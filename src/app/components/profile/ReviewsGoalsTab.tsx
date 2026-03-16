import { format, parseISO } from 'date-fns';
import type { ReviewRecord, PerformanceGoal } from '../../types';
import { REVIEW_TYPE_LABELS, GOAL_STATUS_LABELS } from '../../types';

const GOAL_STATUS_COLORS = {
  not_started: 'var(--text-subtle)',
  in_progress: 'var(--accent-blue)',
  met: 'var(--accent-green)',
  partially_met: 'var(--accent-amber)',
  not_met: 'var(--accent-red)',
};

interface Props {
  reviews: ReviewRecord[];
  goals: PerformanceGoal[];
}

export function ReviewsGoalsTab({ reviews, goals }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Reviews */}
      <section>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-subtle)', fontSize: 13 }}>No reviews on record.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map(review => (
              <div key={review.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{REVIEW_TYPE_LABELS[review.reviewType]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'DM Mono, monospace' }}>
                    {format(parseISO(review.periodStart), 'MMM d')} – {format(parseISO(review.periodEnd), 'MMM d, yyyy')}
                  </div>
                </div>
                {review.overallRating && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Rating: <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent-teal)' }}>{review.overallRating.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
                  {review.completedAt ? (
                    <span style={{ color: 'var(--accent-green)' }}>✓ Completed {format(parseISO(review.completedAt), 'MMM d, yyyy')}</span>
                  ) : (
                    <span style={{ color: 'var(--accent-amber)' }}>⏳ Pending completion</span>
                  )}
                  {review.sharedWithDesignerAt && (
                    <span style={{ color: 'var(--text-subtle)' }}>Shared {format(parseISO(review.sharedWithDesignerAt), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Goals */}
      <section>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Performance Goals ({goals.length})</h3>
        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-subtle)', fontSize: 13 }}>No goals on record.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goals.map(goal => (
              <div key={goal.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOAL_STATUS_COLORS[goal.status], flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{goal.description}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-subtle)' }}>
                    <span style={{ color: GOAL_STATUS_COLORS[goal.status], fontWeight: 600 }}>{GOAL_STATUS_LABELS[goal.status]}</span>
                    {goal.targetDate && <span>Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}</span>}
                    {goal.category && <span>{goal.category}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
