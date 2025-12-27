import type { Anchor } from '../../types';

type EditAnchorModalProps = {
    anchor: Anchor | null;
    onDescriptionChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function EditAnchorModal(props: EditAnchorModalProps) {
    const { anchor, onDescriptionChange, onSave, onCancel } = props;

    if (!anchor) return null;

    return (
        <div
            data-component="EditAnchorModal"
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
                    Edit Anchor Info
                </h2>

                <div
                    style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#3a3a3a',
                        borderRadius: '6px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '12px',
                            color: '#aaa',
                            marginBottom: '4px',
                        }}
                    >
                        Anchor Name
                    </div>
                    <div
                        style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#10b981',
                        }}
                    >
                        {anchor.name}
                    </div>
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
                        value={anchor.description || ''}
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
                            minHeight: '100px',
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
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditAnchorModal;
