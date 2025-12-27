export type ContentType =
    | 'document'
    | 'image'
    | 'text'
    | 'link'
    | 'cctv'
    | 'video';

export interface Project {
    id: string;
    name: string;
    description?: string;
}

export interface ContentItem {
    id: string;
    projectId: string;
    name: string;
    type: ContentType;
    url?: string;
    textContent?: string;
    uploadedAt?: string;
}

export interface Anchor {
    id: string;
    projectId: string;
    name: string;
    type?: string;
    description?: string;
}

export interface Route {
    id: string;
    projectId: string;
    name: string;
    type?: string;
    segments: number;
    description?: string;
}

export interface Entity {
    id: string;
    projectId: string;
    name: string;
    sourceType: 'anchor' | 'manual';
    anchorIds: string[];
    description?: string;
}

export type ContentToAnchorLinks = Record<string, string[]>;
export type AnchorToRouteLinks = Record<string, string[]>;
export type RouteEntityAssignments = Record<string, string[]>;

export type PendingLinkAction = {
    type?: string;
    contentIds?: string[];
    anchorIds?: string[];
    segmentKey?: string;
};
