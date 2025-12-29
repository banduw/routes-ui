import type { ThreeDViewConfig } from './ThreeDView';

export type RouteType = 'evacuation' | 'patrol';

export interface Route {
    id: string;
    projectId: string;
    name: string;
    type: RouteType;
    segments: number;
    description: string;
}

export type AnchorType = 'equipment' | 'exit';

export interface Anchor {
    id: string;
    name: string;
    type: AnchorType;
}

export type ContentType = 'document' | 'image' | 'link' | 'cctv';

export interface ContentItem {
    id: string;
    name: string;
    type: ContentType;
    url?: string;
}

export interface Entity {
    id: string;
    name: string;
}

export interface Project {
    id: string;
    name: string;
}

export type RoutePanelPosition = 'floating' | 'left' | 'right' | 'bottom';

export interface RoutePanelLayout {
    position: RoutePanelPosition;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    segment: number;
}

export interface PatrolMode {
    active: boolean;
    routeId: string | null;
    currentSegment: number;
    paused: boolean;
    transitioning: boolean;
    currentCCTVs: ContentItem[];
    nextCCTVs: ContentItem[];
    countdown?: number;
}

export interface ColorPickerState {
    type: 'route' | 'anchor';
    id: string;
}

export interface Plan {
    id: string;
    name: string;
    projectId: string;
    selectedRoutes: string[];
    routeColors: Record<string, string>;
    anchorColors: Record<string, string>;
    createdAt: string;
}

export interface ContentPanelState {
    id: number;
    content: ContentItem;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RouteStats {
    anchorCount: number;
    contentCount: number;
    entityCount: number;
}

export interface SearchMatch {
    field: string;
    value: string;
    segment?: number;
}

export interface RouteSearchResult {
    route: Route;
    matches: SearchMatch[];
}

export interface VirtualPatrolData {
    ROUTE_COLORS: string[];
    AVAILABLE_COLORS: Array<{ value: string; name: string }>;
    projects: Project[];
    allRoutes: Route[];
    anchors: Anchor[];
    content: ContentItem[];
    entities: Entity[];
    anchorToRoute: Record<string, string[]>;
    contentToAnchor: Record<string, string[]>;
    routeEntities: Record<string, string[]>;
    buildMockThreeDViewConfig: (input: { routes: Route[]; anchors: Anchor[] }) => ThreeDViewConfig;
}
