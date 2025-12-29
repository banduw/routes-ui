import { useMemo } from 'react';
import { ThreeDView } from './ThreeDView';
import type { ThreeDViewController, ThreeDViewConfig } from './ThreeDView';
import { useConfigData } from './ConfigDataProvider';
import { useProjectRoutes } from './useProjectData';

export function ThreeDViewWithConfig({
    controller,
    selectedProject
}: {
    controller: ThreeDViewController;
    selectedProject: string;
}) {
    const { anchors, buildMockThreeDViewConfig, routeSegmentsById } = useConfigData();
    const routes = useProjectRoutes(selectedProject);

    const config = useMemo<ThreeDViewConfig>(
        () => buildMockThreeDViewConfig({ routes, anchors, routeSegmentsById }),
        [buildMockThreeDViewConfig, routes, anchors, routeSegmentsById]
    );

    return <ThreeDView controller={controller} config={config} />;
}
