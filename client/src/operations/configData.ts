import type { ConfigInfo } from '../config/types'
import type {
    Anchor,
    ContentItem,
    Entity,
    Project,
    Route,
    RouteType,
    VirtualPatrolData
} from './types'

const ROUTE_COLORS: string[] = ['#B12518', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const AVAILABLE_COLORS = [
    { value: '#B12518', name: 'Red' },
    { value: '#10b981', name: 'Green' },
    { value: '#3b82f6', name: 'Blue' },
    { value: '#f59e0b', name: 'Orange' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#06b6d4', name: 'Cyan' }
];

export function buildConfigData(configInfo: ConfigInfo): VirtualPatrolData {
    const { routeConfig: config, routeImport } = configInfo

    const routeExtensionsById = new Map(config.routeExtensions.map(ext => [ext.route_id, ext]));
    const anchorExtensionsById = new Map(config.anchorExtensions.map(ext => [ext.anchor_id, ext]));

    const projectByRouteId = new Map<string, string>();
    config.projects.forEach(project => {
        project.routes.forEach(routeId => projectByRouteId.set(routeId, project.id));
    });

    const projects: Project[] = config.projects.map(project => ({ id: project.id, name: project.name }));

    const allRoutes: Route[] = routeImport.map(route => {
        const extension = routeExtensionsById.get(route.id);
        const name = extension?.name ?? route.id;
        const type: RouteType = (() => {
            const value = typeof extension?.type === 'string' ? extension.type.toLowerCase() : '';
            return value === 'patrol' ? 'patrol' : 'evacuation';
        })();
        return {
            id: route.id,
            projectId: projectByRouteId.get(route.id) ?? 'unknown',
            name,
            type,
            segments: Array.isArray(route.segments) ? route.segments.length : 0,
            description: extension?.description ?? ''
        };
    });

    const anchors: Anchor[] = (() => {
        const anchorIds = new Set<string>();

        const bimDots = configInfo.bimDots;
        if (bimDots && typeof bimDots === 'object') {
            Object.values(bimDots).forEach(dots => {
                if (!Array.isArray(dots)) return;
                dots.forEach(dot => {
                    if (dot?.anchor) anchorIds.add(dot.anchor);
                });
            });
        }
        config.anchorExtensions.forEach(ext => {
            if (ext?.anchor_id) anchorIds.add(ext.anchor_id);
        });
        config.projects.forEach(project => {
            project.anchorMaps.forEach(map => {
                map.anchors.forEach(anchorId => anchorIds.add(anchorId));
            });
            project.contentAnchorMaps.forEach(map => {
                map.anchors.forEach(anchorId => anchorIds.add(anchorId));
            });
        });

        return Array.from(anchorIds)
            .sort()
            .map(anchorId => {
                const extension = anchorExtensionsById.get(anchorId);
                const name = extension?.name ?? anchorId;
                const type: Anchor['type'] = (() => {
                    const value = typeof extension?.type === 'string' ? extension.type.toLowerCase() : '';
                    return value === 'exit' ? 'exit' : 'equipment';
                })();
                return {
                    id: anchorId,
                    name,
                    type
                };
            });
    })();

    const content: ContentItem[] = Array.isArray(config.content)
        ? config.content.map(item => ({
            id: item.id,
            name: item.name,
            type: ((): ContentItem['type'] => {
                const value = String(item.type ?? '').toLowerCase()
                if (value === 'document' || value === 'image' || value === 'link' || value === 'cctv') return value
                return 'link'
            })(),
            url: typeof item.url === 'string' ? item.url : undefined
        }))
        : [];

    const entities: Entity[] = (() => {
        const map = new Map<string, Entity>();
        config.projects.forEach(project => {
            project.entities.forEach(entity => {
                if (!map.has(entity.id)) map.set(entity.id, { id: entity.id, name: entity.name });
            });
        });
        return Array.from(map.values());
    })();

    const anchorToRoute: Record<string, string[]> = (() => {
        const result: Record<string, string[]> = {};
        config.projects.forEach(project => {
            project.anchorMaps.forEach(map => {
                result[map.segment_id] = map.anchors;
            });
        });
        return result;
    })();

    const contentToAnchor: Record<string, string[]> = (() => {
        const result: Record<string, string[]> = {};
        config.projects.forEach(project => {
            project.contentAnchorMaps.forEach(map => {
                map.anchors.forEach(anchorId => {
                    if (!result[anchorId]) result[anchorId] = [];
                    if (!result[anchorId].includes(map.content_id)) {
                        result[anchorId].push(map.content_id);
                    }
                });
            });
        });
        return result;
    })();

    return {
        ROUTE_COLORS,
        AVAILABLE_COLORS,
        projects,
        allRoutes,
        anchors,
        content,
        entities,
        anchorToRoute,
        contentToAnchor,
        routeEntities: {}
    };
}
