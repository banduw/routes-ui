type CCTVEditorModalProps = {
    isOpen: boolean;
    name: string;
    url: string;
    onNameChange: (value: string) => void;
    onUrlChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function CCTVEditorModal(props: CCTVEditorModalProps) {
    const { isOpen, name, url, onNameChange, onUrlChange, onSave, onCancel } =
        props;

    if (!isOpen) return null;

    return (
        <div
            data-component="CCTVEditorModal"
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
                    CCTV Feed
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
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter CCTV name..."
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

                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#aaaaaa',
                            marginBottom: '6px',
                        }}
                    >
                        Feed URL
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder="https://example.com/feed"
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
                    <p
                        style={{
                            fontSize: '11px',
                            color: '#666666',
                            marginTop: '6px',
                        }}
                    >
                        Enter the RTSP or HTTP stream URL
                    </p>
                </div>

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
                        disabled={!name.trim() || !url.trim()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor:
                                name.trim() && url.trim()
                                    ? '#B12518'
                                    : '#555555',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor:
                                name.trim() && url.trim()
                                    ? 'pointer'
                                    : 'not-allowed',
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CCTVEditorModal;
