import * as React from "react"

export interface IModelLoadedData {
    model: Autodesk.Viewing.Model
}

export interface IViewerProps {
    docUrn: string
    viewerOptions?: Object
    env?: string
    api?: string
    // urlBase: string
    viewableName?: string
    progressiveRendering?: boolean
    onError?: (error: string) => void
    onModelLoaded: (viewer: Autodesk.Viewing.GuiViewer3D, viewables3d?: string[], viewables2d?: string[]) => void
    getToken: () => Promise<string>
    onViewerInitialized?: (viewer: Autodesk.Viewing.GuiViewer3D) => void
}

export default function ForgeViewer(props: IViewerProps) {
    const initPromiseRef = React.useRef<Promise<void> | null>(null);
    const viewerRef = React.useRef<Autodesk.Viewing.GuiViewer3D | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [ready, setReady] = React.useState(false)

    // 1) One-time Initializer
    function ensureViewingInitialized() {
        if (!initPromiseRef.current) {
            const options = {
                env: props.env || "AutodeskProduction2",
                api: props.api || "derivativeV2",
                getAccessToken: async (onTokenReady: (t: string, exp: number) => void) => {
                    const token = await props.getToken();
                    onTokenReady(token, 900);
                }
            };
            initPromiseRef.current = new Promise<void>((resolve) => {
                Autodesk.Viewing.Initializer(options, () => resolve());
            });
        }
        return initPromiseRef.current;
    }

    // 2) Create one viewer on mount
    React.useEffect(() => {
        let disposed = false;

        (async () => {
            await ensureViewingInitialized();

            if (disposed) return;

            const container = containerRef.current!;
            // Guard: don’t start if container has no size
            const r = container.getBoundingClientRect();
            if (!r.width || !r.height) {
                console.warn("ForgeViewer container has no size at init.");
            }

            const viewer = new Autodesk.Viewing.GuiViewer3D(container);
            viewerRef.current = viewer;

            const started = viewer.start();
            if (started > 0) {
                console.error("Failed to create Viewer (WebGL?).");
                return;
            }

            setReady(true)
            props.onViewerInitialized?.(viewer);
        })();

        return () => {
            disposed = true;
            if (viewerRef.current) {
                viewerRef.current.finish();
                viewerRef.current = null;
            }
            // Shut the platform down only when the component truly unmounts
            Autodesk.Viewing.shutdown();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount only

    // 3) Load new URN(s) when props.docUrn changes (reuse same viewer)
    React.useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const urns = props.docUrn.split(",").map(s => s.trim()).filter(Boolean);
        if (!urns.length) return;

        let cancelled = false;

        async function loadDocs() {
            // unload previous models
            viewer!.getAllModels().forEach(m => viewer!.unloadModel(m));

            // load each manifest, collect default 3D nodes (or 2D per your logic)
            const docs = await Promise.all(
                urns.map(u => new Promise<Autodesk.Viewing.Document>((res, rej) => {
                    Autodesk.Viewing.Document.load(u, res, rej);
                }))
            );
            if (cancelled) return;

            const nodes: { doc: Autodesk.Viewing.Document; node: Autodesk.Viewing.BubbleNode }[] = [];
            for (const doc of docs) {
                const node = doc.getRoot().getDefaultGeometry(true, true); // 3D default
                if (node) nodes.push({ doc, node });
            }

            // load first with keepCurrentModels:false, rest with true
            for (let i = 0; i < nodes.length; i++) {
                const opt = { keepCurrentModels: i > 0, applyRefPoint: true };
                // eslint-disable-next-line no-await-in-loop
                await viewer!.loadDocumentNode(nodes[i].doc, nodes[i].node, opt);
            }

            // do your viewer settings after models are in
            viewer!.setLightPreset(2);
            viewer!.setBackgroundColor(48, 48, 48, 48, 48, 48);
            viewer!.setGhosting(false);
            if (props.progressiveRendering != null) {
                viewer!.setProgressiveRendering(props.progressiveRendering);
            }

            await viewer!.waitForLoadDone({ geometry: true, propDb: true })

            props.onModelLoaded?.(viewer!, ["Default 3D"], /*2Ds*/[]);
        }

        loadDocs().catch(err => props.onError?.(String(err)));

        return () => { cancelled = true; };
    }, [props.docUrn, ready]); // ONLY switch models here

    return <div id="forgeViewer" ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
