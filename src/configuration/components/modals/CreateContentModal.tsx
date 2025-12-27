import type { ContentType } from '../../types';

type CreateContentModalProps = {
    isOpen: boolean;
    contentName: string;
    contentType: ContentType;
    onNameChange: (value: string) => void;
    onTypeChange: (type: ContentType) => void;
    onSave: () => void;
    onCancel: () => void;
    onOpenTextEditor: () => void;
    onOpenCCTVEditor: () => void;
};

function CreateContentModal(props: CreateContentModalProps) {
    const {
        isOpen,
        contentName,
        contentType,
        onNameChange,
        onTypeChange,
        onSave,
        onCancel,
        onOpenTextEditor,
        onOpenCCTVEditor,
    } = props;

    if (!isOpen) return null;

    return (
        <div
            data-component="CreateContentModal"
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
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '500px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <h2
                    style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        marginBottom: '20px',
                    }}
                >
                    Add Content
                </h2>

                <div style={{ marginBottom: '16px' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#aaaaaa',
                            marginBottom: '6px',
                        }}
                    >
                        Content Type
                    </label>
                    <select
                        value={contentType}
                        onChange={(e) =>
                            onTypeChange(e.target.value as ContentType)
                        }
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="text">Text</option>
                        <option value="link">Link</option>
                        <option value="cctv">CCTV Feed</option>
                        <option value="video">Video</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#aaaaaa',
                            marginBottom: '6px',
                        }}
                    >
                        Name
                    </label>
                    <input
                        type="text"
                        value={contentName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter content name..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                {contentType === 'text' && (
                    <div
                        style={{
                            marginBottom: '16px',
                            padding: '12px',
                            backgroundColor: '#3a3a3a',
                            borderRadius: '6px',
                            border: '1px solid #555555',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#aaaaaa',
                                marginBottom: '8px',
                            }}
                        >
                            Create rich text content with formatting
                        </p>
                        <button
                            onClick={onOpenTextEditor}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                backgroundColor: '#B12518',
                                border: 'none',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Open Text Editor
                        </button>
                    </div>
                )}

                {contentType === 'cctv' && (
                    <div
                        style={{
                            marginBottom: '16px',
                            padding: '12px',
                            backgroundColor: '#3a3a3a',
                            borderRadius: '6px',
                            border: '1px solid #555555',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#aaaaaa',
                                marginBottom: '8px',
                            }}
                        >
                            Add CCTV feed URL
                        </p>
                        <button
                            onClick={onOpenCCTVEditor}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                backgroundColor: '#B12518',
                                border: 'none',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Configure CCTV
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!contentName.trim()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: contentName.trim()
                                ? '#B12518'
                                : '#555555',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: contentName.trim()
                                ? 'pointer'
                                : 'not-allowed',
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateContentModal;
