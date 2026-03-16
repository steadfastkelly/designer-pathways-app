import { addDays, isAfter, isBefore, differenceInDays, parseISO } from 'date-fns';
import type {
  Profile, MonthlyHoursSummary, ClickupDeadline, ReviewRecord,
  BonusRecord, PipRecord, ReflectionEntry,
  AttentionItem, ComingUpItem, TeamHealthResult, AttentionPriority,
} from '../types';
import { getDesignerScore, getBillableTarget } from './scoring';

const TODAY = new Date();

// ─── Team Health ──────────────────────────────────────────────────────────────

export function getTeamHealth(
  designers: Profile[],
  allMonthlyHours: MonthlyHoursSummary[],
  allDeadlines: ClickupDeadline[],
): TeamHealthResult {
  const activeDesigners = designers.filter(d => d.isActive && d.role === 'designer');
  const redDesigners: string[] = [];
  const amberDesigners: string[] = [];

  for (const designer of activeDesigners) {
    const target = getBillableTarget(designer.email, designer);
    if (target.exempt) continue;

    const hours = allMonthlyHours
      .filter(h => h.designerId === designer.id)
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

    if (hours.length === 0) continue;

    const deadlines = allDeadlines.filter(d => d.designerId === designer.id);
    const score = getDesignerScore(designer, hours, deadlines);

    if (score.consecutiveMonthsBelowTarget >= 2) {
      redDesigners.push(designer.name);
    } else if (score.consecutiveMonthsBelowTarget === 1) {
      amberDesigners.push(designer.name);
    }
  }

  if (redDesigners.length > 0) {
    return {
      status: 'red',
      message: `${redDesigners.join(', ')} ${redDesigners.length === 1 ? 'has' : 'have'} been below utilization target for 2+ months.`,
      affectedDesigners: redDesigners,
    };
  }
  if (amberDesigners.length > 0) {
    return {
      status: 'amber',
      message: `${amberDesigners.join(', ')} ${amberDesigners.length === 1 ? 'is' : 'are'} below utilization target this month.`,
      affectedDesigners: amberDesigners,
    };
  }
  return {
    status: 'green',
    message: 'All designers are meeting their utilization targets.',
    affectedDesigners: [],
  };
}

// ─── Attention Items ──────────────────────────────────────────────────────────

const PRIORITY_ORDER: AttentionPriority[] = [
  'utilization-red',
  'pip-checkin',
  'missed-deadline',
  'review-due',
  'bonus-due',
  'utilization-yellow',
  'blocker-pattern',
];

