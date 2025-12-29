import { useCallback, useMemo, useState } from 'react'
import { Home, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useConfigInfo } from '../config/ConfigInfoContext'
import ConfigurationSidebar from './ConfigurationSidebar'
import DataFilesSection from './DataFilesSection'
import ServiceConfigSection from './ServiceConfigSection'
import type { ConfigurationSection } from './types'

const sectionDetails: Record<ConfigurationSection, { title: string; description: string }> = {
    'data-files': {
        title: 'Data Files',
        description: 'Review and update JSON datasets used by the twin.'
    },
    'service-config': {
        title: 'Service Config',
        description: 'Review and update the service-level configuration JSON.'
    }
}

const ConfigurationsView = () => {
    const { configInfo, loading, error: loadError, refresh } = useConfigInfo()
    const baseUrl = import.meta.env.BASE_URL ?? '/'
    const isAdmin = configInfo?.user?.isAdmin === true || configInfo?.user?.isServiceAdmin === true
    const [activeSection, setActiveSection] = useState<ConfigurationSection>('data-files')
    const navigate = useNavigate()

    const header = useMemo(() => sectionDetails[activeSection], [activeSection])
    const actionError = loadError ?? null

    const request = useCallback(async (path: string, init?: RequestInit): Promise<Response> => {
        const response = await fetch(`${baseUrl}api/${path}`, {
            credentials: 'include',
            ...init
        })

        if (response.status === 401) {
            const nextPage = encodeURIComponent(baseUrl)
            window.location.href = `${baseUrl}api/login?nextpage=${nextPage}`
            throw new Error('Unauthorized')
        }

        if (!response.ok) {
            const text = await response.text()
            throw new Error(text || `Request failed (${response.status})`)
        }

        return response
    }, [baseUrl])

    if (loading && !configInfo) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#1a1a1a', color: '#e5e5e5' }}>
                Loading configuration...
            </div>
        )
    }

    if (!configInfo) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#1a1a1a', color: '#e5e5e5' }}>
                <div className="text-center space-y-3">
                    <div>Failed to load configuration.</div>
                    {loadError ? <div style={{ color: '#f87171' }}>{loadError}</div> : null}
                    <button
                        className="px-4 py-2 rounded"
                        style={{ backgroundColor: '#2563eb', color: 'white' }}
                        onClick={() => void refresh()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                * {
                    scrollbar-width: thin;
                    scrollbar-color: #555555 #2a2a2a;
                }

                *::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }

                *::-webkit-scrollbar-track {
                    background: #2a2a2a;
                    border-radius: 6px;
                }

                *::-webkit-scrollbar-thumb {
                    background: #555555;
                    border-radius: 6px;
                    border: 2px solid #2a2a2a;
                }

                *::-webkit-scrollbar-thumb:hover {
                    background: #666666;
                }

                *::-webkit-scrollbar-corner {
                    background: #2a2a2a;
                }
            `}</style>

            <div className="flex h-screen text-gray-100" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#0f172a' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#B12518', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Operations"
                    >
                        <Home size={20} />
                    </button>
                    <button
                        onClick={() => void refresh()}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#334155', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Reload config info"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                <ConfigurationSidebar
                    activeSection={activeSection}
                    onSectionChange={(section) => {
                        if (section === 'service-config' && !isAdmin) return
                        setActiveSection(section)
                    }}
                    showServiceConfig={isAdmin}
                />

                <div className="flex-1 relative flex flex-col" style={{ backgroundColor: '#2a2a2a', zIndex: 1, minWidth: 0 }}>
                    <div className="px-8 py-6 border-b flex items-center justify-between gap-4" style={{ borderColor: '#444444' }}>
                        <div>
                            <h1 className="text-2xl" style={{ color: '#e5e5e5', fontWeight: 600 }}>
                                {header.title}
                            </h1>
                            <p className="text-sm" style={{ color: '#a3a3a3', marginTop: '4px' }}>
                                {header.description}
                            </p>
                        </div>
                        {actionError ? (
                            <div className="text-sm" style={{ color: '#f87171' }}>
                                {actionError}
                            </div>
                        ) : null}
                    </div>
                    {activeSection === 'data-files' ? (
                        <DataFilesSection request={request} canEdit={isAdmin} />
                    ) : (
                        <ServiceConfigSection request={request} />
                    )}
                </div>
            </div>
        </>
    )
}

export default ConfigurationsView
