import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../hooks/useAuth';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { EditProfileDialog } from '../components/profile/EditProfileDialog';
import { OverviewTab } from '../components/profile/OverviewTab';
import { HoursHistoryTab } from '../components/profile/HoursHistoryTab';
import { CoachingTab } from '../components/profile/CoachingTab';
import { ReviewsGoalsTab } from '../components/profile/ReviewsGoalsTab';
import { CompensationTab } from '../components/profile/CompensationTab';
import { getDesignerScore } from '../lib/scoring';
import type { CoachingNote, CompensationHistory, Profile } from '../types';

type TabId = 'overview' | 'hours' | 'coaching' | 'reviews' | 'compensation';

export function DesignerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const {
    profile, monthlyHours, coachingNotes, deadlines, reviews, goals,
    compensationHistory, bonuses, loading, error,
  } = useProfileData(id);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [localNotes, setLocalNotes] = useState<CoachingNote[] | null>(null);
  const [localCompHistory, setLocalCompHistory] = useState<CompensationHistory[] | null>(null);

  if (!id) return <Navigate to="/team" replace />;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--accent-teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !profile) {
    return <div style={{ color: 'var(--accent-red)', padding: 24 }}>Error loading designer profile. {error}</div>;
  }

  const displayProfile = localProfile ?? profile;
  const displayNotes = localNotes ?? coachingNotes;
  const displayCompHistory = localCompHistory ?? compensationHistory;
  const score = getDesignerScore(displayProfile, monthlyHours, deadlines);
  const currentBillablePct = monthlyHours[0]?.billablePercent ?? 0;

  const tabs: { id: TabId; label: string; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'hours', label: 'Hours History' },
    { id: 'coaching', label: 'Coaching', adminOnly: true },
    { id: 'reviews', label: 'Reviews & Goals' },
    { id: 'compensation', label: 'Compensation', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || role === 'admin');

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <ProfileHeader
        profile={displayProfile}
        score={score}
        onEdit={() => setShowEdit(true)}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {visibleTabs.map(tab => (
          <button key={tab.id} style={tabBtnStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          profile={displayProfile}
          monthlyHours={monthlyHours}
          coachingNotes={displayNotes}
          deadlines={deadlines}
        />
      )}
      {activeTab === 'hours' && (
        <HoursHistoryTab monthlyHours={monthlyHours} />
      )}
      {activeTab === 'coaching' && role === 'admin' && (
        <CoachingTab
          profile={displayProfile}
          notes={displayNotes}
          currentBillablePct={currentBillablePct}
          onNoteAdded={note => setLocalNotes(prev => [note, ...(prev ?? coachingNotes)])}
        />
      )}
      {activeTab === 'reviews' && (
        <ReviewsGoalsTab reviews={reviews} goals={goals} />
      )}
      {activeTab === 'compensation' && role === 'admin' && (
        <CompensationTab
          profile={displayProfile}
          compensationHistory={displayCompHistory}
          bonuses={bonuses}
          monthlyHours={monthlyHours}
          onHistoryUpdated={record => setLocalCompHistory(prev => [record, ...(prev ?? compensationHistory)])}
        />
      )}

      {/* Edit Dialog */}
      {showEdit && (
        <EditProfileDialog
          profile={displayProfile}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setLocalProfile(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
