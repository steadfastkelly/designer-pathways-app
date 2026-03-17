import type { Profile, MonthlyHoursSummary, ClickupDeadline, DesignerScore, BillableTarget, OverallStatus } from '../types';

// ─── Billable Targets ─────────────────────────────────────────────────────────

const BILLABLE_TARGETS: Record<string, BillableTarget> = {
  'kelly@steadfast.design': { min: 30, max: 37, exempt: true },
  'joy@steadfast.design': { min: 30, max: 37, exempt: true },
  'kayla@steadfast.design': { min: 60, max: 68, exempt: false },
  'jen@steadfast.design': { min: 68, max: 72, exempt: false },
  default: { min: 68, max: 72, exempt: false },
};

export function getBillableTarget(email: string, profile?: Profile): BillableTarget {
  // Per-designer overrides from DB take priority
  if (profile?.billableTargetMin != null && profile?.billableTargetMax != null) {
    return {
      min: profile.billableTargetMin,
      max: profile.billableTargetMax,
      exempt: profile.billableTargetExempt ?? false,
    };
  }
  const normalized = email.toLowerCase().trim();
  return BILLABLE_TARGETS[normalized] ?? BILLABLE_TARGETS.default;
}

// ─── Track Weights ────────────────────────────────────────────────────────────

const TRACK_WEIGHTS = {
  builder: { hours: 0.45, deadlines: 0.20, communication: 0.20, conduct: 0.15 },
  teacher: { hours: 0.35, deadlines: 0.20, communication: 0.25, conduct: 0.20 },
  leader:  { hours: 0.25, deadlines: 0.15, communication: 0.30, conduct: 0.30 },
} as const;

// ─── Individual Scores ────────────────────────────────────────────────────────
// Green=4, Yellow=3, Red=1
// Red flags ONLY for Below Average — average and above is ALWAYS green

export function computeHoursScore(
  billablePercent: number,
  email: string,
  consecutiveMonthsBelow: number,
  profile?: Profile,
): number {
  const target = getBillableTarget(email, profile);
  if (target.exempt) return 4;
  if (billablePercent >= target.min) return 4;
  // Only flag after 2+ consecutive months below target
  if (consecutiveMonthsBelow < 2) return 3;
  return 1;
}

export function computeDeadlineScore(onTimeRate: number): number {
  if (onTimeRate >= 0.90) return 4;
  if (onTimeRate >= 0.75) return 3;
  return 1;
}

export function computeOverallScore(
  scores: { hours: number; deadlines: number; communication: number; conduct: number },
  track: string,
): number {
  const weights = TRACK_WEIGHTS[track as keyof typeof TRACK_WEIGHTS] ?? TRACK_WEIGHTS.builder;
  return (
    scores.hours * weights.hours +
    scores.deadlines * weights.deadlines +
    scores.communication * weights.communication +
    scores.conduct * weights.conduct
  );
}

export function getOverallStatus(score: number, conductScore: number): OverallStatus {
  if (conductScore === 1) return 'action_needed';
  if (score >= 3.25) return 'on_track';
  if (score >= 2.50) return 'watch';
  return 'action_needed';
}

// ─── Full Designer Score ──────────────────────────────────────────────────────

export function getDesignerScore(
  designer: Profile,
  monthlyHours: MonthlyHoursSummary[],
  deadlines: ClickupDeadline[],
): DesignerScore {
  const designerHours = (monthlyHours ?? [])
    .filter(h => h.designerId === designer.id)
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

  const currentBillable = designerHours[0]?.billablePercent ?? 0;
  const target = getBillableTarget(designer.email, designer);

  // Count consecutive months below target
  let consecutiveMonthsBelowTarget = 0;
  for (const month of designerHours) {
    if (month.billablePercent < target.min) {
      consecutiveMonthsBelowTarget++;
    } else {
      break;
    }
  }

  // Deadlines: only designer-attributed late deadlines count against score
  const designerDeadlines = (deadlines ?? []).filter(d => d.designerId === designer.id);
  const attributedDeadlines = designerDeadlines.filter(d => d.attribution != null);
  const designerFaultLate = attributedDeadlines.filter(d => d.wasLate && d.attribution === 'designer').length;
  const totalAttributed = attributedDeadlines.length;
  const onTimeRate = totalAttributed > 0
    ? (totalAttributed - designerFaultLate) / totalAttributed
    : 1;

  const hoursScore = computeHoursScore(currentBillable, designer.email, consecutiveMonthsBelowTarget, designer);
  const deadlineScore = computeDeadlineScore(onTimeRate);
  const communicationScore = 4; // Default green; overridden by coaching data in future
  const conductScore = 4;

  const overallScore = computeOverallScore(
    { hours: hoursScore, deadlines: deadlineScore, communication: communicationScore, conduct: conductScore },
    designer.pathwayTrack ?? 'builder',
  );

  return {
    designerId: designer.id,
    hoursScore,
    deadlineScore,
    communicationScore,
    conductScore,
    overallScore,
    status: getOverallStatus(overallScore, conductScore),
    consecutiveMonthsBelowTarget,
  };
}
