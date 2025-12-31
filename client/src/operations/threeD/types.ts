
import type { RouteImport, RouteImportSegment } from '../../config/types';

export type BimModel = {
    name: string;
    urns: string;
    viewable?: string;
    extIdProp?: string;
    systemProp?: string;
    ceilingDiscovery?: Record<string, string>;
    toHideDiscovery?: Record<string, string>;
};

export type Building = {
    name: string;
    modelName: string;
    sectorName?: string;
    levels: Level[];
};

export type Level = {
    name: string;
    sectorName?: string;
};

export type BimSectorData = {
    name: string;
    cutplanes: any[];
    bounds: any;
};

export type BimSector = {
    name: string;
    isLevel: boolean;
    cutplanes: any[];
    bounds: any;
};

export interface BimViewport {
    itemId: string;
    data: any;
    toHide: string[];
}

type Point3 = [number, number, number];

export type BimDot = {
    anchor: string;
    xyz: Point3;
    extId?: string;
};

export type BimConfig = {
    bimModels: BimModel[];
    buildings: Building[];
};

export type AnchorGroup = {
    anchor: string;
    rows: DataRow[];
    color: string | null;
    subtitle?: string;
    isSelected?: boolean;
};

export type AnchorColorMode = 'max' | 'min';

export type DataRow = Record<string, any>;

export type ConfigInfoData = {
    bimConfig?: BimConfig
    bimSectors?: Record<string, BimSector[]>
    bimViewports?: Record<string, BimViewport[]>
    bimDots?: Record<string, BimDot[]>
}

export type HexColor = string; // "#RRGGBB" format

export interface AnchorRefWithColor {
    anchor_name: string;
    color: HexColor;
}

export interface RouteWithColor extends Omit<RouteImport, 'segments'> {
    color: HexColor;
    segments: RouteSegmentWithColor[];
}

export interface RouteSegmentWithColor extends RouteImportSegment {
    routeId: string;
    color: HexColor;
    segmentIndex: number;
}

export type NavigationCommandAction = 'start' | 'pause' | 'resume' | 'stop';

export interface SegmentNavigationCommand {
    id: number;
    action: NavigationCommandAction;
    routeId: string;
    segment: number;
}

export interface SegmentNavigationComplete {
    routeId: string;
    segment: number;
    commandId: number;
}
