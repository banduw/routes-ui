type CreateProjectModalProps = {
    isOpen: boolean;
    projectName: string;
    projectDescription: string;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function CreateProjectModal(props: CreateProjectModalProps) {
    const {
        isOpen,
        projectName,
        projectDescription,
        onNameChange,
        onDescriptionChange,
        onSave,
        onCancel,
    } = props;

    if (!isOpen) return null;

    return (
        <div
            data-component="CreateProjectModal"
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
                    Create New Project
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
                        Project Name
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter project name..."
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
                        Description
                    </label>
                    <textarea
                        value={projectDescription}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Enter description..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            outline: 'none',
                            minHeight: '80px',
                            resize: 'vertical',
                        }}
                    />
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
                        disabled={!projectName.trim()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: projectName.trim()
                                ? '#10b981'
                                : '#555555',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: projectName.trim()
                                ? 'pointer'
                                : 'not-allowed',
                        }}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateProjectModal;
