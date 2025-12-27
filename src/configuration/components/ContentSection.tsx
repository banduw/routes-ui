import { Edit2, Eye, Plus, Search, X } from 'lucide-react';
import type { ContentItem } from '../types';

type ContentSectionProps = {
    content: ContentItem[];
    selectedContentIds: string[];
    typeFilter: string;
    searchQuery: string;
    displayLimit: number;
    contentTypes: string[];
    onTypeFilterChange: (value: string) => void;
    onSearchQueryChange: (value: string) => void;
    onDisplayLimitChange: (limit: number) => void;
    onContentSelect: (id: string) => void;
    onAddContent: () => void;
    onEditText: (content: ContentItem) => void;
    onEditCCTV: (content: ContentItem) => void;
    onPreview: (content: ContentItem) => void;
};

function ContentSection(props: ContentSectionProps) {
    const {
        content,
        selectedContentIds,
        typeFilter,
        searchQuery,
        displayLimit,
        contentTypes,
        onTypeFilterChange,
        onSearchQueryChange,
        onDisplayLimitChange,
        onContentSelect,
        onAddContent,
        onEditText,
        onEditCCTV,
        onPreview,
    } = props;

    const filteredContent = content.filter((c) => {
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(query);
    });

    return (
        <div data-component="ContentSection" style={{ marginBottom: '20px' }}>
            <h3
                style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#f59e0b',
                }}
            >
                Content ({filteredContent.length}/{content.length})
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
                    {contentTypes.map((type) => (
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
                        placeholder="Search name..."
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
                Showing {Math.min(filteredContent.length, displayLimit)} of{' '}
                {filteredContent.length} items
            </div>

            <button
                onClick={onAddContent}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#B12518',
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
                Add Content
            </button>

            {filteredContent.slice(0, displayLimit).map((c) => (
                <div
                    key={c.id}
                    onClick={() => onContentSelect(c.id)}
                    style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        backgroundColor: selectedContentIds.includes(c.id)
                            ? 'rgba(245, 158, 11, 0.2)'
                            : '#3a3a3a',
                        border: selectedContentIds.includes(c.id)
                            ? '2px solid #f59e0b'
                            : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>
                            {c.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888888' }}>
                            {c.type}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {c.type === 'text' ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditText(c);
                                }}
                                style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#555555',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                }}
                            >
                                <Edit2 size={14} />
                            </button>
                        ) : c.type === 'cctv' ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditCCTV(c);
                                    }}
                                    style={{
                                        padding: '6px',
                                        borderRadius: '6px',
                                        backgroundColor: '#555555',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                    }}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPreview(c);
                                    }}
                                    style={{
                                        padding: '6px',
                                        borderRadius: '6px',
                                        backgroundColor: '#555555',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                    }}
                                >
                                    <Eye size={14} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(c);
                                }}
                                style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#555555',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                }}
                            >
                                <Eye size={14} />
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {filteredContent.length > displayLimit && (
                <button
                    onClick={() => onDisplayLimitChange(displayLimit + 10)}
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
                    Show more ({filteredContent.length - displayLimit}{' '}
                    remaining)
                </button>
            )}
        </div>
    );
}

export default ContentSection;
