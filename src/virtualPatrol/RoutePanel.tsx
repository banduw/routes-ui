import { useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Eye, MapPin, Palette, Check, X } from 'lucide-react';
import type { CSSProperties, Dispatch, MouseEventHandler, SetStateAction } from 'react';
import type {
        Anchor,
        ColorPickerState,
        ContentItem,
        PatrolMode,
        RoutePanelLayout
} from './types';
import { useMockDataCtx } from './MockDataProvider';

interface RoutePanelProps {
        routeId: string;
        panel: RoutePanelLayout;
        routeColor: string;
        isActive: boolean;
        style: CSSProperties;
        colorPicker: ColorPickerState | null;
        setColorPicker: Dispatch<SetStateAction<ColorPickerState | null>>;
        setRouteColor: (routeId: string, color: string) => void;
        patrolMode: PatrolMode;
        onHeaderMouseDown: MouseEventHandler<HTMLDivElement>;
        onPin: (position: RoutePanelLayout['position']) => void;
        onActivate: () => void;
        onClose: () => void;
        onSegmentPrev: () => void;
        onSegmentNext: () => void;
        startVirtualPatrol: (routeId: string, startSegment: number) => void;
        pausePatrol: () => void;
        resumePatrol: () => void;
        stopPatrol: () => void;
        goToPreviousSegment: () => void;
        goToNextSegment: () => void;
        anchorColors: Record<string, string>;
        setAnchorColor: (anchorId: string, color: string) => void;
        openContent: (contentItem: ContentItem) => void;
}

