type DiscoveryConfig = Record<string, string>;
type HiddenFlag = 0 | 1;
type MatchMode = "OR" | "AND";

type ElementRow = {
    dbId: number;
    // Only properties you asked for (subset if some do not exist on the element)
    [prop: string]: any;
};

type ModelResult = {
    modelId: number;
    urn?: string;
    elements: ElementRow[];
};

type DiscoverOptions = {
    hidden?: HiddenFlag; // 1 => only elements where any returned property's {hidden}===1; 0 => ...===0
    match?: MatchMode;   // default "OR"; "AND" requires same element to match ALL criteria
};

const lc = (s: string) => s.toLowerCase();

const toFullPhraseRegExp = (val: string): RegExp => {
    // Allow "/pattern/flags"
    const m = /^\/(.+)\/([a-z]*)$/.exec(val);
    if (m) return new RegExp(m[1], m[2]);
    // Plain string → full-phrase (avoid matching inside larger tokens)
    const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<!\\w)${escaped}(?!\\w)`, "i");
};

export async function discoverElementsByProps(
    viewer: Autodesk.Viewing.GuiViewer3D,
    discovery: DiscoveryConfig,
    opts: DiscoverOptions = {}
): Promise<ModelResult[]> {
    const models: Autodesk.Viewing.Model[] =
        typeof (viewer as any).getAllModels === "function"
            ? (viewer as any).getAllModels()
            : viewer.model ? [viewer.model] : [];
    if (!models.length) return [];

    const requestedKeys = Object.keys(discovery);
    const wantName = requestedKeys.some((k) => lc(k) === "name");
    const wantExternalId = requestedKeys.some((k) => lc(k) === "externalid");
    const matchMode: MatchMode = opts.match ?? "OR";
    const needHiddenEval = typeof opts.hidden === "number";

    // Prebuild regexes for each requested key
    const keyRegexes = new Map<string, RegExp>(
        requestedKeys.map((k) => [lc(k), toFullPhraseRegExp(discovery[k])])
    );

    // Build propFilter according to your APS notes
    // - [] => NEVER (would return empty results)
    // - ["Category"] => ok (properties[] only, no name/externalId)
    // - ["Category","name","externalId"] => top-level name/externalId included
    // - {} => ALL props (we use only if hidden is requested but we asked only for name/externalId)
    const buildPropFilter = (needPropsArray: boolean): string[] | null => {
        const filter: string[] = [];
        for (const k of requestedKeys) {
            const key = lc(k);
            if (key !== "name" && key !== "externalid") filter.push(k);
        }
        if (wantName) filter.push("name");
        if (wantExternalId) filter.push("externalId");

        if (filter.length === 0) {
            // Only name/externalId requested
            return needPropsArray ? null /* call with {} */ : ["name", "externalId"];
        }
        return filter;
    };

    const getBulk = (
        model: Autodesk.Viewing.Model,
        propFilter: string[] | null
    ) =>
        new Promise<Autodesk.Viewing.PropertyResult[]>((resolve, reject) => {
            // Signature: getBulkProperties(dbIds, options, success, error)
            if (propFilter === null) {
                // "{}" => all props (needed only for hidden-eval when only name/externalId requested)
                (model as any).getBulkProperties(
                    [],
                    {},
                    (results: Autodesk.Viewing.PropertyResult[]) => resolve(results ?? []),
                    reject
                );
            } else {
                (model as any).getBulkProperties(
                    [],
                    { propFilter },
                    (results: Autodesk.Viewing.PropertyResult[]) => resolve(results ?? []),
                    reject
                );
            }
        });

    const out: ModelResult[] = [];

    await Promise.all(
        models.map(async (model) => {
            const propFilter = buildPropFilter(needHiddenEval);
            const results = await getBulk(model, propFilter);

            const elements: ElementRow[] = [];

            for (const res of results) {
                const dbId = (res as any).dbId as number;
                const propsArr = (res as any).properties as Array<{
                    attributeName: string;
                    displayCategory: string;
                    displayName: string;
                    displayValue: any;
                    hidden: 0 | 1;
                }> | undefined;

                // Map displayName (ci) -> displayValue
                const byName = new Map<string, any>();
                if (Array.isArray(propsArr)) {
                    for (const p of propsArr) {
                        if (p && typeof p.displayName === "string") {
                            byName.set(lc(p.displayName), p.displayValue);
                        }
                    }
                }

                // Evaluate matches per requested key
                let anyMatch = false;
                let allMatch = true;

                // Projection: dbId + only the properties that (a) were requested and (b) exist on the element
                const projected: ElementRow = { dbId };

                for (const reqKey of requestedKeys) {
                    const key = lc(reqKey);
                    let raw: any;

                    if (key === "name") raw = (res as any).name;
                    else if (key === "externalid") raw = (res as any).externalId;
                    else raw = byName.get(key);

                    // If property not present on the element
                    if (typeof raw === "undefined") {
                        allMatch = false;
                        // In OR mode, an absent prop just means “this key didn’t match”
                        continue;
                    }

                    // Always include present requested properties in the projection
                    projected[reqKey] = raw;

                    // Test this key
                    const rx = keyRegexes.get(key)!;
                    const hit = rx.test(String(raw));

                    if (hit) anyMatch = true;
                    else allMatch = false;
                }

                const qualifies = matchMode === "AND" ? allMatch : anyMatch;
                if (!qualifies) continue;

                // Hidden filter using ONLY the per-property `hidden` in getBulkProperties results
                if (needHiddenEval) {
                    const hasHidden = Array.isArray(propsArr)
                        ? propsArr.some((p) => p && p.hidden === opts.hidden)
                        : false;
                    if (!hasHidden) continue;
                }

                elements.push(projected);
            }

            const urn =
                (model as any)?.getData?.()?.loadOptions?.urn ??
                (model as any)?.myData?.urn ??
                undefined;

            out.push({ modelId: model.id, urn, elements });
        })
    );

    out.sort((a, b) => a.modelId - b.modelId);
    return out;
}

export async function findElementsByIds(model: Autodesk.Viewing.Model, idProp: string, ids: string[]): Promise<Map<string, number>> {
    const result = await (new Promise<Autodesk.Viewing.PropertyResult[]>((resolve) => {
        model.getBulkProperties([], { propFilter: [idProp] }, resolve)
    }))
    const dbIds: [string, number][] = ids.map(id => {
        let dbId = 0
        if (idProp == 'name') dbId = result.find(a => a.name == id)?.dbId ?? 0
        else if (idProp == 'externalId') dbId = result.find(a => a.externalId == id)?.dbId ?? 0
        else dbId = result.find(a => a.properties?.find(b => b.displayName == idProp)?.displayValue == id)?.dbId ?? 0
        return [id, dbId]
    })
    const map = new Map<string, number>()
    dbIds.forEach(([id, dbId]) => {
        if (dbId != 0) map.set(id, dbId)
    })
    return map
}

export async function extractPropsByIds<T>(model: Autodesk.Viewing.Model, idProp: string, otherProps: string[], rows: T[], getId: (row: T) => string | undefined): Promise<[T, Record<string, any>][]> {
    const result = await (new Promise<Autodesk.Viewing.PropertyResult[]>((resolve) => {
        model.getBulkProperties([], { propFilter: [idProp, ...otherProps] }, resolve)
    }))
    const output: [T, Record<string, any>][] = []
    rows.forEach(row => {
        const id = getId(row)
        if (id) {
            let res: Autodesk.Viewing.PropertyResult | undefined

            if (idProp == 'name') res = result.find(a => a.name == id)
            else if (idProp == 'externalId') res = result.find(a => a.externalId == id)
            else res = result.find(a => a.properties?.find(b => b.displayName == idProp)?.displayValue == id)

            if (res) {
                const outProps: Record<string, any> = { dbId: res.dbId }
                outProps[idProp] = id
                otherProps.forEach(p => {
                    const val = res.properties.find(a => a.displayName == p)?.displayValue
                    if (val !== undefined) outProps[p] = val
                })
                output.push([row, outProps])
            }
        }
    })
    return output
}

export async function extractProps(model: Autodesk.Viewing.Model, props: string[]): Promise<Record<string, any>[]> {
    const result = await (new Promise<Autodesk.Viewing.PropertyResult[]>((resolve) => {
        model.getBulkProperties([], { propFilter: props }, resolve)
    }))
    const output: Record<string, any>[] = []
    result.forEach(res => {
        const outProps: Record<string, any> = { dbId: res.dbId }
        props.forEach(prop => {
            let value
            if (prop == 'name') value = res.name
            else if (prop == 'externalId') value = res.externalId
            else value = res.properties?.find(b => b.displayName == prop)?.displayValue
            if (value !== undefined) outProps[prop] = value
        })
        output.push(outProps)
    })
    return output
}

