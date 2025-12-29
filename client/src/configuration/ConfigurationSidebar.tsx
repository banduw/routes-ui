import React from 'react'
import type { ConfigurationSection } from './types'

type ConfigurationSidebarProps = {
    activeSection: ConfigurationSection
    onSectionChange: (section: ConfigurationSection) => void
    showServiceConfig: boolean
}

type NavButtonProps = {
    active: boolean
    title: string
    description: string
    onClick: () => void
}

const NavButton: React.FC<NavButtonProps> = ({ active, title, description, onClick }) => (
    <button
        className="p-4 border-b text-left"
        style={{
            borderColor: '#444444',
            backgroundColor: active ? '#333333' : 'transparent'
        }}
        onClick={onClick}
    >
        <div className="text-sm" style={{ color: '#e5e5e5', fontWeight: 600 }}>{title}</div>
        <div className="text-xs" style={{ color: '#9ca3af', marginTop: '4px' }}>
            {description}
        </div>
    </button>
)

const ConfigurationSidebar: React.FC<ConfigurationSidebarProps> = ({
    activeSection,
    onSectionChange,
    showServiceConfig
}) => {
    return (
        <div
            className="border-r flex flex-col w-80"
            style={{
                backgroundColor: '#2a2a2a',
                borderColor: '#444444',
                zIndex: 100,
                flexShrink: 0,
                boxShadow: '2px 0 15px rgba(0, 0, 0, 0.3)'
            }}
        >
            <div className="p-4 border-b" style={{ borderColor: '#444444' }}>
                <h2 className="text-lg" style={{ color: '#e5e5e5', fontWeight: 600 }}>
                    Configuration
                </h2>
                <p className="text-sm" style={{ color: '#a3a3a3' }}>
                    Adjust data sources and service configuration.
                </p>
            </div>

            <NavButton
                active={activeSection === 'data-files'}
                title="Data Files"
                description="Manage JSON datasets used by the app."
                onClick={() => onSectionChange('data-files')}
            />

            {showServiceConfig ? (
                <NavButton
                    active={activeSection === 'service-config'}
                    title="Service Config"
                    description="Edit service-level JSON configuration."
                    onClick={() => onSectionChange('service-config')}
                />
            ) : null}
        </div>
    )
}

export default ConfigurationSidebar
