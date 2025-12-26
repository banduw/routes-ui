import { X } from 'lucide-react';
import type { ContentItem, PatrolMode } from './types';
import { useProjectRoutes } from './useProjectData';

interface CCTVPanelsColumnProps {
    patrolMode: PatrolMode;
    fullscreenCCTV: ContentItem | null;
    setFullscreenCCTV: (value: ContentItem | null) => void;
    selectedProject: string;
}

export default function CCTVPanelsColumn({
    patrolMode,
    fullscreenCCTV,
    setFullscreenCCTV,
    selectedProject
}: CCTVPanelsColumnProps) {
    const routes = useProjectRoutes(selectedProject);
    const currentRoute = routes.find(r => r.id === patrolMode.routeId);
    const showNextSegment =
        patrolMode.active &&
        currentRoute &&
        patrolMode.currentSegment < currentRoute.segments;

    return (
        <>
            {patrolMode.currentCCTVs.length > 0 && !fullscreenCCTV && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '320px',
                        backgroundColor: '#1a1a1a',
                        borderLeft: '2px solid #B12518',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 800
                    }}
                >
                    <div
                        style={{
                            padding: '16px',
                            borderBottom: '1px solid #3a3a3a',
                            flexShrink: 0
                        }}
                    >
                        <div
                            style={{
                                fontSize: '11px',
                                color: '#B12518',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                marginBottom: '4px'
                            }}
                        >
                            📹 CURRENT SEGMENT CCTVs
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaa' }}>
                            Segment {patrolMode.currentSegment}
                        </div>
                        {patrolMode.currentCCTVs.length > 6 && (
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: '#f59e0b',
                                    backgroundColor: '#2a2a2a',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    marginTop: '8px',
                                    display: 'inline-block'
                                }}
                            >
                                ⚠️ Showing 6 of {patrolMode.currentCCTVs.length} cameras
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        {patrolMode.currentCCTVs.slice(0, 6).map((cctv, idx) => (
                            <div
                                key={cctv.id}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    border: '2px solid #B12518',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    position: 'relative',
                                    animation: 'fadeIn 0.3s ease-out',
                                    animationDelay: `${idx * 0.1}s`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <button
                                    onClick={() => setFullscreenCCTV(cctv)}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        padding: '6px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        border: '1px solid #555',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: '#e5e5e5',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#B12518')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                            'rgba(0, 0, 0, 0.7)')
                                    }
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                    </svg>
                                </button>

                                <div
                                    style={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '12px',
                                        border: '1px solid #333'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                                            📹
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                color: '#10b981',
                                                fontFamily: 'monospace',
                                                fontWeight: 600
                                            }}
                                        >
                                            LIVE STREAM
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#e5e5e5',
                                        marginBottom: '6px'
                                    }}
                                >
                                    {cctv.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {cctv.url}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {fullscreenCCTV && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: '1px solid #444'
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#e5e5e5',
                                    marginBottom: '4px'
                                }}
                            >
                                {fullscreenCCTV.name}
                            </div>
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#888',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {fullscreenCCTV.url}
                            </div>
                        </div>
                        <button
                            onClick={() => setFullscreenCCTV(null)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#B12518',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <X size={16} />
                            Exit Fullscreen
                        </button>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            border: '2px solid #B12518',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📹</div>
                            <div
                                style={{
                                    fontSize: '20px',
                                    color: '#10b981',
                                    fontFamily: 'monospace',
                                    marginBottom: '8px'
                                }}
                            >
                                LIVE STREAM - FULLSCREEN
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                                CCTV feed would display here
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNextSegment && !fullscreenCCTV && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '16px',
                        backgroundColor: 'rgba(42, 42, 42, 0.95)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        zIndex: 799,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                animation: 'pulse 2s infinite'
                            }}
                        ></div>
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#10b981',
                                fontWeight: 700,
                                letterSpacing: '1px'
                            }}
                        >
                            NEXT SEGMENT {patrolMode.currentSegment + 1}
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            paddingLeft: '12px',
                            borderLeft: '1px solid #3a3a3a'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>📹</span>
                        <div>
                            <div
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#10b981'
                                }}
                            >
                                {patrolMode.nextCCTVs.length}
                            </div>
                            <div
                                style={{
                                    fontSize: '9px',
                                    color: '#888',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Camera{patrolMode.nextCCTVs.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {patrolMode.nextCCTVs.length > 6 && (
                        <div
                            style={{
                                fontSize: '9px',
                                color: '#f59e0b',
                                backgroundColor: '#2a2a2a',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px'
                            }}
                        >
                            {patrolMode.nextCCTVs.length - 6} hidden
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
