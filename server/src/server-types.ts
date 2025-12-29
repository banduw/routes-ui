import { ServiceUser, ServiceConfig, GlobalConfig } from '@twinlogic-singapore/common-if-utils'
import { Summarizer } from './interface.js'

export type AccountData = {
    interface: Summarizer.Interface
}

export type SummarizerConfig = ServiceConfig & Summarizer.Config

export type BuildingConfig = {
    name: string
    groupNames: string[]
}

export type GroupConfig = {
    name: string
    canUpload: boolean
    canUpdate: boolean
    canDelete: boolean
}

export type SampleQuery = {
    query: string
    buildingNames: string[]
    groupNames: string[]
}

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

export type ConfigInfo = {
    user: ServiceUser
    anchorImport: AnchorImport[]
    routeImport: RouteImport[]
    config: any
}

export type GlobalConfigEx = GlobalConfig & {
}
