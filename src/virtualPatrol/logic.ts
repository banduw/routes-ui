// @ts-nocheck
// Shared non-UI helpers for the Virtual Patrol prototype.

export function getPlanStorageKey(projectId) {
  return `plans_${projectId}`;
}

export function loadPlans(projectId) {
  const saved = localStorage.getItem(getPlanStorageKey(projectId));
  return saved ? JSON.parse(saved) : [];
}

export function persistPlans(projectId, plans) {
  localStorage.setItem(getPlanStorageKey(projectId), JSON.stringify(plans));
}

export function buildValidSelectedRoutes(selectedRoutes, routes) {
  const validRouteIds = new Set(routes.map(r => r.id));
  return selectedRoutes.filter(id => validRouteIds.has(id));
}

export function getRouteColorByIndex(palette, index) {
  if (!palette || palette.length === 0) return '#888888';
  return palette[index % palette.length];
}

export function createFloatingPanelLayout(index = 0, baseX = 300, baseY = 100) {
  return {
    position: 'floating',
    x: baseX + index * 30,
    y: baseY + index * 30,
    width: 400,
    height: 500,
    segment: 1
  };
}

export function getPinnedPanelLayout(panel = {}, position) {
  return {
    ...panel,
    position,
    ...(position === 'floating' && { x: 300, y: 100, width: 400, height: 500 }),
    ...(position === 'left' && { width: 350 }),
    ...(position === 'right' && { width: 350 }),
    ...(position === 'bottom' && { height: 300 })
  };
}

export function buildDisplayBundles({
  validSelectedRoutes,
  hiddenRoutes,
  routes,
  routePanels,
  routeColors,
  anchorColors,
  anchorToRoute,
  patrolMode
}) {
  const visibleRoutes = validSelectedRoutes.filter(id => !hiddenRoutes.includes(id));

  return visibleRoutes.flatMap(routeId => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return [];

    const panel = routePanels[routeId];
    const routeColor = routeColors[routeId] || '#888888';

    let currentSegment = 1;
    if (patrolMode.active && patrolMode.routeId === routeId) {
      currentSegment = patrolMode.currentSegment;
    } else if (panel) {
      currentSegment = panel.segment;
    }

    const segmentName = `${routeId}-seg${currentSegment}`;
    const anchorsInSegment = anchorToRoute[`${routeId}-${currentSegment}`] || [];

    return {
      segment_name: segmentName,
      color: routeColor,
      anchors: anchorsInSegment.map(anchorId => ({
        anchor_name: anchorId,
        color: anchorColors[anchorId] || '#888888'
      }))
    };
  });
}
