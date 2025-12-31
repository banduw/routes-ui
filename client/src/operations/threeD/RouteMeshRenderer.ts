import './three-polyfills';

/* global THREE */
// Rely on the Forge viewer's bundled THREE; treat it as any for type leniency.
declare const THREE: any;
/**
 * Safety rail: Route geometry must be depth-tested and occluded by the model.
 * This variant renders route meshes via a Viewer overlay scene to sidestep
 * MRT/WebGL2 drawBuffers errors observed in the main scene.
 *
 * Constraints:
 * - material.depthTest = true
 * - material.depthWrite = false (for translucency)
 */

export type RouteSegmentInput = {
    segmentId: string;
    viewportId: string;
    points: THREE.Vector3[];
    color?: string | number;
    routeId?: string;
    segmentIndex?: number;
};

export type ViewportPose = {
    viewportId: string;
    position: THREE.Vector3;
    target: THREE.Vector3;
    up?: THREE.Vector3;
};

export type RouteRenderOptions = {
    radius?: number;
    opacity?: number;
    radialSegments?: number;
    tubularSegmentsPerEdge?: number;
    tension?: number;
    lift?: number;
    materialType?: 'basic' | 'phong';
};

const DEFAULTS: Required<Omit<RouteRenderOptions, 'materialType'>> & {
    materialType: 'basic' | 'phong';
} = {
    radius: 0.30,
    opacity: 0.70,
    radialSegments: 10,
    tubularSegmentsPerEdge: 8,
    tension: 0.4,
    lift: 0,
    materialType: 'basic'
};

export class RouteMeshRenderer {
    private overlayName = 'route-pipes';
    private viewer: Autodesk.Viewing.GuiViewer3D;
    private root: any;
    private viewportGroups = new Map<string, any>();
    private materials = new Set<any>();
    private disposed = false;
    private viewports = new Map<string, ViewportPose>();
    private displayLogCount = 0;

    constructor(viewer: Autodesk.Viewing.GuiViewer3D) {
        this.viewer = viewer;
        this.root = new THREE.Group();
        this.root.name = 'RouteMeshRoot';
        this.viewer.impl.createOverlayScene(this.overlayName);
        this.viewer.impl.addOverlay(this.overlayName, this.root);
    }

    setViewports(poses: ViewportPose[]): void {
        this.viewports = new Map(poses.map((p) => [p.viewportId, p]));
    }

    displaySegments(segments: RouteSegmentInput[], opts?: RouteRenderOptions): void {
        if (this.disposed) return;
        this.clear();
        const mergedOpts = { ...DEFAULTS, ...opts } as Required<RouteRenderOptions>;

        if (!segments || segments.length === 0) {
            this.viewer.impl.invalidate(true, true, true);
            return;
        }

        this.logOnce('[RouteMeshRenderer] displaySegments called');
        this.logOnce(`[RouteMeshRenderer] rendering ${segments.length} segment(s)`);

        const activeViewport = segments[0]?.viewportId ?? null;

        segments.forEach((segment) => {
            const mesh = this.buildSegmentMesh(segment, mergedOpts);
            if (!mesh) return;
            const group = this.getViewportGroup(segment.viewportId);
            group.add(mesh);
            if (mesh.geometry?.boundingSphere) {
                this.logOnce(`[RouteMeshRenderer] segment ${segment.segmentId} radius=${mesh.geometry.boundingSphere.radius?.toFixed?.(2)}`);
            }
        });

        this.setActiveViewport(activeViewport);
        this.viewer.impl.invalidate(true, true, true);
    }

    setActiveViewport(viewportId: string | null): void {
        let nextViewport = viewportId;
        if (nextViewport && this.viewports.size > 0 && !this.viewports.has(nextViewport)) {
            const first = this.viewports.values().next().value;
            nextViewport = first?.viewportId ?? nextViewport;
        }

        this.viewportGroups.forEach((group, id) => {
            group.visible = !nextViewport || id === nextViewport;
        });
        this.viewer.impl.invalidate(true, true, true);
    }

