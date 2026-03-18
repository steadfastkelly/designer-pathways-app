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
}

export async function syncTimelyData(
  token: string,
  accountId: string,
): Promise<TimelySyncResult> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Fetch all time entries via server-side proxy (avoids CORS)
    const url = `/api/timely-events?account_id=${encodeURIComponent(accountId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      errors.push(`Timely API error: ${res.status} ${err.error ?? res.statusText}`);
      return { synced, errors };
    }

    const events: TimelySyncResult[] = await res.json();
    if (!Array.isArray(events)) {
      errors.push('Unexpected Timely API response format');
      return { synced, errors };
    }

    // Group events by user + year + month
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped: Record<string, { userId: string; email: string; year: number; month: number; totalHours: number; billableHours: number; internalHours: number }> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of events as any[]) {
      const userId = event.user?.id;
      const email = event.user?.email?.toLowerCase();
      if (!userId || !email) continue;

      const date = new Date(event.day);
      if (isNaN(date.getTime())) continue;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${email}-${year}-${month}`;
      const hours = (event.duration?.hours ?? 0) + (event.duration?.minutes ?? 0) / 60;
      const billable = event.billed === true || event.billable === true;

      if (!grouped[key]) {
        grouped[key] = { userId, email, year, month, totalHours: 0, billableHours: 0, internalHours: 0 };
      }
      grouped[key].totalHours += hours;
      if (billable) grouped[key].billableHours += hours;
      else grouped[key].internalHours += hours;
    }

    // Get all designers to map email → id
    const designers = await getAllProfiles();
    const emailToId: Record<string, string> = {};
    for (const d of designers) {
      emailToId[d.email.toLowerCase()] = d.id;
    }

    // Upsert monthly summaries
    for (const entry of Object.values(grouped)) {
      const designerId = emailToId[entry.email];
      if (!designerId) continue;

      const billablePercent = entry.totalHours > 0
        ? Math.round((entry.billableHours / entry.totalHours) * 100)
        : 0;

      const { error } = await supabase
        .from('monthly_hours_summary')
        .upsert({
          designer_id: designerId,
          year: entry.year,
          month: entry.month,
          total_hours: Math.round(entry.totalHours * 100) / 100,
          billable_hours: Math.round(entry.billableHours * 100) / 100,
          internal_hours: Math.round(entry.internalHours * 100) / 100,
          billable_percent: billablePercent,
          logging_days: 0,
          internal_breakdown: {},
          updated_at: new Date().toISOString(),
        }, { onConflict: 'designer_id,year,month' });

      if (error) errors.push(`Upsert error for ${entry.email} ${entry.year}/${entry.month}: ${error.message}`);
      else synced++;
    }

    await setAppSetting('timely_last_sync', new Date().toISOString());
  } catch (e) {
    errors.push(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { synced, errors };
}

// ─── ClickUp Sync ──────────────────────────────────────────────────────────────

export async function syncClickUpData(
  apiKey: string,
  teamId: string,
): Promise<TimelySyncResult> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Fetch all tasks from the team — paginate through
    let page = 0;
    let hasMore = true;
    const allTasks: unknown[] = [];

    while (hasMore) {
      const res = await fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?page=${page}&include_closed=true&subtasks=true&per_page=100`,
        { headers: { Authorization: apiKey } },
      );

      if (!res.ok) {
        errors.push(`ClickUp API error: ${res.status} ${res.statusText}`);
        break;
      }

      const json = await res.json();
      const tasks = json.tasks ?? [];
      allTasks.push(...tasks);
      hasMore = tasks.length === 100;
      page++;
    }

    // Get designers to map email → id
    const designers = await getAllProfiles();
    const emailToId: Record<string, string> = {};
    for (const d of designers) emailToId[d.email.toLowerCase()] = d.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const task of allTasks as any[]) {
      const dueDate = task.due_date ? new Date(Number(task.due_date)) : null;
      const completedDate = task.date_closed ? new Date(Number(task.date_closed)) : null;

      if (!dueDate) continue;

      const wasLate = !!(completedDate && completedDate > dueDate);
      const daysLate = wasLate
        ? Math.ceil((completedDate!.getTime() - dueDate.getTime()) / 86400000)
        : 0;

      for (const assignee of (task.assignees ?? [])) {
        const email = assignee.email?.toLowerCase();
        const designerId = email ? emailToId[email] : null;
        if (!designerId) continue;

        const { error } = await supabase
          .from('clickup_deadlines')
          .upsert({
            clickup_task_id: task.id,
            designer_id: designerId,
            task_name: task.name ?? 'Untitled',
            due_date: dueDate.toISOString().slice(0, 10),
            completed_date: completedDate ? completedDate.toISOString().slice(0, 10) : null,
            was_late: wasLate,
            days_late: daysLate,
            clickup_url: task.url ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'clickup_task_id,designer_id' });

        if (error) errors.push(`ClickUp upsert error ${task.id}: ${error.message}`);
        else synced++;
      }
    }

    await setAppSetting('clickup_last_sync', new Date().toISOString());
  } catch (e) {
    errors.push(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { synced, errors };
}
