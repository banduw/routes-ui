import React, { createContext, useContext, useMemo } from 'react'
import { useConfigInfo } from '../config/ConfigInfoContext'
import { buildConfigData } from './configData'
import type { VirtualPatrolData } from './types'

type ConfigDataContextValue = {
    data: VirtualPatrolData | null
    loading: boolean
    error: string | null
    refresh: () => Promise<void>
}

const ConfigDataContext = createContext<ConfigDataContextValue | null>(null)

export function ConfigDataProvider({ children }: { children: React.ReactNode }) {
    const { configInfo, loading, error, refresh } = useConfigInfo()
    const data = useMemo<VirtualPatrolData | null>(
        () => (configInfo ? buildConfigData(configInfo) : null),
        [configInfo]
    )

    const value = useMemo<ConfigDataContextValue>(() => ({
        data,
        loading,
        error,
        refresh
    }), [data, loading, error, refresh])

    return (
        <ConfigDataContext.Provider value={value}>
            {children}
        </ConfigDataContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfigDataCtx(): ConfigDataContextValue {
    const ctx = useContext(ConfigDataContext)
    if (!ctx) {
        throw new Error('useConfigDataCtx must be used within <ConfigDataProvider>')
    }
    return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfigData(): VirtualPatrolData {
    const ctx = useConfigDataCtx()
    if (!ctx.data) {
        throw new Error('Config data is not loaded yet')
    }
    return ctx.data
}
