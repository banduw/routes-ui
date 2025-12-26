import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { Home, Sliders } from 'lucide-react';
import { useMockData } from './virtualPatrol/mockData';
import { 
    buildDisplayBundles, 
    buildValidSelectedRoutes, 
    createFloatingPanelLayout, 
    getPinnedPanelLayout, 
    getRouteColorByIndex, 
    loadPlans, 
    persistPlans 
} from './virtualPatrol/logic';
import { ThreeDView, createThreeDViewController } from './virtualPatrol/ThreeDView';
import type { SegmentDisplayBundle, ThreeDViewAnchor, ThreeDViewConfig, ThreeDViewController, ThreeDViewSegment, ThreeDViewViewport } from './virtualPatrol/ThreeDView';
import type {
    Anchor,
    ColorPickerState,
    ContentItem,
    ContentPanelState,
    Entity,
    PatrolMode,
    Plan,
    Route,
    RoutePanelLayout,
    RouteSearchResult,
    RouteStats,
    SearchMatch
} from './virtualPatrol/types';
import LeftPanel from './virtualPatrol/LeftPanel';
import RoutePanel from './virtualPatrol/RoutePanel';
import ContentPanel from './virtualPatrol/ContentPanel';
import CCTVPanelsColumn from './virtualPatrol/CCTVPanelsColumn';

