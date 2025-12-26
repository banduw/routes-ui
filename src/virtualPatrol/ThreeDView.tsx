import { useEffect, useRef, useState } from 'react';

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface ThreeDViewAnchor {
    name: string;
    point: Point3D;
}

export interface ThreeDViewSegment {
    name: string;
    from: Point3D;
    to: Point3D;
    viewport_name: string;
}

export interface ThreeDViewViewport {
    name: string;
    camera: any; // Not used in mock
}

export interface ThreeDViewConfig {
    anchors: ThreeDViewAnchor[];
    segments: ThreeDViewSegment[];
    viewports: ThreeDViewViewport[];
}

export type HexColor = string; // "#RRGGBB" format

export interface AnchorRefWithColor {
    anchor_name: string;
    color: HexColor;
}

export interface SegmentDisplayBundle {
    segment_name: string;
    color: HexColor;
    anchors: AnchorRefWithColor[];
}

export interface SegmentClickEvent {
    segment_name: string;
}

export interface AnchorClickEvent {
    anchor_name: string;
}

export interface ThreeDViewController {
    getAnchorNames(): string[];
    getSegmentNames(): string[];
    
    setDisplayedSegments(items: SegmentDisplayBundle[]): void;
    
    onAnchorClick(cb: (ev: AnchorClickEvent) => void): () => void; // returns unsubscribe
    onSegmentClick(cb: (ev: SegmentClickEvent) => void): () => void;
    
    _registerHost(host: any): void;
    _unregisterHost(): void;
}

export function createThreeDViewController(): ThreeDViewController {
    let host: any = null;
    const anchorClickCallbacks: Array<(ev: AnchorClickEvent) => void> = [];
    const segmentClickCallbacks: Array<(ev: SegmentClickEvent) => void> = [];
    
    return {
        getAnchorNames(): string[] {
            if (!host) return [];
            return host.getAnchorNames();
        },
        
        getSegmentNames(): string[] {
            if (!host) return [];
            return host.getSegmentNames();
        },
        
        setDisplayedSegments(items: SegmentDisplayBundle[]): void {
            if (!host) {
                console.warn('[ThreeDViewController] No host registered, cannot set displayed segments');
                return;
            }
            
            host.setDisplayedSegments(items);
        },
        
        onAnchorClick(cb: (ev: AnchorClickEvent) => void): () => void {
            anchorClickCallbacks.push(cb);
            return () => {
                const index = anchorClickCallbacks.indexOf(cb);
                if (index !== -1) anchorClickCallbacks.splice(index, 1);
            };
        },
        
        onSegmentClick(cb: (ev: SegmentClickEvent) => void): () => void {
            segmentClickCallbacks.push(cb);
            return () => {
                const index = segmentClickCallbacks.indexOf(cb);
                if (index !== -1) segmentClickCallbacks.splice(index, 1);
            };
        },
        
        _registerHost(h: any): void {
            host = h;
            host._setAnchorClickCallbacks(anchorClickCallbacks);
            host._setSegmentClickCallbacks(segmentClickCallbacks);
        },
        
        _unregisterHost(): void {
            host = null;
        }
    };
}

