import { Edit2, Plus, Search, X } from 'lucide-react';
import type { Anchor, ContentItem } from '../types';

type AnchorSectionProps = {
    anchors: Anchor[];
    content: ContentItem[];
    selectedAnchorIds: string[];
    contentToAnchorToSegmentLinks: Record<string, string[]>;
    typeFilter: string;
    searchQuery: string;
    displayLimit: number;
    anchorTypes: string[];
    onTypeFilterChange: (value: string) => void;
    onSearchQueryChange: (value: string) => void;
    onDisplayLimitChange: (limit: number) => void;
    onAnchorSelect: (id: string) => void;
    onAddAnchor: () => void;
    onEditAnchor: (anchor: Anchor) => void;
};

function AnchorSection(props: AnchorSectionProps) {
    const {
        anchors,
        content,
        selectedAnchorIds,
        contentToAnchorToSegmentLinks,
        typeFilter,
        searchQuery,
        displayLimit,
        anchorTypes,
        onTypeFilterChange,
        onSearchQueryChange,
        onDisplayLimitChange,
        onAnchorSelect,
        onAddAnchor,
        onEditAnchor,
    } = props;

    const getLinkedContent = (anchorId: string) => {
        const allLinkedContent = new Set<string>();
        Object.keys(contentToAnchorToSegmentLinks).forEach((linkKey) => {
            if (linkKey.endsWith(`-${anchorId}`)) {
                contentToAnchorToSegmentLinks[linkKey].forEach((cId) =>
                    allLinkedContent.add(cId),
                );
            }
        });
        return allLinkedContent;
    };

    const filteredAnchors = anchors.filter((a) => {
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            a.name.toLowerCase().includes(query) ||
            (a.type || '').toLowerCase().includes(query)
        );
    });

    return (
        <div data-component="AnchorSection" style={{ marginBottom: '20px' }}>
            <h3
                style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#10b981',
                }}
            >
                Anchors ({filteredAnchors.length}/{anchors.length})
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                    value={typeFilter}
                    onChange={(e) => onTypeFilterChange(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#3a3a3a',
                        border: '1px solid #555555',
                        color: '#e5e5e5',
                        fontSize: '12px',
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '110px',
                    }}
                >
                    <option value="all">All Types</option>
                    {anchorTypes.map((type) => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>

                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#888888',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search anchors..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 8px 8px 32px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '12px',
                            outline: 'none',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchQueryChange('')}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '2px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    fontSize: '10px',
                    color: '#666666',
                    marginBottom: '8px',
                }}
            >
                Showing {Math.min(filteredAnchors.length, displayLimit)} of{' '}
                {filteredAnchors.length} anchors
            </div>

            <button
                onClick={onAddAnchor}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                }}
            >
                <Plus size={16} />
                Add Anchor
            </button>

            {filteredAnchors.slice(0, displayLimit).map((anchor) => {
                const linkedContent = getLinkedContent(anchor.id);

                return (
                    <div
                        key={anchor.id}
                        onClick={() => onAnchorSelect(anchor.id)}
                        style={{
                            padding: '10px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            backgroundColor: selectedAnchorIds.includes(
                                anchor.id,
                            )
                                ? 'rgba(16, 185, 129, 0.2)'
                                : '#3a3a3a',
                            border: selectedAnchorIds.includes(anchor.id)
                                ? '2px solid #10b981'
                                : '2px solid transparent',
                            cursor: 'pointer',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                gap: '6px',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: '12px',
                                    }}
                                >
                                    {anchor.name}
                                    {linkedContent.size > 0 && (
                                        <span
                                            style={{
                                                marginLeft: '6px',
                                                fontSize: '10px',
                                                color: '#f59e0b',
                                            }}
                                        >
                                            ({linkedContent.size})
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: anchor.type
                                            ? '#888888'
                                            : '#666666',
                                    }}
                                >
                                    {anchor.type || 'No type set'}
                                </div>
                                {anchor.description && (
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#aaaaaa',
                                            marginTop: '4px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {anchor.description}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAnchor(anchor);
                                }}
                                style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#555555',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginLeft: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <Edit2 size={10} />
                                {anchor.description ? 'Edit' : 'Add'} Info
                            </button>
                        </div>

                        {linkedContent.size > 0 && (
                            <div
                                style={{
                                    marginTop: '4px',
                                    marginLeft: '4px',
                                    padding: '8px',
                                    backgroundColor: '#2a2a2a',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#888888',
                                        fontSize: '10px',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Linked Content:
                                </div>
                                {Array.from(linkedContent).map((contentId) => {
                                    const contentItem = content.find(
                                        (c) => c.id === contentId,
                                    );
                                    return (
                                        <div
                                            key={contentId}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '4px 6px',
                                                backgroundColor: '#3a3a3a',
                                                borderRadius: '4px',
                                                marginBottom: '2px',
                                            }}
                                        >
                                            <span style={{ color: '#cccccc' }}>
                                                {contentItem?.name ||
                                                    'Content item'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {filteredAnchors.length > displayLimit && (
                <button
                    onClick={() => onDisplayLimitChange(displayLimit + 8)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: '#3a3a3a',
                        border: '1px dashed #555555',
                        color: '#aaaaaa',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#444444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                    }}
                >
                    Show more ({filteredAnchors.length - displayLimit}{' '}
                    remaining)
                </button>
            )}
        </div>
    );
}

export default AnchorSection;
