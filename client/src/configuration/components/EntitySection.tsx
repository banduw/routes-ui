import { Plus, X } from 'lucide-react';
import type { Anchor, Entity } from '../types';

type EntitySectionProps = {
    entities: Entity[];
    anchors: Anchor[];
    onCreateEntity: () => void;
    onRemoveEntity: (id: string) => void;
};

function EntitySection(props: EntitySectionProps) {
    const { entities, anchors, onCreateEntity, onRemoveEntity } = props;

    const getEntityAnchorCount = (entity: Entity) => {
        if (entity.sourceType === 'anchor') {
            return entity.anchorIds.filter((id) =>
                anchors.some((a) => a.id === id),
            ).length;
        }
        return 0;
    };

    return (
        <div data-component="EntitySection" style={{ marginBottom: '20px' }}>
            <h3
                style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#8b5cf6',
                }}
            >
                Entities ({entities.length})
            </h3>

            <button
                onClick={onCreateEntity}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#8b5cf6',
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
                Create Entity
            </button>

            {entities.map((entity) => (
                <div
                    key={entity.id}
                    style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#3a3a3a',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: '12px',
                                color: '#e5e5e5',
                            }}
                        >
                            {entity.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#888888' }}>
                            {entity.sourceType === 'anchor'
                                ? `From Anchors • ${getEntityAnchorCount(entity)} linked`
                                : 'Manual Entry'}
                        </div>
                    </div>
                    <button
                        onClick={() => onRemoveEntity(entity.id)}
                        style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#B12518',
                            cursor: 'pointer',
                            display: 'flex',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}

            {entities.length === 0 && (
                <div
                    style={{
                        padding: '20px',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#666666',
                        fontSize: '12px',
                    }}
                >
                    No entities created yet
                </div>
            )}
        </div>
    );
}

export default EntitySection;
