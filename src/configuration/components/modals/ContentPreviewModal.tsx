import { FileText, X } from 'lucide-react';
import type { ContentItem } from '../../types';

type ContentPreviewModalProps = {
    content: ContentItem | null;
    context: { linkKey: string; contentIds: string[] } | null;
    allContent: ContentItem[];
    currentContentIndex: Record<string, number>;
    onNavigate: (direction: 'prev' | 'next') => void;
    onClose: () => void;
    onEdit: (content: ContentItem) => void;
};

function ContentPreviewModal(props: ContentPreviewModalProps) {
    const {
        content,
        context,
        currentContentIndex,
        onNavigate,
        onClose,
        onEdit,
    } = props;

    if (!content) return null;

    const hasMultiple = context && context.contentIds.length > 1;
    const currentIndex = context
        ? currentContentIndex[context.linkKey] || 0
        : 0;
    const totalCount = context ? context.contentIds.length : 1;

    return (
        <div
            data-component="ContentPreviewModal"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            {hasMultiple && (
                <button
                    onClick={() => onNavigate('prev')}
                    style={{
                        position: 'absolute',
                        left: '40px',
                        padding: '12px 16px',
                        borderRadius: '50%',
                        backgroundColor: '#3a3a3a',
                        border: '2px solid #555555',
                        color: '#e5e5e5',
                        cursor: 'pointer',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        zIndex: 1001,
                    }}
                >
                    ‹
                </button>
            )}

            <div
                style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '500px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                            {content.name}
                        </h2>
                        {hasMultiple && (
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#888',
                                    marginTop: '4px',
                                }}
                            >
                                {(currentIndex % totalCount) + 1} of{' '}
                                {totalCount}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {content.type === 'text' ? (
                    <div>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: content.textContent || '',
                            }}
                            style={{
                                padding: '16px',
                                backgroundColor: '#3a3a3a',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                minHeight: '100px',
                            }}
                        />
                        <button
                            onClick={() => onEdit(content)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor: '#B12518',
                                border: 'none',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Edit Text
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: '40px',
                            backgroundColor: '#3a3a3a',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#888888',
                        }}
                    >
                        <FileText size={48} style={{ margin: '0 auto 12px' }} />
                        <p>Preview for {content.type} content</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>
                            ({content.name})
                        </p>
                    </div>
                )}
            </div>

            {hasMultiple && (
                <button
                    onClick={() => onNavigate('next')}
                    style={{
                        position: 'absolute',
                        right: '40px',
                        padding: '12px 16px',
                        borderRadius: '50%',
                        backgroundColor: '#3a3a3a',
                        border: '2px solid #555555',
                        color: '#e5e5e5',
                        cursor: 'pointer',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        zIndex: 1001,
                    }}
                >
                    ›
                </button>
            )}
        </div>
    );
}

export default ContentPreviewModal;
