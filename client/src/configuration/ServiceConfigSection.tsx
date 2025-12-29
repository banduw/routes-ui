import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../utils/common'

type ServiceConfigSectionProps = {
    request: (path: string, init?: RequestInit) => Promise<Response>
}

const ServiceConfigSection: React.FC<ServiceConfigSectionProps> = ({ request }) => {
    const [serviceConfigContent, setServiceConfigContent] = useState<string>('')
    const [originalServiceConfigContent, setOriginalServiceConfigContent] = useState<string>('')
    const [serviceConfigStatus, setServiceConfigStatus] = useState<string | null>(null)
    const [serviceConfigError, setServiceConfigError] = useState<string | null>(null)
    const [isLoadingServiceConfig, setIsLoadingServiceConfig] = useState(false)
    const [isSavingServiceConfig, setIsSavingServiceConfig] = useState(false)

    const loadServiceConfig = useCallback(async (): Promise<void> => {
        setIsLoadingServiceConfig(true)
        setServiceConfigError(null)
        setServiceConfigStatus(null)
        try {
            const response = await request('read-account-config', {
                method: 'POST',
                credentials: 'include'
            })
            const text = await response.text()
            let pretty = text
            try {
                const parsed = JSON.parse(text)
                pretty = JSON.stringify(parsed, null, 2)
            } catch {
                pretty = text
            }
            setServiceConfigContent(pretty)
            setOriginalServiceConfigContent(pretty)
        } catch (err) {
            setServiceConfigError(errorMessage(err))
            setServiceConfigContent('')
            setOriginalServiceConfigContent('')
        } finally {
            setIsLoadingServiceConfig(false)
        }
    }, [request])

    const handleServiceConfigSave = useCallback(async () => {
        setIsSavingServiceConfig(true)
        setServiceConfigError(null)
        setServiceConfigStatus(null)
        try {
            const parsed = JSON.parse(serviceConfigContent)
            const payload = JSON.stringify(parsed, null, 2)
            await request('save-account-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: payload
            })
            setServiceConfigContent(payload)
            setOriginalServiceConfigContent(payload)
            setServiceConfigStatus('Saved.')
        } catch (err) {
            setServiceConfigError(errorMessage(err))
        } finally {
            setIsSavingServiceConfig(false)
        }
    }, [request, serviceConfigContent])

    const isServiceConfigDirty = useMemo(
        () => serviceConfigContent !== originalServiceConfigContent,
        [serviceConfigContent, originalServiceConfigContent]
    )

    useEffect(() => {
        void loadServiceConfig()
    }, [loadServiceConfig])

    return (
        <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#444444' }}>
                <div>
                    <div className="text-sm" style={{ color: '#e5e5e5', fontWeight: 600 }}>
                        Service Configuration
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af', marginTop: '2px' }}>
                        {isServiceConfigDirty ? 'Unsaved changes' : 'All changes saved'}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="text-xs px-3 py-1 rounded"
                        style={{ backgroundColor: '#3f3f3f', color: '#e5e5e5' }}
                        onClick={() => void loadServiceConfig()}
                        disabled={isLoadingServiceConfig}
                    >
                        {isLoadingServiceConfig ? 'Loading...' : 'Reload'}
                    </button>
                    <button
                        className="text-xs px-3 py-1 rounded"
                        style={{
                            backgroundColor: isServiceConfigDirty ? '#2563eb' : '#3f3f3f',
                            color: '#e5e5e5',
                            opacity: isServiceConfigDirty ? 1 : 0.6
                        }}
                        onClick={() => void handleServiceConfigSave()}
                        disabled={!isServiceConfigDirty || isSavingServiceConfig}
                    >
                        {isSavingServiceConfig ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
                {serviceConfigError ? (
                    <div className="mb-4 text-xs" style={{ color: '#f87171' }}>{serviceConfigError}</div>
                ) : null}
                {serviceConfigStatus ? (
                    <div className="mb-4 text-xs" style={{ color: '#34d399' }}>{serviceConfigStatus}</div>
                ) : null}
                <textarea
                    className="w-full h-full p-3 text-xs font-mono rounded border"
                    style={{
                        backgroundColor: '#1f1f1f',
                        borderColor: '#444444',
                        color: '#e5e5e5',
                        minHeight: '400px'
                    }}
                    value={serviceConfigContent}
                    onChange={(event) => setServiceConfigContent(event.target.value)}
                    placeholder="Loading configuration..."
                    spellCheck={false}
                />
            </div>
        </div>
    )
}

export default ServiceConfigSection
