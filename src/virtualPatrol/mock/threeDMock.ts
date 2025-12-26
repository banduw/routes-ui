import type { ThreeDViewAnchor, ThreeDViewConfig, ThreeDViewSegment, ThreeDViewViewport } from '../ThreeDView';
import type { Anchor, Route } from '../types';

interface BuildMockThreeDViewConfigInput {
    routes: Route[];
    anchors: Anchor[];
}

export function buildMockThreeDViewConfig({ routes, anchors }: BuildMockThreeDViewConfigInput): ThreeDViewConfig {
    const configAnchors: ThreeDViewAnchor[] = anchors.map(anchor => ({
        name: anchor.id, // Using ID as name for now (TODO: use actual names in config mode)
        point: { x: 0, y: 0, z: 0 } // TODO: Add real coordinates in Config Mode
    }));

    const configSegments: ThreeDViewSegment[] = routes.flatMap(route => {
        return Array.from({ length: route.segments }, (_, i) => {
            const segmentNumber = i + 1;
            const segmentName = `${route.id}-seg${segmentNumber}`;

            let viewportName = 'Viewport 1'; // Default
            if (route.id === 'r2' || route.id === 'm2') {
                viewportName = 'Viewport 2';
            } else if (route.id === 'r3' || route.id === 'm3') {
                viewportName = 'Viewport 3';
            }

            return {
                name: segmentName,
                from: { x: i * 100, y: 0, z: 0 }, // TODO: Real geometry in Config Mode
                to: { x: (i + 1) * 100, y: 0, z: 0 }, // TODO: Real geometry in Config Mode
                viewport_name: viewportName
            };
        });
    });

    const configViewports: ThreeDViewViewport[] = [
        { name: 'Viewport 1', camera: {} },
        { name: 'Viewport 2', camera: {} },
        { name: 'Viewport 3', camera: {} }
    ];

    return {
        anchors: configAnchors,
        segments: configSegments,
        viewports: configViewports
    };
}
