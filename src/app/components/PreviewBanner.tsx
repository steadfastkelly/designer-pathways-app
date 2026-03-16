import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function PreviewBanner() {
  const { previewMode, previewDesigner, exitPreview } = useAuth();
  const navigate = useNavigate();

  if (!previewMode || !previewDesigner) return null;

  return (
    <div style={{
      background: 'var(--accent-amber-dim)',
      borderBottom: '1px solid var(--accent-amber)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 13,
      color: 'var(--accent-amber)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>Preview Mode</span>
        <span style={{ color: 'var(--text-muted)' }}>—</span>
        <span>Viewing as {previewDesigner.name}</span>
      </div>
      <button
        onClick={() => { exitPreview(); navigate('/today'); }}
        style={{
          background: 'transparent', border: 'none', color: 'var(--accent-amber)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, padding: '2px 6px', borderRadius: 4,
        }}
      >
        <X size={14} />
        Exit Preview
      </button>
    </div>
  );
}
