import type { Anchor } from '../../types';

type EntityCreationModalProps = {
    isOpen: boolean;
    name: string;
    description: string;
    sourceType: 'anchor' | 'manual';
    selectedAnchorIds: string[];
    anchors: Anchor[];
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onSourceTypeChange: (type: 'anchor' | 'manual') => void;
    onAnchorToggle: (anchorId: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function EntityCreationModal(props: EntityCreationModalProps) {
    const {
        isOpen,
        name,
        description,
        sourceType,
        selectedAnchorIds,
        anchors,
        onNameChange,
        onDescriptionChange,
        onSourceTypeChange,
        onAnchorToggle,
        onSave,
        onCancel,
    } = props;

    if (!isOpen) return null;

    return (
        <div
            data-component="EntityCreationModal"
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
                    Create Entity
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
                        Entity Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter entity name..."
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

                <div style={{ marginBottom: '16px' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#aaaaaa',
                            marginBottom: '6px',
                        }}
                    >
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Add description..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#3a3a3a',
                            border: '1px solid #555555',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            outline: 'none',
                            minHeight: '60px',
                            resize: 'vertical',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#aaaaaa',
                            marginBottom: '6px',
                        }}
                    >
                        Source Type
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => onSourceTypeChange('manual')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor:
                                    sourceType === 'manual'
                                        ? '#8b5cf6'
                                        : '#3a3a3a',
                                border: 'none',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => onSourceTypeChange('anchor')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor:
                                    sourceType === 'anchor'
                                        ? '#8b5cf6'
                                        : '#3a3a3a',
                                border: 'none',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            From Anchors
                        </button>
                    </div>
                </div>

                {sourceType === 'anchor' && (
                    <div style={{ flex: 1, marginBottom: '16px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                color: '#aaaaaa',
                                marginBottom: '8px',
                            }}
                        >
                            Select Anchors ({selectedAnchorIds.length} selected)
                        </label>
                        <div
                            style={{
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '6px',
                                padding: '8px',
                            }}
                        >
                            {anchors.map((anchor) => (
                                <div
                                    key={anchor.id}
                                    onClick={() => onAnchorToggle(anchor.id)}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '4px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                            selectedAnchorIds.includes(
                                                anchor.id,
                                            )
                                                ? 'rgba(139, 92, 246, 0.2)'
                                                : '#2a2a2a',
                                        border: selectedAnchorIds.includes(
                                            anchor.id,
                                        )
                                            ? '1px solid #8b5cf6'
                                            : '1px solid transparent',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    {anchor.name}
                                </div>
                            ))}
                        </div>
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
                        disabled={
                            !name.trim() ||
                            (sourceType === 'anchor' &&
                                selectedAnchorIds.length === 0)
                        }
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor:
                                name.trim() &&
                                (sourceType === 'manual' ||
                                    selectedAnchorIds.length > 0)
                                    ? '#8b5cf6'
                                    : '#555555',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor:
                                name.trim() &&
                                (sourceType === 'manual' ||
                                    selectedAnchorIds.length > 0)
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

export default EntityCreationModal;
