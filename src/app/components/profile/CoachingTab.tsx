import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { MessageSquarePlus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CoachingNote, CoachingCategory, Profile } from '../../types';
import { COACHING_CATEGORY_LABELS } from '../../types';
import { addCoachingNote } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const CATEGORY_COLORS: Record<CoachingCategory, string> = {
  billable_hours: 'var(--accent-red)', logging_accuracy: 'var(--accent-amber)',
  deadlines: 'var(--accent-amber)', communication: 'var(--accent-blue)',
  conduct: 'var(--accent-violet)', pathway_progression: 'var(--accent-teal)',
  workload: 'var(--accent-green)', general: 'var(--text-muted)',
};
const CATEGORY_BG: Record<CoachingCategory, string> = {
  billable_hours: 'var(--accent-red-dim)', logging_accuracy: 'var(--accent-amber-dim)',
  deadlines: 'var(--accent-amber-dim)', communication: 'var(--accent-blue-dim)',
  conduct: 'var(--accent-violet-dim)', pathway_progression: 'var(--accent-teal-dim)',
  workload: 'var(--accent-green-dim)', general: 'rgba(139,143,168,0.12)',
};

interface Props {
  profile: Profile;
  notes: CoachingNote[];
  currentBillablePct: number;
  onNoteAdded: (note: CoachingNote) => void;
}

export function CoachingTab({ profile, notes, currentBillablePct, onNoteAdded }: Props) {
  const { profile: adminProfile } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CoachingCategory>('general');
  const [cycleDate, setCycleDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = profile.name.split(' ')[0];

  const handleAdd = async () => {
    if (!content.trim() || !adminProfile) return;
    setSaving(true);
    setError(null);
    const note = await addCoachingNote({
      designerId: profile.id,
      authorId: adminProfile.id,
      content: content.trim(),
      category,
      relatedCycleDate: cycleDate || undefined,
      beforeMetricValue: category === 'billable_hours' ? currentBillablePct : undefined,
    });
    setSaving(false);
    if (note) {
      onNoteAdded(note);
      setContent('');
      setCycleDate('');
      setCategory('general');
    } else {
      setError('Failed to save note. Please try again.');
    }
  };

  return (
    <div>
      {/* Add Note Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquarePlus size={16} color="var(--accent-teal)" />
          Add a Coaching Note
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Write a private coaching note about ${firstName}…`}
          rows={4}
          style={{ width: '100%', resize: 'vertical', marginBottom: 12 }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as CoachingCategory)}>
              {(Object.entries(COACHING_CATEGORY_LABELS) as [CoachingCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Related Cycle Date (optional)</label>
            <input type="date" value={cycleDate} onChange={e => setCycleDate(e.target.value)} />
          </div>
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--accent-red)', marginBottom: 10 }}>{error}</div>}
        <button
          onClick={handleAdd}
          disabled={!content.trim() || saving}
          style={{
            padding: '8px 18px', background: 'var(--accent-teal)', color: '#0F1117',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: (!content.trim() || saving) ? 'not-allowed' : 'pointer',
            opacity: (!content.trim() || saving) ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>

      {/* Notes List */}
      <div style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
          Coaching Notes ({notes.length})
        </h3>
      </div>

      {notes.length === 0 ? (
        <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: '16px 0' }}>
          No coaching notes yet. Add your first note above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: CoachingNote }) {
  const color = CATEGORY_COLORS[note.category];
  const bg = CATEGORY_BG[note.category];
  const daysSince = differenceInDays(new Date(), parseISO(note.createdAt));
  const showFollowUp = note.beforeMetricValue != null && daysSince >= 30;
  const hasAfterValue = note.afterMetricValue != null;
  const delta = hasAfterValue && note.beforeMetricValue != null
    ? note.afterMetricValue! - note.beforeMetricValue
    : null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {COACHING_CATEGORY_LABELS[note.category]}
          </span>
          {note.relatedCycleDate && (
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Cycle: {format(parseISO(note.relatedCycleDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>
          {format(parseISO(note.createdAt), 'MMM d, yyyy')}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
        {note.content}
      </p>
      {/* Before/After Tracking */}
      {note.beforeMetricValue != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
          <span>Before: <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>{note.beforeMetricValue.toFixed(1)}%</span></span>
          {hasAfterValue && delta !== null && (
            <>
              <span>→ After: <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>{note.afterMetricValue!.toFixed(1)}%</span></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                {Math.abs(delta).toFixed(1)}%
              </span>
            </>
          )}
          {showFollowUp && !hasAfterValue && (
            <span style={{ color: 'var(--accent-amber)', fontSize: 11 }}>⏰ Follow-up due (30+ days)</span>
          )}
        </div>
      )}
    </div>
  );
}