    clear(): void {
        this.viewportGroups.forEach((group) => {
            group.children.forEach((child: any) => {
                const mesh = child as any;
                mesh?.geometry?.dispose?.();
            });
            this.root.remove(group);
        });
        this.viewportGroups.clear();

        this.materials.forEach((mat) => mat.dispose());
        this.materials.clear();
        this.viewer.impl.invalidate(true, true, true);
    }

    dispose(): void {
        if (this.disposed) return;
        this.clear();
        try {
            this.viewer.impl.removeOverlay(this.overlayName, this.root);
        } catch {
            // ignore
        }
        this.disposed = true;
    }

    private getViewportGroup(viewportId: string): any {
        let group = this.viewportGroups.get(viewportId);
        if (!group) {
            group = new THREE.Group();
            group.name = `RouteViewport_${viewportId}`;
            this.viewportGroups.set(viewportId, group);
            this.root.add(group);
        }
        return group;
    }

    private buildSegmentMesh(segment: RouteSegmentInput, opts: Required<RouteRenderOptions>): any | null {
        const uniquePoints: any[] = [];
        const epsilon = 1e-6;
        segment.points.forEach((pt) => {
            const last = uniquePoints[uniquePoints.length - 1];
            if (!last || last.distanceToSquared(pt) > epsilon) {
                uniquePoints.push(pt.clone());
            }
        });

        if (uniquePoints.length < 2) return null;

        const liftedPoints = this.applyLift(uniquePoints, opts.lift);

        if (typeof (THREE as any).TubeGeometry !== 'function') {
            console.warn('[RouteMeshRenderer] TubeGeometry not available on THREE');
            return null;
        }
        const curve = new THREE.CatmullRomCurve3(liftedPoints, false, 'centripetal', opts.tension);
        const tubularSegments = Math.max(16, (liftedPoints.length - 1) * opts.tubularSegmentsPerEdge);
        const geometry = new (THREE as any).TubeGeometry(
            curve,
            tubularSegments,
            opts.radius,
            opts.radialSegments,
            false
        );

        const material = this.createMaterial(segment.color, opts);
        const mesh = new THREE.Mesh(geometry, material);
        if (typeof geometry.computeBoundingSphere === 'function') {
            geometry.computeBoundingSphere();
        }
        mesh.frustumCulled = false;
        mesh.userData = {
            kind: 'route-segment',
            segmentId: segment.segmentId,
            routeId: segment.routeId,
            viewportId: segment.viewportId,
            segmentIndex: segment.segmentIndex
        };
        mesh.renderOrder = 0;
        return mesh;
    }

    private createMaterial(color: RouteSegmentInput['color'], opts: Required<RouteRenderOptions>): THREE.Material {
        const matColor = new THREE.Color(
            color !== undefined && color !== null ? (color as any) : 0x00d1ff
        );
        const commonProps = {
            color: matColor,
            transparent: true,
            opacity: opts.opacity,
            depthTest: true,
            depthWrite: false,
            side: THREE.DoubleSide
        };

        const material =
            opts.materialType === 'phong'
                ? new THREE.MeshPhongMaterial(commonProps)
                : new THREE.MeshBasicMaterial(commonProps);

        this.materials.add(material);
        return material;
    }

    private applyLift(points: THREE.Vector3[], lift: number): THREE.Vector3[] {
        if (!lift) return points;
        const upRaw = this.viewer?.navigation?.getWorldUpVector?.();
        const up = upRaw && (upRaw as any).distanceTo ? upRaw : new THREE.Vector3(0, 0, 1);
        const lifted = up.clone().normalize().multiplyScalar(lift);
        return points.map((p) => p.clone().add(lifted));
    }

    private logOnce(msg: string): void {
        if (this.displayLogCount > 4) return;
        this.displayLogCount += 1;
        console.log(msg);
    }
}
