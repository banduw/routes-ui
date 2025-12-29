import { useMemo } from 'react';
import type { Route } from './types';
import { useConfigData } from './ConfigDataProvider';

export function useProjectRoutes(projectId: string): Route[] {
    const { allRoutes } = useConfigData();
    return useMemo(() => allRoutes.filter(route => route.projectId === projectId), [allRoutes, projectId]);
}
