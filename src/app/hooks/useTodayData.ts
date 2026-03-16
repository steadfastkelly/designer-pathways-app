import { useState, useEffect } from 'react';
import {
  getAllProfiles, getAllMonthlyHours, getClickupDeadlines,
  getAllReviewRecords, getBonusRecords, getPipRecords,
} from '../lib/api';
import { getTeamHealth, getAttentionItems, getComingUp } from '../lib/today-intelligence';
import type { Profile, MonthlyHoursSummary, ClickupDeadline, ReviewRecord, BonusRecord, PipRecord, TeamHealthResult, AttentionItem, ComingUpItem, ReflectionEntry } from '../types';

interface TodayData {
  designers: Profile[];
  monthlyHours: MonthlyHoursSummary[];
  deadlines: ClickupDeadline[];
  reviews: ReviewRecord[];
  bonuses: BonusRecord[];
  pips: PipRecord[];
  teamHealth: TeamHealthResult;
  attentionItems: AttentionItem[];
  comingUp: ComingUpItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTodayData(): TodayData {
  const [data, setData] = useState<Omit<TodayData, 'loading' | 'error' | 'refetch'>>({
    designers: [],
    monthlyHours: [],
    deadlines: [],
    reviews: [],
    bonuses: [],
    pips: [],
    teamHealth: { status: 'green', message: 'Loading...', affectedDesigners: [] },
    attentionItems: [],
    comingUp: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllProfiles(),
      getAllMonthlyHours(),
      getClickupDeadlines(),
      getAllReviewRecords(),
      getBonusRecords(),
      getPipRecords(),
    ]).then(([profiles, hours, deadlines, reviews, bonuses, pips]) => {
      const designers = profiles.filter(p => p.isActive);
      const reflections: ReflectionEntry[] = []; // fetched separately if needed
      setData({
        designers,
        monthlyHours: hours,
        deadlines,
        reviews,
        bonuses,
        pips,
        teamHealth: getTeamHealth(designers, hours, deadlines),
        attentionItems: getAttentionItems(designers, hours, deadlines, reviews, bonuses, pips, reflections),
        comingUp: getComingUp(designers, reviews, bonuses, pips),
      });
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [tick]);

  return { ...data, loading, error, refetch: () => setTick(t => t + 1) };
}
