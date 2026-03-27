import { useState, useEffect } from 'react';
import { useSyncVersion } from '../contexts/SyncContext';
import {
  getProfile, getMonthlyHours, getCoachingNotes, getClickupDeadlines,
  getReflectionEntries, getValueMultipliers, getReviewRecords,
  getPerformanceGoals, getCompensationHistory, getBonusRecords, getPipRecords,
} from '../lib/api';
import type {
  Profile, MonthlyHoursSummary, CoachingNote, ClickupDeadline,
  ReflectionEntry, ValueMultiplier, ReviewRecord, PerformanceGoal,
  CompensationHistory, BonusRecord, PipRecord,
} from '../types';

interface ProfileData {
  profile: Profile | null;
  monthlyHours: MonthlyHoursSummary[];
  coachingNotes: CoachingNote[];
  deadlines: ClickupDeadline[];
  reflections: ReflectionEntry[];
  valueMultipliers: ValueMultiplier[];
  reviews: ReviewRecord[];
  goals: PerformanceGoal[];
  compensationHistory: CompensationHistory[];
  bonuses: BonusRecord[];
  pips: PipRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfileData(designerId: string | undefined): ProfileData {
  const syncVersion = useSyncVersion();
  const [state, setState] = useState<Omit<ProfileData, 'loading' | 'error' | 'refetch'>>({
    profile: null, monthlyHours: [], coachingNotes: [], deadlines: [],
    reflections: [], valueMultipliers: [], reviews: [], goals: [],
    compensationHistory: [], bonuses: [], pips: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!designerId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getProfile(designerId),
      getMonthlyHours(designerId, 24),
      getCoachingNotes(designerId),
      getClickupDeadlines(designerId),
      getReflectionEntries(designerId),
      getValueMultipliers(designerId),
      getReviewRecords(designerId),
      getPerformanceGoals(designerId),
      getCompensationHistory(designerId),
      getBonusRecords(designerId),
      getPipRecords(designerId),
    ]).then(([profile, monthlyHours, coachingNotes, deadlines, reflections,
              valueMultipliers, reviews, goals, compensationHistory, bonuses, pips]) => {
      setState({ profile, monthlyHours, coachingNotes, deadlines, reflections,
                 valueMultipliers, reviews, goals, compensationHistory, bonuses, pips });
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [designerId, tick, syncVersion]);

  return { ...state, loading, error, refetch: () => setTick(t => t + 1) };
}
