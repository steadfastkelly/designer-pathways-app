import { useState, useEffect } from 'react';
import { getAllProfiles, getAllMonthlyHours, getClickupDeadlines } from '../lib/api';
import { getDesignerScore } from '../lib/scoring';
import type { Profile, MonthlyHoursSummary, ClickupDeadline, DesignerScore } from '../types';

interface TeamMember {
  profile: Profile;
  hours: MonthlyHoursSummary[];
  deadlines: ClickupDeadline[];
  score: DesignerScore;
}

interface TeamData {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTeamData(): TeamData {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([getAllProfiles(), getAllMonthlyHours(), getClickupDeadlines()])
      .then(([profiles, allHours, allDeadlines]) => {
        const designers = profiles.filter(p => p.isActive && p.role === 'designer');
        const built: TeamMember[] = designers.map(profile => {
          const hours = allHours.filter(h => h.designerId === profile.id);
          const deadlines = allDeadlines.filter(d => d.designerId === profile.id);
          return { profile, hours, deadlines, score: getDesignerScore(profile, hours, deadlines) };
        });
        setMembers(built);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tick]);

  return { members, loading, error, refetch: () => setTick(t => t + 1) };
}
