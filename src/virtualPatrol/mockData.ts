import { useMemo } from 'react';
import type {
    Anchor,
    ContentItem,
    Entity,
    Project,
    Route,
    VirtualPatrolData
} from './types';

const ROUTE_COLORS: string[] = ['#B12518', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const AVAILABLE_COLORS = [
    { value: '#B12518', name: 'Red' },
    { value: '#10b981', name: 'Green' },
    { value: '#3b82f6', name: 'Blue' },
    { value: '#f59e0b', name: 'Orange' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#06b6d4', name: 'Cyan' }
];

const projects: Project[] = [
    { id: 'proj1', name: 'Tiong Bahru Plaza' },
    { id: 'proj2', name: 'Marina Square' }
];

const allRoutes: Route[] = [
    { id: 'r1', projectId: 'proj1', name: 'North Wing Corridor', type: 'evacuation', segments: 5, description: 'Main evacuation route' },
    { id: 'r2', projectId: 'proj1', name: 'South Wing Patrol', type: 'patrol', segments: 8, description: 'Security patrol route' },
    { id: 'r3', projectId: 'proj1', name: 'Emergency Exit A', type: 'evacuation', segments: 3, description: 'Fire escape route' },
    { id: 'r4', projectId: 'proj1', name: 'West Lobby Circuit', type: 'patrol', segments: 6, description: 'Lobby monitoring route' },
    { id: 'm1', projectId: 'proj2', name: 'East Wing Security', type: 'patrol', segments: 4, description: 'East wing patrol path' },
    { id: 'm2', projectId: 'proj2', name: 'Central Atrium Route', type: 'evacuation', segments: 6, description: 'Main evacuation corridor' },
    { id: 'm3', projectId: 'proj2', name: 'Basement Patrol', type: 'patrol', segments: 7, description: 'Underground parking patrol' },
    { id: 'm4', projectId: 'proj2', name: 'Rooftop Access', type: 'evacuation', segments: 3, description: 'Emergency rooftop exit' }
];

const anchors: Anchor[] = [
    { id: 'a1', name: 'Fire Extinguisher #12', type: 'equipment' },
    { id: 'a2', name: 'Exit Door E3', type: 'exit' },
    { id: 'a3', name: 'Emergency Light #45', type: 'equipment' }
];

const content: ContentItem[] = [
    { id: 'c1', name: 'Fire Safety Manual', type: 'document', url: 'safety_manual.pdf' },
    { id: 'c2', name: 'Evacuation Map', type: 'image', url: 'evac_map.png' },
    { id: 'c3', name: 'CCTV North-01', type: 'cctv', url: 'rtsp://192.168.1.101/stream' },
    { id: 'c4', name: 'Equipment Guide', type: 'document', url: 'equipment.pdf' },
    { id: 'c5', name: 'CCTV North-02', type: 'cctv', url: 'rtsp://192.168.1.102/stream' },
    { id: 'c6', name: 'CCTV North-03', type: 'cctv', url: 'rtsp://192.168.1.103/stream' },
    { id: 'c7', name: 'CCTV South-01', type: 'cctv', url: 'rtsp://192.168.1.104/stream' },
    { id: 'c8', name: 'CCTV South-02', type: 'cctv', url: 'rtsp://192.168.1.105/stream' },
    { id: 'c9', name: 'CCTV South-03', type: 'cctv', url: 'rtsp://192.168.1.106/stream' },
    { id: 'c10', name: 'CCTV Lobby-01', type: 'cctv', url: 'rtsp://192.168.1.107/stream' },
    { id: 'c11', name: 'CCTV Lobby-02', type: 'cctv', url: 'rtsp://192.168.1.108/stream' },
    { id: 'c12', name: 'Emergency Procedures', type: 'document', url: 'emergency.pdf' },
    { id: 'c13', name: 'CCTV East-01', type: 'cctv', url: 'rtsp://192.168.1.109/stream' },
    { id: 'c14', name: 'CCTV West-01', type: 'cctv', url: 'rtsp://192.168.1.110/stream' }
];

const entities: Entity[] = [
    { id: 'e1', name: 'Security Team A' },
    { id: 'e2', name: 'Fire Wardens' }
];

const anchorToRoute: Record<string, string[]> = { 
    'r1-1': ['a1', 'a2'], 
    'r1-2': ['a1', 'a2', 'a3'],  // All 3 anchors = 6+ CCTVs combined
    'r1-3': ['a2'],
    'r1-4': ['a1'],
    'r1-5': ['a3'],
    'r2-1': ['a1'], 
    'r3-1': ['a2', 'a3'] 
};

const contentToAnchor: Record<string, string[]> = { 
    'a1': ['c1', 'c3', 'c5', 'c6', 'c13'],     // 1 doc + 4 CCTVs
    'a2': ['c2', 'c7', 'c8', 'c9', 'c14'],     // 1 image + 4 CCTVs  
    'a3': ['c4', 'c10', 'c11']                 // 1 doc + 2 CCTVs
};

const routeEntities: Record<string, string[]> = { 'r1': ['e2'], 'r2': ['e1'], 'r3': ['e2'] };

export function useMockData(): VirtualPatrolData {
    return useMemo(
        () => ({
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
        }),
        []
    );
}
