import { Eye, EyeOff, Pin, Search, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type {
        PatrolMode,
        Plan,
        Project,
        Route,
        RouteSearchResult,
        RouteStats
} from './types';

type SearchMode = 'routes' | 'anchors' | 'entities';

interface LeftPanelProps {
        selectedProject: string;
        setSelectedProject: Dispatch<SetStateAction<string>>;
        projects: Project[];
        colorMode: 'instance' | 'type';
        setColorMode: Dispatch<SetStateAction<'instance' | 'type'>>;
        plans: Plan[];
        showPlansPanel: boolean;
        setShowPlansPanel: Dispatch<SetStateAction<boolean>>;
        loadPlan: (plan: Plan) => void;
        deletePlan: (planId: string) => void;
        setShowPlanModal: Dispatch<SetStateAction<boolean>>;
        selectedRoutes: string[];
        searchMode: SearchMode;
        setSearchMode: Dispatch<SetStateAction<SearchMode>>;
        searchQuery: string;
        setSearchQuery: Dispatch<SetStateAction<string>>;
        performSearch: (query: string) => void;
        searchResults: RouteSearchResult[];
        setSearchResults: Dispatch<SetStateAction<RouteSearchResult[]>>;
        showSearchResults: boolean;
        setShowSearchResults: Dispatch<SetStateAction<boolean>>;
        pinnedRoutes: string[];
        togglePinRoute: (routeId: string) => void;
        sendSingleToView: (routeId: string) => void;
        sendPinnedToView: () => void;
        routes: Route[];
        routeColors: Record<string, string>;
        getRouteStats: (routeId: string) => RouteStats;
        patrolMode: PatrolMode;
        hiddenRoutes: string[];
        hideAllRoutes: () => void;
        showAllRoutes: () => void;
        toggleRoute: (routeId: string) => void;
}

export default function LeftPanel({
        selectedProject,
        setSelectedProject,
        projects,
        colorMode,
        setColorMode,
        plans,
        showPlansPanel,
        setShowPlansPanel,
        loadPlan,
        deletePlan,
        setShowPlanModal,
        selectedRoutes,
        searchMode,
        setSearchMode,
        searchQuery,
        setSearchQuery,
        performSearch,
        searchResults,
        setSearchResults,
        showSearchResults,
        setShowSearchResults,
        pinnedRoutes,
        togglePinRoute,
        sendSingleToView,
        sendPinnedToView,
        routes,
        routeColors,
        getRouteStats,
        patrolMode,
        hiddenRoutes,
        hideAllRoutes,
        showAllRoutes,
        toggleRoute
}: LeftPanelProps) {
    const searchModes: SearchMode[] = ['routes', 'anchors', 'entities'];
    return (
        <div style={{ width: '320px', backgroundColor: '#2a2a2a', borderRight: '1px solid #444', height: '100vh', overflowY: 'auto', padding: '20px', flexShrink: 0 }}>
            
            {/* Project Selector */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Project</div>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#3a3a3a', border: '1px solid #555', color: '#e5e5e5', fontSize: '13px', cursor: 'pointer' }}>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            
            {/* Routes Overview Header */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#B12518', textTransform: 'uppercase' }}>
                Routes Overview
            </h3>
            
            {/* Color Mode Toggle */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Color Mode</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { console.log('Setting color mode to: instance'); setColorMode('instance'); }} style={{ flex: 1, padding: '8px', backgroundColor: colorMode === 'instance' ? '#B12518' : '#3a3a3a', border: 'none', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Individual
                    </button>
                    <button onClick={() => { console.log('Setting color mode to: type'); setColorMode('type'); }} style={{ flex: 1, padding: '8px', backgroundColor: colorMode === 'type' ? '#B12518' : '#3a3a3a', border: 'none', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        By Type
                    </button>
                </div>
                <p style={{ fontSize: '9px', color: '#666', marginTop: '6px' }}>
                    {colorMode === 'instance' ? 'Colors per item' : 'Colors per type'}
                </p>
            </div>
            
            {/* Plans Section */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Plans</div>
                    {plans.length > 0 && (
                        <button
                            onClick={() => setShowPlansPanel(!showPlansPanel)}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#3a3a3a',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#e5e5e5',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444444'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                        >
                            {showPlansPanel ? 'Hide' : 'Show'} ({plans.length})
                        </button>
                    )}
                </div>
                
                {/* Saved Plans List (collapsible) */}
                {showPlansPanel && plans.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                        {plans.map(plan => (
                            <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '6px', border: '1px solid #3a3a3a' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e5e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {plan.name}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#666' }}>
                                        {plan.selectedRoutes.length} route{plan.selectedRoutes.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => loadPlan(plan)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#10b981',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '9px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => deletePlan(plan.id)}
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#B12518',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '9px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f1e13'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B12518'}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Save Button - Always Visible */}
                <button
                    onClick={() => setShowPlanModal(true)}
                    disabled={selectedRoutes.length === 0}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: selectedRoutes.length === 0 ? '#3a3a3a' : '#B12518',
                        border: 'none',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: selectedRoutes.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: selectedRoutes.length === 0 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => selectedRoutes.length > 0 && (e.currentTarget.style.backgroundColor = '#8f1e13')}
                    onMouseLeave={(e) => selectedRoutes.length > 0 && (e.currentTarget.style.backgroundColor = '#B12518')}
                >
                    💾 Save Current as Plan
                </button>
            </div>
            
            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                {/* Search Mode Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {searchModes.map(mode => (
                        <button
                            key={mode}
                            onClick={() => {
                                setSearchMode(mode);
                                if (searchQuery) performSearch(searchQuery);
                            }}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: searchMode === mode ? '#B12518' : '#3a3a3a',
                                border: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={`Search ${searchMode}...`}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            performSearch(e.target.value);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 36px 10px 36px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555',
                            color: '#e5e5e5',
                            fontSize: '13px'
                        }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowSearchResults(false);
                            }}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                    <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        border: '1px solid #B12518',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Search Results ({searchResults.length}) - Searching {searchMode}
                        </div>
                        {searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: '8px',
                                    padding: '10px',
                                    backgroundColor: '#2a2a2a',
                                    borderRadius: '6px',
                                    border: '1px solid #444'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e5e5', marginBottom: '2px' }}>
                                            {result.route.name}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#888' }}>
                                            {result.route.type} • {result.route.segments} segments
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => togglePinRoute(result.route.id)}
                                            style={{
                                                padding: '4px',
                                                backgroundColor: pinnedRoutes.includes(result.route.id) ? '#8b5cf6' : '#3a3a3a',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Pin size={12} style={{ color: 'white' }} />
                                        </button>
                                        <button
                                            onClick={() => sendSingleToView(result.route.id)}
                                            style={{
                                                padding: '4px',
                                                backgroundColor: '#10b981',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Eye size={12} style={{ color: 'white' }} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '9px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                                    Found in:
                                </div>
                                <div style={{ fontSize: '10px', color: '#aaa' }}>
                                    {result.matches.map((match, mIdx) => (
                                        <div key={mIdx} style={{ marginTop: '4px', padding: '6px 8px', backgroundColor: '#1a1a1a', borderRadius: '4px', borderLeft: '3px solid #B12518' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'start' }}>
                                                <span style={{ color: '#B12518', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', minWidth: '60px' }}>
                                                    {match.field}:
                                                </span>
                                                <span style={{ color: '#e5e5e5', flex: 1 }}>{match.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Pinned Workspace */}
            {pinnedRoutes.length > 0 && !patrolMode.active && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase' }}>
                            📌 Pinned ({pinnedRoutes.length})
                        </div>
                        <button
                            onClick={sendPinnedToView}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Send All
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pinnedRoutes.map(routeId => {
                            const route = routes.find(r => r.id === routeId);
                            const isInView = selectedRoutes.includes(routeId);
                            if (!route) return null;
                            return (
                                <div
                                    key={routeId}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px',
                                        backgroundColor: '#2a2a2a',
                                        borderRadius: '4px',
                                        border: isInView ? '1px solid #10b981' : '1px solid transparent'
                                    }}
                                >
                                    <span style={{ fontSize: '11px', color: '#e5e5e5', flex: 1 }}>{route.name}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => sendSingleToView(routeId)}
                                            disabled={isInView}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: isInView ? '#3a3a3a' : '#10b981',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: isInView ? 'not-allowed' : 'pointer',
                                                fontSize: '9px',
                                                color: 'white',
                                                fontWeight: 600,
                                                opacity: isInView ? 0.5 : 1
                                            }}
                                        >
                                            {isInView ? 'In View' : 'Send'}
                                        </button>
                                        <button
                                            onClick={() => togglePinRoute(routeId)}
                                            style={{
                                                padding: '3px',
                                                backgroundColor: '#3a3a3a',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={10} style={{ color: '#888' }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Hide/Show Controls */}
            {selectedRoutes.length > 0 && !patrolMode.active && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <div style={{ fontSize: '10px', color: '#f59e0b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                        👁️ Visibility Controls
                    </div>
                    <div style={{ fontSize: '9px', color: '#888', marginBottom: '8px' }}>
                        {hiddenRoutes.length > 0 
                            ? `${hiddenRoutes.length} of ${selectedRoutes.length} routes hidden`
                            : `All ${selectedRoutes.length} routes visible`
                        }
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={hideAllRoutes}
                            disabled={hiddenRoutes.length === selectedRoutes.length}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: hiddenRoutes.length === selectedRoutes.length ? '#2a2a2a' : '#3a3a3a',
                                border: 'none',
                                color: hiddenRoutes.length === selectedRoutes.length ? '#555' : '#e5e5e5',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: hiddenRoutes.length === selectedRoutes.length ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <EyeOff size={12} />
                            Hide All
                        </button>
                        <button
                            onClick={showAllRoutes}
                            disabled={hiddenRoutes.length === 0}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: hiddenRoutes.length === 0 ? '#2a2a2a' : '#10b981',
                                border: 'none',
                                color: hiddenRoutes.length === 0 ? '#555' : 'white',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: hiddenRoutes.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <Eye size={12} />
                            Show All
                        </button>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666', marginTop: '8px' }}>
                        Toggle individual routes in tabs above
                    </div>
                </div>
            )}
            
            {/* Helper Info */}
            {selectedRoutes.length > 0 && (
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>💡 TIP</div>
                    <div style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.5' }}>
                        Pin multiple panels to the same side to auto-stack them!
                    </div>
                </div>
            )}
            
            {/* Patrol Mode Indicator */}
            {patrolMode.active && (
                <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: '8px', 
                    border: '2px solid #B12518' 
                }}>
                    <div style={{ 
                        fontSize: '11px', 
                        color: '#B12518', 
                        marginBottom: '8px', 
                        textTransform: 'uppercase', 
                        fontWeight: 700,
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ 
                            display: 'inline-block', 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#B12518', 
                            animation: 'pulse 2s infinite' 
                        }}></span>
                        PATROL MODE ACTIVE
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
                        Route selection and visibility controls are locked. Stop patrol to make changes.
                    </div>
                </div>
            )}
            
            {/* Route Cards */}
            {!showSearchResults && (
                <>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Routes ({routes.length})
                    </div>
                    
                    {routes.map(route => {
                        const isSelected = selectedRoutes.includes(route.id);
                        const isPinned = pinnedRoutes.includes(route.id);
                        const routeColor = routeColors[route.id];
                        const stats = getRouteStats(route.id);
                        
                        return (
                            <div key={route.id} style={{ 
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
                                {/* Lock indicator during patrol */}
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
                                
                                {/* Status indicators in top right */}
                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePinRoute(route.id);
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
                                
                                <div onClick={() => !patrolMode.active && toggleRoute(route.id)}>
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
                    })}
                </>
            )}
            {/* Instructions */}
            <div style={{ padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '8px', fontSize: '11px', lineHeight: '1.6', color: '#aaa' }}>
                <strong style={{ color: '#e5e5e5', display: 'block', marginBottom: '8px' }}>Try These:</strong>
                • Click palette icons to change colors<br/>
                • Use arrow buttons to pin panel<br/>
                • Pin multiple to same side = auto-stack<br/>
                • Drag panels by header<br/>
                • Resize from bottom-right<br/>
                • Click eye icons to open content<br/>
                • Navigate segments with Prev/Next
            </div>
        </div>
    );
}
