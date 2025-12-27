import { useState } from 'react';
import { Plus } from 'lucide-react';
import RouteSegmentItem from './RouteSegmentItem';
import type {
    Anchor,
    ContentItem,
    Entity,
    Route,
    RouteEntityAssignments,
} from '../types';

type RouteManagementPanelProps = {
    routes: Route[];
    entities: Entity[];
    anchors: Anchor[];
    content: ContentItem[];
    selectedRouteForConfig: string | null;
    routesAddedToProject: string[];
    selectedSegmentForLink: number | null;
    anchorToRouteLinks: Record<string, string[]>;
    contentToAnchorToSegmentLinks: Record<string, string[]>;
    routeToEntityAssignments: RouteEntityAssignments;
    currentContentIndex: Record<string, number>;
    onClose: () => void;
    onAddRouteToProject: () => void;
    onAbandonRoute: (routeId: string) => void;
    onViewContent: (linkKey: string, contentIds: string[]) => void;
    onRemoveAnchor: (segmentKey: string, anchorId: string) => void;
    onManageEntities: (routeId: string) => void;
    onViewProjectRoute: (routeId: string | null) => void;
};

function RouteManagementPanel(props: RouteManagementPanelProps) {
    const {
        routes,
        entities,
        anchors,
        content,
        selectedRouteForConfig,
        routesAddedToProject,
        selectedSegmentForLink,
        anchorToRouteLinks,
        contentToAnchorToSegmentLinks,
        routeToEntityAssignments,
        currentContentIndex,
        onClose,
        onAddRouteToProject,
        onAbandonRoute,
        onViewContent,
        onRemoveAnchor,
        onManageEntities,
        onViewProjectRoute,
    } = props;

    const [collapsedSegments, setCollapsedSegments] = useState<Set<string>>(
        new Set(),
    );

    const handleToggleCollapse = (segmentKey: string) => {
        setCollapsedSegments((prev) => {
            const next = new Set(prev);
            if (next.has(segmentKey)) {
                next.delete(segmentKey);
            } else {
                next.add(segmentKey);
            }
            return next;
        });
    };

    const getTotalAnchorsForRoute = (routeId: string) => {
        const route = routes.find((item) => item.id === routeId);
        if (!route) return 0;

        const uniqueAnchors = new Set<string>();
        for (
            let segmentNumber = 1;
            segmentNumber <= route.segments;
            segmentNumber += 1
        ) {
            const segmentAnchors =
                anchorToRouteLinks[`${routeId}-${segmentNumber}`] || [];
            segmentAnchors.forEach((anchorId) => uniqueAnchors.add(anchorId));
        }

        return uniqueAnchors.size;
    };

    return (
        <div
            data-component="RouteManagementPanel"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: '#1a1a1a',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                width: '400px',
                maxHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #333',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#10b981',
                        }}
                    >
                        Route Management
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '10px',
                            fontWeight: 600,
                        }}
                    >
                        {routesAddedToProject.length} in project
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#3a3a3a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#e5e5e5',
                        fontSize: '11px',
                        cursor: 'pointer',
                    }}
                >
                    ✕
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                {selectedRouteForConfig &&
                    !routesAddedToProject.includes(selectedRouteForConfig) &&
                    (() => {
                        const route = routes.find(
                            (item) => item.id === selectedRouteForConfig,
                        );
                        if (!route) return null;

                        return (
                            <div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#888',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Working Route
                                </div>
                                <div
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#202020',
                                        border: '1px solid #eab308',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            marginBottom: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span>{route.name}</span>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                color: '#888',
                                                fontWeight: 400,
                                            }}
                                        >
                                            ({route.segments} segments)
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        {Array.from(
                                            { length: route.segments },
                                            (_, index) => {
                                                const segmentNum = index + 1;
                                                const segmentKey = `${route.id}-${segmentNum}`;
                                                const linkedAnchorIds =
                                                    anchorToRouteLinks[
                                                        segmentKey
                                                    ] || [];
                                                const isSelected =
                                                    selectedSegmentForLink ===
                                                    segmentNum;
                                                const isCollapsed =
                                                    collapsedSegments.has(
                                                        segmentKey,
                                                    );

                                                return (
                                                    <RouteSegmentItem
                                                        key={segmentNum}
                                                        routeId={route.id}
                                                        segmentNum={segmentNum}
                                                        isSelected={isSelected}
                                                        isCollapsed={
                                                            isCollapsed
                                                        }
                                                        linkedAnchorIds={
                                                            linkedAnchorIds
                                                        }
                                                        anchors={anchors}
                                                        content={content}
                                                        contentToAnchorToSegmentLinks={
                                                            contentToAnchorToSegmentLinks
                                                        }
                                                        currentContentIndex={
                                                            currentContentIndex
                                                        }
                                                        onToggleCollapse={
                                                            handleToggleCollapse
                                                        }
                                                        onViewContent={
                                                            onViewContent
                                                        }
                                                        onRemoveAnchor={
                                                            onRemoveAnchor
                                                        }
                                                    />
                                                );
                                            },
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            marginBottom: '12px',
                                            padding: '8px',
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                marginBottom: '6px',
                                                color: '#888',
                                            }}
                                        >
                                            ENTITIES
                                        </div>
                                        {routeToEntityAssignments[route.id]
                                            ?.length ? (
                                            <div
                                                style={{
                                                    fontSize: '10px',
                                                    color: '#aaa',
                                                }}
                                            >
                                                {routeToEntityAssignments[
                                                    route.id
                                                ].map((entityId) => {
                                                    const entity =
                                                        entities.find(
                                                            (item) =>
                                                                item.id ===
                                                                entityId,
                                                        );
                                                    return entity ? (
                                                        <div
                                                            key={entityId}
                                                            style={{
                                                                padding: '4px',
                                                                marginBottom:
                                                                    '2px',
                                                            }}
                                                        >
                                                            • {entity.name}
                                                        </div>
                                                    ) : null;
                                                })}
                                                <button
                                                    onClick={() =>
                                                        onManageEntities(
                                                            route.id,
                                                        )
                                                    }
                                                    style={{
                                                        marginTop: '6px',
                                                        padding: '4px 8px',
                                                        backgroundColor:
                                                            '#3a3a3a',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        color: '#8b5cf6',
                                                        fontSize: '9px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Manage Entities
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: '10px',
                                                        color: '#666',
                                                        fontStyle: 'italic',
                                                        marginBottom: '6px',
                                                    }}
                                                >
                                                    No entities assigned
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        onManageEntities(
                                                            route.id,
                                                        )
                                                    }
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor:
                                                            '#3a3a3a',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        color: '#8b5cf6',
                                                        fontSize: '9px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    + Assign Entities
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={onAddRouteToProject}
                                        disabled={
                                            getTotalAnchorsForRoute(
                                                route.id,
                                            ) === 0
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            backgroundColor:
                                                getTotalAnchorsForRoute(
                                                    route.id,
                                                ) > 0
                                                    ? '#10b981'
                                                    : '#555555',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor:
                                                getTotalAnchorsForRoute(
                                                    route.id,
                                                ) > 0
                                                    ? 'pointer'
                                                    : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <Plus size={14} />
                                        Add to Project
                                        {getTotalAnchorsForRoute(route.id) === 0
                                            ? ' (No anchors linked)'
                                            : ''}
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                {routesAddedToProject.length > 0 && (
                    <div>
                        <div
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#888',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Project Routes
                        </div>
                        {routesAddedToProject.map((routeId) => {
                            const route = routes.find(
                                (item) => item.id === routeId,
                            );
                            if (!route) return null;

                            return (
                                <div
                                    key={routeId}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        backgroundColor: '#1a3a2a',
                                        border: '1px solid #10b981',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: '#10b981',
                                                }}
                                            >
                                                {route.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '10px',
                                                    color: '#888',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {getTotalAnchorsForRoute(
                                                    routeId,
                                                )}{' '}
                                                anchors • {route.segments}{' '}
                                                segments
                                                {routeToEntityAssignments[
                                                    routeId
                                                ]?.length
                                                    ? ` • ${routeToEntityAssignments[routeId].length} ${
                                                          routeToEntityAssignments[
                                                              routeId
                                                          ].length === 1
                                                              ? 'entity'
                                                              : 'entities'
                                                      }`
                                                    : ''}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '4px',
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    onViewProjectRoute(routeId)
                                                }
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#3a3a3a',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    color: '#10b981',
                                                    fontSize: '9px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                👁️ View
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onAbandonRoute(routeId)
                                                }
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#3a3a3a',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    color: '#ef4444',
                                                    fontSize: '9px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RouteManagementPanel;
