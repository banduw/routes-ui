import type { PendingLinkAction } from '../../types';

type ConfirmLinkModalProps = {
    isOpen: boolean;
    action: PendingLinkAction | null;
    onConfirm: () => void;
    onCancel: () => void;
};

function ConfirmLinkModal(props: ConfirmLinkModalProps) {
    const { isOpen, action, onConfirm, onCancel } = props;

    if (!isOpen || !action) return null;

    const totalLinks =
        (action.contentIds?.length || 0) * (action.anchorIds?.length || 0);

    return (
        <div
            data-component="ConfirmLinkModal"
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
                    width: '400px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <h2
                    style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        marginBottom: '16px',
                        color: '#f59e0b',
                    }}
                >
                    Confirm Multi-Link
                </h2>

                <div
                    style={{
                        marginBottom: '20px',
                        fontSize: '14px',
                        color: '#e5e5e5',
                        lineHeight: 1.6,
                    }}
                >
                    You're about to link:
                    <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                        {action.contentIds && (
                            <li>
                                <strong>{action.contentIds.length}</strong>{' '}
                                content item
                                {action.contentIds.length !== 1 ? 's' : ''}
                            </li>
                        )}
                        {action.anchorIds && (
                            <li>
                                <strong>{action.anchorIds.length}</strong>{' '}
                                anchor{action.anchorIds.length !== 1 ? 's' : ''}
                            </li>
                        )}
                    </ul>
                    <p
                        style={{
                            marginTop: '12px',
                            color: '#aaa',
                            fontSize: '12px',
                        }}
                    >
                        This will create <strong>{totalLinks}</strong> link
                        {totalLinks !== 1 ? 's' : ''}.
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
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#f59e0b',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmLinkModal;
