import type { Anchor, ContentItem } from '../types';

type RouteSegmentItemProps = {
    routeId: string;
    segmentNum: number;
    isSelected: boolean;
    isCollapsed: boolean;
    linkedAnchorIds: string[];
    anchors: Anchor[];
    content: ContentItem[];
    contentToAnchorToSegmentLinks: Record<string, string[]>;
    currentContentIndex: Record<string, number>;
    onToggleCollapse: (segmentKey: string) => void;
    onViewContent: (linkKey: string, contentIds: string[]) => void;
    onRemoveAnchor: (segmentKey: string, anchorId: string) => void;
};

function RouteSegmentItem(props: RouteSegmentItemProps) {
    const {
        routeId,
        segmentNum,
        isSelected,
        isCollapsed,
        linkedAnchorIds,
        anchors,
        content,
        contentToAnchorToSegmentLinks,
        currentContentIndex,
        onToggleCollapse,
        onViewContent,
        onRemoveAnchor,
    } = props;

    const segmentKey = `${routeId}-${segmentNum}`;

    return (
        <div
            data-component="RouteSegmentItem"
            key={segmentNum}
            style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: isSelected
                    ? '#3a2a1a'
                    : linkedAnchorIds.length > 0
                      ? '#1a2a1a'
                      : '#2a2a2a',
                border: isSelected ? '1px solid #eab308' : '1px solid #333',
                borderRadius: '4px',
            }}
        >
            <div
                onClick={() => onToggleCollapse(segmentKey)}
                style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: isCollapsed ? '0' : '6px',
                    color: isSelected ? '#eab308' : '#e5e5e5',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>Segment {segmentNum}</span>
                <span style={{ fontSize: '9px', color: '#888' }}>
                    {linkedAnchorIds.length > 0
                        ? `${linkedAnchorIds.length} anchor${linkedAnchorIds.length !== 1 ? 's' : ''} • `
                        : ''}
                    {isCollapsed ? '▼' : '▲'}
                </span>
            </div>

            {!isCollapsed &&
                (linkedAnchorIds.length > 0 ? (
                    <div style={{ fontSize: '10px' }}>
                        {linkedAnchorIds.map((anchorId) => {
                            const anchor = anchors.find(
                                (item) => item.id === anchorId,
                            );
                            if (!anchor) return null;

                            const linkKey = `${segmentKey}-${anchorId}`;
                            const linkedContentIds =
                                contentToAnchorToSegmentLinks[linkKey] || [];
                            const contentIndex =
                                currentContentIndex[linkKey] || 0;

                            return (
                                <div
                                    key={anchorId}
                                    style={{
                                        padding: '6px 8px',
                                        marginBottom: '4px',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '3px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                color: '#10b981',
                                                fontWeight: 600,
                                                marginBottom: '2px',
                                            }}
                                        >
                                            {anchor.name}
                                        </div>
                                        {linkedContentIds.length > 0 && (
                                            <div
                                                style={{
                                                    color: '#888',
                                                    fontSize: '9px',
                                                }}
                                            >
                                                Content:{' '}
                                                {linkedContentIds
                                                    .map(
                                                        (contentId) =>
                                                            content.find(
                                                                (item) =>
                                                                    item.id ===
                                                                    contentId,
                                                            )?.name ||
                                                            contentId,
                                                    )
                                                    .join(', ')}
                                                {contentIndex > 0 && (
                                                    <span
                                                        style={{
                                                            marginLeft: '4px',
                                                            color: '#aaa',
                                                        }}
                                                    >
                                                        (at{' '}
                                                        {Math.min(
                                                            contentIndex + 1,
                                                            linkedContentIds.length,
                                                        )}
                                                        /
                                                        {
                                                            linkedContentIds.length
                                                        }
                                                        )
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {linkedContentIds.length > 0 && (
                                            <button
                                                onClick={() =>
                                                    onViewContent(
                                                        linkKey,
                                                        linkedContentIds,
                                                    )
                                                }
                                                style={{
                                                    padding: '3px 8px',
                                                    backgroundColor: '#3a3a3a',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    color: '#f59e0b',
                                                    fontSize: '9px',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                👁️ View (
                                                {linkedContentIds.length})
                                            </button>
                                        )}
                                        <button
                                            onClick={() =>
                                                onRemoveAnchor(
                                                    segmentKey,
                                                    anchorId,
                                                )
                                            }
                                            style={{
                                                padding: '2px 6px',
                                                backgroundColor: '#3a3a3a',
                                                border: 'none',
                                                borderRadius: '3px',
                                                color: '#ef4444',
                                                fontSize: '9px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            fontSize: '10px',
                            color: '#666',
                            fontStyle: 'italic',
                        }}
                    >
                        No anchors linked
                    </div>
                ))}
        </div>
    );
}

export default RouteSegmentItem;
