import { useState, useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import type { Profile, PathwayLevel, PathwayTrack, ScheduleType } from '../../types';
import { PATHWAY_LEVEL_LABELS, PATHWAY_LEVEL_ORDER, PATHWAY_TRACK_LABELS, SCHEDULE_TYPE_LABELS } from '../../types';
import { updateProfile, uploadAvatar } from '../../lib/api';
import { Avatar } from '../team/DesignerCard';

interface Props {
  profile: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}

const REGIONS = ['Southeast', 'Midwest', 'Northeast', 'West', 'Remote-International'];

export function EditProfileDialog({ profile, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [externalTitle, setExternalTitle] = useState(profile.externalTitle ?? '');
  const [pathwayLevel, setPathwayLevel] = useState<PathwayLevel | ''>(profile.pathwayLevel ?? '');
  const [pathwayTrack, setPathwayTrack] = useState<PathwayTrack | ''>(profile.pathwayTrack ?? '');
  const [scheduledHours, setScheduledHours] = useState(String(profile.scheduledHoursPerWeek));
  const [scheduleType, setScheduleType] = useState<ScheduleType>(profile.scheduleType);
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.locationCity ?? '');
  const [state, setState] = useState(profile.locationState ?? '');
  const [region, setRegion] = useState(profile.region ?? '');
  const [hireDate, setHireDate] = useState(profile.hireDate ?? '');
  const [birthday, setBirthday] = useState(profile.birthday ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [mbti, setMbti] = useState(profile.personalityMbti ?? '');
  const [enneagram, setEnneagram] = useState(profile.personalityEnneagram ?? '');
  const [personalityNotes, setPersonalityNotes] = useState(profile.personalityNotes ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [specialNotes, setSpecialNotes] = useState(profile.specialCircumstancesNotes ?? '');
  const [billableMin, setBillableMin] = useState(profile.billableTargetMin != null ? String(profile.billableTargetMin) : '');
  const [billableMax, setBillableMax] = useState(profile.billableTargetMax != null ? String(profile.billableTargetMax) : '');
  const [billableExempt, setBillableExempt] = useState(profile.billableTargetExempt ?? false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const url = await uploadAvatar(file, profile.id);
    if (url) {
      setAvatarUrl(url);
      await updateProfile(profile.id, { avatar_url: url });
    } else {
      setError('Failed to upload photo. Check your Supabase Storage bucket (avatars) is public.');
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const updated = await updateProfile(profile.id, {
      name,
      external_title: externalTitle || null,
      pathway_level: pathwayLevel || null,
      pathway_track: pathwayTrack || null,
      scheduled_hours_per_week: parseInt(scheduledHours) || 36,
      schedule_type: scheduleType,
      hire_date: hireDate || null,
      region: region || null,
      location_city: city || null,
      location_state: state || null,
      phone: phone || null,
      birthday: birthday || null,
      personality_mbti: mbti || null,
      personality_enneagram: enneagram || null,
      personality_notes: personalityNotes || null,
      bio: bio || null,
      special_circumstances_notes: specialNotes || null,
      billable_target_min: billableMin ? parseFloat(billableMin) : null,
      billable_target_max: billableMax ? parseFloat(billableMax) : null,
      billable_target_exempt: billableExempt,
    });
    setSaving(false);
    if (updated) {
      onSaved(updated);
    } else {
      setError('Failed to save changes. Please try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-inner)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 8, padding: '9px 12px',
    fontFamily: 'Inter, sans-serif', fontSize: 13, outline: 'none',
    width: '100%', transition: 'border-color 0.15s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
  };
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 16, marginTop: 28,
    paddingBottom: 8, borderBottom: '1px solid var(--border)',
  };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const fieldStyle: React.CSSProperties = { marginBottom: 0 };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-accent)', width: '100%', maxWidth: 620, position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>Edit Profile</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{profile.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '0 28px 24px', maxHeight: '72vh', overflowY: 'auto' }}>

          {/* Profile Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={profile.name} avatarUrl={avatarUrl || undefined} size={64} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--accent-teal)', border: '2px solid var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <Camera size={12} color="#1a1e24" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Profile Photo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {uploadingAvatar ? 'Uploading…' : 'JPG, PNG, WebP — shown throughout the app'}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  padding: '5px 12px', background: 'var(--bg-inner)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                }}
              >
                {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
              </button>
            </div>
          </div>

          {/* Section 1: Role & Position */}
          <div style={sectionHeaderStyle}>Role & Position</div>
          <div style={fieldStyle}>
            <label style={labelStyle}>External Title</label>
            <input style={inputStyle} value={externalTitle} onChange={e => setExternalTitle(e.target.value)} placeholder="e.g. Senior Designer" />
          </div>
          <div style={{ ...gridStyle, marginTop: 14 }}>
            <div>
              <label style={labelStyle}>Pathway Level</label>
              <select style={inputStyle} value={pathwayLevel} onChange={e => setPathwayLevel(e.target.value as PathwayLevel | '')}>
                <option value="">— Not set —</option>
                {PATHWAY_LEVEL_ORDER.map(level => (
                  <option key={level} value={level}>{PATHWAY_LEVEL_LABELS[level]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pathway Track</label>
              <select style={inputStyle} value={pathwayTrack} onChange={e => setPathwayTrack(e.target.value as PathwayTrack | '')}>
                <option value="">— Not set —</option>
                {(Object.entries(PATHWAY_TRACK_LABELS) as [PathwayTrack, string][]).map(([t, l]) => (
                  <option key={t} value={t}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Scheduled Hours/Week</label>
              <input style={inputStyle} type="number" min={1} max={50} value={scheduledHours} onChange={e => setScheduledHours(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Schedule Type</label>
              <select style={inputStyle} value={scheduleType} onChange={e => setScheduleType(e.target.value as ScheduleType)}>
                {(Object.entries(SCHEDULE_TYPE_LABELS) as [ScheduleType, string][]).map(([t, l]) => (
                  <option key={t} value={t}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Personal Details */}
          <div style={sectionHeaderStyle}>Personal Details</div>
          <div style={{ ...fieldStyle, marginBottom: 14 }}>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ ...gridStyle }}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Greenville" />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input style={inputStyle} value={state} onChange={e => setState(e.target.value)} placeholder="SC" maxLength={2} />
            </div>
            <div>
              <label style={labelStyle}>Region</label>
              <select style={inputStyle} value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">— Not set —</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label style={labelStyle}>Hire Date</label>
              <input style={inputStyle} type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Birthday</label>
              <input style={inputStyle} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
            </div>
          </div>

          {/* Section 3: Personality & Working Style */}
          <div style={sectionHeaderStyle}>Personality & Working Style</div>
          <div style={{ ...gridStyle }}>
            <div>
              <label style={labelStyle}>MBTI Type</label>
              <input style={inputStyle} value={mbti} onChange={e => setMbti(e.target.value)} placeholder="e.g. ENFP" />
            </div>
            <div>
              <label style={labelStyle}>Enneagram</label>
              <input style={inputStyle} value={enneagram} onChange={e => setEnneagram(e.target.value)} placeholder="e.g. 7w8" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              Personality Notes
              <span style={{ fontSize: 10, color: 'var(--accent-amber)', marginLeft: 6, fontWeight: 400 }}>ADMIN ONLY</span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
              value={personalityNotes}
              onChange={e => setPersonalityNotes(e.target.value)}
              placeholder="Working style, communication preferences, motivators…"
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              Bio
              <span style={{ fontSize: 10, color: 'var(--accent-green)', marginLeft: 6, fontWeight: 400 }}>Visible to designer</span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Short team bio shown on profile…"
            />
          </div>

          {/* Section 4: Special Circumstances */}
          <div style={sectionHeaderStyle}>Special Circumstances</div>
          <div>
            <label style={labelStyle}>
              Notes
              <span style={{ fontSize: 10, color: 'var(--accent-amber)', marginLeft: 6, fontWeight: 400 }}>ADMIN ONLY — Never shown to designer</span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              placeholder="PUMP Act accommodation, leave, temporary schedule changes…"
            />
          </div>

          {/* Section 5: Billable Targets */}
          <div style={sectionHeaderStyle}>Billable Targets</div>
          <div style={{ ...gridStyle }}>
            <div>
              <label style={labelStyle}>Target Min %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={billableMin} onChange={e => setBillableMin(e.target.value)} placeholder="e.g. 68" />
            </div>
            <div>
              <label style={labelStyle}>Target Max %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={billableMax} onChange={e => setBillableMax(e.target.value)} placeholder="e.g. 72" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={billableExempt}
              onChange={e => setBillableExempt(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-teal)' }}
            />
            Exempt from billable flagging — never generate a utilization warning for this person
          </label>
        </div>

        {/* Footer */}
        {error && (
          <div style={{ margin: '0 28px 16px', padding: '10px 14px', background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 8, fontSize: 13, color: 'var(--accent-red)' }}>
            {error}
          </div>
        )}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border-accent)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '9px 20px', background: 'var(--accent-teal)', color: '#0F1117', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
