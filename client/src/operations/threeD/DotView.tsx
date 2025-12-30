import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfigInfo } from '../../config/ConfigInfoContext';
import type { AnchorGroup, BimDot, BimSector } from './types';

const BASE_DOT_SIZE = 16;
const SELECTED_DOT_SCALE = 1.5;
const DIMMED_OPACITY = 0.3;
const DEFAULT_DOT_COLOR = '#ffffff';

type DotWithMeta = {
    anchor: string;
    xyz: [number, number, number];
    color: string;
    opacity: number;
    size: number;
    group: AnchorGroup;
};

type PositionedDot = DotWithMeta & { x: number; y: number };

type DotViewProps = {
    viewer?: Autodesk.Viewing.GuiViewer3D | null;
    hostContainer?: HTMLDivElement | null;
    currentSector?: BimSector | null;
    modelName?: string | null;
    anchorGroups: AnchorGroup[];
    onAnchorClick: (group: AnchorGroup) => void;
    onBackgroundClick: () => void;
};

const DotView: React.FC<DotViewProps> = ({
    viewer,
    hostContainer: _hostContainer,
    currentSector,
    modelName,
    anchorGroups,
    onAnchorClick,
    onBackgroundClick: _onBackgroundClick
}) => {
    const { configInfo } = useConfigInfo();
    const [viewTick, setViewTick] = useState(0);

    const bimDotsByAnchor = useMemo(() => {
        const map = new Map<string, BimDot>();
        if (!modelName) return map;
        const dots = configInfo?.bimDots?.[modelName] ?? [];
        dots?.forEach((dot) => {
            if (!map.has(dot.anchor)) {
                map.set(dot.anchor, dot);
            }
        });
        return map;
    }, [configInfo?.bimDots, modelName]);

    const selectedAnchor = useMemo(
        () => anchorGroups.find((group) => group.isSelected)?.anchor ?? null,
        [anchorGroups]
    );

    const isInSector = useCallback((dot: BimDot): boolean => {
        if (!dot?.xyz || dot.xyz.length !== 3) return false;
        if (!currentSector?.bounds) return true;
        return currentSector.bounds.containsPoint(
            new THREE.Vector3(dot.xyz[0], dot.xyz[1], dot.xyz[2])
        );
    }, [currentSector]);

    const dots = useMemo((): DotWithMeta[] => {
        const mapped = anchorGroups
            .map((group) => {
                const dot = bimDotsByAnchor.get(group.anchor);
                if (!dot) return null;
                if (!isInSector(dot)) return null;

                const isSelected = selectedAnchor === group.anchor;
                const color = group.color ?? DEFAULT_DOT_COLOR;
                const opacity = selectedAnchor ? (isSelected ? 1 : DIMMED_OPACITY) : 1;
                const size = BASE_DOT_SIZE * (isSelected ? SELECTED_DOT_SCALE : 1);

                return {
                    anchor: group.anchor,
                    xyz: dot.xyz,
                    color,
                    opacity,
                    size,
                    group
                };
            })
            .filter((entry): entry is DotWithMeta => Boolean(entry));
        return mapped;
    }, [anchorGroups, bimDotsByAnchor, isInSector, selectedAnchor]);

    useEffect(() => {
        if (!viewer) return;
        const handleCameraChange = () => setViewTick((tick) => tick + 1);

        viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, handleCameraChange);
        return () => {
            viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, handleCameraChange);
        };
    }, [viewer]);

    useEffect(() => {
        setViewTick((tick) => tick + 1);
    }, [viewer]);

    const positionedDots = useMemo((): PositionedDot[] => {
        if (!viewer) return [];

        const positioned = dots
            .map((dot) => {
                const clientPoint = viewer.worldToClient(
                    new THREE.Vector3(dot.xyz[0], dot.xyz[1], dot.xyz[2])
                );
                if (!clientPoint) return null;

                const { x, y } = clientPoint;
                if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

                return { ...dot, x, y };
            })
            .filter((entry): entry is PositionedDot => Boolean(entry));
        return positioned;
    }, [dots, viewer, viewTick]);

    const handleDotClick = useCallback(
        (event: React.MouseEvent, group: AnchorGroup) => {
            event.stopPropagation();
            onAnchorClick(group);
        },
        [onAnchorClick]
    );

    if (!viewer || positionedDots.length === 0) return null;

    return (
        <div
            className="absolute inset-0"
            style={{ pointerEvents: 'none', backgroundColor: 'transparent', zIndex: 5 }}
            aria-hidden
        >
            {positionedDots.map((dot) => (
                <div
                    key={dot.anchor}
                    style={{
                        position: 'absolute',
                        left: dot.x,
                        top: dot.y,
                        width: dot.size,
                        height: dot.size,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '9999px',
                        backgroundColor: dot.color,
                        opacity: dot.opacity,
                        boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.35)',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 6
                    }}
                    onClick={(event) => handleDotClick(event, dot.group)}
                />
            ))}
        </div>
    );
};

export default DotView;
