import { discoverElementsByProps } from "./element-discovery";

// CeilingDiscovery.ts
type DbId = number;
export type Criteria = Record<string, string>

export class CeilingDiscovery {
    private viewer: Autodesk.Viewing.GuiViewer3D | null = null;
    private criteria: Criteria = {};
    private perModelIds: Map<Autodesk.Viewing.Model, DbId[]> = new Map();
    private initialized = false;
    private active = false; // becomes true after discover()

    constructor() { }

    /** Call this after your viewer is initialized (and anytime you want to replace criteria). */
    initialize(viewer: Autodesk.Viewing.GuiViewer3D, criteria: Criteria) {
        this.viewer = viewer;
        this.criteria = criteria ?? {};
        this.initialized = true;
        this.active = false;      // nothing discovered yet
        this.perModelIds.clear(); // drop any stale data
    }

    /** Update criteria later (safe before/after discover; no-op if not initialized). */
    setCriteria(criteria: Criteria) {
        if (!this.initialized) return;
        this.criteria = criteria ?? {};
        // Don’t auto-discover; caller decides when to run discover()
    }

    /** Discover ceilings across all current 3D models. Safe no-op if not initialized. */
    async discover(): Promise<void> {
        if (!this.initialized || !this.viewer) return;

        this.perModelIds.clear();
        this.active = false;

        const result = await discoverElementsByProps(this.viewer, this.criteria)
        const models = this.viewer.getAllModels()
        result.forEach(row => {
            const m = models.find(a => a.id == row.modelId)
            if (m) this.perModelIds.set(m, row.elements.map(a => a.dbId))
        })
        this.active = this.perModelIds.size > 0;
    }

    /** Hide discovered ceilings. Safe no-op if not initialized or nothing discovered. */
    hide(): void {
        if (!this.initialized || !this.viewer || !this.active) return;
        for (const [model, ids] of this.perModelIds) if (ids?.length) this.viewer.hide(ids, model);
        this.viewer.impl.invalidate(true, true, true);
    }

    /** Show discovered ceilings. Safe no-op if not initialized or nothing discovered. */
    show(): void {
        if (!this.initialized || !this.viewer || !this.active) return;
        for (const [model, ids] of this.perModelIds) if (ids?.length) this.viewer.show(ids, model);
        this.viewer.impl.invalidate(true, true, true);
    }

    /** Clear cached data and deactivate. After this, hide()/show() won’t do anything. */
    clear(): void {
        this.perModelIds.clear();
        this.active = false;
        // stays initialized; you can call discover() again for the next model set
    }

    /** Optional: completely reset (e.g., on viewer disposal). */
    reset(): void {
        this.clear();
        this.initialized = false;
        this.viewer = null;
        this.criteria = {};
    }

    /** For debugging/inspection */
    getModelMap(): Map<Autodesk.Viewing.Model, DbId[]> {
        return this.perModelIds;
    }

    /** Whether initialize(...) has completed. */
    isInitialized(): boolean {
        return this.initialized;
    }
}
