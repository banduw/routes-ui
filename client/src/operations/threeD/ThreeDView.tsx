import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfigInfo } from '../../config/ConfigInfoContext';
import type { AnchorRefWithColor } from './types';
import type { BimConfig, BimDot, BimModel, BimSector, BimViewport, Building, Level } from './types';
import { discoverElementsByProps } from './element-discovery';
import { CeilingDiscovery } from "./ceiling-discovery";
import DotView from './DotView';
import ForgeViewer from './ForgeViewer';
import ThreeDToolbar from './ThreeDToolbar';
import type { AnchorGroup } from './types';
import { box3FromObject } from './utilities';

const ALL_LEVELS_LABEL = 'ALL LEVELS';

type LevelOption = Level & { isAllLevels?: boolean };

type AnchorMeta = {
    dot: BimDot;
    modelName: string;
    building?: Building;
    level?: Level | null;
    sector?: BimSector | null;
    viewport?: BimViewport | null;
};

export type ThreeDViewProps = {
    anchors: AnchorRefWithColor[]
    bimConfig?: BimConfig | null;
    onDotClick: (anchor: string) => void
    onRequestSelectionOptions: (rowIds: number[]) => void;
    onClearSelection: () => void;
};

const ThreeDView: React.FC<ThreeDViewProps> = ({
    anchors,
    bimConfig,
    onDotClick
}) => {
    const { configInfo } = useConfigInfo();

    const hostContainer = useRef<HTMLDivElement | null>(null);
    const forgeViewerRef = useRef<Autodesk.Viewing.GuiViewer3D | null>(null);

    const toHideDbIds = useRef<Map<Autodesk.Viewing.Model, number[]>>(new Map());
    const [viewerReady, setViewerReady] = useState(false);
    const backStateRef = useRef<any | null>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const suppressNextSectorApply = useRef(false);
    const pendingLevelRef = useRef<string | null>(null);
    const ceilingDiscovery = useRef(new CeilingDiscovery())
    const [clickedAnchor, setClickedAnchor] = useState<string>()

    const buildingOptions = bimConfig?.buildings ?? [];
    const [selectedBuildingName, setSelectedBuildingName] = useState<string>(buildingOptions[0]?.name ?? '');

    useEffect(() => {
        if (!buildingOptions.length) {
            setSelectedBuildingName('');
            pendingLevelRef.current = null;
            return;
        }
        if (!buildingOptions.some(b => b.name === selectedBuildingName)) {
            pendingLevelRef.current = ALL_LEVELS_LABEL;
            setSelectedBuildingName(buildingOptions[0].name);
        }
    }, [buildingOptions, selectedBuildingName]);

    const selectedBuilding = useMemo(
        () => buildingOptions.find(b => b.name === selectedBuildingName) ?? buildingOptions[0] ?? null,
        [buildingOptions, selectedBuildingName]
    );

    const levelOptions = useMemo<LevelOption[]>(() => {
        if (!selectedBuilding) return [];

        const uniqueLevels = new Map<string, LevelOption>();
        (selectedBuilding.levels ?? []).forEach(level => {
            if (level.name === ALL_LEVELS_LABEL) return;
            if (!uniqueLevels.has(level.name)) {
                uniqueLevels.set(level.name, level);
            }
        });

        const allLevelsOption: LevelOption = {
            name: ALL_LEVELS_LABEL,
            sectorName: selectedBuilding.sectorName,
            isAllLevels: true
        };

        return [allLevelsOption, ...Array.from(uniqueLevels.values())];
    }, [selectedBuilding]);
    const [selectedLevel, setSelectedLevel] = useState<string>(levelOptions[0]?.name ?? '');

    useEffect(() => {
        const pending = pendingLevelRef.current;
        const levelNames = levelOptions.map(l => l.name);
        if (pending && levelNames.includes(pending)) {
            setSelectedLevel(pending);
            pendingLevelRef.current = null;
            return;
        }
        if (!selectedLevel || !levelNames.includes(selectedLevel)) {
            setSelectedLevel(levelOptions[0]?.name ?? '');
        }
    }, [levelOptions, selectedLevel]);

    const forgeModel = useMemo<BimModel | undefined>(() => {
        if (bimConfig && selectedBuilding) {
            return bimConfig.bimModels.find(m => m.name === selectedBuilding.modelName);
        }
        return undefined;
    }, [bimConfig, selectedBuilding]);
    const modelName = forgeModel?.name ?? null;

    useEffect(() => {
        setViewerReady(false);
        toHideDbIds.current = new Map();
    }, [forgeModel]);

    useEffect(() => {
        backStateRef.current = null;
        setCanGoBack(false);
    }, [forgeModel?.name]);

    const currentModelBuildings = useMemo(
        () => (modelName ? buildingOptions.filter((b) => b.modelName === modelName) : []),
        [buildingOptions, modelName]
    );

    const modelViewports = useMemo<BimViewport[]>(() => {
        if (modelName && configInfo?.bimViewports) {
            return configInfo.bimViewports[modelName] ?? [];
        }
        return [];
    }, [configInfo?.bimViewports, modelName]);

    const currentModelSectors = useMemo(() => {
        const map = new Map<string, BimSector>();
        if (!modelName || !configInfo?.bimSectors) return map;

        const levelSectorNames = new Set<string>();
        currentModelBuildings.forEach((b) => {
            b.levels?.forEach((lvl) => {
                if (lvl.sectorName) levelSectorNames.add(lvl.sectorName);
            });
        });

        const sectors = configInfo.bimSectors[modelName] ?? [];
        sectors?.forEach((s) => {
            map.set(s.name, {
                name: s.name,
                isLevel: levelSectorNames.has(s.name),
                cutplanes: s.cutplanes ?? [],
                bounds: box3FromObject(s.bounds)
            });
        });

        return map;
    }, [configInfo?.bimSectors, currentModelBuildings, modelName]);

    const selectedLevelObj = useMemo(
        () => levelOptions.find(l => l.name === selectedLevel) ?? null,
        [levelOptions, selectedLevel]
    );

    const buildingSector = useMemo(() => {
        if (!selectedBuilding?.sectorName) return null;
        return currentModelSectors.get(selectedBuilding.sectorName) ?? null;
    }, [currentModelSectors, selectedBuilding?.sectorName]);

    const activeSector = useMemo(() => {
        const sectorName = selectedLevelObj?.sectorName ?? selectedBuilding?.sectorName;
        if (!sectorName) return null;
        return currentModelSectors.get(sectorName) ?? null;
    }, [currentModelSectors, selectedBuilding?.sectorName, selectedLevelObj?.sectorName]);

    const anchorMetaByKey = useMemo(() => {
        const meta = new Map<string, AnchorMeta>();
        if (!configInfo?.bimDots || !modelName) return meta;

        const sectorMap = currentModelSectors;
        const buildings = currentModelBuildings;
        const viewportMap = new Map<string, BimViewport>(
            modelViewports.map((v) => [v.itemId, v])
        );

        const dots = configInfo.bimDots[modelName] ?? [];
        dots?.forEach((dot) => {
            const point = new THREE.Vector3(dot.xyz[0], dot.xyz[1], dot.xyz[2]);
            let foundBuilding: Building | undefined;
            let foundLevel: Level | null = null;
            let foundSector: BimSector | null = null;

            for (const b of buildings) {
                let matched = false;
                b.levels?.forEach((lvl) => {
                    if (matched || !lvl.sectorName) return;
                    const sec = sectorMap.get(lvl.sectorName);
                    if (sec?.bounds?.containsPoint(point)) {
                        foundBuilding = b;
                        foundLevel = lvl;
                        foundSector = sec;
                        matched = true;
                    }
                });
                if (matched) break;
            }

            if (!foundBuilding) {
                for (const b of buildings) {
                    if (!b.sectorName) continue;
                    const sec = sectorMap.get(b.sectorName);
                    if (sec?.bounds?.containsPoint(point)) {
                        foundBuilding = b;
                        foundLevel = null;
                        foundSector = sec;
                        break;
                    }
                }
            }

            meta.set(dot.anchor, {
                dot,
                modelName,
                building: foundBuilding,
                level: foundLevel,
                sector: foundSector,
                viewport: viewportMap.get(dot.anchor) ?? null
            });
        });

        return meta;
    }, [configInfo?.bimDots, currentModelBuildings, currentModelSectors, modelName, modelViewports]);


    const anchorSelectionKey = useMemo(() => {
        const match = clickedAnchor ? anchors.find(g => g.anchor_name == clickedAnchor) : undefined
        return match ? match.anchor_name : null;
    }, [anchors, clickedAnchor]);

    const selectedAnchorMeta = anchorSelectionKey ? (anchorMetaByKey.get(anchorSelectionKey) ?? null) : null;

    const gotoAction = useMemo(() => {
        if (!selectedAnchorMeta) return null;

        const hasDifferentBuilding = selectedAnchorMeta.building && selectedAnchorMeta.building.name !== selectedBuildingName;
        if (hasDifferentBuilding) {
            return {
                type: 'building' as const,
                building: selectedAnchorMeta.building,
                level: selectedAnchorMeta.level ?? null
            };
        }

        if (selectedAnchorMeta.viewport?.data) {
            return {
                type: 'viewport' as const,
                state: selectedAnchorMeta.viewport.data,
                building: selectedAnchorMeta.building,
                level: selectedAnchorMeta.level ?? null
            };
        }

        if (selectedAnchorMeta.level && selectedAnchorMeta.building?.name === selectedBuildingName && selectedAnchorMeta.level.name !== selectedLevel) {
            return {
                type: 'level' as const,
                building: selectedAnchorMeta.building,
                level: selectedAnchorMeta.level
            };
        }

        return null;
    }, [selectedAnchorMeta, selectedBuildingName, selectedLevel]);

    const anchorGroups = useMemo(() => {
        const groups: AnchorGroup[] = []
        if (forgeModel) {
            const bimDots = configInfo?.bimDots?.[forgeModel.name]
            if (bimDots) {
                anchors.forEach(a => {
                    const dot = bimDots.find(b => b.anchor == a.anchor_name)
                    if (dot) {
                        groups.push({
                            anchor: dot.anchor,
                            rows: [],
                            color: a.color
                        })
                    }
                })
            }
        }
        return groups
    }, [anchors, configInfo, forgeModel])

    const handleAnchorClick = useCallback((group: AnchorGroup) => {
        setClickedAnchor(group.anchor)
        onDotClick(group.anchor)
    }, []);

    const toVector4 = (p: any) => new THREE.Vector4(
        p?.x ?? (Array.isArray(p) ? p[0] ?? 0 : 0),
        p?.y ?? (Array.isArray(p) ? p[1] ?? 0 : 0),
        p?.z ?? (Array.isArray(p) ? p[2] ?? 0 : 0),
        p?.w ?? (Array.isArray(p) ? p[3] ?? 0 : 0)
    );

    const normalizeCutplanes = useCallback((planes: any[] | null | undefined): THREE.Vector4[] =>
        Array.isArray(planes) ? planes.map(toVector4) : [], []);

    const smoothCut = useCallback((cutplaneData: any[]) => {
        const viewer = forgeViewerRef.current;
        if (!viewer) return;

        const cutplanes = normalizeCutplanes(cutplaneData);
        const currentPlanes = normalizeCutplanes(viewer.getState()?.cutplanes as any[] | undefined);
        const duration = 200;

        if (cutplanes.length === 0) {
            viewer.setCutPlanes([]);
            return;
        }

        if (currentPlanes.length > 0) {
            let startTime: number | undefined;

            const animate = (time: number) => {
                if (startTime === undefined) startTime = time;
                const elapsed = time - startTime;
                if (elapsed < duration) {
                    const t = elapsed / duration;
                    const midPlanes = cutplanes.map((p, index) => {
                        const oldP = currentPlanes[index] ?? p;
                        const w = oldP.w + (p.w - oldP.w) * t;
                        return new THREE.Vector4(p.x, p.y, p.z, w);
                    });
                    viewer.setCutPlanes(midPlanes);
                    requestAnimationFrame(animate);
                } else {
                    viewer.setCutPlanes(cutplanes);
                }
            };
            requestAnimationFrame(animate);
        } else {
            viewer.setCutPlanes(cutplanes);
        }
    }, [normalizeCutplanes]);

    const applyStateWithCutplanes = useCallback((state: any | null | undefined) => {
        const viewer = forgeViewerRef.current;
        if (!viewer || !state) return;

        const cutplanes = normalizeCutplanes((state as any).cutplanes);
        if (cutplanes.length) smoothCut(cutplanes);
        else viewer.setCutPlanes([]);

        viewer.restoreState(state, {
            viewport: true,
            renderOptions: true,
            objectSet: true,
            cutplanes: false
        }, true);
    }, [normalizeCutplanes, smoothCut]);

    const captureViewerState = useCallback(() => {
        const viewer = forgeViewerRef.current;
        if (!viewer) return null;
        try {
            return viewer.getState({
                viewport: true,
                objectSet: true,
                renderOptions: true,
                cutplanes: true,
                seedURN: true
            });
        } catch (error) {
            console.warn('Failed to capture viewer state with filters, using default', error);
            return viewer.getState();
        }
    }, []);

    const findSectorViewportState = useCallback((sectorName?: string | null) => {
        if (!sectorName) return null;
        const candidates = [`__${sectorName}__`, sectorName];
        const vp = modelViewports.find(v => candidates.includes(v.itemId));
        return vp?.data ?? null;
    }, [modelViewports]);

    const applySectorState = useCallback((sector: BimSector | null) => {
        const viewer = forgeViewerRef.current;
        if (!viewer || !viewerReady) return;
        if (suppressNextSectorApply.current) {
            suppressNextSectorApply.current = false;
            return;
        }

        if (!sector) {
            ceilingDiscovery.current.show();
            viewer.setCutPlanes([]);
            viewer.navigation.setRequestHomeView(true);
            return;
        }

        if (sector.isLevel) ceilingDiscovery.current.hide();
        else ceilingDiscovery.current.show();

        smoothCut(sector.cutplanes ?? []);

        if (!sector.isLevel) {
            const state = findSectorViewportState(sector.name);
            if (state) {
                viewer.restoreState(state, {
                    viewport: true,
                    renderOptions: true,
                    objectSet: true,
                    cutplanes: false
                }, true);
            } else {
                viewer.navigation.setRequestHomeView(true);
            }
        }
    }, [findSectorViewportState, smoothCut, viewerReady]);

    useEffect(() => {
        applySectorState(activeSector ?? null);
    }, [activeSector, applySectorState]);

    const handleGoHome = useCallback(() => {
        if (!viewerReady) return;
        applySectorState(buildingSector ?? null);
    }, [applySectorState, buildingSector, viewerReady]);

    const selectBuilding = useCallback((buildingName: string, levelName?: string | null) => {
        const nextLevel = levelName ?? ALL_LEVELS_LABEL;
        pendingLevelRef.current = nextLevel;
        setSelectedLevel(nextLevel);
        setSelectedBuildingName(buildingName);
    }, []);

    const handleGotoViewport = useCallback(() => {
        if (!gotoAction || gotoAction.type !== 'viewport') return;
        if (!viewerReady) return;

        const currentState = captureViewerState();
        if (currentState) {
            backStateRef.current = currentState;
            setCanGoBack(true);
        }

        suppressNextSectorApply.current = true;
        if (gotoAction.building) selectBuilding(gotoAction.building.name, ALL_LEVELS_LABEL);

        ceilingDiscovery.current.show();
        applyStateWithCutplanes(gotoAction.state);
        setTimeout(() => ceilingDiscovery.current.hide(), 300);
    }, [applyStateWithCutplanes, captureViewerState, gotoAction, selectBuilding, viewerReady]);

    const handleGoBack = useCallback(() => {
        if (!canGoBack || !backStateRef.current || !viewerReady) return;
        applyStateWithCutplanes(backStateRef.current);
        backStateRef.current = null;
        setCanGoBack(false);
    }, [applyStateWithCutplanes, canGoBack, viewerReady]);

    const handleGotoBuilding = useCallback(() => {
        if (!gotoAction || gotoAction.type !== 'building' || !gotoAction.building) return;
        selectBuilding(gotoAction.building.name, null);
    }, [gotoAction, selectBuilding]);

    const handleGotoLevel = useCallback(() => {
        if (!gotoAction || gotoAction.type !== 'level' || !gotoAction.level || !gotoAction.building) return;
        selectBuilding(gotoAction.building.name, gotoAction.level.name);
    }, [gotoAction, selectBuilding]);

    const onForgeToken = useCallback(async (): Promise<string> => {
        const response = await fetch(`${import.meta.env.BASE_URL}api/forge-access-token`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch forge access token (${response.status})`);
        }

        const data = await response.json();
        if (data.error) throw new Error(`/api/forge-access-token, ${data.error}`);
        if (!data.access_token) throw new Error('No forge access token returned');

        return data.access_token as string;
    }, []);

    const onViewerInitialized = useCallback((viewer: Autodesk.Viewing.GuiViewer3D) => {
        forgeViewerRef.current = viewer;
    }, []);

    useEffect(() => {
        if (forgeModel && viewerReady) {
            ceilingDiscovery.current.discover()
        }
        return () => {
            ceilingDiscovery.current.clear()
        }
    }, [forgeModel, viewerReady])

    const onModelLoaded = useCallback(async (viewer: Autodesk.Viewing.GuiViewer3D, _viewables3d?: string[], _viewables2d?: string[]) => {
        setViewerReady(false);

        ceilingDiscovery.current.initialize(viewer, forgeModel!.ceilingDiscovery ?? {})
        toHideDbIds.current = new Map();
        if (forgeModel?.toHideDiscovery) {
            try {
                const results = await discoverElementsByProps(viewer, forgeModel.toHideDiscovery);
                const models = typeof (viewer as any).getAllModels === 'function'
                    ? (viewer as any).getAllModels() as Autodesk.Viewing.Model[]
                    : viewer.model ? [viewer.model] : [];

                results.forEach(result => {
                    const match = models.find(m => m.id === result.modelId);
                    if (match && result.elements.length) {
                        toHideDbIds.current.set(match, result.elements.map(e => e.dbId));
                    }
                });
            } catch (error) {
                console.error('Failed to discover elements to hide', error);
            }
        }

        viewer.disableSelection(true);

        toHideDbIds.current.forEach((dbIds, model) => {
            try {
                viewer.hide(dbIds, model);
            } catch (error) {
                console.error('Failed to hide elements in viewer', error);
            }
        });

        setViewerReady(true);
    }, [forgeModel]);

    const activeViewer = viewerReady ? forgeViewerRef.current : null;
    const gotoHandler = gotoAction?.type === 'viewport'
        ? handleGotoViewport
        : gotoAction?.type === 'building'
            ? handleGotoBuilding
            : gotoAction?.type === 'level'
                ? handleGotoLevel
                : undefined;
    const gotoLabel = gotoAction?.type === 'viewport'
        ? 'Goto Viewport'
        : gotoAction?.type === 'building'
            ? 'Goto Building'
            : gotoAction?.type === 'level'
                ? 'Goto Level'
                : 'Goto';
    const gotoEnabled = Boolean(gotoHandler && (gotoAction?.type !== 'viewport' || viewerReady));
    const homeEnabled = viewerReady && Boolean(selectedBuilding);

    return (
        <div className="absolute inset-0" style={{ height: '100vh' }}>
            <div
                ref={hostContainer}
                className="relative grow w-full h-full"
                style={{
                    backgroundColor: '#1a1a1a',
                    pointerEvents: 'auto'
                }}
            >
                {forgeModel ? (
                    <>
                        <ForgeViewer
                            docUrn={forgeModel.urns}
                            onModelLoaded={onModelLoaded}
                            onViewerInitialized={onViewerInitialized}
                            getToken={onForgeToken}
                        />

                        <DotView
                            viewer={activeViewer}
                            hostContainer={hostContainer.current}
                            currentSector={activeSector ?? null}
                            modelName={forgeModel?.name ?? null}
                            anchorGroups={anchorGroups}
                            onAnchorClick={handleAnchorClick}
                            onBackgroundClick={() => { }}
                        />
                    </>
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center text-sm"
                        style={{ color: '#888888' }}
                    >
                        3D View
                    </div>
                )}
            </div>

            <ThreeDToolbar
                buildingOptions={buildingOptions}
                levelOptions={levelOptions}
                selectedBuildingName={selectedBuildingName}
                onSelectBuilding={(name) => selectBuilding(name, null)}
                selectedLevel={selectedLevel}
                onSelectLevel={setSelectedLevel}
                canGoBack={canGoBack}
                onGoBack={handleGoBack}
                onGoHome={handleGoHome}
                gotoEnabled={gotoEnabled}
                gotoLabel={gotoLabel}
                onGoto={gotoHandler}
                homeEnabled={homeEnabled}
                isModelReady={viewerReady}
            />
        </div>
    );
};

export default ThreeDView;
