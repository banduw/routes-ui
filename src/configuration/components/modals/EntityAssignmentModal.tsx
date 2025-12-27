import { MapPin } from 'lucide-react';
import type { Entity, Route } from '../../types';

type EntityAssignmentModalProps = {
    routeId: string | null;
    routes: Route[];
    entities: Entity[];
    currentAssignments: string[];
    onToggle: (entityId: string) => void;
    onSave: (selectedIds: string[]) => void;
    onCancel: () => void;
};

function EntityAssignmentModal(props: EntityAssignmentModalProps) {
    const {
        routeId,
        routes,
        entities,
        currentAssignments,
        onToggle,
        onSave,
        onCancel,
    } = props;

    if (!routeId) return null;

    const route = routes.find((r) => r.id === routeId);
    if (!route) return null;

    return (
        <div
            data-component="EntityAssignmentModal"
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
                        marginBottom: '16px',
                    }}
                >
                    Assign Entities to Route
                </h2>

                <div
                    style={{
                        marginBottom: '16px',
                        padding: '10px',
                        backgroundColor: '#3a3a3a',
                        borderRadius: '8px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#e5e5e5',
                        }}
                    >
                        {route.name}
                    </div>
                    <div
                        style={{
                            fontSize: '11px',
                            color: '#888888',
                            marginTop: '4px',
                        }}
                    >
                        {route.description || 'No description'}
                    </div>
                </div>

                {entities.length === 0 ? (
                    <div
                        style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '8px',
                            marginBottom: '20px',
                        }}
                    >
                        <MapPin
                            size={48}
                            style={{ margin: '0 auto 12px', color: '#666666' }}
                        />
                        <p style={{ fontSize: '14px', color: '#888888' }}>
                            No entities available
                        </p>
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#666666',
                                marginTop: '4px',
                            }}
                        >
                            Create entities first in Configuration mode
                        </p>
                    </div>
                ) : (
                    <>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                color: '#aaaaaa',
                                marginBottom: '8px',
                            }}
                        >
                            Select Entities ({currentAssignments.length}{' '}
                            selected)
                        </label>

                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                marginBottom: '20px',
                            }}
                        >
                            {entities.map((entity) => {
                                const isAssigned = currentAssignments.includes(
                                    entity.id,
                                );
                                return (
                                    <div
                                        key={entity.id}
                                        onClick={() => onToggle(entity.id)}
                                        style={{
                                            padding: '10px',
                                            marginBottom: '6px',
                                            borderRadius: '6px',
                                            backgroundColor: isAssigned
                                                ? 'rgba(139, 92, 246, 0.2)'
                                                : '#3a3a3a',
                                            border: isAssigned
                                                ? '2px solid #8b5cf6'
                                                : '2px solid transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {entity.name}
                                            </div>
                                            {entity.description && (
                                                <div
                                                    style={{
                                                        fontSize: '11px',
                                                        color: '#888',
                                                        marginTop: '2px',
                                                    }}
                                                >
                                                    {entity.description}
                                                </div>
                                            )}
                                        </div>
                                        {isAssigned && (
                                            <span
                                                style={{
                                                    color: '#8b5cf6',
                                                    fontSize: '18px',
                                                }}
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
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
                        onClick={() => onSave(currentAssignments)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: '#8b5cf6',
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

export default EntityAssignmentModal;
