import { useState } from 'react';
import type { Profile, PerformanceGoal, ReviewRecord } from '../../types';
import { PATHWAY_LEVEL_LABELS, PATHWAY_LEVEL_ORDER, PATHWAY_TRACK_LABELS } from '../../types';

interface Props {
  profile: Profile;
  goals: PerformanceGoal[];
  reviews: ReviewRecord[];
}

export function YourJourney({ profile, goals, reviews }: Props) {
  const [showAllGoals, setShowAllGoals] = useState(false);
  const levelIndex = profile.pathwayLevel ? PATHWAY_LEVEL_ORDER.indexOf(profile.pathwayLevel) : -1;
  const nextLevel = levelIndex >= 0 && levelIndex < PATHWAY_LEVEL_ORDER.length - 1
    ? PATHWAY_LEVEL_ORDER[levelIndex + 1]
    : null;

  const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'not_started');
  const latestReview = reviews.find(r => r.sharedWithDesignerAt);

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Your Journey</div>

      {/* Current Level */}
      <div style={{ marginBottom: 20 }}>
        {profile.pathwayLevel ? (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4 }}>Current Level</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--accent-teal)', marginBottom: 4 }}>
              {PATHWAY_LEVEL_LABELS[profile.pathwayLevel]}
            </div>
            {profile.pathwayTrack && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {PATHWAY_TRACK_LABELS[profile.pathwayTrack]} Track
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Pathway level not set yet.</div>
        )}
      </div>

      {/* Progress Bar */}
      {levelIndex >= 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6 }}>
            <span>Level {levelIndex + 1} of {PATHWAY_LEVEL_ORDER.length}</span>
            {nextLevel && <span>Next: {PATHWAY_LEVEL_LABELS[nextLevel]}</span>}
          </div>
          <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((levelIndex + 1) / PATHWAY_LEVEL_ORDER.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-violet))',
              borderRadius: 3,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Active Goals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(showAllGoals ? activeGoals : activeGoals.slice(0, 3)).map(goal => (
              <div key={goal.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: goal.status === 'in_progress' ? 'var(--accent-teal)' : 'var(--border-accent)', flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{goal.description}</span>
              </div>
            ))}
          </div>
          {activeGoals.length > 3 && (
            <button
              onClick={() => setShowAllGoals(s => !s)}
              style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent-teal)', padding: 0 }}
            >
              {showAllGoals ? 'Show fewer' : `View all ${activeGoals.length} goals →`}
            </button>
          )}
        </div>
      )}

      {/* Latest Review Note */}
      {latestReview?.overallRating && (
        <div style={{ marginTop: 16, padding: '12px', background: 'var(--accent-teal-dim)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Latest review score: <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent-teal)' }}>{latestReview.overallRating.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
