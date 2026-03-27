import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ShieldAlert, Plus } from 'lucide-react';
import type { CompensationHistory, BonusRecord, MonthlyHoursSummary, Profile } from '../../types';
import { computeROIMetrics } from '../../lib/compensation';
import { addCompensationRecord } from '../../lib/api';

interface Props {
  profile: Profile;
  compensationHistory: CompensationHistory[];
  bonuses: BonusRecord[];
  monthlyHours: MonthlyHoursSummary[];
  onHistoryUpdated: (record: CompensationHistory) => void;
}

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtHr(n: number) { return `$${n.toFixed(2)}/hr`; }

function MetricRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{note}</div>}
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

export function CompensationTab({ profile, compensationHistory, bonuses, monthlyHours, onHistoryUpdated }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const monthlyBillableHours = monthlyHours[0]?.billableHours ?? 0;
  const metrics = computeROIMetrics(compensationHistory, profile.scheduledHoursPerWeek, profile.region, monthlyBillableHours);

  const handleAddRecord = async () => {
    if (!newSalary || !newDate) return;
    setSaving(true);
    const record = await addCompensationRecord({
      designerId: profile.id,
      salary: parseFloat(newSalary.replace(/,/g, '')),
      effectiveDate: newDate,
      notes: newNotes || undefined,
    });
    setSaving(false);
    if (record) {
      onHistoryUpdated(record);
      setShowAddRecord(false);
      setNewSalary(''); setNewDate(''); setNewNotes('');
    }
  };

  if (!confirmed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="card" style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldAlert size={24} color="var(--accent-amber)" />
          </div>
          <h3 style={{ fontSize: 17, marginBottom: 10 }}>Confidential Data</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            You are viewing confidential compensation data. This information is strictly internal and should not be shared outside of leadership.
          </p>
          <button
            onClick={() => setConfirmed(true)}
            style={{ padding: '10px 22px', background: 'var(--accent-amber)', color: '#0F1117', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            I Understand — View Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Key Metrics */}
      <div className="card">
        <div style={{ fontSize: 11, color: 'var(--accent-amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={13} /> Confidential
        </div>
        <MetricRow label="Current Salary" value={fmt(metrics.currentSalary)} />
        <MetricRow label="Effective Hourly Rate" value={fmtHr(metrics.effectiveHourlyRate)} note={`Based on ${profile.scheduledHoursPerWeek}hrs/week`} />
        <MetricRow label="FTE Equivalent (36hr)" value={fmt(metrics.fteEquivalent)} note="Normalized to full-time" />
        <MetricRow label="True Cost (Annual)" value={fmt(metrics.trueCostAnnual)} note={`Includes ${((1 / (1 + (metrics.trueCostAnnual / metrics.fteEquivalent - 1))) * 100).toFixed(0)}% overhead`} />
        <MetricRow label="True Cost (Monthly)" value={fmt(metrics.trueCostMonthly)} />
      </div>

      {/* ROI */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>ROI Analysis</div>
        <MetricRow label="Break-even @ $150/hr" value={`${metrics.breakEven150.toFixed(0)} billable hrs/yr`} />
        <MetricRow label="Break-even @ $180/hr" value={`${metrics.breakEven180.toFixed(0)} billable hrs/yr`} />
        <MetricRow label="Monthly ROI" value={`${(metrics.monthlyROI * 100).toFixed(0)}%`} note="(billable rev / true monthly cost)" />
        <MetricRow label="Monthly Margin" value={fmt(metrics.monthlyMargin)} note="(billable rev − true monthly cost)" />
      </div>

      {/* Bonuses */}
      {bonuses.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Bonuses</div>
          {bonuses.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.bonusType.charAt(0).toUpperCase() + b.bonusType.slice(1)} Bonus</span>
                {b.payoutDate && <span style={{ color: 'var(--text-subtle)', marginLeft: 8, fontSize: 11 }}>{format(parseISO(b.payoutDate), 'MMM d, yyyy')}</span>}
                {b.notes && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{b.notes}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>{fmt(b.amount)}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: b.isPaid ? 'var(--accent-green-dim)' : 'var(--accent-amber-dim)', color: b.isPaid ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                  {b.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Salary History */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Salary History</div>
          <button
            onClick={() => setShowAddRecord(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 7, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Plus size={13} /> Add Record
          </button>
        </div>

        {showAddRecord && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Salary</label>
                <input value={newSalary} onChange={e => setNewSalary(e.target.value)} placeholder="e.g. 75000" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Effective Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
            </div>
            <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAddRecord} disabled={!newSalary || !newDate || saving} style={{ padding: '7px 16px', background: 'var(--accent-teal)', color: '#0F1117', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Add'}
              </button>
              <button onClick={() => setShowAddRecord(false)} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid var(--border-accent)', color: 'var(--text-muted)', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {compensationHistory.map((record, i) => (
          <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', fontSize: 15 }}>{fmt(record.salary)}</span>
                {i === 0 && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)', fontWeight: 600 }}>CURRENT</span>}
              </div>
              {record.notes && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{record.notes}</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'DM Mono, monospace' }}>
              {format(parseISO(record.effectiveDate), 'MMM d, yyyy')}
            </div>
          </div>
        ))}
        {compensationHistory.length === 0 && (
          <p style={{ color: 'var(--text-subtle)', fontSize: 13 }}>No compensation records yet.</p>
        )}
      </div>
    </div>
  );
}
