import type { ThreeDViewAnchor, ThreeDViewConfig, ThreeDViewSegment, ThreeDViewViewport } from '../ThreeDView-mock';
import type { Anchor, Route } from '../types';
import type { RouteImportSegment } from '../../config/types';

interface BuildMockThreeDViewConfigInput {
    routes: Route[];
    anchors: Anchor[];
    routeSegmentsById?: Record<string, RouteImportSegment[]>;
}

export function buildMockThreeDViewConfig({ routes, anchors, routeSegmentsById }: BuildMockThreeDViewConfigInput): ThreeDViewConfig {
    const configAnchors: ThreeDViewAnchor[] = anchors.map(anchor => ({
        name: anchor.id,
        point: { x: 0, y: 0, z: 0 }
    }));

    const viewports = new Map<string, ThreeDViewViewport>();
    const configSegments: ThreeDViewSegment[] = routes.flatMap(route => {
        const segments = routeSegmentsById?.[route.id] ?? [];
        if (segments.length === 0) {
            return Array.from({ length: route.segments }, (_, i) => {
                const segmentNumber = i + 1;
                const segmentName = `${route.id}-seg${segmentNumber}`;

                return {
                    name: segmentName,
                    from: { x: i * 100, y: 0, z: 0 },
                    to: { x: (i + 1) * 100, y: 0, z: 0 },
                    viewport_name: 'Viewport 1'
                };
            });
        }

        return segments.map((segment, index) => {
            const viewportName = (segment.viewport_id && segment.viewport_id.trim()) || 'Viewport 1';
            if (!viewports.has(viewportName)) {
                viewports.set(viewportName, { name: viewportName, camera: {} });
            }
            return {
                name: segment.label || segment.id || `${route.id}-seg${index + 1}`,
                from: segment.from,
                to: segment.to,
                viewport_name: viewportName
            };
        });
    });

    if (!viewports.has('Viewport 1')) {
        viewports.set('Viewport 1', { name: 'Viewport 1', camera: {} });
    }

    return {
        anchors: configAnchors,
        segments: configSegments,
        viewports: Array.from(viewports.values())
    };
}