export default function OperationsView() {
    // ============================================================================
    // 3D VIEW CONTROLLER (stable reference, created once)
    // ============================================================================
    const threeDController = useRef<ThreeDViewController>(createThreeDViewController()).current;
    
    // App state
    const [appMode, setAppMode] = useState<'presentation' | 'configuration'>('presentation');
    const [selectedProject, setSelectedProject] = useState<string>('proj1');
    const leftPanelOpen = true;
    
    // Route selection
    const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
    const [routePanels, setRoutePanels] = useState<Record<string, RoutePanelLayout | undefined>>({});
    const [routeColors, setRouteColors] = useState<Record<string, string>>({});
    const [activePanel, setActivePanel] = useState<string | null>(null);
    
    // Pinned routes (workspace)
    const [pinnedRoutes, setPinnedRoutes] = useState<string[]>([]);
    
    // Hide/Show controls
    const [hiddenRoutes, setHiddenRoutes] = useState<string[]>([]);
    
    // Advanced search
    const [searchMode, setSearchMode] = useState<'routes' | 'anchors' | 'entities'>('routes');
    const [searchResults, setSearchResults] = useState<RouteSearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
    
    // Virtual Patrol state
    const [patrolMode, setPatrolMode] = useState<PatrolMode>({
        active: false,
        routeId: null,
        currentSegment: 1,
        paused: false,
        transitioning: false,
        currentCCTVs: [],
        nextCCTVs: []
    });
    
    // Fullscreen CCTV
    const [fullscreenCCTV, setFullscreenCCTV] = useState<ContentItem | null>(null);
    
    // ============================================================================
    // PATROL ADVANCEMENT: Driven by 3D view calling handle3DNavigationDone()
    // Module sends navigate_segment_id, 3D view animates, then calls callback
    // No countdown timer - 3D view controls all timing
    // ============================================================================
    
    // Color picker
    const [colorPicker, setColorPicker] = useState<ColorPickerState | null>(null);
    const [colorMode, setColorMode] = useState<'instance' | 'type'>('instance');
    const [anchorColors, setAnchorColors] = useState<Record<string, string>>({});
    
    // Plans system
    const [plans, setPlans] = useState<Plan[]>(() => loadPlans<Plan>(selectedProject));
    const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
    const [planName, setPlanName] = useState<string>('');
    const [showPlansPanel, setShowPlansPanel] = useState<boolean>(false);
    
    // Content panels
    const [contentPanels, setContentPanels] = useState<ContentPanelState[]>([]);
    
    // Search
    const [searchQuery, setSearchQuery] = useState<string>('');
    const {
        ROUTE_COLORS,
        AVAILABLE_COLORS,
        projects,
        allRoutes,
        anchors,
        content,
        entities,
        anchorToRoute,
        contentToAnchor,
        routeEntities
    } = useMockData();
    
    // Filter routes by current project
    const routes: Route[] = allRoutes.filter(r => r.projectId === selectedProject);
    
    // Filter selected routes to only include valid ones for current project
    const validSelectedRoutes = useMemo(
        () => buildValidSelectedRoutes(selectedRoutes, routes),
        [selectedRoutes, routes]
    );
    
    
    // ============================================================================
    // NOTE: Auto-advance is handled by 3D view calling onNavigationDone callback
    // Countdown timer REMOVED - 3D view controls pacing via 10-second animation
    // ============================================================================
    
    // Reload plans when project changes
    useEffect(() => {
        setPlans(loadPlans<Plan>(selectedProject));
    }, [selectedProject]);
    
    // Track previous project to detect actual changes
    const prevProjectRef = useRef(selectedProject);
    
    useEffect(() => {
        // Only clear if project actually changed (not initial render)
        if (prevProjectRef.current !== selectedProject) {
            // Clear all state - no preservation
            setSelectedRoutes([]);
            setRoutePanels({});
            setRouteColors({});
            setAnchorColors({});
            setPinnedRoutes([]);
            setHiddenRoutes([]);
            setContentPanels([]);
            setActivePanel(null);
            
            // Stop patrol
            if (patrolMode.active) {
                setPatrolMode({
                    active: false,
                    routeId: null,
                    currentSegment: 1,
                    paused: false,
                    transitioning: false,
                    
                    currentCCTVs: [],
                    nextCCTVs: []
                });
                setFullscreenCCTV(null);
            }
            
            // Update ref
            prevProjectRef.current = selectedProject;
        }
    }, [selectedProject, patrolMode.active]);
    
    // ============================================================================
    // 3D VIEW DATA CONTRACT
    // ============================================================================
    
    // ============================================================================
    // 3D VIEW CONFIGURATION (loaded once, defines available anchors/segments)
    // ============================================================================
    
    const threeDViewConfig = useMemo<ThreeDViewConfig>(() => {
        // Build anchors from all anchors in the system
        const configAnchors: ThreeDViewAnchor[] = anchors.map(anchor => ({
            name: anchor.id, // Using ID as name for now (TODO: use actual names in config mode)
            point: { x: 0, y: 0, z: 0 } // TODO: Add real coordinates in Config Mode
        }));
        
        // Build segments from all routes
        const configSegments: ThreeDViewSegment[] = routes.flatMap(route => {
            return Array.from({ length: route.segments }, (_, i) => {
                const segmentNumber = i + 1;
                const segmentName = `${route.id}-seg${segmentNumber}`;
                
                // Assign routes to different viewports for testing hidden anchors feature
                let viewportName = 'Viewport 1'; // Default
                if (route.id === 'r2' || route.id === 'm2') {
                    viewportName = 'Viewport 2';
                } else if (route.id === 'r3' || route.id === 'm3') {
                    viewportName = 'Viewport 3';
                }
                // r1, r4, m1, m4 stay on Viewport 1
                
                return {
                    name: segmentName,
                    from: { x: i * 100, y: 0, z: 0 }, // TODO: Real geometry in Config Mode
                    to: { x: (i + 1) * 100, y: 0, z: 0 }, // TODO: Real geometry in Config Mode
                    viewport_name: viewportName
                };
            });
        });
        
        // Define viewports
        const configViewports: ThreeDViewViewport[] = [
            { name: 'Viewport 1', camera: {} },
            { name: 'Viewport 2', camera: {} },
            { name: 'Viewport 3', camera: {} }
        ];
        
        return {
            anchors: configAnchors,
            segments: configSegments,
            viewports: configViewports
        };
    }, [routes, anchors]);
    
    // ============================================================================
    // 3D VIEW DISPLAY COMMAND (frequent updates, what to show with colors)
    // ============================================================================
    
    const prepareDisplayBundles = useMemo<SegmentDisplayBundle[]>(() => buildDisplayBundles({
        validSelectedRoutes,
        hiddenRoutes,
        routes,
        routePanels,
        routeColors,
        anchorColors,
        anchorToRoute,
        patrolMode
    }), [
        validSelectedRoutes,
        hiddenRoutes,
        routes,
        routePanels,
        routeColors,
        anchorColors,
        anchorToRoute,
        patrolMode.active,
        patrolMode.routeId,
        patrolMode.currentSegment
    ]);
    
    // ============================================================================
    // SEND DISPLAY COMMAND TO 3D VIEW (whenever display bundles change)
    // ============================================================================
    
    useEffect(() => {
        threeDController.setDisplayedSegments(prepareDisplayBundles);
    }, [prepareDisplayBundles, threeDController]);
    
    // ============================================================================
    // 3D VIEW EVENT HANDLERS (segment/anchor clicks)
    // ============================================================================
    
    useEffect(() => {
        // Handle segment clicks from 3D view
        const unsubSegment = threeDController.onSegmentClick((event) => {
            console.log('[3D View] Segment clicked:', event.segment_name);
            // TODO: Handle segment selection (navigate to that segment)
        });
        
        // Handle anchor clicks from 3D view  
        const unsubAnchor = threeDController.onAnchorClick((event) => {
            console.log('[3D View] Anchor clicked:', event.anchor_name);
            // TODO: Handle anchor selection (show anchor details)
        });
        
        return () => {
            unsubSegment();
            unsubAnchor();
        };
    }, [threeDController]);
    
    // ============================================================================
    // Handlers
    const toggleRoute = (routeId: string): void => {
        // Prevent any route changes during patrol
        if (patrolMode.active) {
            return;
        }
        
        if (selectedRoutes.includes(routeId)) {
            // Deselect
            setSelectedRoutes(prev => prev.filter(id => id !== routeId));
            setRoutePanels(prev => {
                const newPanels = { ...prev };
                delete newPanels[routeId];
                return newPanels;
            });
            if (activePanel === routeId) {
                const remaining = selectedRoutes.filter(id => id !== routeId);
                setActivePanel(remaining.length > 0 ? remaining[0] : null);
            }
        } else {
            // Select
            const newSelected = [...selectedRoutes, routeId];
            setSelectedRoutes(newSelected);
            setRoutePanels(prev => ({
                ...prev,
                [routeId]: createFloatingPanelLayout(newSelected.length - 1)
            }));
            
            // Assign color
            const colorIndex = newSelected.length - 1;
            setRouteColors(prev => ({ ...prev, [routeId]: getRouteColorByIndex(ROUTE_COLORS, colorIndex) }));
            setActivePanel(routeId);
        }
    };
    
    // Pin/Unpin to workspace
    const togglePinRoute = (routeId: string): void => {
        if (pinnedRoutes.includes(routeId)) {
            setPinnedRoutes(prev => prev.filter(id => id !== routeId));
        } else {
            setPinnedRoutes(prev => [...prev, routeId]);
        }
    };
    
    // Send pinned routes to 3D view
    const sendPinnedToView = () => {
        // Get routes that need to be added
        const routesToAdd = pinnedRoutes.filter(routeId => !selectedRoutes.includes(routeId));
        
        if (routesToAdd.length === 0) {
            return; // All pinned routes already in view
        }
        
        // Use callback-based state updates to ensure we're working with latest state
        setSelectedRoutes(prev => [...prev, ...routesToAdd]);
        
        setRoutePanels(prev => {
            const newPanels = { ...prev };
            const currentCount = selectedRoutes.length;
            
            routesToAdd.forEach((routeId, index) => {
                const offsetIndex = currentCount + index;
                newPanels[routeId] = createFloatingPanelLayout(offsetIndex);
            });
            
            return newPanels;
        });
        
        setRouteColors(prev => {
            const newColors = { ...prev };
            const currentCount = selectedRoutes.length;
            
            routesToAdd.forEach((routeId, index) => {
                const colorIndex = (currentCount + index) % ROUTE_COLORS.length;
                newColors[routeId] = getRouteColorByIndex(ROUTE_COLORS, colorIndex);
            });
            
            return newColors;
        });
        
        // Set first new route as active
        if (routesToAdd.length > 0) {
            setActivePanel(routesToAdd[0]);
        }
    };
    
    const sendSingleToView = (routeId: string): void => {
        if (selectedRoutes.includes(routeId)) {
            return; // Already in view
        }
        
        // Add route
        const newSelected = [...selectedRoutes, routeId];
        setSelectedRoutes(newSelected);
        
        // Create panel
        setRoutePanels(prev => ({
            ...prev,
            [routeId]: createFloatingPanelLayout(newSelected.length - 1)
        }));
        
        // Assign color
        const colorIndex = (newSelected.length - 1) % ROUTE_COLORS.length;
        setRouteColors(prev => ({ ...prev, [routeId]: getRouteColorByIndex(ROUTE_COLORS, colorIndex) }));
        
        // Set as active
        setActivePanel(routeId);
    };
    
    // Hide/Show handlers
    const hideAllRoutes = (): void => {
        // Prevent during patrol
        if (patrolMode.active) return;
        
        setHiddenRoutes([...selectedRoutes]);
    };
    
    const showAllRoutes = (): void => {
        // Prevent during patrol
        if (patrolMode.active) return;
        
        setHiddenRoutes([]);
    };
    
    // Advanced search function
    const performSearch = (query: string): void => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        
        const q = query.toLowerCase();
        const results: RouteSearchResult[] = [];
        
        if (searchMode === 'routes') {
            // Search in route names and descriptions
            routes.forEach(route => {
                const matches: SearchMatch[] = [];
                if (route.name.toLowerCase().includes(q)) {
                    matches.push({ field: 'name', value: route.name });
                }
                if (route.description.toLowerCase().includes(q)) {
                    matches.push({ field: 'description', value: route.description });
                }
                if (route.type.toLowerCase().includes(q)) {
                    matches.push({ field: 'type', value: route.type });
                }
                
                if (matches.length > 0) {
                    results.push({ route, matches });
                }
            });
        } else if (searchMode === 'anchors') {
            // Search for routes containing matching anchors
            routes.forEach(route => {
                const matchingAnchors: Array<{ segment: number; anchor: Anchor }> = [];
                
                for (let i = 1; i <= route.segments; i++) {
                    const key = `${route.id}-${i}`;
                    const segAnchors = (anchorToRoute[key] || [])
                        .map(aid => anchors.find(a => a.id === aid))
                        .filter((anchor): anchor is Anchor => Boolean(anchor));
                    
                    segAnchors.forEach(anchor => {
                        if (anchor.name.toLowerCase().includes(q) || anchor.type.toLowerCase().includes(q)) {
                            matchingAnchors.push({ segment: i, anchor });
                        }
                    });
                }
                
                if (matchingAnchors.length > 0) {
                    const anchorMatches: SearchMatch[] = matchingAnchors.map(ma => ({ 
                        field: 'anchor', 
                        value: `${ma.anchor.name} (Segment ${ma.segment})`,
                        segment: ma.segment 
                    }));
                    
                    results.push({ 
                        route, 
                        matches: anchorMatches
                    });
                }
            });
        } else if (searchMode === 'entities') {
            // Search for routes containing matching entities
            routes.forEach(route => {
                const assignedEntityIds = routeEntities[route.id] || [];
                const matchingEntities = assignedEntityIds
                    .map(eid => entities.find(e => e.id === eid))
                    .filter((entity): entity is Entity => Boolean(entity && entity.name.toLowerCase().includes(q)));
                
                if (matchingEntities.length > 0) {
                    const entityMatches: SearchMatch[] = matchingEntities.map(e => ({ field: 'entity', value: e.name }));
                    results.push({
                        route,
                        matches: entityMatches
                    });
                }
            });
        }
        
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    };
    
    const pinPanel = (routeId: string, position: RoutePanelLayout['position']): void => {
        setRoutePanels(prev => ({
            ...prev,
            [routeId]: getPinnedPanelLayout(prev[routeId], position)
        }));
    };
    
    const dragPanel = (e: ReactMouseEvent<HTMLDivElement>, routeId: string): void => {
        const panel = routePanels[routeId];
        if (!panel || panel.position !== 'floating' || (e.target as HTMLElement).closest('button')) return;
        
        e.preventDefault();
        setActivePanel(routeId);
        const startX = e.clientX - (panel.x ?? 0);
        const startY = e.clientY - (panel.y ?? 0);
        
        const move = (me: MouseEvent) => {
            setRoutePanels(prev => {
                const current = prev[routeId];
                if (!current) return prev;
                return {
                    ...prev,
                    [routeId]: { ...current, x: Math.max(0, me.clientX - startX), y: Math.max(0, me.clientY - startY) }
                };
            });
        };
        
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };
    
    const dragContentPanel = (e: ReactMouseEvent<HTMLDivElement>, panelId: number): void => {
        const panel = contentPanels.find(p => p.id === panelId);
        if (!panel || (e.target as HTMLElement).closest('button')) return;
        
        e.preventDefault();
        setActivePanel(`content-${panelId}`);
        const startX = e.clientX - (panel.x ?? 0);
        const startY = e.clientY - (panel.y ?? 0);
        
        const move = (me: MouseEvent) => {
            setContentPanels(prev => prev.map(p => 
                p.id === panelId ? { ...p, x: Math.max(0, me.clientX - startX), y: Math.max(0, me.clientY - startY) } : p
            ));
        };
        
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };
    
    const openContent = (contentItem: ContentItem): void => {
        const existing = contentPanels.find(p => p.content.id === contentItem.id);
        if (existing) {
            setActivePanel(`content-${existing.id}`);
        } else {
            const newPanel: ContentPanelState = {
                id: Date.now(),
                content: contentItem,
                x: 500 + contentPanels.length * 30,
                y: 150 + contentPanels.length * 30,
                width: 500,
                height: 400
            };
            setContentPanels(prev => [...prev, newPanel]);
            setActivePanel(`content-${newPanel.id}`);
        }
    };
    
    const getPanelStyle = (panel: RoutePanelLayout, routeColor: string, routeId: string): CSSProperties => {
        const isPatrolActive = patrolMode.active && patrolMode.routeId === routeId;
        const hasCCTVs = patrolMode.active && patrolMode.currentCCTVs.length > 0;
        
        const base: CSSProperties = {
            backgroundColor: '#2a2a2a',
            border: `2px solid ${routeColor}`,
            boxShadow: `0 10px 40px ${routeColor}40`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        };
        
        if (panel.position === 'floating') {
            return { 
                ...base, 
                position: 'absolute', 
                left: panel.x ?? 0, 
                top: panel.y ?? 0, 
                width: panel.width ?? 400, 
                height: panel.height ?? 500, 
                borderRadius: '12px', 
                resize: 'both'
            };
        } else if (panel.position === 'left') {
            // Compact patrol panel on left
            if (isPatrolActive) {
                return {
                    ...base,
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '280px',
                    height: 'auto',
                    maxHeight: '400px',
                    borderRadius: '0 12px 12px 0'
                };
            }
            
            // Normal left panel stacking
            const leftPinnedRoutes = selectedRoutes.filter(rid => routePanels[rid]?.position === 'left');
            const index = leftPinnedRoutes.indexOf(routeId);
            const totalPinned = leftPinnedRoutes.length;
            const heightPerPanel = 100 / totalPinned;
            
            return { 
                ...base, 
                position: 'absolute', 
                left: 0, 
                top: `${index * heightPerPanel}%`,
                width: panel.width ?? 350, 
                height: `${heightPerPanel}%`,
                borderRadius: '0 12px 12px 0'
            };
        } else if (panel.position === 'right') {
            // Compact patrol panel on right - offset for CCTV panel
            if (isPatrolActive) {
                return {
                    ...base,
                    position: 'absolute',
                    right: hasCCTVs ? '340px' : 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '280px',
                    height: 'auto',
                    maxHeight: '400px',
                    borderRadius: '12px 0 0 12px'
                };
            }
            
            // Normal right panel stacking - also offset for CCTV
            const rightPinnedRoutes = selectedRoutes.filter(rid => routePanels[rid]?.position === 'right');
            const index = rightPinnedRoutes.indexOf(routeId);
            const totalPinned = rightPinnedRoutes.length;
            const heightPerPanel = 100 / totalPinned;
            
            return { 
                ...base, 
                position: 'absolute', 
                right: hasCCTVs ? '340px' : 0, 
                top: `${index * heightPerPanel}%`,
                width: panel.width ?? 350, 
                height: `${heightPerPanel}%`, 
                borderRadius: '12px 0 0 12px'
            };
        } else if (panel.position === 'bottom') {
            // Compact patrol panel on bottom
            if (isPatrolActive) {
                return {
                    ...base,
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: hasCCTVs ? 'calc(100% - 400px)' : '400px',
                    maxWidth: '500px',
                    height: 'auto',
                    maxHeight: '350px',
                    borderRadius: '12px',
                    border: `2px solid ${routeColor}`
                };
            }
            
            // Normal bottom panel stacking - reduce width if CCTV visible
            const bottomPinnedRoutes = selectedRoutes.filter(rid => routePanels[rid]?.position === 'bottom');
            const index = bottomPinnedRoutes.indexOf(routeId);
            const totalPinned = bottomPinnedRoutes.length;
            const widthPerPanel = 100 / totalPinned;
            
            return { 
                ...base, 
                position: 'absolute', 
                left: `${index * widthPerPanel}%`,
                bottom: 0, 
                width: hasCCTVs ? `calc(${widthPerPanel}% - ${340 / totalPinned}px)` : `${widthPerPanel}%`, 
                height: panel.height ?? 300, 
                borderRadius: '12px 12px 0 0'
            };
        }

        return base;
    };
    
    // ============================================================================
    // VIRTUAL PATROL FUNCTIONS
    // ============================================================================
    
    const startVirtualPatrol = (routeId: string, startSegment: number): void => {
        const route = routes.find(r => r.id === routeId);
        if (!route) return;
        
        // Get CCTVs for current and next segment
        const currentCCTVs = getSegmentCCTVs(routeId, startSegment);
        const nextCCTVs = startSegment < route.segments ? getSegmentCCTVs(routeId, startSegment + 1) : [];
        
        setPatrolMode({
            active: true,
            routeId,
            currentSegment: startSegment,
            paused: false,
            transitioning: false,
            
            currentCCTVs,
            nextCCTVs
        });
        
        // Hide all other routes
        const otherRoutes = selectedRoutes.filter(id => id !== routeId);
        setHiddenRoutes(otherRoutes);
        
        // Clear all content panels
        setContentPanels([]);
    };
    
    const pausePatrol = () => {
        setPatrolMode(prev => ({ ...prev, paused: true }));
    };
    
    const resumePatrol = () => {
        setPatrolMode(prev => ({ ...prev, paused: false }));
    };
    
    const stopPatrol = (): void => {
        setPatrolMode({
            active: false,
            routeId: null,
            currentSegment: 1,
            paused: false,
            transitioning: false,
            
            currentCCTVs: [],
            nextCCTVs: []
        });
        setHiddenRoutes([]);
        setFullscreenCCTV(null);
    };
    
    // ============================================================================
    // PLANS MANAGEMENT
    // ============================================================================
    
    const savePlan = (): void => {
        if (!planName.trim()) return;
        
        const newPlan = {
            id: Date.now().toString(),
            name: planName.trim(),
            projectId: selectedProject,
            selectedRoutes: [...selectedRoutes],
            routeColors: { ...routeColors },
            anchorColors: { ...anchorColors },
            createdAt: new Date().toISOString()
        };
        
        const updatedPlans = [...plans, newPlan];
        setPlans(updatedPlans);
        persistPlans(selectedProject, updatedPlans);
        
        setPlanName('');
        setShowPlanModal(false);
    };
    
    const loadPlan = (plan: Plan): void => {
        setSelectedRoutes(plan.selectedRoutes);
        setRouteColors(plan.routeColors);
        setAnchorColors(plan.anchorColors);
        
        // Initialize route panels for loaded routes
        const newPanels: Record<string, RoutePanelLayout> = {};
        plan.selectedRoutes.forEach(routeId => {
            if (!routePanels[routeId]) {
                const nextIndex = Object.keys(newPanels).length;
                newPanels[routeId] = createFloatingPanelLayout(nextIndex, 400, 200);
            }
        });
        
        if (Object.keys(newPanels).length > 0) {
            setRoutePanels(prev => ({ ...prev, ...newPanels }));
        }
    };
    
    const deletePlan = (planId: string): void => {
        const updatedPlans = plans.filter(p => p.id !== planId);
        setPlans(updatedPlans);
        persistPlans(selectedProject, updatedPlans);
    };
    
    // ============================================================================
    
    const goToPreviousSegment = (): void => {
        if (patrolMode.currentSegment <= 1) return;
        
        setPatrolMode(prev => {
            const newSegment = prev.currentSegment - 1;
            const currentCCTVs = getSegmentCCTVs(prev.routeId, newSegment);
            const nextCCTVs = getSegmentCCTVs(prev.routeId, newSegment + 1);
            
            return {
                ...prev,
                currentSegment: newSegment,
                currentCCTVs,
                nextCCTVs,
                transitioning: true,
                countdown: 5
            };
        });
        
        setTimeout(() => {
            setPatrolMode(prev => ({ ...prev, transitioning: false }));
        }, 2000);
    };
    
    const goToNextSegment = (): void => {
        setPatrolMode(prev => {
            const route = routes.find(r => r.id === prev.routeId);
            if (!route || prev.currentSegment >= route.segments) return prev;
            
            const newSegment = prev.currentSegment + 1;
            const currentCCTVs = getSegmentCCTVs(prev.routeId, newSegment);
            const nextCCTVs = newSegment < route.segments ? getSegmentCCTVs(prev.routeId, newSegment + 1) : [];
            
            return {
                ...prev,
                currentSegment: newSegment,
                currentCCTVs,
                nextCCTVs,
                transitioning: true,
                countdown: 5
            };
        });
        
        setTimeout(() => {
            setPatrolMode(prev => ({ ...prev, transitioning: false }));
        }, 2000);
    };
    
    const getSegmentCCTVs = (routeId: string | null, segmentNum: number): ContentItem[] => {
        if (!routeId) return [];
        const segmentKey = `${routeId}-${segmentNum}`;
        const segmentAnchors = anchorToRoute[segmentKey] || [];
        
        const allContent: ContentItem[] = [];
        segmentAnchors.forEach(anchorId => {
            const contentIds = contentToAnchor[anchorId] || [];
            contentIds.forEach(cid => {
                const contentItem = content.find(c => c.id === cid);
                if (contentItem && contentItem.type === 'cctv' && !allContent.find(c => c.id === cid)) {
                    allContent.push(contentItem);
                }
            });
        });
        
        return allContent;
    };
    
    const setRouteColor = (routeId: string, color: string): void => {
        console.log('setRouteColor called:', { routeId, color, colorMode });
        if (colorMode === 'instance') {
            console.log('Setting individual color');
            setRouteColors(prev => ({ ...prev, [routeId]: color }));
        } else {
            console.log('Setting by type');
            const route = routes.find(r => r.id === routeId);
            if (!route) return;
            const sameType = routes.filter(r => r.type === route.type);
            setRouteColors(prev => {
                const newColors = { ...prev };
                sameType.forEach(r => {
                    if (selectedRoutes.includes(r.id)) {
                        newColors[r.id] = color;
                    }
                });
                return newColors;
            });
        }
        setColorPicker(null);
    };
    
    const setAnchorColor = (anchorId: string, color: string): void => {
        console.log('setAnchorColor called:', { anchorId, color, colorMode });
        if (colorMode === 'instance') {
            console.log('Setting individual anchor color');
            setAnchorColors(prev => ({ ...prev, [anchorId]: color }));
        } else {
            console.log('Setting anchor color by type');
            const anchor = anchors.find(a => a.id === anchorId);
            if (!anchor) return;
            const sameType = anchors.filter(a => a.type === anchor.type);
            console.log('Same type anchors:', sameType.map(a => a.id));
            setAnchorColors(prev => {
                const newColors = { ...prev };
                sameType.forEach(a => { newColors[a.id] = color; });
                return newColors;
            });
        }
        setColorPicker(null);
    };
    
    // Calculate stats for routes
    const getRouteStats = (routeId: string): RouteStats => {
        let anchorCount = 0;
        let contentCount = 0;
        const route = routes.find(r => r.id === routeId);
        if (!route) {
            return { anchorCount, contentCount, entityCount: 0 };
        }
        
        for (let i = 1; i <= route.segments; i++) {
            const key = `${routeId}-${i}`;
            const segAnchors = anchorToRoute[key] || [];
            anchorCount += segAnchors.length;
            segAnchors.forEach(aid => {
                const segContent = contentToAnchor[aid] || [];
                contentCount += segContent.length;
            });
        }
        
        const assignedEntities = routeEntities[routeId] || [];
        return { anchorCount, contentCount, entityCount: assignedEntities.length };
    };
    
    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: '#e5e5e5', fontFamily: 'system-ui' }}>
            
            {/* Left Icon Bar */}
            <div style={{ width: '64px', backgroundColor: '#2a2a2a', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => setAppMode('configuration')} style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: appMode === 'configuration' ? '#B12518' : '#3a3a3a', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sliders size={20} />
                </button>
                <button onClick={() => setAppMode('presentation')} style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: appMode === 'presentation' ? '#B12518' : '#3a3a3a', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Home size={20} />
                </button>
            </div>
            
            {/* Left Panel */}
            {leftPanelOpen && (
                <LeftPanel
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                    projects={projects}
                    colorMode={colorMode}
                    setColorMode={setColorMode}
                    plans={plans}
                    showPlansPanel={showPlansPanel}
                    setShowPlansPanel={setShowPlansPanel}
                    loadPlan={loadPlan}
                    deletePlan={deletePlan}
                    setShowPlanModal={setShowPlanModal}
                    selectedRoutes={selectedRoutes}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    performSearch={performSearch}
                    searchResults={searchResults}
                    setSearchResults={setSearchResults}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                    pinnedRoutes={pinnedRoutes}
                    togglePinRoute={togglePinRoute}
                    sendSingleToView={sendSingleToView}
                    sendPinnedToView={sendPinnedToView}
                    routes={routes}
                    routeColors={routeColors}
                    getRouteStats={getRouteStats}
                    patrolMode={patrolMode}
                    hiddenRoutes={hiddenRoutes}
                    hideAllRoutes={hideAllRoutes}
                    showAllRoutes={showAllRoutes}
                    toggleRoute={toggleRoute}
                />
            )}
            
            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', minWidth: 0 }}>
                
                {/* 3D View Container */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* Route Panels */}
                    {validSelectedRoutes.map(routeId => {
                        const route = routes.find(r => r.id === routeId);
                        if (!route) return null;
                        const panel = routePanels[routeId];
                        const routeColor = routeColors[routeId] ?? '#888888';
                        const isActive = activePanel === routeId;
                        const isHidden = hiddenRoutes.includes(routeId);
                        
                        if (!panel || isHidden) return null;
                        
                        const linkKey = `${routeId}-${panel.segment}`;
                        const segAnchors = (anchorToRoute[linkKey] || [])
                            .map(aid => anchors.find(a => a.id === aid))
                            .filter((anchor): anchor is Anchor => Boolean(anchor));
                        const assignedEntities = (routeEntities[routeId] || [])
                            .map(eid => entities.find(e => e.id === eid))
                            .filter((entity): entity is Entity => Boolean(entity));
                        const panelStyle = getPanelStyle(panel, routeColor, routeId);

                        const changeSegment = (delta: number) => {
                            setRoutePanels(prev => {
                                const existing = prev[routeId];
                                if (!existing) return prev;
                                const nextSegment = existing.segment + delta;
                                if (nextSegment < 1 || nextSegment > route.segments) return prev;
                                return { ...prev, [routeId]: { ...existing, segment: nextSegment } };
                            });
                        };
                        
                        return (
                            <RoutePanel
                                key={routeId}
                                route={route}
                                panel={panel}
                                routeColor={routeColor}
                                isActive={isActive}
                                style={panelStyle}
                                colorPicker={colorPicker}
                                setColorPicker={setColorPicker}
                                AVAILABLE_COLORS={AVAILABLE_COLORS}
                                setRouteColor={setRouteColor}
                                patrolMode={patrolMode}
                                onHeaderMouseDown={(e) => dragPanel(e, routeId)}
                                onPin={(position) => pinPanel(routeId, position)}
                                onActivate={() => setActivePanel(routeId)}
                                onClose={() => toggleRoute(routeId)}
                                onSegmentPrev={() => changeSegment(-1)}
                                onSegmentNext={() => changeSegment(1)}
                                startVirtualPatrol={startVirtualPatrol}
                                pausePatrol={pausePatrol}
                                resumePatrol={resumePatrol}
                                stopPatrol={stopPatrol}
                                goToPreviousSegment={goToPreviousSegment}
                                goToNextSegment={goToNextSegment}
                                segAnchors={segAnchors}
                                anchorColors={anchorColors}
                                setAnchorColor={setAnchorColor}
                                contentToAnchor={contentToAnchor}
                                content={content}
                                openContent={openContent}
                                assignedEntities={assignedEntities}
                            />
                        );
                    })}
                    
                    {/* Content Panels */}
                    {contentPanels.map(panel => (
                        <ContentPanel
                            key={panel.id}
                            panel={panel}
                            isActive={activePanel === `content-${panel.id}`}
                            onActivate={() => setActivePanel(`content-${panel.id}`)}
                            onDrag={(e) => dragContentPanel(e, panel.id)}
                            onClose={() => setContentPanels(prev => prev.filter(p => p.id !== panel.id))}
                        />
                    ))}
                    
                    {/* VIRTUAL PATROL CCTV PANELS */}
                    {patrolMode.active && (
                        <CCTVPanelsColumn
                            patrolMode={patrolMode}
                            fullscreenCCTV={fullscreenCCTV}
                            setFullscreenCCTV={setFullscreenCCTV}
                            routes={routes}
                        />
                    )}
                    
                    {/* Mock 3D View - Multi-Viewport Testing */}
                    <ThreeDView controller={threeDController} config={threeDViewConfig} />
                </div>
            </div>
            
            {/* Save Plan Modal */}
            {showPlanModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: '#2a2a2a',
                        border: '2px solid #B12518',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '400px',
                        maxWidth: '90vw'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#B12518', marginBottom: '16px' }}>
                            💾 Save as Plan
                        </h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px', display: 'block' }}>
                                Plan Name
                            </label>
                            <input
                                type="text"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && planName.trim() && savePlan()}
                                placeholder="e.g., Fire Drill Setup"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '6px',
                                    color: '#e5e5e5',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#B12518'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>This plan will save:</div>
                            <div style={{ fontSize: '11px', color: '#e5e5e5' }}>
                                • {selectedRoutes.length} selected route{selectedRoutes.length !== 1 ? 's' : ''}<br/>
                                • All route colors<br/>
                                • All anchor colors
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    setShowPlanModal(false);
                                    setPlanName('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#3a3a3a',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#e5e5e5',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444444'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePlan}
                                disabled={!planName.trim()}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: planName.trim() ? '#B12518' : '#3a3a3a',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: planName.trim() ? 'pointer' : 'not-allowed',
                                    opacity: planName.trim() ? 1 : 0.5
                                }}
                                onMouseEnter={(e) => planName.trim() && (e.currentTarget.style.backgroundColor = '#8f1e13')}
                                onMouseLeave={(e) => planName.trim() && (e.currentTarget.style.backgroundColor = '#B12518')}
                            >
                                Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
