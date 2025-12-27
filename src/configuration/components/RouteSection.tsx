import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Search, X } from 'lucide-react';
import type { AnchorToRouteLinks, Route } from '../types';

type RouteSectionProps = {
    routes: Route[];
    selectedRouteForConfig: string | null;
    routesAddedToProject: string[];
    anchorToRouteLinks: AnchorToRouteLinks;
    typeFilter: string;
    searchQuery: string;
    displayLimit: number;
    routeTypes: string[];
    onTypeFilterChange: (value: string) => void;
    onSearchQueryChange: (value: string) => void;
    onDisplayLimitChange: (limit: number) => void;
    onRouteSelect: (id: string | null) => void;
    onEditRoute: (route: Route) => void;
};

function RouteSection(props: RouteSectionProps) {
    const {
        routes,
        selectedRouteForConfig,
        routesAddedToProject,
        anchorToRouteLinks,
        typeFilter,
        searchQuery,
        displayLimit,
        routeTypes,
        onTypeFilterChange,
        onSearchQueryChange,
        onDisplayLimitChange,
        onRouteSelect,
        onEditRoute,
    } = props;

    const [showLockedRouteMessage, setShowLockedRouteMessage] = useState(false);
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

    useEffect(() => {
        if (!showLockedRouteMessage) return undefined;
        const timeout = setTimeout(
            () => setShowLockedRouteMessage(false),
            2200,
        );
        return () => clearTimeout(timeout);
    }, [showLockedRouteMessage]);

    const getTotalAnchorsForRoute = (routeId: string) => {
        const uniqueAnchors = new Set<string>();
        Object.entries(anchorToRouteLinks).forEach(([linkKey, anchors]) => {
            if (linkKey.startsWith(`${routeId}-`)) {
                anchors.forEach((anchorId) => uniqueAnchors.add(anchorId));
            }
        });
        return uniqueAnchors.size;
    };

    const filteredRoutes = routes.filter((r) => {
        if (typeFilter !== 'all' && r.type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            r.name.toLowerCase().includes(query) ||
            (r.type || '').toLowerCase().includes(query) ||
            (r.description || '').toLowerCase().includes(query)
        );
    });

    return (
        <div data-component="RouteSection" style={{ marginBottom: '20px' }}>
            <h3
                style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#B12518',
                }}
            >
                Routes ({filteredRoutes.length}/{routes.length})
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                    value={typeFilter}
                    onChange={(e) => onTypeFilterChange(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#3a3a3a',
                        border: '1px solid #555555',
                        color: '#e5e5e5',
                        fontSize: '12px',
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '110px',
                    }}
                >
                    <option value="all">All Types</option>
                    {routeTypes.map((type) => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>

                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#888888',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search routes..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 8px 8px 32px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '12px',
                            outline: 'none',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchQueryChange('')}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '2px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {showLockedRouteMessage && (
                <div
                    style={{
                        marginBottom: '10px',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: '#1a3a2a',
                        border: '1px solid #10b981',
                        color: '#c7f9e7',
                        fontSize: '11px',
                    }}
                >
                    Route is already added to the project.
                </div>
            )}

            <div
                style={{
                    fontSize: '10px',
                    color: '#666666',
                    marginBottom: '8px',
                }}
            >
                Showing {Math.min(filteredRoutes.length, displayLimit)} of{' '}
                {filteredRoutes.length} routes
            </div>

            {filteredRoutes.slice(0, displayLimit).map((route) => {
                const isLocked = routesAddedToProject.includes(route.id);
                const isSelected = selectedRouteForConfig === route.id;
                const anchorCount = getTotalAnchorsForRoute(route.id);
                const isExpanded = expandedRoute === route.id;

                return (
                    <div
                        key={route.id}
                        onClick={() => {
                            if (isLocked) {
                                setShowLockedRouteMessage(true);
                                return;
                            }
                            onRouteSelect(isSelected ? null : route.id);
                        }}
                        style={{
                            padding: '10px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            backgroundColor: isLocked
                                ? '#1a3a2a'
                                : isSelected
                                  ? 'rgba(177, 37, 24, 0.2)'
                                  : '#3a3a3a',
                            border: isLocked
                                ? '2px solid #10b981'
                                : isSelected
                                  ? '2px solid #B12518'
                                  : '2px solid transparent',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked ? 0.6 : 1,
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {route.name}
                                {isLocked && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: '#10b981',
                                        }}
                                    >
                                        🔒 In Project
                                    </span>
                                )}
                                {!isLocked && anchorCount > 0 && (
                                    <span
                                        style={{
                                            color: '#10b981',
                                            fontSize: '11px',
                                        }}
                                    >
                                        • {anchorCount} anchor
                                        {anchorCount !== 1 ? 's' : ''} linked
                                    </span>
                                )}
                            </span>
                            <div
                                style={{ display: 'flex', gap: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() =>
                                        setExpandedRoute(
                                            isExpanded ? null : route.id,
                                        )
                                    }
                                    style={{
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: '#444',
                                        border: 'none',
                                        color: '#e5e5e5',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11px',
                                    }}
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={12} />
                                    ) : (
                                        <ChevronRight size={12} />
                                    )}
                                    Segments
                                </button>
                                <button
                                    onClick={() => onEditRoute(route)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: '#555555',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <Edit2 size={10} />
                                    {route.description ? 'Edit' : 'Add'} Info
                                </button>
                            </div>
                        </div>
                        {route.description && (
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: '#cccccc',
                                    marginTop: '6px',
                                    fontStyle: 'italic',
                                }}
                            >
                                {route.description}
                            </div>
                        )}
                        <div
                            style={{
                                fontSize: '10px',
                                color: route.type ? '#888888' : '#666666',
                                marginTop: '4px',
                            }}
                        >
                            {route.type ? `${route.type} • ` : 'No type set • '}
                            {route.segments} segments
                        </div>

                        {isExpanded && (
                            <div
                                style={{
                                    marginTop: '8px',
                                    padding: '8px',
                                    backgroundColor: '#2a2a2a',
                                    borderRadius: '6px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#aaaaaa',
                                        marginBottom: '6px',
                                    }}
                                >
                                    Segments
                                </div>
                                {Array.from(
                                    { length: route.segments },
                                    (_, index) => {
                                        const linkKey = `${route.id}-${index + 1}`;
                                        const linkedAnchors =
                                            anchorToRouteLinks[linkKey] || [];
                                        return (
                                            <div
                                                key={linkKey}
                                                style={{
                                                    padding: '6px 8px',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#3a3a3a',
                                                    border: '1px solid #555555',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#e5e5e5',
                                                    }}
                                                >
                                                    Segment {index + 1}{' '}
                                                    <span
                                                        style={{
                                                            color: '#888888',
                                                            fontWeight: 400,
                                                        }}
                                                    >
                                                        ({linkedAnchors.length}{' '}
                                                        anchor
                                                        {linkedAnchors.length !==
                                                        1
                                                            ? 's'
                                                            : ''}
                                                        )
                                                    </span>
                                                </div>
                                                {linkedAnchors.length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: '6px',
                                                            display: 'flex',
                                                            gap: '6px',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        {linkedAnchors.map(
                                                            (anchorId) => (
                                                                <span
                                                                    key={
                                                                        anchorId
                                                                    }
                                                                    style={{
                                                                        fontSize:
                                                                            '10px',
                                                                        padding:
                                                                            '4px 6px',
                                                                        borderRadius:
                                                                            '4px',
                                                                        backgroundColor:
                                                                            '#2a2a2a',
                                                                        border: '1px solid #444',
                                                                        color: '#e5e5e5',
                                                                    }}
                                                                >
                                                                    {anchorId}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {filteredRoutes.length > displayLimit && (
                <button
                    onClick={() => onDisplayLimitChange(displayLimit + 5)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: '#3a3a3a',
                        border: '1px dashed #555555',
                        color: '#aaaaaa',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#444444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                    }}
                >
                    Show more ({filteredRoutes.length - displayLimit} remaining)
                </button>
            )}
        </div>
    );
}

export default RouteSection;
