// @ts-nocheck
// Frozen design prototype from user; type checking is disabled to preserve the original structure.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { MouseEvent, ChangeEvent, KeyboardEvent } from 'react';
import { Home, Sliders, X, ChevronLeft, ChevronRight, ChevronDown, Palette, Check, Eye, EyeOff, MapPin, FileText, Search, Pin } from 'lucide-react';
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Route {
  id: string;
  projectId: string;
  name: string;
  type: 'evacuation' | 'patrol';
  segments: number;
  description: string;
}

interface RoutePanel {
  position: 'floating' | 'left' | 'right' | 'bottom';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  segment: number;
}

interface PatrolMode {
  active: boolean;
  routeId: string | null;
  currentSegment: number;
  paused: boolean;
  transitioning: boolean;
  currentCCTVs: Content[];
  nextCCTVs: Content[];
}

interface Content {
  id: string;
  name: string;
  type: 'document' | 'image' | 'link' | 'cctv';
  url?: string;
}

interface ContentPanel {
  id: string;
  type: 'document' | 'image' | 'cctv';
  position: 'floating' | 'bottom';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  contentId: string;
}

interface Plan {
  id: string;
  name: string;
  projectId: string;
  selectedRoutes: string[];
  routeColors: Record<string, string>;
  anchorColors: Record<string, string>;
  createdAt: string;
}

interface SearchResult {
  type: 'route' | 'anchor' | 'content';
  id: string;
  name: string;
  route?: Route;
  matches: Array<{ field: string; value: string }>;
}

interface ColorPickerState {
  type: 'route' | 'anchor';
  id: string;
}

interface Anchor {
  id: string;
  name: string;
  type: 'equipment' | 'exit';
}

interface Project {
  id: string;
  name: string;
}

interface ColorOption {
  value: string;
  name: string;
}

// 3D View Types (aligned with mock-3dview-spec.md)
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Config types (loaded once into 3D view)
interface ThreeDViewAnchor {
  name: string;
  point: Point3D;
}

interface ThreeDViewSegment {
  name: string;
  from: Point3D;
  to: Point3D;
  viewport_name: string;
}

interface ThreeDViewViewport {
  name: string;
  camera: any; // Not used in mock
}

interface ThreeDViewConfig {
  anchors: ThreeDViewAnchor[];
  segments: ThreeDViewSegment[];
  viewports: ThreeDViewViewport[];
}

// Display command types (frequent updates)
type HexColor = string; // "#RRGGBB" format

interface AnchorRefWithColor {
  anchor_name: string;
  color: HexColor;
}

interface SegmentDisplayBundle {
  segment_name: string;
  color: HexColor;
  anchors: AnchorRefWithColor[];
}

// Event types (callbacks from 3D view)
interface SegmentClickEvent {
  segment_name: string;
}

interface AnchorClickEvent {
  anchor_name: string;
}

// Controller interface (imperative API)
interface ThreeDViewController {
  // Queries (read-only)
  getAnchorNames(): string[];
  getSegmentNames(): string[];
  
  // Display command (frequent updates)
  setDisplayedSegments(items: SegmentDisplayBundle[]): void;
  
  // Event subscriptions
  onAnchorClick(cb: (ev: AnchorClickEvent) => void): () => void; // returns unsubscribe
  onSegmentClick(cb: (ev: SegmentClickEvent) => void): () => void;
  
  // Internal lifecycle (used by ThreeDView component)
  _registerHost(host: any): void;
  _unregisterHost(): void;
}

// ============================================================================

// ============================================================================
// 3D VIEW CONTROLLER FACTORY
// ============================================================================

function createThreeDViewController(): ThreeDViewController {
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
        if (index > -1) anchorClickCallbacks.splice(index, 1);
      };
    },
    
    onSegmentClick(cb: (ev: SegmentClickEvent) => void): () => void {
      segmentClickCallbacks.push(cb);
      return () => {
        const index = segmentClickCallbacks.indexOf(cb);
        if (index > -1) segmentClickCallbacks.splice(index, 1);
      };
    },
    
    _registerHost(newHost: any): void {
      host = newHost;
      // Pass callbacks to host
      host._setAnchorClickCallbacks(anchorClickCallbacks);
      host._setSegmentClickCallbacks(segmentClickCallbacks);
    },
    
    _unregisterHost(): void {
      host = null;
    }
  };
}

