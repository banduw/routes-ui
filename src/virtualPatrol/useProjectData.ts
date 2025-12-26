import { useMemo } from 'react';
import type { Route } from './types';
import { useMockDataCtx } from './MockDataProvider';

export function useProjectRoutes(projectId: string): Route[] {
    const { allRoutes } = useMockDataCtx();
    return useMemo(() => allRoutes.filter(route => route.projectId === projectId), [allRoutes, projectId]);
}
