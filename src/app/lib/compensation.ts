import type { CompensationHistory, ROIMetrics } from '../types';

const OVERHEAD_RATES: Record<string, number> = {
  Southeast: 0.18,
  Midwest: 0.19,
  Northeast: 0.18,
  West: 0.18,
  'Remote-International': 0.18,
};

const BILLABLE_RATE_CUTOFF = new Date('2026-01-01');

export function getBillableRate(asOf = new Date()): number {
  return asOf >= BILLABLE_RATE_CUTOFF ? 180 : 150;
}

export function getOverheadRate(region?: string): number {
  if (!region) return 0.18;
  return OVERHEAD_RATES[region] ?? 0.18;
}

export function getCurrentSalary(history: CompensationHistory[]): CompensationHistory | null {
  if (history.length === 0) return null;
  return [...history].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
}

export function getEffectiveHourlyRate(salary: number, scheduledHoursPerWeek: number): number {
  return salary / (scheduledHoursPerWeek * 52);
}

export function getFTEEquivalent(salary: number, scheduledHoursPerWeek: number): number {
  return salary * (36 / scheduledHoursPerWeek);
}

export function getProratedSalary(salary: number, scheduledHoursPerWeek: number): number {
  const fullTimeHours = 36;
  return salary * (scheduledHoursPerWeek / fullTimeHours);
}

export function getTrueCostAnnual(salary: number, scheduledHoursPerWeek: number, region?: string): number {
  const prorated = getProratedSalary(salary, scheduledHoursPerWeek);
  const overhead = getOverheadRate(region);
  return prorated * (1 + overhead);
}

export function computeROIMetrics(
  compensationHistory: CompensationHistory[],
  scheduledHoursPerWeek: number,
  region: string | undefined,
  monthlyBillableHours: number,
): ROIMetrics {
  const current = getCurrentSalary(compensationHistory);
  const salary = current?.salary ?? 0;
  const rate = getBillableRate();

  const trueCostAnnual = getTrueCostAnnual(salary, scheduledHoursPerWeek, region);
  const trueCostMonthly = trueCostAnnual / 12;

  return {
    currentSalary: salary,
    effectiveHourlyRate: getEffectiveHourlyRate(salary, scheduledHoursPerWeek),
    fteEquivalent: getFTEEquivalent(salary, scheduledHoursPerWeek),
    trueCostAnnual,
    trueCostMonthly,
    breakEven150: trueCostAnnual / 150,
    breakEven180: trueCostAnnual / 180,
    monthlyROI: monthlyBillableHours > 0 ? (monthlyBillableHours * rate) / trueCostMonthly : 0,
    monthlyMargin: (monthlyBillableHours * rate) - trueCostMonthly,
  };
}