export function ThreeDView({ controller, config }: { controller: ThreeDViewController; config: ThreeDViewConfig }) {
    const [displayedSegments, setDisplayedSegments] = useState<SegmentDisplayBundle[]>([]);
    const [currentViewportName, setCurrentViewportName] = useState<string | null>(null);
    const [lastClickedSegment, setLastClickedSegment] = useState<string | null>(null);
    const [lastClickedAnchor, setLastClickedAnchor] = useState<string | null>(null);
    const [showHiddenAnchors, setShowHiddenAnchors] = useState<boolean>(false);
    const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
    
    const segmentClickCallbacks = useRef<Array<(ev: SegmentClickEvent) => void>>([]);
    const anchorClickCallbacks = useRef<Array<(ev: AnchorClickEvent) => void>>([]);
    
    const segmentsByName = useRef<Map<string, ThreeDViewSegment>>(new Map());
    
    useEffect(() => {
        if (!config || !config.segments) return;
        
        segmentsByName.current.clear();
        config.segments.forEach(segment => {
            segmentsByName.current.set(segment.name, segment);
        });
    }, [config]);
    
    useEffect(() => {
        const host = {
            setDisplayedSegments: (items: SegmentDisplayBundle[]) => {
                setDisplayedSegments(items);
                
                if (items.length > 0) {
                    const firstSegment = segmentsByName.current.get(items[0].segment_name);
                    if (firstSegment) {
                        setCurrentViewportName(firstSegment.viewport_name);
                    }
                } else {
                    setCurrentViewportName(null);
                }
            },
            
            _setAnchorClickCallbacks: (callbacks: any) => {
                anchorClickCallbacks.current = callbacks;
            },
            _setSegmentClickCallbacks: (callbacks: any) => {
                segmentClickCallbacks.current = callbacks;
            },
            getAnchorNames: () => [],
            getSegmentNames: () => []
        };
        
        controller._registerHost(host);
        
        return () => {
            controller._unregisterHost();
        };
    }, [controller]);
    
    if (!config || !config.anchors || !config.segments || !config.viewports) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#1a1a1a',
                color: '#666',
                fontSize: '16px'
            }}>
                Loading 3D View configuration...
            </div>
        );
    }
    
    const visibleSegments = displayedSegments.filter(bundle => {
        const segment = segmentsByName.current.get(bundle.segment_name);
        return segment && segment.viewport_name === currentViewportName;
    });
    
    const hiddenSegments = displayedSegments.filter(bundle => {
        const segment = segmentsByName.current.get(bundle.segment_name);
        return !segment || segment.viewport_name !== currentViewportName;
    });
    
    const visibleAnchorMap = new Map<string, string>();
    visibleSegments.forEach(bundle => {
        bundle.anchors.forEach(anchor => {
            visibleAnchorMap.set(anchor.anchor_name, anchor.color);
        });
    });
    
    const hiddenAnchorMap = new Map<string, string>();
    hiddenSegments.forEach(bundle => {
        bundle.anchors.forEach(anchor => {
            if (!visibleAnchorMap.has(anchor.anchor_name)) {
                hiddenAnchorMap.set(anchor.anchor_name, anchor.color);
            }
        });
    });
    
    const handleSegmentClick = (segmentName: string) => {
        setLastClickedSegment(segmentName);
        setTimeout(() => setLastClickedSegment(null), 300);
        const event: SegmentClickEvent = { segment_name: segmentName };
        segmentClickCallbacks.current.forEach(cb => cb(event));
    };
    
    const handleAnchorClick = (anchorName: string, isHidden: boolean) => {
        if (isHidden) {
            for (const bundle of displayedSegments) {
                if (bundle.anchors.some(a => a.anchor_name === anchorName)) {
                    const segment = segmentsByName.current.get(bundle.segment_name);
                    if (segment) {
                        setCurrentViewportName(segment.viewport_name);
                        break;
                    }
                }
            }
        }
        setLastClickedAnchor(anchorName);
        setTimeout(() => setLastClickedAnchor(null), 300);
        const event: AnchorClickEvent = { anchor_name: anchorName };
        anchorClickCallbacks.current.forEach(cb => cb(event));
    };
    
    const getDiagnostics = () => {
        if (!config) return ['⚠️ Config not loaded'];
        const diagnostics: string[] = [];
        diagnostics.push(`Anchors: ${config.anchors.length}`);
        diagnostics.push(`Segments: ${config.segments.length}`);
        diagnostics.push(`Viewports: ${config.viewports.length}`);
        diagnostics.push('');
        diagnostics.push('✅ No issues detected');
        return diagnostics;
    };
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1a1a1a', color: '#e5e5e5', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #333', backgroundColor: '#252525' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🏢 Mock 3D View</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>Viewport:</span>
                            <select
                                value={currentViewportName || ''}
                                onChange={(e) => setCurrentViewportName(e.target.value || null)}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    border: '1px solid #444',
                                    color: '#e5e5e5',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '12px'
                                }}
                            >
                                <option value="">Select viewport</option>
                                {config.viewports.map(vp => (
                                    <option key={vp.name} value={vp.name}>{vp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => setShowHiddenAnchors(prev => !prev)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: showHiddenAnchors ? '#B12518' : '#3a3a3a',
                                border: 'none',
                                color: 'white',
                                borderRadius: '6px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            {showHiddenAnchors ? 'Hide Hidden Anchors' : 'Show Hidden Anchors'}
                        </button>
                        
                        <button
                            onClick={() => setShowDiagnostics(prev => !prev)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: showDiagnostics ? '#10b981' : '#3a3a3a',
                                border: 'none',
                                color: 'white',
                                borderRadius: '6px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Segment Viewport */}
                <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                    {currentViewportName ? (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {visibleSegments.length === 0 && (
                                <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', color: '#888' }}>No segments visible in this viewport</div>
                                </div>
                            )}
                            
                            {visibleSegments.map((bundle, idx) => (
                                <div 
                                    key={bundle.segment_name}
                                    onClick={() => handleSegmentClick(bundle.segment_name)}
                                    style={{ 
                                        border: '1px solid #333', 
                                        padding: '12px', 
                                        borderRadius: '8px', 
                                        backgroundColor: '#252525',
                                        cursor: 'pointer',
                                        boxShadow: lastClickedSegment === bundle.segment_name ? '0 0 0 3px rgba(177,37,24,0.6)' : 'none',
                                        transition: 'box-shadow 0.2s ease',
                                        animation: 'fadeIn 0.2s ease',
                                        animationDelay: `${idx * 0.05}s`,
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: bundle.color, boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }} />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 700 }}>{bundle.segment_name}</div>
                                                <div style={{ fontSize: '11px', color: '#888' }}>Viewport: {currentViewportName}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setCurrentViewportName(null); }}
                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#e5e5e5', cursor: 'pointer', fontSize: '11px' }}
                                        >
                                            Reset View
                                        </button>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                        {bundle.anchors.map(anchor => (
                                            <div 
                                                key={anchor.anchor_name}
                                                onClick={(e) => { e.stopPropagation(); handleAnchorClick(anchor.anchor_name, false); }}
                                                style={{ 
                                                    padding: '6px 10px', 
                                                    backgroundColor: '#2a2a2a', 
                                                    borderRadius: '6px', 
                                                    border: `1px solid ${anchor.color}`, 
                                                    color: anchor.color,
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    boxShadow: lastClickedAnchor === anchor.anchor_name ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none',
                                                    transition: 'box-shadow 0.2s ease'
                                                }}
                                            >
                                                📍 {anchor.anchor_name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '14px' }}>
                            Select a viewport to view segments
                        </div>
                    )}
                </div>
                
                {/* Hidden Anchors */}
                {showHiddenAnchors && (
                    <div style={{ width: '280px', borderLeft: '1px solid #333', padding: '16px', backgroundColor: '#1f1f1f', overflow: 'auto' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#e5e5e5' }}>Hidden Anchors</div>
                        {hiddenAnchorMap.size === 0 ? (
                            <div style={{ fontSize: '12px', color: '#666' }}>None</div>
                        ) : (
                            <div style={{ display: 'grid', gap: '6px' }}>
                                {Array.from(hiddenAnchorMap.entries()).map(([name, color]) => (
                                    <div 
                                        key={name}
                                        onClick={() => handleAnchorClick(name, true)}
                                        style={{ 
                                            padding: '8px', 
                                            borderRadius: '6px', 
                                            border: `1px solid ${color}`, 
                                            color,
                                            backgroundColor: '#252525',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📍 {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Diagnostics Panel */}
                {showDiagnostics && (
                    <div style={{ width: '240px', borderLeft: '1px solid #333', padding: '16px', backgroundColor: '#111', color: '#e5e5e5', overflow: 'auto' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Diagnostics</div>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', color: '#10b981' }}>
                            {getDiagnostics().join('\n')}
                        </pre>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