export function getAttentionItems(
  designers: Profile[],
  allMonthlyHours: MonthlyHoursSummary[],
  allDeadlines: ClickupDeadline[],
  allReviews: ReviewRecord[],
  allBonuses: BonusRecord[],
  allPips: PipRecord[],
  allReflections: ReflectionEntry[],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const seen = new Set<string>();

  const activeDesigners = designers.filter(d => d.isActive && d.role === 'designer');
  const in30Days = addDays(TODAY, 30);
  const in14Days = addDays(TODAY, 14);
  const in7Days = addDays(TODAY, 7);

  for (const designer of activeDesigners) {
    const designerHours = allMonthlyHours.filter(h => h.designerId === designer.id);
    const designerDeadlines = allDeadlines.filter(d => d.designerId === designer.id);
    const score = getDesignerScore(designer, designerHours, designerDeadlines);

    // utilization-red: 2+ consecutive months below target
    if (score.consecutiveMonthsBelowTarget >= 2 && !seen.has(`utilization-red-${designer.id}`)) {
      seen.add(`utilization-red-${designer.id}`);
      items.push({
        id: `utilization-red-${designer.id}`,
        priority: 'utilization-red',
        designerId: designer.id,
        designerName: designer.name,
        message: `${designer.name} has been below utilization target for ${score.consecutiveMonthsBelowTarget} consecutive months.`,
        actionLabel: 'View Profile',
        actionPath: `/team/${designer.id}`,
      });
    }

    // pip-checkin: active PIP with end within 7 days
    const activePip = allPips.find(p => p.designerId === designer.id && p.isActive);
    if (activePip?.endDate) {
      const endDate = parseISO(activePip.endDate);
      if (isBefore(endDate, in7Days) && isAfter(endDate, TODAY)) {
        items.push({
          id: `pip-checkin-${designer.id}`,
          priority: 'pip-checkin',
          designerId: designer.id,
          designerName: designer.name,
          message: `${designer.name}'s PIP ends in ${differenceInDays(endDate, TODAY)} days.`,
          actionLabel: 'View PIP',
          actionPath: `/team/${designer.id}`,
        });
      }
    }

    // missed-deadline: late deadline pending attribution
    const pendingAttribution = designerDeadlines.filter(d => d.wasLate && !d.attribution);
    if (pendingAttribution.length > 0) {
      items.push({
        id: `missed-deadline-${designer.id}`,
        priority: 'missed-deadline',
        designerId: designer.id,
        designerName: designer.name,
        message: `${designer.name} has ${pendingAttribution.length} late deadline${pendingAttribution.length > 1 ? 's' : ''} pending attribution.`,
        actionLabel: 'Attribute',
        actionPath: `/team/${designer.id}`,
      });
    }

    // utilization-yellow: 1 month below target
    if (score.consecutiveMonthsBelowTarget === 1 && !seen.has(`utilization-yellow-${designer.id}`)) {
      seen.add(`utilization-yellow-${designer.id}`);
      items.push({
        id: `utilization-yellow-${designer.id}`,
        priority: 'utilization-yellow',
        designerId: designer.id,
        designerName: designer.name,
        message: `${designer.name} is below utilization target this month.`,
        actionLabel: 'View Profile',
        actionPath: `/team/${designer.id}`,
      });
    }

    // blocker-pattern: blockers in 2+ consecutive reflections
    const designerReflections = allReflections
      .filter(r => r.designerId === designer.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 3);
    const consecutiveBlockers = designerReflections.filter(r => r.blockersResponse && r.blockersResponse.trim().length > 0);
    if (consecutiveBlockers.length >= 2) {
      items.push({
        id: `blocker-pattern-${designer.id}`,
        priority: 'blocker-pattern',
        designerId: designer.id,
        designerName: designer.name,
        message: `${designer.name} has reported blockers in ${consecutiveBlockers.length} consecutive reflections.`,
        actionLabel: 'View Reflections',
        actionPath: `/team/${designer.id}`,
      });
    }
  }

  // review-due: period_end within 14 days, not complete
  for (const review of allReviews) {
    if (review.completedAt) continue;
    const periodEnd = parseISO(review.periodEnd);
    if (isBefore(periodEnd, in14Days) && isAfter(periodEnd, TODAY)) {
      const designer = designers.find(d => d.id === review.designerId);
      if (designer) {
        items.push({
          id: `review-due-${review.id}`,
          priority: 'review-due',
          designerId: designer.id,
          designerName: designer.name,
          message: `${designer.name}'s review period ends in ${differenceInDays(periodEnd, TODAY)} days.`,
          actionLabel: 'View Review',
          actionPath: `/team/${designer.id}`,
        });
      }
    }
  }

  // bonus-due: unpaid bonus within 30 days
  for (const bonus of allBonuses) {
    if (bonus.isPaid || !bonus.payoutDate) continue;
    const payoutDate = parseISO(bonus.payoutDate);
    if (isBefore(payoutDate, in30Days) && isAfter(payoutDate, TODAY)) {
      const designer = designers.find(d => d.id === bonus.designerId);
      if (designer) {
        items.push({
          id: `bonus-due-${bonus.id}`,
          priority: 'bonus-due',
          designerId: designer.id,
          designerName: designer.name,
          message: `${designer.name} has an unpaid $${bonus.amount.toLocaleString()} ${bonus.bonusType} bonus due in ${differenceInDays(payoutDate, TODAY)} days.`,
          actionLabel: 'View Compensation',
          actionPath: `/team/${designer.id}`,
        });
      }
    }
  }

  // Sort by priority order, deduplicate by designer (max 1 item per designer for utilization)
  items.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
  return items.slice(0, 3);
}

// ─── Coming Up ────────────────────────────────────────────────────────────────

export function getComingUp(
  designers: Profile[],
  allReviews: ReviewRecord[],
  allBonuses: BonusRecord[],
  allPips: PipRecord[],
): ComingUpItem[] {
  const items: ComingUpItem[] = [];
  const in30Days = addDays(TODAY, 30);

  for (const review of allReviews) {
    if (review.completedAt) continue;
    const periodEnd = parseISO(review.periodEnd);
    if (isAfter(periodEnd, TODAY) && isBefore(periodEnd, in30Days)) {
      const designer = designers.find(d => d.id === review.designerId);
      items.push({
        id: `review-${review.id}`,
        type: 'review',
        designerId: review.designerId,
        designerName: designer?.name,
        date: review.periodEnd,
        label: 'Review Due',
        description: `${designer?.name ?? 'Designer'}'s ${review.reviewType.replace('_', '-')} review period ends`,
      });
    }
  }

  for (const bonus of allBonuses) {
    if (bonus.isPaid || !bonus.payoutDate) continue;
    const payoutDate = parseISO(bonus.payoutDate);
    if (isAfter(payoutDate, TODAY) && isBefore(payoutDate, in30Days)) {
      const designer = designers.find(d => d.id === bonus.designerId);
      items.push({
        id: `bonus-${bonus.id}`,
        type: 'bonus',
        designerId: bonus.designerId,
        designerName: designer?.name,
        date: bonus.payoutDate,
        label: 'Bonus Payout',
        description: `${designer?.name ?? 'Designer'} — $${bonus.amount.toLocaleString()} ${bonus.bonusType} bonus`,
      });
    }
  }

  for (const pip of allPips) {
    if (!pip.isActive || !pip.endDate) continue;
    const endDate = parseISO(pip.endDate);
    if (isAfter(endDate, TODAY) && isBefore(endDate, in30Days)) {
      const designer = designers.find(d => d.id === pip.designerId);
      items.push({
        id: `pip-${pip.id}`,
        type: 'pip',
        designerId: pip.designerId,
        designerName: designer?.name,
        date: pip.endDate,
        label: 'PIP End Date',
        description: `${designer?.name ?? 'Designer'}'s performance improvement period ends`,
      });
    }
  }

  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
}
