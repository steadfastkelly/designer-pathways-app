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
    .maybeSingle();
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
    avatar_url: string | null;
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

// ─── App Settings ──────────────────────────────────────────────────────────────
// Requires table: app_settings (key text PRIMARY KEY, value text, updated_at timestamptz)

export async function getAppSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value;
}

// ─── API Credentials ───────────────────────────────────────────────────────────
// Stores Timely + ClickUp credentials in api_credentials table (admin-only, RLS).

export async function getApiCredentials(service: string): Promise<Record<string, string> | null> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('credentials, is_configured')
    .eq('service', service)
    .maybeSingle();
  if (error || !data || !data.is_configured) return null;
  return data.credentials as Record<string, string>;
}

export async function upsertApiCredentials(
  service: string,
  updates: Record<string, string>,
): Promise<boolean> {
  // Read existing credentials first so we merge rather than overwrite
  const { data: existing } = await supabase
    .from('api_credentials')
    .select('credentials')
    .eq('service', service)
    .maybeSingle();

  const merged = { ...(existing?.credentials as Record<string, string> ?? {}), ...updates };

  const { error } = await supabase
    .from('api_credentials')
    .upsert(
      { service, credentials: merged, is_configured: true, updated_at: new Date().toISOString() },
      { onConflict: 'service' },
    );
  if (error) console.error('upsertApiCredentials error:', error);
  return !error;
}

export async function getAppSettings(keys: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', keys);
  if (error || !data) return {};
  return Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
}

export async function setAppSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return !error;
}

export async function deleteAppSetting(key: string): Promise<void> {
  await supabase.from('app_settings').delete().eq('key', key);
}

// ─── Avatar Upload ─────────────────────────────────────────────────────────────
// Requires Supabase Storage bucket: 'avatars' (public)

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error('uploadAvatar error:', error); return null; }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl ?? null;
}

// ─── Timely Sync ───────────────────────────────────────────────────────────────

export interface TimelySyncResult {
  synced: number;
  errors: string[];
  warnings: string[];
  attempted_at: string | null;
  success: boolean;
  error_count: number;
  warning_count: number;
}

export interface SyncResult {
  synced: number;
  errors: string[];
}

// Delegates to the server-side /api/scheduled-sync route, which uses the
// Supabase service role key (bypasses RLS) and keeps API keys server-side.
// The token/accountId params are accepted for call-site compatibility but
// are not used — the server reads credentials from the api_credentials table.
export async function syncTimelyData(
  token: string,
  accountId: string,
): Promise<TimelySyncResult> {
  void token;
  void accountId;
  const attemptedAt = new Date().toISOString();
  try {
    const res = await fetch('/api/scheduled-sync', { method: 'POST' });
    const text = await res.text();
    if (!text.trim()) {
      return {
        synced: 0,
        errors: [`Empty response from /api/scheduled-sync (HTTP ${res.status}). Check SUPABASE_SERVICE_ROLE_KEY is set in Vercel for all environments.`],
        warnings: [],
        attempted_at: attemptedAt,
        success: false,
        error_count: 1,
        warning_count: 0,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    try { json = JSON.parse(text); } catch {
      return {
        synced: 0,
        errors: [`Non-JSON from /api/scheduled-sync: ${text.slice(0, 200)}`],
        warnings: [],
        attempted_at: attemptedAt,
        success: false,
        error_count: 1,
        warning_count: 0,
      };
    }
    if (!res.ok) {
      return {
        synced: 0,
        errors: [json?.error ?? `Sync server error: ${res.status}`],
        warnings: [],
        attempted_at: attemptedAt,
        success: false,
        error_count: 1,
        warning_count: 0,
      };
    }
    const t = json.timely;
    const mergedErrors = [...(t?.errors ?? []), ...(json.errors ?? [])];
    const warnings = [...(t?.warnings ?? [])];
    const status = json.timely_status ?? t?.status ?? {};
    const synced = t?.synced ?? status.synced ?? 0;
    const errorCount = status.error_count ?? mergedErrors.length;
    const warningCount = status.warning_count ?? warnings.length;
    return {
      synced,
      errors: mergedErrors,
      warnings,
      attempted_at: status.attempted_at ?? attemptedAt,
      success: typeof status.success === 'boolean' ? status.success : errorCount === 0,
      error_count: errorCount,
      warning_count: warningCount,
    };
  } catch (e) {
    return {
      synced: 0,
      errors: [`Sync failed: ${e instanceof Error ? e.message : String(e)}`],
      warnings: [],
      attempted_at: attemptedAt,
      success: false,
      error_count: 1,
      warning_count: 0,
    };
  }
}

// ─── ClickUp Sync ──────────────────────────────────────────────────────────────

// Same delegation pattern as syncTimelyData — all sync logic runs server-side.
export async function syncClickUpData(
  apiKey: string,
  teamId: string,
): Promise<SyncResult> {
  void apiKey;
  void teamId;
  try {
    const res = await fetch('/api/scheduled-sync', { method: 'POST' });
    const text = await res.text();
    if (!text.trim()) {
      return { synced: 0, errors: [`Empty response from /api/scheduled-sync (HTTP ${res.status}). Check SUPABASE_SERVICE_ROLE_KEY is set in Vercel for all environments.`] };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any;
    try { json = JSON.parse(text); } catch {
      return { synced: 0, errors: [`Non-JSON from /api/scheduled-sync: ${text.slice(0, 200)}`] };
    }
    if (!res.ok) return { synced: 0, errors: [json?.error ?? `Sync server error: ${res.status}`] };
    const c = json.clickup;
    return { synced: c?.synced ?? 0, errors: [...(c?.errors ?? []), ...(json.errors ?? [])] };
  } catch (e) {
    return { synced: 0, errors: [`Sync failed: ${e instanceof Error ? e.message : String(e)}`] };
  }
}
