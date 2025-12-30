import type {
        PatrolMode,
        Route,
        RoutePanelLayout,
        RoutePanelPosition,
        SegmentDisplayBundle
} from './types';

export function getPlanStorageKey(projectId: string): string {
        return `plans_${projectId}`;
}

export function loadPlans<T>(projectId: string, fallback: T[] = []): T[] {
        const saved = localStorage.getItem(getPlanStorageKey(projectId));
        if (!saved) {
                return fallback;
        }

        try {
                return JSON.parse(saved) as T[];
        } catch (error) {
                console.warn('Failed to parse saved plans', error);
                return fallback;
        }
}

export function persistPlans<T>(projectId: string, plans: T[]): void {
        localStorage.setItem(getPlanStorageKey(projectId), JSON.stringify(plans));
}

export function buildValidSelectedRoutes(selectedRoutes: string[], routes: Route[]): string[] {
        const validRouteIds = new Set(routes.map(r => r.id));
        return selectedRoutes.filter(id => validRouteIds.has(id));
}

export function getRouteColorByIndex(palette: string[], index: number): string {
        if (!palette || palette.length === 0) return '#888888';
        return palette[index % palette.length];
}

export function createFloatingPanelLayout(index = 0, baseX = 300, baseY = 100): RoutePanelLayout {
        return {
                position: 'floating',
                x: baseX + index * 30,
                y: baseY + index * 30,
                width: 400,
                height: 500,
                segment: 1
        };
}

export function getPinnedPanelLayout(
        panel: RoutePanelLayout | undefined,
        position: RoutePanelPosition
): RoutePanelLayout {
        const basePanel = panel ?? createFloatingPanelLayout();

        return {
                ...basePanel,
                position,
                ...(position === 'floating' && { x: 300, y: 100, width: 400, height: 500 }),
                ...(position === 'left' && { width: 350 }),
                ...(position === 'right' && { width: 350 }),
                ...(position === 'bottom' && { height: 300 })
        };
}

export function buildDisplayBundles({
        validSelectedRoutes,
        hiddenRoutes,
        routes,
        routePanels,
        routeColors,
        anchorColors,
        anchorToRoute,
        patrolMode
}: {
        validSelectedRoutes: string[];
        hiddenRoutes: string[];
        routes: Route[];
        routePanels: Record<string, RoutePanelLayout | undefined>;
        routeColors: Record<string, string>;
        anchorColors: Record<string, string>;
        anchorToRoute: Record<string, string[]>;
        patrolMode: PatrolMode;
}): SegmentDisplayBundle[] {
        const visibleRoutes = validSelectedRoutes.filter(id => !hiddenRoutes.includes(id));

        return visibleRoutes.flatMap(routeId => {
                const route = routes.find(r => r.id === routeId);
                if (!route) return [];

                const panel = routePanels[routeId];
                const routeColor = routeColors[routeId] || '#888888';

                let currentSegment = 1;
                if (patrolMode.active && patrolMode.routeId === routeId) {
                        currentSegment = patrolMode.currentSegment;
                } else if (panel) {
                        currentSegment = panel.segment;
                }

                const segmentName = `${routeId}-seg${currentSegment}`;
                const anchorsInSegment = anchorToRoute[`${routeId}-${currentSegment}`] || [];

                return [{
                        segment_name: segmentName,
                        color: routeColor,
                        anchors: anchorsInSegment.map(anchorId => ({
                                anchor_name: anchorId,
                                color: anchorColors[anchorId] || '#888888'
                        }))
                }];
        });
}
