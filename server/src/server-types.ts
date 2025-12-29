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

export type ConfigInfo = {
    user: ServiceUser
    buildings: BuildingConfig[]
    groups: GroupConfig[]
    sampleQueries: SampleQuery[]
}

export type GlobalConfigEx = GlobalConfig & {
}