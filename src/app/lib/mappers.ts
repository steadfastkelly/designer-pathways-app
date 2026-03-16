import type {
  Profile, MonthlyHoursSummary, ClickupDeadline, CoachingNote,
  ReflectionEntry, ValueMultiplier, ReviewRecord, PerformanceGoal,
  CompensationHistory, BonusRecord, PipRecord, PipGoal,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    externalTitle: row.external_title ?? undefined,
    pathwayLevel: row.pathway_level ?? undefined,
    pathwayTrack: row.pathway_track ?? undefined,
    hireDate: row.hire_date ?? undefined,
    region: row.region ?? undefined,
    scheduledHoursPerWeek: row.scheduled_hours_per_week ?? 36,
    scheduleType: row.schedule_type ?? 'standard',
    isActive: row.is_active ?? true,
    avatarUrl: row.avatar_url ?? undefined,
    personalityMbti: row.personality_mbti ?? undefined,
    personalityEnneagram: row.personality_enneagram ?? undefined,
    personalityNotes: row.personality_notes ?? undefined,
    locationCity: row.location_city ?? undefined,
    locationState: row.location_state ?? undefined,
    phone: row.phone ?? undefined,
    birthday: row.birthday ?? undefined,
    bio: row.bio ?? undefined,
    specialCircumstancesNotes: row.special_circumstances_notes ?? undefined,
    billableTargetMin: row.billable_target_min ?? undefined,
    billableTargetMax: row.billable_target_max ?? undefined,
    billableTargetExempt: row.billable_target_exempt ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMonthlyHours(row: any): MonthlyHoursSummary {
  return {
    id: row.id,
    designerId: row.designer_id,
    year: row.year,
    month: row.month,
    totalHours: Number(row.total_hours ?? 0),
    billableHours: Number(row.billable_hours ?? 0),
    internalHours: Number(row.internal_hours ?? 0),
    billablePercent: Number(row.billable_percent ?? 0),
    internalBreakdown: row.internal_breakdown ?? {},
    loggingDays: row.logging_days ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickupDeadline(row: any): ClickupDeadline {
  return {
    id: row.id,
    designerId: row.designer_id,
    taskName: row.task_name,
    dueDate: row.due_date ?? undefined,
    completedDate: row.completed_date ?? undefined,
    wasLate: row.was_late ?? false,
    daysLate: row.days_late ?? 0,
    attribution: row.attribution ?? undefined,
    attributionSetBy: row.attribution_set_by ?? undefined,
    attributionSetAt: row.attribution_set_at ?? undefined,
    attributionNotes: row.attribution_notes ?? undefined,
    approvedByKelly: row.approved_by_kelly ?? false,
    approvalNotes: row.approval_notes ?? undefined,
    clickupTaskId: row.clickup_task_id ?? undefined,
    clickupUrl: row.clickup_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCoachingNote(row: any): CoachingNote {
  return {
    id: row.id,
    designerId: row.designer_id,
    authorId: row.author_id ?? undefined,
    content: row.content,
    category: row.category ?? 'general',
    relatedCycleDate: row.related_cycle_date ?? undefined,
    beforeMetricValue: row.before_metric_value != null ? Number(row.before_metric_value) : undefined,
    afterMetricValue: row.after_metric_value != null ? Number(row.after_metric_value) : undefined,
    isPrivate: row.is_private ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReflectionEntry(row: any): ReflectionEntry {
  return {
    id: row.id,
    designerId: row.designer_id,
    cycleStartDate: row.cycle_start_date,
    cycleEndDate: row.cycle_end_date,
    focusResponse: row.focus_response ?? undefined,
    blockersResponse: row.blockers_response ?? undefined,
    nextStepsResponse: row.next_steps_response ?? undefined,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapValueMultiplier(row: any): ValueMultiplier {
  return {
    id: row.id,
    designerId: row.designer_id,
    category: row.category,
    name: row.name,
    contextNote: row.context_note ?? undefined,
    dateAdded: row.date_added,
    addedBy: row.added_by ?? undefined,
    status: row.status ?? 'active',
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReviewRecord(row: any): ReviewRecord {
  return {
    id: row.id,
    designerId: row.designer_id,
    reviewType: row.review_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    overallRating: row.overall_rating != null ? Number(row.overall_rating) : undefined,
    kellyNotes: row.kelly_notes ?? undefined,
    completedAt: row.completed_at ?? undefined,
    sharedWithDesignerAt: row.shared_with_designer_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPerformanceGoal(row: any): PerformanceGoal {
  return {
    id: row.id,
    designerId: row.designer_id,
    reviewId: row.review_id ?? undefined,
    description: row.description,
    category: row.category ?? undefined,
    targetDate: row.target_date ?? undefined,
    targetType: row.target_type ?? 'completion',
    status: row.status ?? 'not_started',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompensationHistory(row: any): CompensationHistory {
  return {
    id: row.id,
    designerId: row.designer_id,
    salary: Number(row.salary),
    effectiveDate: row.effective_date,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBonusRecord(row: any): BonusRecord {
  return {
    id: row.id,
    designerId: row.designer_id,
    amount: Number(row.amount),
    bonusType: row.bonus_type,
    payoutDate: row.payout_date ?? undefined,
    isPaid: row.is_paid ?? false,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPipRecord(row: any): PipRecord {
  return {
    id: row.id,
    designerId: row.designer_id,
    startDate: row.start_date,
    reason: row.reason ?? undefined,
    timelineDays: row.timeline_days ?? 90,
    endDate: row.end_date ?? undefined,
    outcome: row.outcome ?? undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPipGoal(row: any): PipGoal {
  return {
    id: row.id,
    pipId: row.pip_id,
    description: row.description,
    measurableTarget: row.measurable_target ?? undefined,
    status: row.status ?? 'not_started',
    createdAt: row.created_at,
  };
}
