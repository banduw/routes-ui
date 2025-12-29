import { useMemo } from 'react';
import anchorImportsJson from '../data/demo/anchor-import.json';
import configJson from '../data/demo/config.json';
import routeImportsJson from '../data/demo/route-import.json';
import type {
    Anchor,
    ContentItem,
    Entity,
    Project,
    Route,
    RouteType,
    VirtualPatrolData
} from './types';
import { buildMockThreeDViewConfig } from './mock/threeDMock';

interface RouteImportSegment {
    id: string;
    label: string;
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
    viewport_id: string;
}

interface RouteImport {
    id: string;
    segments: RouteImportSegment[];
}

interface AnchorImport {
    id: string;
    model_id: string;
}

interface ConfigProject {
    id: string;
    name: string;
    routes: string[];
    anchorMaps: Array<{ route_id: string; segment_id: string; anchors: string[] }>;
    contentAnchorMaps: Array<{ content_id: string; anchors: string[] }>;
    entities: Array<{ id: string; name: string }>;
}

interface ConfigRouteExtension {
    route_id: string;
    name: string;
    description: string;
}

interface ConfigAnchorExtension {
    anchor_id: string;
    name: string;
    description: string;
}

interface ImportedConfig {
    projects: ConfigProject[];
    content: ContentItem[];
    routeExtensions: ConfigRouteExtension[];
    anchorExtensions: ConfigAnchorExtension[];
}

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

const routeImports = routeImportsJson as RouteImport[];
const anchorImports = anchorImportsJson as AnchorImport[];
const config = configJson as ImportedConfig;

const routeExtensionsById = new Map(config.routeExtensions.map(ext => [ext.route_id, ext]));
const anchorExtensionsById = new Map(config.anchorExtensions.map(ext => [ext.anchor_id, ext]));

const projectByRouteId = new Map<string, string>();
config.projects.forEach(project => {
    project.routes.forEach(routeId => projectByRouteId.set(routeId, project.id));
});

const inferRouteType = (name: string): RouteType => {
    const lower = name.toLowerCase();
    if (lower.includes('patrol') || lower.includes('security')) return 'patrol';
    return 'evacuation';
};

const inferAnchorType = (name: string): Anchor['type'] => {
    if (name.toLowerCase().includes('exit')) return 'exit';
    return 'equipment';
};

const buildProjects = (): Project[] => config.projects.map(project => ({ id: project.id, name: project.name }));

const buildRoutes = (): Route[] =>
    routeImports.map(routeImport => {
        const extension = routeExtensionsById.get(routeImport.id);
        const name = extension?.name ?? routeImport.id;
        return {
            id: routeImport.id,
            projectId: projectByRouteId.get(routeImport.id) ?? 'unknown',
            name,
            type: inferRouteType(name),
            segments: routeImport.segments?.length ?? 0,
            description: extension?.description ?? ''
        };
    });

const buildAnchors = (): Anchor[] =>
    anchorImports.map(anchorImport => {
        const extension = anchorExtensionsById.get(anchorImport.id);
        const name = extension?.name ?? anchorImport.id;
        return {
            id: anchorImport.id,
            name,
            type: inferAnchorType(name)
        };
    });

const buildContent = (): ContentItem[] => config.content;

const buildEntities = (): Entity[] => {
    const map = new Map<string, Entity>();
    config.projects.forEach(project => {
        project.entities.forEach(entity => {
            if (!map.has(entity.id)) map.set(entity.id, { id: entity.id, name: entity.name });
        });
    });
    return Array.from(map.values());
};

const buildAnchorToRoute = (): Record<string, string[]> => {
    const anchorToRoute: Record<string, string[]> = {};
    config.projects.forEach(project => {
        project.anchorMaps.forEach(map => {
            anchorToRoute[map.segment_id] = map.anchors;
        });
    });
    return anchorToRoute;
};

const buildContentToAnchor = (): Record<string, string[]> => {
    const contentToAnchor: Record<string, string[]> = {};
    config.projects.forEach(project => {
        project.contentAnchorMaps.forEach(map => {
            map.anchors.forEach(anchorId => {
                if (!contentToAnchor[anchorId]) contentToAnchor[anchorId] = [];
                if (!contentToAnchor[anchorId].includes(map.content_id)) {
                    contentToAnchor[anchorId].push(map.content_id);
                }
            });
        });
    });
    return contentToAnchor;
};

export function useMockData(): VirtualPatrolData {
    return useMemo(() => {
        const projects = buildProjects();
        const allRoutes = buildRoutes();
        const anchors = buildAnchors();
        const content = buildContent();
        const entities = buildEntities();
        const anchorToRoute = buildAnchorToRoute();
        const contentToAnchor = buildContentToAnchor();

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
            routeEntities: {},
            buildMockThreeDViewConfig
        };
    }, []);
}
