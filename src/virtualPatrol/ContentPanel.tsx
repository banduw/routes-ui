// @ts-nocheck
import React from 'react';
import { FileText, X } from 'lucide-react';

export default function ContentPanel({
  panel,
  isActive,
  onActivate,
  onDrag,
  onClose
}) {
  return (
    <div
      onClick={onActivate}
      style={{
        position: 'absolute',
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        backgroundColor: '#2a2a2a',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        boxShadow: isActive ? '0 10px 40px rgba(245,158,11,0.4)' : '0 4px 20px rgba(245,158,11,0.2)',
        zIndex: isActive ? 1200 : 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        resize: 'both',
        transition: 'box-shadow 0.2s'
      }}
    >
      <div
        style={{ padding: '12px 16px', backgroundColor: '#1a1a1a', borderBottom: '2px solid #f59e0b', cursor: 'move', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
        onMouseDown={onDrag}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{panel.content.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {panel.content.type === 'document' && (
          <div style={{ textAlign: 'center' }}>
            <FileText size={64} style={{ color: '#666', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.fileName}</p>
            <p style={{ fontSize: '12px', color: '#888' }}>PDF Document</p>
          </div>
        )}

        {panel.content.type === 'image' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🖼️</div>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.fileName}</p>
            <p style={{ fontSize: '12px', color: '#888' }}>Image File</p>
          </div>
        )}

        {panel.content.type === 'cctv' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📹</div>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>{panel.content.name}</p>
            <p style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace' }}>{panel.content.cctvUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
