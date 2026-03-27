import { useState, useEffect } from 'react';
import { useSyncVersion } from '../contexts/SyncContext';
import {
  getMonthlyHours, getReflectionEntries, getValueMultipliers,
  getReviewRecords, getPerformanceGoals, getClickupDeadlines, getAllMonthlyHours,
} from '../lib/api';
import type {
  MonthlyHoursSummary, ReflectionEntry, ValueMultiplier,
  ReviewRecord, PerformanceGoal, ClickupDeadline,
} from '../types';

interface HomebaseData {
  monthlyHours: MonthlyHoursSummary[];
  teamHours: MonthlyHoursSummary[];
  reflections: ReflectionEntry[];
  valueMultipliers: ValueMultiplier[];
  reviews: ReviewRecord[];
  goals: PerformanceGoal[];
  deadlines: ClickupDeadline[];
  loading: boolean;
  error: string | null;
}

export function useHomebaseData(designerId: string | undefined): HomebaseData {
  const syncVersion = useSyncVersion();
  const [state, setState] = useState<Omit<HomebaseData, 'loading' | 'error'>>({
    monthlyHours: [], teamHours: [], reflections: [], valueMultipliers: [],
    reviews: [], goals: [], deadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designerId) { setLoading(false); return; }
    Promise.all([
      getMonthlyHours(designerId, 12),
      getAllMonthlyHours(200),
      getReflectionEntries(designerId),
      getValueMultipliers(designerId),
      getReviewRecords(designerId),
      getPerformanceGoals(designerId),
      getClickupDeadlines(designerId),
    ]).then(([monthlyHours, teamHours, reflections, valueMultipliers, reviews, goals, deadlines]) => {
      setState({ monthlyHours, teamHours, reflections, valueMultipliers, reviews, goals, deadlines });
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [designerId, syncVersion]);

  return { ...state, loading, error };
}
