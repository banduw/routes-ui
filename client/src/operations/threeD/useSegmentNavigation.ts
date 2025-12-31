import { useCallback, useEffect, useRef } from 'react';
import type { RouteImport } from '../../config/types';
import type { SegmentNavigationCommand, SegmentNavigationComplete } from './types';

type NavigationPhase = 'turn' | 'walk';

type NavigationState = {
    command: SegmentNavigationCommand;
    pathFrom: THREE.Vector3;
    pathTo: THREE.Vector3;
    initialDir: THREE.Vector3;
    targetDir: THREE.Vector3;
    offset: number;
    phase: NavigationPhase;
    phaseStartTime: number | null;
    phaseDuration: number;
    turnDuration: number;
    walkDuration: number;
    progress: number;
    pausedAt: number | null;
    loggedWalkStart: boolean;
};

const TURN_DURATION_MS = 800;
const WALK_SPEED_UNITS_PER_SEC = 5;
const MIN_WALK_DURATION_MS = 300;
const Z_CONTINUATION_EPS_METERS = 0.2;
const XY_CONTINUATION_EPS_METERS = 5.0;
export function useSegmentNavigation({
    navigationCommand,
    navigationConfig,
    viewerRef,
    onNavigationComplete
}: {
    navigationCommand: SegmentNavigationCommand | null;
    navigationConfig: RouteImport[];
    viewerRef: React.MutableRefObject<Autodesk.Viewing.GuiViewer3D | null>;
    onNavigationComplete?: (payload: SegmentNavigationComplete) => void;
}): void {
    const activeNavigationRef = useRef<SegmentNavigationCommand | null>(null);
    const navigationPausedRef = useRef(false);
    const navigationRafRef = useRef<number | null>(null);
    const navigationStateRef = useRef<NavigationState | null>(null);
    const lastNavCommandIdRef = useRef<number | null>(null);
    const lastEyeRef = useRef<THREE.Vector3 | null>(null);
    const lastNavEndRef = useRef<THREE.Vector3 | null>(null);

    const clearNavigationRaf = useCallback(() => {
        if (navigationRafRef.current !== null) {
            cancelAnimationFrame(navigationRafRef.current);
            navigationRafRef.current = null;
        }
    }, []);

    const notifyNavigationComplete = useCallback((command: SegmentNavigationCommand) => {
        if (!onNavigationComplete) return;
        onNavigationComplete({
            routeId: command.routeId,
            segment: command.segment,
            commandId: command.id
        });
    }, [onNavigationComplete]);

    const setView = useCallback((eye: THREE.Vector3, target: THREE.Vector3) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        viewer.navigation.setView(eye, target);
        viewer.navigation.setCameraUpVector(viewer.navigation.getWorldUpVector());
        viewer.impl.invalidate(true, true, true);
        lastEyeRef.current = eye.clone();
    }, [viewerRef]);

    const easeInOut = useCallback((t: number) => {
        const clamped = Math.min(1, Math.max(0, t));
        return clamped * clamped * (3 - 2 * clamped);
    }, []);

    const finalizeNavigation = useCallback((command: SegmentNavigationCommand) => {
        const state = navigationStateRef.current;
        if (state?.pathTo) {
            lastNavEndRef.current = state.pathTo.clone();
        }
        clearNavigationRaf();
        navigationStateRef.current = null;
        navigationPausedRef.current = false;
        activeNavigationRef.current = null;
        notifyNavigationComplete(command);
    }, [clearNavigationRaf, notifyNavigationComplete]);

    const runNavigationFrame = useCallback(() => {
        const state = navigationStateRef.current;
        const viewerReadyNow = Boolean(viewerRef.current);
        if (!state || !viewerReadyNow) return;

        if (navigationPausedRef.current) {
            navigationRafRef.current = requestAnimationFrame(runNavigationFrame);
            return;
        }

        const now = performance.now();
        if (state.phaseStartTime === null) {
            state.phaseStartTime = now - state.progress * state.phaseDuration;
        }

        const elapsed = now - (state.phaseStartTime ?? now);
        const rawProgress = state.phaseDuration <= 0 ? 1 : Math.min(1, elapsed / state.phaseDuration);
        const eased = easeInOut(rawProgress);
        state.progress = rawProgress;

        if (state.phase === 'turn') {
            const dir = state.initialDir.clone().lerp(state.targetDir, eased).normalize();
            const eye = state.pathFrom.clone().sub(state.targetDir.clone().setLength(state.offset));
            setView(eye, eye.clone().add(dir));

            if (rawProgress >= 1) {
                state.phase = 'walk';
                state.phaseDuration = state.walkDuration;
                state.phaseStartTime = null;
                state.progress = 0;
                state.loggedWalkStart = false;
                navigationRafRef.current = requestAnimationFrame(runNavigationFrame);
                return;
            }
        } else {
            if (rawProgress >= 1) {
                const finalEye = state.pathTo.clone().sub(state.targetDir.clone().setLength(state.offset));
                setView(finalEye, finalEye.clone().add(state.targetDir));
                finalizeNavigation(state.command);
                return;
            }

            const pathPoint = state.pathFrom.clone().lerp(state.pathTo, eased);
            const eye = pathPoint.clone().sub(state.targetDir.clone().setLength(state.offset));
            if (!state.loggedWalkStart) state.loggedWalkStart = true;
            setView(eye, eye.clone().add(state.targetDir));
        }

        navigationRafRef.current = requestAnimationFrame(runNavigationFrame);
    }, [easeInOut, finalizeNavigation, setView]);

    const stopNavigation = useCallback((_command?: SegmentNavigationCommand) => {
        clearNavigationRaf();
        navigationStateRef.current = null;
        navigationPausedRef.current = false;
        activeNavigationRef.current = null;
    }, [clearNavigationRaf]);

    const ensureBimWalkActive = useCallback(async (viewer: Autodesk.Viewing.GuiViewer3D): Promise<boolean> => {
        const extId = 'Autodesk.BimWalk';
        let ext: any = viewer.getExtension?.(extId);
        if (!ext && viewer.loadExtension) {
            try {
                ext = await viewer.loadExtension(extId);
            } catch {
                return false;
            }
        }
        if (!ext) return false;

        const modes: string[] = ext.getModes?.() || [];
        const mode = modes[0];
        if (mode) {
            if (!ext.isActive?.(mode)) ext.activate?.(mode);
        } else {
            ext.activate?.();
        }
        return true;
    }, []);

    const buildDirectionFromCamera = useCallback((viewer: Autodesk.Viewing.GuiViewer3D): THREE.Vector3 => {
        const camera = viewer.getCamera?.();
        const dir = new THREE.Vector3();
        if (camera?.getWorldDirection) {
            camera.getWorldDirection(dir);
        }
        if (!Number.isFinite(dir.length()) || dir.length() < 1e-6) {
            return new THREE.Vector3(1, 0, 0);
        }
        return dir.normalize();
    }, []);

    const startNavigation = useCallback(async (command: SegmentNavigationCommand) => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const ready = await ensureBimWalkActive(viewer);
        if (!ready) return;

        const route = navigationConfig.find(r => r.id === command.routeId);
        const segment = route?.segments?.[command.segment - 1];
        if (!segment) return;

        stopNavigation();

        const from = new THREE.Vector3(segment.from.x, segment.from.y, segment.from.z);
        const to = new THREE.Vector3(segment.to.x, segment.to.y, segment.to.z);
        const delta = to.clone().sub(from);
        const horizMag = Math.hypot(delta.x, delta.y);
        const vertMag = Math.abs(delta.z);
        const isVertical = vertMag > 0 && horizMag <= Math.max(1, vertMag * 0.1);
        const lastBase = lastNavEndRef.current ?? lastEyeRef.current;
        const model = viewer.model;
        const metersPerUnit = typeof model?.getUnitScale === 'function' ? model.getUnitScale() : 1;

        const zDelta = lastBase ? Math.abs(lastBase.z - from.z) * metersPerUnit : Number.POSITIVE_INFINITY;
        const xyDelta = lastBase ? Math.hypot(lastBase.x - from.x, lastBase.y - from.y) * metersPerUnit : Number.POSITIVE_INFINITY;
        const isContinuation = isVertical
            && !!lastBase
            && zDelta < Z_CONTINUATION_EPS_METERS
            && xyDelta < XY_CONTINUATION_EPS_METERS;

        const currentDir = buildDirectionFromCamera(viewer);

        const targetDir = (() => {
            if (!isVertical) {
                const dir = delta.clone().normalize();
                if (dir.lengthSq() > 0) return dir;
            }
            const horiz = new THREE.Vector3(currentDir.x, currentDir.y, 0);
            if (horiz.lengthSq() === 0) horiz.set(1, 0, 0);
            return horiz.normalize();
        })();

        const offset = isVertical ? 0 : Math.max(1, Math.min(4, delta.length() * 0.25 + 0.5));

        let startEye: THREE.Vector3;
        let pathFrom = from.clone();
        let pathTo = to.clone();

        if (isVertical) {
            startEye = isContinuation && lastEyeRef.current ? lastEyeRef.current.clone() : from.clone();
            pathFrom = startEye.clone();
            pathTo = startEye.clone();
            pathTo.z = startEye.z + delta.z;
        } else {
            startEye = from.clone().sub(targetDir.clone().setLength(offset));
        }

        const distance = startEye.distanceTo(pathTo);
        const walkDuration = Math.max(MIN_WALK_DURATION_MS, (distance / WALK_SPEED_UNITS_PER_SEC) * 1000);

        const initialPhase: NavigationPhase = isVertical && isContinuation ? 'walk' : 'turn';
        const initialPhaseDuration = initialPhase === 'walk' ? Math.max(1, walkDuration) : TURN_DURATION_MS;

        if (!(isVertical && isContinuation)) {
            setView(startEye, isVertical ? startEye.clone().add(targetDir) : from.clone());
        } else {
            setView(startEye, startEye.clone().add(targetDir));
        }

        navigationStateRef.current = {
            command,
            pathFrom,
            pathTo,
            initialDir: currentDir,
            targetDir,
            offset,
            phase: initialPhase,
            phaseStartTime: initialPhase === 'walk' ? performance.now() : null,
            phaseDuration: initialPhaseDuration,
            turnDuration: TURN_DURATION_MS,
            walkDuration,
            progress: 0,
            pausedAt: null,
            loggedWalkStart: false
        };

        activeNavigationRef.current = command;
        navigationPausedRef.current = false;
        navigationRafRef.current = requestAnimationFrame(runNavigationFrame);
    }, [MIN_WALK_DURATION_MS, TURN_DURATION_MS, WALK_SPEED_UNITS_PER_SEC, buildDirectionFromCamera, ensureBimWalkActive, navigationConfig, runNavigationFrame, setView, stopNavigation, viewerRef]);

    const pauseNavigation = useCallback((command: SegmentNavigationCommand) => {
        const active = activeNavigationRef.current;
        const state = navigationStateRef.current;
        if (!active || active.routeId !== command.routeId || active.segment !== command.segment || !state) return;
        if (navigationPausedRef.current) return;

        navigationPausedRef.current = true;
        state.pausedAt = performance.now();
        clearNavigationRaf();
    }, [clearNavigationRaf]);

    const resumeNavigation = useCallback((command: SegmentNavigationCommand) => {
        const active = activeNavigationRef.current;
        const state = navigationStateRef.current;
        if (!active || active.routeId !== command.routeId || active.segment !== command.segment || !state) return;
        if (!navigationPausedRef.current) return;

        const now = performance.now();
        if (state.pausedAt) {
            const pausedDuration = now - state.pausedAt;
            state.phaseStartTime = (state.phaseStartTime ?? now) + pausedDuration;
            state.pausedAt = null;
        }

        navigationPausedRef.current = false;
        navigationRafRef.current = requestAnimationFrame(runNavigationFrame);
    }, [runNavigationFrame]);

    useEffect(() => {
        if (!navigationCommand) return;
        if (lastNavCommandIdRef.current === navigationCommand.id) return;
        lastNavCommandIdRef.current = navigationCommand.id;

        switch (navigationCommand.action) {
            case 'start':
                void startNavigation(navigationCommand);
                break;
            case 'pause':
                pauseNavigation(navigationCommand);
                break;
            case 'resume':
                resumeNavigation(navigationCommand);
                break;
            case 'stop':
                stopNavigation(navigationCommand);
                break;
            default:
                break;
        }
    }, [navigationCommand, pauseNavigation, resumeNavigation, startNavigation, stopNavigation]);

    useEffect(() => () => {
        stopNavigation();
        lastNavCommandIdRef.current = null;
    }, [stopNavigation]);
}
