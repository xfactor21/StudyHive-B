import React, { useMemo, useState } from 'react';

function normalizeHandle(handle) {
  const cleaned = handle.trim().replace(/^@+/, '').replace(/\s+/g, '');
  return cleaned ? `@${cleaned}` : '';
}

export default function AccountSetupScreen({ onCreateProfile }) {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const normalizedHandle = useMemo(() => normalizeHandle(handle), [handle]);
  const canSubmit = displayName.trim() && normalizedHandle && grade.trim() && school.trim() && !saving;

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)',
    fontFamily: 'var(--font)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)',
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onCreateProfile({
        displayName: displayName.trim(),
        handle: normalizedHandle,
        grade: grade.trim(),
        school: school.trim(),
      });
    } catch {
      setError('Could not finish setup — please try again.');
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-5)' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Welcome to StudyHive</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
        Quick setup before you jump in.
      </p>

      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>Display Name</label>
      <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jordan M." />

      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>Handle</label>
      <input style={inputStyle} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@jordanm" />
      {normalizedHandle && (
        <div style={{ marginTop: '-8px', marginBottom: 'var(--space-3)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          Will save as {normalizedHandle}
        </div>
      )}

      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>Grade</label>
      <input style={inputStyle} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="11th Grade" />

      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>School</label>
      <input style={inputStyle} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Lincoln HS" />

      {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)' }}>{error}</p>}

      <button
        className="modal-btn primary"
        style={{ padding: 12, marginTop: 'var(--space-2)', opacity: canSubmit ? 1 : 0.5 }}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {saving ? 'Saving...' : 'Get Started'}
      </button>
    </div>
  );
}
