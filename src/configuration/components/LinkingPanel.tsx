import type { Route } from '../types';

type LinkingPanelProps = {
    selectedContentIds: string[];
    selectedAnchorIds: string[];
    selectedRouteForConfig: string | null;
    selectedSegmentForLink: number | null;
    routes: Route[];
    routesAddedToProject: string[];
    showLockedRouteMessage: boolean;
    onSegmentChange: (segment: number | null) => void;
    onLinkContentToAnchorToSegment: () => void;
    onLinkAnchorsToRoute: () => void;
    onClear: () => void;
};

function LinkingPanel(props: LinkingPanelProps) {
    const {
        selectedContentIds,
        selectedAnchorIds,
        selectedRouteForConfig,
        selectedSegmentForLink,
        routes,
        routesAddedToProject,
        showLockedRouteMessage,
        onSegmentChange,
        onLinkContentToAnchorToSegment,
        onLinkAnchorsToRoute,
        onClear,
    } = props;

    if (
        selectedContentIds.length === 0 &&
        selectedAnchorIds.length === 0 &&
        !selectedRouteForConfig &&
        !showLockedRouteMessage
    ) {
        return null;
    }

    const isRouteLocked = selectedRouteForConfig
        ? routesAddedToProject.includes(selectedRouteForConfig)
        : false;
    const selectedRoute = routes.find(
        (route) => route.id === selectedRouteForConfig,
    );

    return (
        <div
            data-component="LinkingPanel"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1a1a1a',
                border:
                    isRouteLocked || showLockedRouteMessage
                        ? '1px solid #ef4444'
                        : '1px solid #B12518',
                borderRadius: '12px',
                padding: '16px 24px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                minWidth: '400px',
            }}
        >
            {isRouteLocked || showLockedRouteMessage ? (
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#ef4444',
                            marginBottom: '8px',
                        }}
                    >
                        🔒 Route Locked
                    </div>
                    <div
                        style={{
                            fontSize: '12px',
                            color: '#aaa',
                            marginBottom: '12px',
                        }}
                    >
                        This route is in the project and cannot be modified.
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                        Remove it from the project in the Route Management panel
                        to make changes.
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '20px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '12px',
                        }}
                    >
                        {selectedContentIds.length > 0 && (
                            <div>
                                <span style={{ color: '#aaaaaa' }}>
                                    Content:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#f59e0b',
                                        fontWeight: 600,
                                    }}
                                >
                                    {selectedContentIds.length}
                                </span>
                            </div>
                        )}
                        {selectedAnchorIds.length > 0 && (
                            <div>
                                <span style={{ color: '#aaaaaa' }}>
                                    Anchors:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#10b981',
                                        fontWeight: 600,
                                    }}
                                >
                                    {selectedAnchorIds.length}
                                </span>
                            </div>
                        )}
                        {selectedRouteForConfig && (
                            <div>
                                <span style={{ color: '#aaaaaa' }}>
                                    Route:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#B12518',
                                        fontWeight: 600,
                                    }}
                                >
                                    {selectedRoute?.name}
                                </span>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        {selectedContentIds.length > 0 &&
                            selectedAnchorIds.length > 0 &&
                            selectedRouteForConfig && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                    }}
                                >
                                    <select
                                        value={selectedSegmentForLink ?? ''}
                                        onChange={(event) =>
                                            onSegmentChange(
                                                event.target.value
                                                    ? Number.parseInt(
                                                          event.target.value,
                                                          10,
                                                      )
                                                    : null,
                                            )
                                        }
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            backgroundColor: '#3a3a3a',
                                            border: '1px solid #555555',
                                            color: '#e5e5e5',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                        }}
                                    >
                                        <option value="">
                                            Select Segment...
                                        </option>
                                        {Array.from(
                                            {
                                                length:
                                                    selectedRoute?.segments ??
                                                    0,
                                            },
                                            (_, index) => (
                                                <option
                                                    key={index + 1}
                                                    value={index + 1}
                                                >
                                                    Segment {index + 1}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <button
                                        onClick={onLinkContentToAnchorToSegment}
                                        disabled={!selectedSegmentForLink}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            backgroundColor:
                                                selectedSegmentForLink
                                                    ? '#f59e0b'
                                                    : '#555555',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: selectedSegmentForLink
                                                ? 'pointer'
                                                : 'not-allowed',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Link Content → Anchor → Segment
                                    </button>
                                </div>
                            )}

                        {selectedAnchorIds.length > 0 &&
                            selectedRouteForConfig &&
                            selectedContentIds.length === 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                    }}
                                >
                                    <select
                                        value={selectedSegmentForLink ?? ''}
                                        onChange={(event) =>
                                            onSegmentChange(
                                                event.target.value
                                                    ? Number.parseInt(
                                                          event.target.value,
                                                          10,
                                                      )
                                                    : null,
                                            )
                                        }
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            backgroundColor: '#3a3a3a',
                                            border: '1px solid #555555',
                                            color: '#e5e5e5',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                        }}
                                    >
                                        <option value="">
                                            Select Segment...
                                        </option>
                                        {Array.from(
                                            {
                                                length:
                                                    selectedRoute?.segments ??
                                                    0,
                                            },
                                            (_, index) => (
                                                <option
                                                    key={index + 1}
                                                    value={index + 1}
                                                >
                                                    Segment {index + 1}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <button
                                        onClick={onLinkAnchorsToRoute}
                                        disabled={!selectedSegmentForLink}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            backgroundColor:
                                                selectedSegmentForLink
                                                    ? '#10b981'
                                                    : '#555555',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: selectedSegmentForLink
                                                ? 'pointer'
                                                : 'not-allowed',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Link Anchor
                                        {selectedAnchorIds.length > 1
                                            ? 's'
                                            : ''}{' '}
                                        → Segment
                                    </button>
                                </div>
                            )}

                        <button
                            onClick={onClear}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                backgroundColor: '#3a3a3a',
                                border: 'none',
                                color: '#e5e5e5',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LinkingPanel;
