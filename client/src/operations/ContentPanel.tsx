import { FileText, X } from 'lucide-react';
import type { MouseEventHandler } from 'react';
import type { ContentPanelState } from './types';

interface ContentPanelProps {
    panel: ContentPanelState;
    isActive: boolean;
    onActivate: () => void;
    onDrag: MouseEventHandler<HTMLDivElement>;
    onClose: () => void;
}

export default function ContentPanel({
    panel,
    isActive,
    onActivate,
    onDrag,
    onClose
}: ContentPanelProps) {
    const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
    const contentUrl = panel.content.type !== 'link' && panel.content.url
        ? `${baseUrl}/api/content/${encodeURIComponent(panel.content.url)}`
        : null;

    const renderMissing = (label: string) => (
        <div style={{ textAlign: 'center', color: '#888' }}>
            <p style={{ fontSize: '14px', marginBottom: '6px' }}>{label}</p>
            <p style={{ fontSize: '12px' }}>Content unavailable</p>
        </div>
    );

    const renderContent = () => {
        if (panel.content.type === 'document') {
            if (!contentUrl) return renderMissing('Document');
            return (
                <iframe
                    src={contentUrl}
                    title={panel.content.name}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', backgroundColor: '#0f172a' }}
                />
            );
        }

        if (panel.content.type === 'image') {
            if (!contentUrl) return renderMissing('Image');
            return (
                <img
                    src={contentUrl}
                    alt={panel.content.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
            );
        }

        if (panel.content.type === 'cctv') {
            if (!contentUrl) return renderMissing('CCTV stream');
            return (
                <video
                    src={contentUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '8px', objectFit: 'contain' }}
                />
            );
        }

        return renderMissing('Content');
    };

    return (
        <div
            onClick={onActivate}
            style={{
                position: 'absolute',
                left: panel.x,
                top: panel.y,
                width: panel.width,
                height: panel.height,
                backgroundColor: '#2a2a2a',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                boxShadow: isActive ? '0 10px 40px rgba(245,158,11,0.4)' : '0 4px 20px rgba(245,158,11,0.2)',
                zIndex: isActive ? 1200 : 1100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                resize: 'both',
                transition: 'box-shadow 0.2s'
            }}
        >
            <div
                style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderBottom: '2px solid #f59e0b', cursor: 'move', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
                onMouseDown={onDrag}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{panel.content.name}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                    <X size={16} />
                </button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderContent()}
            </div>
        </div>
    );
}
