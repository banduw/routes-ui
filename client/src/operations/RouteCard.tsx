import { Pin } from 'lucide-react';
import { useMockDataCtx } from './MockDataProvider';
import type { PatrolMode, Route, RouteStats } from './types';

interface RouteCardProps {
        route: Route;
        isSelected: boolean;
        isPinned: boolean;
        routeColor?: string;
        patrolMode: PatrolMode;
        onTogglePin: (routeId: string) => void;
        onToggleRoute: (routeId: string) => void;
}

export default function RouteCard({
        route,
        isSelected,
        isPinned,
        routeColor,
        patrolMode,
        onTogglePin,
        onToggleRoute
}: RouteCardProps) {
    const { anchorToRoute, contentToAnchor, routeEntities } = useMockDataCtx();

    const getRouteStats = (routeId: string): RouteStats => {
        let anchorCount = 0;
        let contentCount = 0;
        const routeAnchorsBySegment = anchorToRoute;

        for (let i = 1; i <= route.segments; i++) {
            const key = `${routeId}-${i}`;
            const segAnchors = routeAnchorsBySegment[key] || [];
            anchorCount += segAnchors.length;
            segAnchors.forEach(aid => {
                const segContent = contentToAnchor[aid] || [];
                contentCount += segContent.length;
            });
        }

        const assignedEntities = routeEntities[routeId] || [];
        return { anchorCount, contentCount, entityCount: assignedEntities.length };
    };

    const stats = getRouteStats(route.id);

    return (
        <div style={{
            marginBottom: '12px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: isSelected ? 'rgba(177, 37, 24, 0.15)' : '#3a3a3a',
            border: isSelected ? `2px solid ${routeColor}` : '1px solid #555',
            cursor: patrolMode.active ? 'not-allowed' : 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
            opacity: patrolMode.active ? 0.5 : 1
        }}>
            {patrolMode.active && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}>
                    <span style={{ fontSize: '32px' }}>🔒</span>
                </div>
            )}

            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(route.id);
                    }}
                    style={{
                        padding: '4px',
                        backgroundColor: isPinned ? '#8b5cf6' : '#3a3a3a',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Pin size={12} style={{ color: 'white' }} />
                </button>
                {isSelected && (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: routeColor, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                )}
            </div>

            <div onClick={() => !patrolMode.active && onToggleRoute(route.id)}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#e5e5e5', marginBottom: '4px', paddingRight: '50px' }}>{route.name}</div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{route.type} • {route.segments} segments</div>
                <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '8px' }}>{route.description}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{stats.anchorCount}</div>
                        <div style={{ fontSize: '9px', color: '#666' }}>Anchors</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>{stats.contentCount}</div>
                        <div style={{ fontSize: '9px', color: '#666' }}>Content</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#8b5cf6' }}>{stats.entityCount}</div>
                        <div style={{ fontSize: '9px', color: '#666' }}>Entities</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
