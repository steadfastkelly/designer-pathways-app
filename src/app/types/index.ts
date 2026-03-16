// ─── Primitive Types ─────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'supervisor' | 'designer';

export type PathwayLevel =
  | 'core_designer'
  | 'mindful_designer'
  | 'strategic_designer'
  | 'design_lead'
  | 'senior_design_lead'
  | 'associate_creative_director'
  | 'creative_director';

export type PathwayTrack = 'builder' | 'teacher' | 'leader';

export type ScheduleType = 'standard' | 'pump_act' | 'part_time' | 'reduced';

export type ReviewType = '45_day' | '90_day' | 'biannual' | 'annual';

export type GoalStatus = 'not_started' | 'in_progress' | 'met' | 'partially_met' | 'not_met';

export type GoalTargetType = 'completion' | 'metric' | 'behavior' | 'milestone';

export type ValueMultiplierCategory = 'craft' | 'collaboration' | 'leadership' | 'technical' | 'culture';

export type ValueMultiplierStatus = 'active' | 'inactive';

export type BonusType = 'performance' | 'signing' | 'milestone';

export type CoachingCategory =
  | 'billable_hours'
  | 'logging_accuracy'
  | 'deadlines'
  | 'communication'
  | 'conduct'
  | 'pathway_progression'
  | 'workload'
  | 'general';

export type DeadlineAttribution = 'designer' | 'client' | 'out_of_control';

export type OverallStatus = 'on_track' | 'watch' | 'action_needed';

// ─── DB Table Interfaces ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  externalTitle?: string;
  pathwayLevel?: PathwayLevel;
  pathwayTrack?: PathwayTrack;
  hireDate?: string;
  region?: string;
  scheduledHoursPerWeek: number;
  scheduleType: ScheduleType;
  isActive: boolean;
  avatarUrl?: string;
  personalityMbti?: string;
  personalityEnneagram?: string;
  personalityNotes?: string;
  locationCity?: string;
  locationState?: string;
  phone?: string;
  birthday?: string;
  bio?: string;
  specialCircumstancesNotes?: string;
  billableTargetMin?: number;
  billableTargetMax?: number;
  billableTargetExempt?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyHoursSummary {
  id: string;
  designerId: string;
  year: number;
  month: number;
  totalHours: number;
  billableHours: number;
  internalHours: number;
  billablePercent: number;
  internalBreakdown: Record<string, number>;
  loggingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClickupDeadline {
  id: string;
  designerId: string;
  taskName: string;
  dueDate?: string;
  completedDate?: string;
  wasLate: boolean;
  daysLate: number;
  attribution?: DeadlineAttribution;
  attributionSetBy?: string;
  attributionSetAt?: string;
  attributionNotes?: string;
  approvedByKelly: boolean;
  approvalNotes?: string;
  clickupTaskId?: string;
  clickupUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingNote {
  id: string;
  designerId: string;
  authorId?: string;
  content: string;
  category: CoachingCategory;
  relatedCycleDate?: string;
  beforeMetricValue?: number;
  afterMetricValue?: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionEntry {
  id: string;
  designerId: string;
  cycleStartDate: string;
  cycleEndDate: string;
  focusResponse?: string;
  blockersResponse?: string;
  nextStepsResponse?: string;
  submittedAt: string;
  createdAt: string;
}

export interface ValueMultiplier {
  id: string;
  designerId: string;
  category: ValueMultiplierCategory;
  name: string;
  contextNote?: string;
  dateAdded: string;
  addedBy?: string;
  status: ValueMultiplierStatus;
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  designerId: string;
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
  overallRating?: number;
  kellyNotes?: string;
  completedAt?: string;
  sharedWithDesignerAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceGoal {
  id: string;
  designerId: string;
  reviewId?: string;
  description: string;
  category?: string;
  targetDate?: string;
  targetType: GoalTargetType;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompensationHistory {
  id: string;
  designerId: string;
  salary: number;
  effectiveDate: string;
  notes?: string;
  createdAt: string;
}

export interface BonusRecord {
  id: string;
  designerId: string;
  amount: number;
  bonusType: BonusType;
  payoutDate?: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export interface PipRecord {
  id: string;
  designerId: string;
  startDate: string;
  reason?: string;
  timelineDays: number;
  endDate?: string;
  outcome?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipGoal {
  id: string;
  pipId: string;
  description: string;
  measurableTarget?: string;
  status: string;
  createdAt: string;
}

// ─── Computed / UI Types ─────────────────────────────────────────────────────

export interface BillableTarget {
  min: number;
  max: number;
  exempt: boolean;
}

export interface DesignerScore {
  designerId: string;
  hoursScore: number;
  deadlineScore: number;
  communicationScore: number;
  conductScore: number;
  overallScore: number;
  status: OverallStatus;
  consecutiveMonthsBelowTarget: number;
}

export type AttentionPriority =
  | 'utilization-red'
  | 'pip-checkin'
  | 'missed-deadline'
  | 'review-due'
  | 'bonus-due'
  | 'utilization-yellow'
  | 'blocker-pattern';

export interface AttentionItem {
  id: string;
  priority: AttentionPriority;
  designerId: string;
  designerName: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
  metadata?: Record<string, unknown>;
}

export interface ComingUpItem {
  id: string;
  type: 'review' | 'bonus' | 'pip' | 'cycle';
  designerId?: string;
  designerName?: string;
  date: string;
  label: string;
  description: string;
}

export interface TeamHealthResult {
  status: 'green' | 'amber' | 'red';
  message: string;
  affectedDesigners: string[];
}

export interface ROIMetrics {
  currentSalary: number;
  effectiveHourlyRate: number;
  fteEquivalent: number;
  trueCostAnnual: number;
  trueCostMonthly: number;
  breakEven150: number;
  breakEven180: number;
  monthlyROI: number;
  monthlyMargin: number;
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const PATHWAY_LEVEL_LABELS: Record<PathwayLevel, string> = {
  core_designer: 'Core Designer',
  mindful_designer: 'Mindful Designer',
  strategic_designer: 'Strategic Designer',
  design_lead: 'Design Lead',
  senior_design_lead: 'Senior Design Lead',
  associate_creative_director: 'Associate Creative Director',
  creative_director: 'Creative Director',
};

export const PATHWAY_LEVEL_ORDER: PathwayLevel[] = [
  'core_designer',
  'mindful_designer',
  'strategic_designer',
  'design_lead',
  'senior_design_lead',
  'associate_creative_director',
  'creative_director',
];

export const PATHWAY_TRACK_LABELS: Record<PathwayTrack, string> = {
  builder: 'Builder',
  teacher: 'Teacher',
  leader: 'Leader',
};

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  standard: 'Standard',
  pump_act: 'PUMP Act',
  part_time: 'Part Time',
  reduced: 'Reduced',
};

export const COACHING_CATEGORY_LABELS: Record<CoachingCategory, string> = {
  billable_hours: 'Billable Hours',
  logging_accuracy: 'Logging Accuracy',
  deadlines: 'Deadlines',
  communication: 'Communication',
  conduct: 'Conduct',
  pathway_progression: 'Pathway Progression',
  workload: 'Workload',
  general: 'General',
};

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  '45_day': '45-Day Review',
  '90_day': '90-Day Review',
  biannual: 'Biannual Review',
  annual: 'Annual Review',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  met: 'Met',
  partially_met: 'Partially Met',
  not_met: 'Not Met',
};