export default function RoutePanel({
        routeId,
        panel,
        routeColor,
        isActive,
        style,
        colorPicker,
        setColorPicker,
        setRouteColor,
        patrolMode,
        onHeaderMouseDown,
        onPin,
        onActivate,
        onClose,
        onSegmentPrev,
        onSegmentNext,
        startVirtualPatrol,
        pausePatrol,
        resumePatrol,
        stopPatrol,
        goToPreviousSegment,
        goToNextSegment,
        anchorColors,
        setAnchorColor,
        openContent
}: RoutePanelProps) {
    const {
        AVAILABLE_COLORS,
        allRoutes,
        anchors,
        content,
        contentToAnchor,
        anchorToRoute,
        routeEntities,
        entities
    } = useMockDataCtx();

    const route = useMemo(() => allRoutes.find(r => r.id === routeId), [allRoutes, routeId]);
    const segAnchors = useMemo<Anchor[]>(() => {
        const key = `${routeId}-${panel.segment}`;
        return (anchorToRoute[key] || [])
            .map(aid => anchors.find(anchor => anchor.id === aid))
            .filter((anchor): anchor is Anchor => Boolean(anchor));
    }, [anchorToRoute, anchors, panel.segment, routeId]);
    const assignedEntities = useMemo(() => {
        return (routeEntities[routeId] || [])
            .map(entityId => entities.find(entity => entity.id === entityId))
            .filter((entity): entity is NonNullable<typeof entity> => Boolean(entity));
    }, [entities, routeEntities, routeId]);

    if (!route) return null;

    return (
        <div onClick={onActivate} style={{ ...style, zIndex: isActive ? 1000 : 900 }}>
            <div
                style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderBottom: `2px solid ${routeColor}`, cursor: panel.position === 'floating' ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
                onMouseDown={onHeaderMouseDown}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: routeColor }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{route.name}</span>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {panel.position !== 'left' && <button onClick={() => onPin('left')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronLeft size={14} /></button>}
                    {panel.position !== 'right' && <button onClick={() => onPin('right')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronRight size={14} /></button>}
                    {panel.position !== 'bottom' && <button onClick={() => onPin('bottom')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronDown size={14} /></button>}
                    {panel.position !== 'floating' && <button onClick={() => onPin('floating')} style={{ padding: '4px 6px', backgroundColor: '#B12518', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>📌</button>}

                    <div style={{ width: '1px', height: '16px', backgroundColor: '#555', margin: '0 4px' }} />

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setColorPicker(prev => prev?.type === 'route' && prev?.id === routeId ? null : { type: 'route', id: routeId });
                            }}
                            style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <Palette size={14} />
                        </button>

                        {colorPicker?.type === 'route' && colorPicker?.id === routeId && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 2000, minWidth: '180px' }}
                            >
                                <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>COLOR</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {AVAILABLE_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setRouteColor(routeId, c.value);
                                            }}
                                            style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: c.value, border: routeColor === c.value ? '3px solid white' : '2px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {routeColor === c.value && <Check size={16} style={{ color: 'white' }} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>SEGMENT</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={onSegmentPrev}
                            disabled={panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: panel.segment === 1 ? '#3a3a3a' : routeColor, border: 'none', color: 'white', cursor: (panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: (panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)) ? 0.5 : 1 }}
                        >
                            ← Prev
                        </button>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: routeColor }}>
                            Segment {(patrolMode.active && patrolMode.routeId === routeId) ? patrolMode.currentSegment : panel.segment} / {route.segments}
                        </div>
                        <button
                            onClick={onSegmentNext}
                            disabled={panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)}
                            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: panel.segment === route.segments ? '#3a3a3a' : routeColor, border: 'none', color: 'white', cursor: (panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: (panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)) ? 0.5 : 1 }}
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {patrolMode.active && patrolMode.routeId === routeId ? (
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #B12518' }}>
                        <div style={{ fontSize: '11px', color: '#B12518', marginBottom: '12px', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B12518', animation: 'pulse 2s infinite' }}></span>
                            VIRTUAL PATROL ACTIVE
                        </div>

                        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
                            {patrolMode.transitioning ? '⏳ Loading next segment...' : patrolMode.paused ? '⏸️ Paused' : '▶️ In Progress'}
                        </div>

                        <div style={{ marginBottom: '12px', fontSize: '11px', color: '#888', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '6px' }}>
                            <div>Current: Segment {patrolMode.currentSegment} / {route.segments}</div>
                            {patrolMode.currentSegment < route.segments && (
                                <div style={{ color: '#10b981', marginTop: '4px' }}>
                                    Next: Segment {patrolMode.currentSegment + 1}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {patrolMode.paused ? (
                                <button
                                    onClick={resumePatrol}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#10b981', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                >
                                    ▶️ Resume
                                </button>
                            ) : (
                                <button
                                    onClick={pausePatrol}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#f59e0b', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                >
                                    ⏸️ Pause
                                </button>
                            )}

                            <button
                                onClick={stopPatrol}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#B12518', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                                ⏹️ Stop
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={goToPreviousSegment}
                                disabled={patrolMode.currentSegment === 1}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: patrolMode.currentSegment === 1 ? '#2a2a2a' : '#3a3a3a', border: 'none', color: patrolMode.currentSegment === 1 ? '#555' : '#e5e5e5', cursor: patrolMode.currentSegment === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                                ◀️ Back
                            </button>

                            <button
                                onClick={goToNextSegment}
                                disabled={patrolMode.currentSegment >= route.segments}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: patrolMode.currentSegment >= route.segments ? '#2a2a2a' : '#3a3a3a', border: 'none', color: patrolMode.currentSegment >= route.segments ? '#555' : '#e5e5e5', cursor: patrolMode.currentSegment >= route.segments ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                                ▶️ Forward
                            </button>
                        </div>

                        {patrolMode.transitioning && (
                            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '6px' }}>
                                <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>LOADING CCTV STREAMS...</div>
                                <div style={{ height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '50%', backgroundColor: '#B12518', animation: 'slide 1s infinite' }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    !patrolMode.active && (
                        <div style={{ marginBottom: '16px' }}>
                            <button
                                onClick={() => startVirtualPatrol(routeId, panel.segment)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#B12518', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                🎥 Start Virtual Patrol
                            </button>
                        </div>
                    )
                )}

                {!(patrolMode.active && patrolMode.routeId === routeId) && (
                    <>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>ANCHORS ({segAnchors.length})</div>
                            {segAnchors.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                                    <MapPin size={32} style={{ color: '#666', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '12px', color: '#888' }}>No anchors</p>
                                </div>
                            ) : (
                                segAnchors.map(anchor => {
                                    const anchorColor = anchorColors[anchor.id] || '#10b981';
                                    const anchorContent = (contentToAnchor[anchor.id] || [])
                                        .map(cid => content.find(c => c.id === cid))
                                        .filter((item): item is ContentItem => Boolean(item));

                                    return (
                                        <div key={anchor.id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#3a3a3a', borderRadius: '8px', border: anchorColors[anchor.id] ? `2px solid ${anchorColor}` : '1px solid #555' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: anchorColor, marginBottom: '4px' }}>{anchor.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#888' }}>{anchor.type}</div>
                                                </div>

                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setColorPicker(prev => prev?.type === 'anchor' && prev?.id === anchor.id ? null : { type: 'anchor', id: anchor.id });
                                                        }}
                                                        style={{ padding: '4px', backgroundColor: '#2a2a2a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        <Palette size={12} />
                                                    </button>

                                                    {colorPicker?.type === 'anchor' && colorPicker?.id === anchor.id && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 2001, minWidth: '180px' }}
                                                        >
                                                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>COLOR</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                                                {AVAILABLE_COLORS.map(c => (
                                                                    <button
                                                                        key={c.value}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setAnchorColor(anchor.id, c.value);
                                                                        }}
                                                                        style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: c.value, border: anchorColor === c.value ? '3px solid white' : '2px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        {anchorColor === c.value && <Check size={16} style={{ color: 'white' }} />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {anchorContent.length > 0 && (
                                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #555' }}>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Content ({anchorContent.length})</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {anchorContent.map(c => (
                                                            <button key={c.id} onClick={() => openContent(c)} style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Eye size={12} />
                                                                {c.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {assignedEntities.length > 0 && (
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>ENTITIES ({assignedEntities.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {assignedEntities.map(entity => (
                                        <span key={entity.id} style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '10px', fontWeight: 600 }}>
                                            {entity.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
