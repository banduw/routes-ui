import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ConfigInfo } from './types'
import { errorMessage } from '../utils/common'

type ConfigInfoContextValue = {
    configInfo: ConfigInfo | null
    loading: boolean
    error: string | null
    refresh: () => Promise<void>
}

const ConfigInfoContext = createContext<ConfigInfoContextValue | null>(null)

export function ConfigInfoProvider({ children }: { children: React.ReactNode }) {
    const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const baseUrl = import.meta.env.BASE_URL ?? '/'

    const load = useCallback(async (): Promise<void> => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${baseUrl}api/config-info`, {
                credentials: 'include'
            })
            if (response.status === 401) {
                const nextPage = encodeURIComponent(baseUrl)
                window.location.href = `${baseUrl}api/login?nextpage=${nextPage}`
                return
            }
            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || `Failed to load config-info (${response.status})`)
            }
            const data = await response.json() as ConfigInfo
            setConfigInfo(data)
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [baseUrl])

    useEffect(() => {
        void load()
    }, [load])

    const value = useMemo<ConfigInfoContextValue>(() => ({
        configInfo,
        loading,
        error,
        refresh: load
    }), [configInfo, loading, error, load])

    return (
        <ConfigInfoContext.Provider value={value}>
            {children}
        </ConfigInfoContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfigInfo(): ConfigInfoContextValue {
    const ctx = useContext(ConfigInfoContext)
    if (!ctx) {
        throw new Error('useConfigInfo must be used within <ConfigInfoProvider>')
    }
    return ctx
}
