import { AlignLeft, Bold, Italic, List, ListOrdered } from 'lucide-react';

type TextEditorModalProps = {
    isOpen: boolean;
    title: string;
    content: string;
    onTitleChange: (value: string) => void;
    onContentChange: (html: string) => void;
    onFormat: (command: string, value?: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function TextEditorModal(props: TextEditorModalProps) {
    const {
        isOpen,
        title,
        content,
        onTitleChange,
        onContentChange,
        onFormat,
        onSave,
        onCancel,
    } = props;

    if (!isOpen) return null;

    return (
        <div
            data-component="TextEditorModal"
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
                    width: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
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
                    Text Editor
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
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Enter title..."
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

                <div
                    style={{
                        marginBottom: '12px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        padding: '8px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '6px',
                    }}
                >
                    <button
                        onClick={() => onFormat('bold')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={() => onFormat('italic')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        onClick={() => onFormat('insertUnorderedList')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => onFormat('insertOrderedList')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <ListOrdered size={16} />
                    </button>
                    <button
                        onClick={() => onFormat('justifyLeft')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#3a3a3a',
                            border: 'none',
                            color: '#e5e5e5',
                            cursor: 'pointer',
                        }}
                    >
                        <AlignLeft size={16} />
                    </button>
                </div>

                <div
                    contentEditable
                    onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: content }}
                    suppressContentEditableWarning
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: '#3a3a3a',
                        border: '1px solid #555555',
                        color: '#e5e5e5',
                        fontSize: '14px',
                        outline: 'none',
                        minHeight: '200px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        marginBottom: '20px',
                    }}
                />

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
                        disabled={!title.trim()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: title.trim()
                                ? '#B12518'
                                : '#555555',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: title.trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TextEditorModal;