// ============================================================================

// ============================================================================
// MOCK 3D VIEW COMPONENT (INLINE - Spec Compliant)
// ============================================================================

function ThreeDView({ controller, config }: { controller: ThreeDViewController; config: ThreeDViewConfig }) {
  // State
  const [displayedSegments, setDisplayedSegments] = useState<SegmentDisplayBundle[]>([]);
  const [currentViewportName, setCurrentViewportName] = useState<string | null>(null);
  const [lastClickedSegment, setLastClickedSegment] = useState<string | null>(null);
  const [lastClickedAnchor, setLastClickedAnchor] = useState<string | null>(null);
  const [showHiddenAnchors, setShowHiddenAnchors] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  
  // Callback storage
  const segmentClickCallbacks = useRef<Array<(ev: SegmentClickEvent) => void>>([]);
  const anchorClickCallbacks = useRef<Array<(ev: AnchorClickEvent) => void>>([]);
  
  // Indexes
  const segmentsByName = useRef<Map<string, ThreeDViewSegment>>(new Map());
  
  // Initialize indexes from config
  useEffect(() => {
    if (!config || !config.segments) return;
    
    segmentsByName.current.clear();
    config.segments.forEach(segment => {
      segmentsByName.current.set(segment.name, segment);
    });
  }, [config]);
  
  // Register with controller
  useEffect(() => {
    const host = {
      setDisplayedSegments: (items: SegmentDisplayBundle[]) => {
        setDisplayedSegments(items);
        
        // Set viewport from first segment
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
  
  // Early return if no config
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
  
  // Compute visible/hidden segments
  const visibleSegments = displayedSegments.filter(bundle => {
    const segment = segmentsByName.current.get(bundle.segment_name);
    return segment && segment.viewport_name === currentViewportName;
  });
  
  const hiddenSegments = displayedSegments.filter(bundle => {
    const segment = segmentsByName.current.get(bundle.segment_name);
    return !segment || segment.viewport_name !== currentViewportName;
  });
  
  // Compute visible/hidden anchors
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
  
  // Click handlers
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
  
  // Diagnostics
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
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: '#10b981',
                  padding: '4px 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {config.viewports.map(vp => (
                  <option key={vp.name} value={vp.name}>{vp.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: '#888' }}>• {visibleSegments.length} visible segments</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '8px 16px', backgroundColor: showHiddenAnchors ? '#3b82f6' : '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '6px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }} onClick={() => setShowHiddenAnchors(!showHiddenAnchors)}>
              {showHiddenAnchors ? '✓' : ''} Show Hidden Anchors
            </button>
            <button style={{ padding: '8px 16px', backgroundColor: showDiagnostics ? '#3b82f6' : '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '6px', color: '#e5e5e5', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }} onClick={() => setShowDiagnostics(!showDiagnostics)}>
              {showDiagnostics ? '✓' : ''} Show Diagnostics
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '16px', overflow: 'hidden' }}>
        {/* Segments */}
        <div style={{ flex: 1, backgroundColor: '#202020', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', fontWeight: 600, fontSize: '14px', backgroundColor: '#252525' }}>
            Segments (Current Viewport) • {visibleSegments.length}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {visibleSegments.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No segments in current viewport</div>
            ) : (
              visibleSegments.map(bundle => (
                <div key={bundle.segment_name} style={{ padding: '10px 12px', marginBottom: '6px', backgroundColor: lastClickedSegment === bundle.segment_name ? '#3b82f6' : '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => handleSegmentClick(bundle.segment_name)} onMouseEnter={(e) => { if (lastClickedSegment !== bundle.segment_name) e.currentTarget.style.backgroundColor = '#333'; }} onMouseLeave={(e) => { if (lastClickedSegment !== bundle.segment_name) e.currentTarget.style.backgroundColor = '#2a2a2a'; }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: bundle.color, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{bundle.segment_name}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{bundle.color} • {bundle.anchors.length} anchors</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Anchors */}
        <div style={{ flex: 1, backgroundColor: '#202020', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', fontWeight: 600, fontSize: '14px', backgroundColor: '#252525' }}>
            Anchors • {visibleAnchorMap.size} visible{showHiddenAnchors && ` • ${hiddenAnchorMap.size} hidden`}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {visibleAnchorMap.size === 0 && hiddenAnchorMap.size === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No anchors to display</div>
            ) : (
              <>
                {Array.from(visibleAnchorMap.entries()).map(([name, color]) => (
                  <div key={name} style={{ padding: '10px 12px', marginBottom: '6px', backgroundColor: lastClickedAnchor === name ? '#3b82f6' : '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => handleAnchorClick(name, false)} onMouseEnter={(e) => { if (lastClickedAnchor !== name) e.currentTarget.style.backgroundColor = '#333'; }} onMouseLeave={(e) => { if (lastClickedAnchor !== name) e.currentTarget.style.backgroundColor = '#2a2a2a'; }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: color, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{color}</div>
                    </div>
                  </div>
                ))}
                {showHiddenAnchors && hiddenAnchorMap.size > 0 && (
                  <>
                    <div style={{ padding: '12px 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#666', borderTop: '1px solid #333', marginTop: '8px' }}>HIDDEN ANCHORS</div>
                    {Array.from(hiddenAnchorMap.entries()).map(([name, color]) => (
                      <div key={name} style={{ padding: '10px 12px', marginBottom: '6px', backgroundColor: lastClickedAnchor === name ? '#3b82f6' : '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }} onClick={() => handleAnchorClick(name, true)} onMouseEnter={(e) => { if (lastClickedAnchor !== name) e.currentTarget.style.backgroundColor = '#333'; }} onMouseLeave={(e) => { if (lastClickedAnchor !== name) e.currentTarget.style.backgroundColor = '#2a2a2a'; }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#808080', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{name}</div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Hidden • Click to switch viewport</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Diagnostics */}
        {showDiagnostics && (
          <div style={{ maxWidth: '300px', backgroundColor: '#202020', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', fontWeight: 600, fontSize: '14px', backgroundColor: '#252525' }}>Diagnostics</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {getDiagnostics().map((line, i) => (
                <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '4px 0', color: line.startsWith('⚠️') ? '#f59e0b' : line.startsWith('✅') ? '#10b981' : '#aaa' }}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================

export default function CompletePresentationDemo(): JSX.Element {
  // ============================================================================
  // 3D VIEW CONTROLLER (stable reference, created once)
  // ============================================================================
  const threeDController = useRef<ThreeDViewController>(createThreeDViewController()).current;
  
  // App state
  const [appMode, setAppMode] = useState<'presentation' | 'configuration'>('presentation');
  const [selectedProject, setSelectedProject] = useState<string>('proj1');
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  
  // Route selection
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [routePanels, setRoutePanels] = useState<Record<string, RoutePanel>>({});
  const [routeColors, setRouteColors] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  // Pinned routes (workspace)
  const [pinnedRoutes, setPinnedRoutes] = useState<string[]>([]);
  
  // Hide/Show controls
  const [hiddenRoutes, setHiddenRoutes] = useState<string[]>([]);
  const [allRoutesHidden, setAllRoutesHidden] = useState<boolean>(false);
  
  // Advanced search
  const [searchMode, setSearchMode] = useState<'routes' | 'anchors' | 'entities'>('routes');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
  const [fullscreenCCTV, setFullscreenCCTV] = useState<Content | null>(null);
  
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
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans(selectedProject));
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>('');
  const [showPlansPanel, setShowPlansPanel] = useState<boolean>(false);
  
  // Content panels
  const [contentPanels, setContentPanels] = useState<ContentPanel[]>([]);
  
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
    setPlans(loadPlans(selectedProject));
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
      setAllRoutesHidden(false);
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
  // PATROL NAVIGATION CALLBACK (3D view uses this during patrol mode)
  // ============================================================================
  
  // Note: In the new controller pattern, the 3D view will call a callback
  // when navigation animation completes. We'll set this up when we build
  // the actual mock 3D view component. For now, keeping the old callback
  // structure for reference.
  
  const handle3DNavigationDone = useCallback((completedSegmentName: string): void => {
    if (!patrolMode.active) return;
    
    // Extract route and segment number from segment_name (e.g., 'r1-seg3' -> routeId='r1', segNum=3)
    const [routeId, segPart] = completedSegmentName.split('-seg');
    const completedSegNum = parseInt(segPart);
    
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    
    // Check if there's a next segment
    const nextSegment = completedSegNum + 1;
    if (nextSegment > route.segments) {
      // Route complete, stop patrol
      stopPatrol();
      return;
    }
    
    // Advance to next segment
    const currentCCTVs = getSegmentCCTVs(routeId, nextSegment);
    const nextCCTVs = nextSegment < route.segments 
      ? getSegmentCCTVs(routeId, nextSegment + 1) 
      : [];
    
    setPatrolMode(prev => ({
      ...prev,
      currentSegment: nextSegment,
      currentCCTVs,
      nextCCTVs,
      transitioning: false
    }));
  }, [patrolMode.active, routes]);
  
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
  
  const bringToFront = (routeId) => {
    setActivePanel(routeId);
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
  
  const sendSingleToView = (routeId) => {
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
    
    setAllRoutesHidden(true);
    setHiddenRoutes([...selectedRoutes]);
  };
  
  const showAllRoutes = (): void => {
    // Prevent during patrol
    if (patrolMode.active) return;
    
    setAllRoutesHidden(false);
    setHiddenRoutes([]);
  };
  
  const toggleRouteVisibility = (routeId: string): void => {
    // Prevent visibility changes during patrol (except for patrol route itself)
    if (patrolMode.active && patrolMode.routeId !== routeId) {
      return;
    }
    
    setHiddenRoutes(prev => {
      if (prev.includes(routeId)) {
        return prev.filter(id => id !== routeId);
      } else {
        return [...prev, routeId];
      }
    });
  };
  
  // Advanced search function
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const q = query.toLowerCase();
    const results = [];
    
    if (searchMode === 'routes') {
      // Search in route names and descriptions
      routes.forEach(route => {
        const matches = [];
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
        const matchingAnchors = [];
        
        for (let i = 1; i <= route.segments; i++) {
          const key = `${route.id}-${i}`;
          const segAnchors = (anchorToRoute[key] || [])
            .map(aid => anchors.find(a => a.id === aid))
            .filter(Boolean);
          
          segAnchors.forEach(anchor => {
            if (anchor.name.toLowerCase().includes(q) || anchor.type.toLowerCase().includes(q)) {
              matchingAnchors.push({ segment: i, anchor });
            }
          });
        }
        
        if (matchingAnchors.length > 0) {
          results.push({ 
            route, 
            matches: matchingAnchors.map(ma => ({ 
              field: 'anchor', 
              value: `${ma.anchor.name} (Segment ${ma.segment})`,
              segment: ma.segment 
            }))
          });
        }
      });
    } else if (searchMode === 'entities') {
      // Search for routes containing matching entities
      routes.forEach(route => {
        const assignedEntityIds = routeEntities[route.id] || [];
        const matchingEntities = assignedEntityIds
          .map(eid => entities.find(e => e.id === eid))
          .filter(e => e && e.name.toLowerCase().includes(q));
        
        if (matchingEntities.length > 0) {
          results.push({
            route,
            matches: matchingEntities.map(e => ({ field: 'entity', value: e.name }))
          });
        }
      });
    }
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };
  
  const pinPanel = (routeId, position) => {
    setRoutePanels(prev => ({
      ...prev,
      [routeId]: getPinnedPanelLayout(prev[routeId], position)
    }));
  };
  
  const dragPanel = (e, routeId) => {
    const panel = routePanels[routeId];
    if (!panel || panel.position !== 'floating' || e.target.closest('button')) return;
    
    e.preventDefault();
    setActivePanel(routeId);
    const startX = e.clientX - panel.x;
    const startY = e.clientY - panel.y;
    
    const move = (me) => {
      setRoutePanels(prev => ({
        ...prev,
        [routeId]: { ...prev[routeId], x: Math.max(0, me.clientX - startX), y: Math.max(0, me.clientY - startY) }
      }));
    };
    
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };
  
  const dragContentPanel = (e, panelId) => {
    const panel = contentPanels.find(p => p.id === panelId);
    if (!panel || e.target.closest('button')) return;
    
    e.preventDefault();
    setActivePanel(`content-${panelId}`);
    const startX = e.clientX - panel.x;
    const startY = e.clientY - panel.y;
    
    const move = (me) => {
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
  
  const openContent = (contentItem) => {
    const existing = contentPanels.find(p => p.content.id === contentItem.id);
    if (existing) {
      setActivePanel(`content-${existing.id}`);
    } else {
      const newPanel = {
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
  
  const getPanelStyle = (panel, routeColor, routeId) => {
    const isPatrolActive = patrolMode.active && patrolMode.routeId === routeId;
    const hasCCTVs = patrolMode.active && patrolMode.currentCCTVs.length > 0;
    
    const base = {
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
        left: panel.x, 
        top: panel.y, 
        width: panel.width, 
        height: panel.height, 
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
        width: panel.width, 
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
        width: panel.width, 
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
        height: panel.height, 
        borderRadius: '12px 12px 0 0'
      };
    }
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
    const newPanels = {};
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
  
  const goToPreviousSegment = () => {
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
  
  const goToNextSegment = () => {
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
  
  const getSegmentCCTVs = (routeId, segmentNum) => {
    const segmentKey = `${routeId}-${segmentNum}`;
    const segmentAnchors = anchorToRoute[segmentKey] || [];
    
    const allContent = [];
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
  const getRouteStats = (routeId) => {
    let anchorCount = 0;
    let contentCount = 0;
    const route = routes.find(r => r.id === routeId);
    
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
              {['routes', 'anchors', 'entities'].map(mode => (
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
      )}
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', minWidth: 0 }}>
        
        {/* Route Tabs */}
        {selectedRoutes.length > 0 && (
          <div style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #444', padding: '8px 16px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
            {validSelectedRoutes.map(routeId => {
              const route = routes.find(r => r.id === routeId);
              const routeColor = routeColors[routeId];
              const isHidden = hiddenRoutes.includes(routeId);
              
              return (
                <div 
                  key={routeId} 
                  onClick={() => bringToFront(routeId)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#2a2a2a', border: `2px solid ${routeColor}`, cursor: 'pointer', whiteSpace: 'nowrap', opacity: isHidden ? 0.5 : 1 }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: routeColor }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{route.name}</span>
                  
                  {/* Patrol Status Indicator */}
                  {patrolMode.active && patrolMode.routeId === routeId && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#B12518', color: 'white', fontWeight: 600 }}>
                      🎥 PATROL
                    </span>
                  )}
                  
                  {/* Lock Icon for Other Routes During Patrol */}
                  {patrolMode.active && patrolMode.routeId !== routeId && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#3a3a3a', color: '#888', fontWeight: 600 }}>
                      🔒 LOCKED
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!patrolMode.active || patrolMode.routeId === routeId) {
                        toggleRouteVisibility(routeId);
                      }
                    }}
                    disabled={patrolMode.active && patrolMode.routeId !== routeId}
                    style={{ 
                      padding: '2px', 
                      backgroundColor: 'transparent', 
                      border: 'none', 
                      color: patrolMode.active && patrolMode.routeId !== routeId ? '#555' : '#888', 
                      cursor: patrolMode.active && patrolMode.routeId !== routeId ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!patrolMode.active || patrolMode.routeId === routeId) {
                        toggleRoute(routeId);
                      }
                    }} 
                    disabled={patrolMode.active && patrolMode.routeId !== routeId}
                    style={{ 
                      padding: '2px', 
                      backgroundColor: 'transparent', 
                      border: 'none', 
                      color: patrolMode.active && patrolMode.routeId !== routeId ? '#555' : '#888', 
                      cursor: patrolMode.active && patrolMode.routeId !== routeId ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 3D View Container */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Route Panels */}
          {validSelectedRoutes.map(routeId => {
            const route = routes.find(r => r.id === routeId);
            const panel = routePanels[routeId];
            const routeColor = routeColors[routeId];
            const isActive = activePanel === routeId;
            const isHidden = hiddenRoutes.includes(routeId);
            
            if (!panel || isHidden) return null;
            
            const linkKey = `${routeId}-${panel.segment}`;
            const segAnchors = (anchorToRoute[linkKey] || []).map(aid => anchors.find(a => a.id === aid)).filter(Boolean);
            const assignedEntities = (routeEntities[routeId] || []).map(eid => entities.find(e => e.id === eid)).filter(Boolean);
            
            return (
              <div key={routeId} onClick={() => setActivePanel(routeId)} style={{ ...getPanelStyle(panel, routeColor, routeId), zIndex: isActive ? 1000 : 900 }}>
                
                <div style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderBottom: `2px solid ${routeColor}`, cursor: panel.position === 'floating' ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }} onMouseDown={(e) => dragPanel(e, routeId)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: routeColor }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{route.name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {panel.position !== 'left' && <button onClick={() => pinPanel(routeId, 'left')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronLeft size={14} /></button>}
                    {panel.position !== 'right' && <button onClick={() => pinPanel(routeId, 'right')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronRight size={14} /></button>}
                    {panel.position !== 'bottom' && <button onClick={() => pinPanel(routeId, 'bottom')} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><ChevronDown size={14} /></button>}
                    {panel.position !== 'floating' && <button onClick={() => pinPanel(routeId, 'floating')} style={{ padding: '4px 6px', backgroundColor: '#B12518', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>📌</button>}
                    
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#555', margin: '0 4px' }} />
                    
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setColorPicker(prev => 
                          prev?.type === 'route' && prev?.id === routeId ? null : { type: 'route', id: routeId }
                        ); 
                      }} style={{ padding: '4px 6px', backgroundColor: '#3a3a3a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}><Palette size={14} /></button>
                      
                      {colorPicker?.type === 'route' && colorPicker?.id === routeId && (
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 2000, minWidth: '180px' }}>
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
                                  console.log('Setting route color:', routeId, c.value);
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
                    
                    <button onClick={(e) => { e.stopPropagation(); toggleRoute(routeId); }} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>SEGMENT</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => panel.segment > 1 && setRoutePanels(prev => ({ ...prev, [routeId]: { ...prev[routeId], segment: prev[routeId].segment - 1 } }))} disabled={panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: panel.segment === 1 ? '#3a3a3a' : routeColor, border: 'none', color: 'white', cursor: (panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: (panel.segment === 1 || (patrolMode.active && patrolMode.routeId === routeId)) ? 0.5 : 1 }}>← Prev</button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: routeColor }}>
                        Segment {(patrolMode.active && patrolMode.routeId === routeId) ? patrolMode.currentSegment : panel.segment} / {route.segments}
                      </div>
                      <button onClick={() => panel.segment < route.segments && setRoutePanels(prev => ({ ...prev, [routeId]: { ...prev[routeId], segment: prev[routeId].segment + 1 } }))} disabled={panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: panel.segment === route.segments ? '#3a3a3a' : routeColor, border: 'none', color: 'white', cursor: (panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: (panel.segment === route.segments || (patrolMode.active && patrolMode.routeId === routeId)) ? 0.5 : 1 }}>Next →</button>
                    </div>
                  </div>
                  
                  {/* VIRTUAL PATROL CONTROLS */}
                  {patrolMode.active && patrolMode.routeId === routeId ? (
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #B12518' }}>
                      <div style={{ fontSize: '11px', color: '#B12518', marginBottom: '12px', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B12518', animation: 'pulse 2s infinite' }}></span>
                        VIRTUAL PATROL ACTIVE
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
                        {patrolMode.transitioning ? (
                          '⏳ Loading next segment...'
                        ) : patrolMode.paused ? (
                          '⏸️ Paused'
                        ) : (
                          '▶️ In Progress'
                        )}
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
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              borderRadius: '6px', 
                              backgroundColor: '#10b981', 
                              border: 'none', 
                              color: 'white', 
                              cursor: 'pointer', 
                              fontSize: '12px', 
                              fontWeight: 600 
                            }}
                          >
                            ▶️ Resume
                          </button>
                        ) : (
                          <button 
                            onClick={pausePatrol}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f59e0b', 
                              border: 'none', 
                              color: 'white', 
                              cursor: 'pointer', 
                              fontSize: '12px', 
                              fontWeight: 600 
                            }}
                          >
                            ⏸️ Pause
                          </button>
                        )}
                        
                        <button 
                          onClick={stopPatrol}
                          style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '6px', 
                            backgroundColor: '#B12518', 
                            border: 'none', 
                            color: 'white', 
                            cursor: 'pointer', 
                            fontSize: '12px', 
                            fontWeight: 600 
                          }}
                        >
                          ⏹️ Stop
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={goToPreviousSegment}
                          disabled={patrolMode.currentSegment === 1}
                          style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '6px', 
                            backgroundColor: patrolMode.currentSegment === 1 ? '#2a2a2a' : '#3a3a3a', 
                            border: 'none', 
                            color: patrolMode.currentSegment === 1 ? '#555' : '#e5e5e5', 
                            cursor: patrolMode.currentSegment === 1 ? 'not-allowed' : 'pointer', 
                            fontSize: '12px', 
                            fontWeight: 600 
                          }}
                        >
                          ◀️ Back
                        </button>
                        
                        <button 
                          onClick={goToNextSegment}
                          disabled={patrolMode.currentSegment >= route.segments}
                          style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '6px', 
                            backgroundColor: patrolMode.currentSegment >= route.segments ? '#2a2a2a' : '#3a3a3a', 
                            border: 'none', 
                            color: patrolMode.currentSegment >= route.segments ? '#555' : '#e5e5e5', 
                            cursor: patrolMode.currentSegment >= route.segments ? 'not-allowed' : 'pointer', 
                            fontSize: '12px', 
                            fontWeight: 600 
                          }}
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
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            backgroundColor: '#B12518', 
                            border: 'none', 
                            color: 'white', 
                            cursor: 'pointer', 
                            fontSize: '13px', 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          🎥 Start Virtual Patrol
                        </button>
                      </div>
                    )
                  )}
                  
                  {/* Hide anchors and content during patrol mode */}
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
                        const anchorContent = (contentToAnchor[anchor.id] || []).map(cid => content.find(c => c.id === cid)).filter(Boolean);
                        
                        return (
                          <div key={anchor.id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#3a3a3a', borderRadius: '8px', border: anchorColors[anchor.id] ? `2px solid ${anchorColor}` : '1px solid #555' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: anchorColor, marginBottom: '4px' }}>{anchor.name}</div>
                                <div style={{ fontSize: '11px', color: '#888' }}>{anchor.type}</div>
                              </div>
                              
                              <div style={{ position: 'relative' }}>
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setColorPicker(prev => 
                                    prev?.type === 'anchor' && prev?.id === anchor.id ? null : { type: 'anchor', id: anchor.id }
                                  ); 
                                }} style={{ padding: '4px', backgroundColor: '#2a2a2a', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}>
                                  <Palette size={12} />
                                </button>
                                
                                {colorPicker?.type === 'anchor' && colorPicker?.id === anchor.id && (
                                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 2001, minWidth: '180px' }}>
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
                                            console.log('Setting anchor color:', anchor.id, c.value);
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
          })}
          
          {/* Content Panels */}
          {contentPanels.map(panel => {
            const isActive = activePanel === `content-${panel.id}`;
            
            return (
              <div key={panel.id} onClick={() => setActivePanel(`content-${panel.id}`)} style={{ position: 'absolute', left: panel.x, top: panel.y, width: panel.width, height: panel.height, backgroundColor: '#2a2a2a', border: '2px solid #f59e0b', borderRadius: '12px', boxShadow: isActive ? '0 10px 40px rgba(245,158,11,0.4)' : '0 4px 20px rgba(245,158,11,0.2)', zIndex: isActive ? 1200 : 1100, display: 'flex', flexDirection: 'column', overflow: 'hidden', resize: 'both', transition: 'box-shadow 0.2s' }}>
                
                <div style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderBottom: '2px solid #f59e0b', cursor: 'move', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }} onMouseDown={(e) => dragContentPanel(e, panel.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{panel.content.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setContentPanels(prev => prev.filter(p => p.id !== panel.id)); }} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {panel.content.type === 'document' && (
                    <div style={{ textAlign: 'center' }}>
                      <FileText size={64} style={{ color: '#666', margin: '0 auto 16px' }} />
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.fileName}</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>PDF Document</p>
                    </div>
                  )}
                  
                  {panel.content.type === 'image' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🖼️</div>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.fileName}</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>Image File</p>
                    </div>
                  )}
                  
                  {panel.content.type === 'cctv' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📹</div>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.name}</p>
                      <p style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace' }}>{panel.content.cctvUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* VIRTUAL PATROL CCTV PANELS */}
          {patrolMode.active && (
            <>
              {/* Current CCTVs - RIGHT SIDE PANEL */}
              {patrolMode.currentCCTVs.length > 0 && !fullscreenCCTV && (
                <div style={{
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
                }}>
                  {/* Header - Fixed */}
                  <div style={{ 
                    padding: '16px',
                    borderBottom: '1px solid #3a3a3a',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '11px', color: '#B12518', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>
                      📹 CURRENT SEGMENT CCTVs
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Segment {patrolMode.currentSegment}
                    </div>
                    {patrolMode.currentCCTVs.length > 6 && (
                      <div style={{ fontSize: '10px', color: '#f59e0b', backgroundColor: '#2a2a2a', padding: '4px 8px', borderRadius: '4px', marginTop: '8px', display: 'inline-block' }}>
                        ⚠️ Showing 6 of {patrolMode.currentCCTVs.length} cameras
                      </div>
                    )}
                  </div>
                  
                  {/* Scrollable Content Area */}
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
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
                        {/* Fullscreen button */}
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
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B12518'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                          </svg>
                        </button>
                        
                        <div style={{ 
                          width: '100%',
                          aspectRatio: '16/9', 
                          backgroundColor: '#1a1a1a', 
                          borderRadius: '6px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '12px',
                          border: '1px solid #333'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📹</div>
                            <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
                              LIVE STREAM
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e5e5', marginBottom: '6px' }}>
                          {cctv.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                          {cctv.cctvUrl}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fullscreen CCTV View */}
              {fullscreenCCTV && (
                <div style={{
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
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #444'
                  }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#e5e5e5', marginBottom: '4px' }}>
                        {fullscreenCCTV.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                        {fullscreenCCTV.cctvUrl}
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
                  
                  <div style={{
                    flex: 1,
                    backgroundColor: '#1a1a1a',
                    borderRadius: '12px',
                    border: '2px solid #B12518',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📹</div>
                      <div style={{ fontSize: '20px', color: '#10b981', fontFamily: 'monospace', marginBottom: '8px' }}>
                        LIVE STREAM - FULLSCREEN
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        CCTV feed would display here
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Next Segment - Compact Indicator */}
              {patrolMode.active && (() => {
                const currentRoute = routes.find(r => r.id === patrolMode.routeId);
                return currentRoute && patrolMode.currentSegment < currentRoute.segments;
              })() && !fullscreenCCTV && (
                <div style={{
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
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>
                      NEXT SEGMENT {patrolMode.currentSegment + 1}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    paddingLeft: '12px',
                    borderLeft: '1px solid #3a3a3a'
                  }}>
                    <span style={{ fontSize: '20px' }}>📹</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                        {patrolMode.nextCCTVs.length}
                      </div>
                      <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>
                        Camera{patrolMode.nextCCTVs.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {patrolMode.nextCCTVs.length > 6 && (
                    <div style={{
                      fontSize: '9px',
                      color: '#f59e0b',
                      backgroundColor: '#2a2a2a',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }}>
                      {patrolMode.nextCCTVs.length - 6} hidden
                    </div>
                  )}
                </div>
              )}
            </>
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
