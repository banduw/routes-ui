import { useMemo } from 'react';
import { ThreeDView } from './ThreeDView';
import type { ThreeDViewController, ThreeDViewConfig } from './ThreeDView';
import { useMockDataCtx } from './MockDataProvider';
import { useProjectRoutes } from './useProjectData';

export function ThreeDViewWithMockConfig({
    controller,
    selectedProject
}: {
    controller: ThreeDViewController;
    selectedProject: string;
}) {
    const { anchors, buildMockThreeDViewConfig } = useMockDataCtx();
    const routes = useProjectRoutes(selectedProject);

    const config = useMemo<ThreeDViewConfig>(
        () => buildMockThreeDViewConfig({ routes, anchors }),
        [buildMockThreeDViewConfig, routes, anchors]
    );

    return <ThreeDView controller={controller} config={config} />;
}
