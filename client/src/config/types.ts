import type { BimConfig, BimDot, BimSector, BimViewport } from "../operations/threeD/types"

export type ServiceUser = {
    email?: string
    name?: string
    userId?: string
    groups?: string
    isAdmin?: boolean
    isServiceAdmin?: boolean
    serviceRoles?: string[]
}

export type RouteType = 'evacuation' | 'patrol'

export type AnchorType = 'equipment' | 'exit'

export type AnchorImport = {
    id: string
    model_id?: string
}

export type RouteImportSegment = {
    id: string
    label?: string
    from: { x: number; y: number; z: number }
    to: { x: number; y: number; z: number }
    viewport_id?: string
}

export type RouteImport = {
    id: string
    segments: RouteImportSegment[]
}

export type ConfigProject = {
    id: string
    name: string
    routes: string[]
    anchorMaps: Array<{ route_id: string; segment_id: string; anchors: string[] }>
    contentAnchorMaps: Array<{ content_id: string; anchors: string[] }>
    entities: Array<{ id: string; name: string }>
}

export type ConfigRouteExtension = {
    route_id: string
    name: string
    type: RouteType
    description?: string
}

export type ConfigAnchorExtension = {
    anchor_id: string
    name: string
    type: AnchorType
    description?: string
}

export type ImportedConfig = {
    projects: ConfigProject[]
    content: Array<{ id: string; name: string; type: string; url?: string }>
    routeExtensions: ConfigRouteExtension[]
    anchorExtensions: ConfigAnchorExtension[]
}

export type ConfigInfo = {
    user: ServiceUser
    anchorImport: AnchorImport[] // temporary, can be extracted from bimDots
    routeImport: RouteImport[]
    routeConfig: ImportedConfig
    bimConfig?: BimConfig
    bimSectors?: Record<string, BimSector[]>
    bimViewports?: Record<string, BimViewport[]>
    bimDots?: Record<string, BimDot[]>
}
