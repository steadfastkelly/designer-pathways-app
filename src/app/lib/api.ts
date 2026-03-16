import { supabase } from './supabase';
import {
  mapProfile, mapMonthlyHours, mapClickupDeadline, mapCoachingNote,
  mapReflectionEntry, mapValueMultiplier, mapReviewRecord, mapPerformanceGoal,
  mapCompensationHistory, mapBonusRecord, mapPipRecord,
} from './mappers';
import type {
  Profile, MonthlyHoursSummary, ClickupDeadline, CoachingNote,
  ReflectionEntry, ValueMultiplier, ReviewRecord, PerformanceGoal,
  CompensationHistory, BonusRecord, PipRecord, CoachingCategory,
  DeadlineAttribution,
} from '../types';

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function getActiveDesigners(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .eq('role', 'designer')
    .order('name');
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function updateProfile(
  id: string,
  updates: Partial<{
    name: string;
    external_title: string | null;
    pathway_level: string | null;
    pathway_track: string | null;
    scheduled_hours_per_week: number;
    schedule_type: string;
    hire_date: string | null;
    region: string | null;
    location_city: string | null;
    location_state: string | null;
    phone: string | null;
    birthday: string | null;
    personality_mbti: string | null;
    personality_enneagram: string | null;
    personality_notes: string | null;
    bio: string | null;
    special_circumstances_notes: string | null;
    billable_target_min: number | null;
    billable_target_max: number | null;
    billable_target_exempt: boolean;
  }>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) { console.error('updateProfile error:', error); return null; }
  return mapProfile(data);
}

// ─── Monthly Hours ─────────────────────────────────────────────────────────────

export async function getMonthlyHours(designerId: string, limit = 24): Promise<MonthlyHoursSummary[]> {
  const { data, error } = await supabase
    .from('monthly_hours_summary')
    .select('*')
    .eq('designer_id', designerId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapMonthlyHours);
}

export async function getAllMonthlyHours(limit = 500): Promise<MonthlyHoursSummary[]> {
  const { data, error } = await supabase
    .from('monthly_hours_summary')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapMonthlyHours);
}

// ─── ClickUp Deadlines ─────────────────────────────────────────────────────────

export async function getClickupDeadlines(designerId?: string): Promise<ClickupDeadline[]> {
  let query = supabase.from('clickup_deadlines').select('*').order('due_date', { ascending: false });
  if (designerId) query = query.eq('designer_id', designerId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapClickupDeadline);
}

export async function updateDeadlineAttribution(
  id: string,
  attribution: DeadlineAttribution,
  notes?: string,
  attributedBy?: string,
): Promise<void> {
  await supabase.from('clickup_deadlines').update({
    attribution,
    attribution_notes: notes ?? null,
    attribution_set_by: attributedBy ?? null,
    attribution_set_at: new Date().toISOString(),
  }).eq('id', id);
}

// ─── Coaching Notes ───────────────────────────────────────────────────────────

export async function getCoachingNotes(designerId: string): Promise<CoachingNote[]> {
  const { data, error } = await supabase
    .from('coaching_notes')
    .select('*')
    .eq('designer_id', designerId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapCoachingNote);
}

export async function addCoachingNote(note: {
  designerId: string;
  authorId: string;
  content: string;
  category: CoachingCategory;
  relatedCycleDate?: string;
  beforeMetricValue?: number;
}): Promise<CoachingNote | null> {
  const { data, error } = await supabase
    .from('coaching_notes')
    .insert({
      designer_id: note.designerId,
      author_id: note.authorId,
      content: note.content,
      category: note.category,
      related_cycle_date: note.relatedCycleDate ?? null,
      before_metric_value: note.beforeMetricValue ?? null,
      is_private: true,
    })
    .select()
    .single();
  if (error || !data) { console.error('addCoachingNote error:', error); return null; }
  return mapCoachingNote(data);
}

export async function updateCoachingNoteAfterValue(id: string, afterValue: number): Promise<void> {
  await supabase.from('coaching_notes').update({ after_metric_value: afterValue }).eq('id', id);
}

// ─── Reflections ──────────────────────────────────────────────────────────────

export async function getReflectionEntries(designerId: string): Promise<ReflectionEntry[]> {
  const { data, error } = await supabase
    .from('reflection_entries')
    .select('*')
    .eq('designer_id', designerId)
    .order('submitted_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapReflectionEntry);
}

export async function addReflectionEntry(entry: {
  designerId: string;
  cycleStartDate: string;
  cycleEndDate: string;
  focusResponse?: string;
  blockersResponse?: string;
  nextStepsResponse?: string;
}): Promise<ReflectionEntry | null> {
  const { data, error } = await supabase
    .from('reflection_entries')
    .insert({
      designer_id: entry.designerId,
      cycle_start_date: entry.cycleStartDate,
      cycle_end_date: entry.cycleEndDate,
      focus_response: entry.focusResponse ?? null,
      blockers_response: entry.blockersResponse ?? null,
      next_steps_response: entry.nextStepsResponse ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapReflectionEntry(data);
}

// ─── Value Multipliers ────────────────────────────────────────────────────────

export async function getValueMultipliers(designerId: string): Promise<ValueMultiplier[]> {
  const { data, error } = await supabase
    .from('value_multipliers')
    .select('*')
    .eq('designer_id', designerId)
    .order('date_added', { ascending: false });
  if (error || !data) return [];
  return data.map(mapValueMultiplier);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviewRecords(designerId: string): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from('review_records')
    .select('*')
    .eq('designer_id', designerId)
    .order('period_end', { ascending: false });
  if (error || !data) return [];
  return data.map(mapReviewRecord);
}

export async function getAllReviewRecords(): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from('review_records')
    .select('*')
    .order('period_end', { ascending: false });
  if (error || !data) return [];
  return data.map(mapReviewRecord);
}

// ─── Performance Goals ────────────────────────────────────────────────────────

export async function getPerformanceGoals(designerId: string): Promise<PerformanceGoal[]> {
  const { data, error } = await supabase
    .from('performance_goals')
    .select('*')
    .eq('designer_id', designerId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapPerformanceGoal);
}

// ─── Compensation ──────────────────────────────────────────────────────────────

export async function getCompensationHistory(designerId: string): Promise<CompensationHistory[]> {
  const { data, error } = await supabase
    .from('compensation_history')
    .select('*')
    .eq('designer_id', designerId)
    .order('effective_date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapCompensationHistory);
}

export async function addCompensationRecord(record: {
  designerId: string;
  salary: number;
  effectiveDate: string;
  notes?: string;
}): Promise<CompensationHistory | null> {
  const { data, error } = await supabase
    .from('compensation_history')
    .insert({
      designer_id: record.designerId,
      salary: record.salary,
      effective_date: record.effectiveDate,
      notes: record.notes ?? null,
    })
    .select()
    .single();
  if (error || !data) { console.error('addCompensationRecord error:', error); return null; }
  return mapCompensationHistory(data);
}

// ─── Bonuses ──────────────────────────────────────────────────────────────────

export async function getBonusRecords(designerId?: string): Promise<BonusRecord[]> {
  let query = supabase.from('bonus_records').select('*').order('payout_date', { ascending: true });
  if (designerId) query = query.eq('designer_id', designerId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapBonusRecord);
}

// ─── PIPs ──────────────────────────────────────────────────────────────────────

export async function getPipRecords(designerId?: string): Promise<PipRecord[]> {
  let query = supabase.from('pip_records').select('*').order('start_date', { ascending: false });
  if (designerId) query = query.eq('designer_id', designerId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapPipRecord);
}
