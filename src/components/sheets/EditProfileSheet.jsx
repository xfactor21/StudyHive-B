import React, { useMemo, useState } from 'react';
import HexAvatar from '../HexAvatar';
import { uploadProfilePhoto } from '../../firebase/firestore';

function normalizeHandle(handle) {
  const cleaned = handle.trim().replace(/^@+/, '').replace(/\s+/g, '');
  return cleaned ? `@${cleaned}` : '';
}

export default function EditProfileSheet({ me, currentUser, onClose, onSave, onPhotoUploaded }) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle);
  const [bio, setBio] = useState(me.bio);
  const [classes, setClasses] = useState(me.classes || []);
  const [classInput, setClassInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const normalizedHandle = useMemo(() => normalizeHandle(handle), [handle]);

  function addClass() {
    const trimmed = classInput.trim();
    if (!trimmed || classes.includes(trimmed) || classes.length >= 8) {
      setClassInput('');
      return;
    }
    setClasses([...classes, trimmed]);
    setClassInput('');
  }

  function removeClass(c) {
    setClasses(classes.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!name.trim() || !normalizedHandle) {
      setError('Display name and handle are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), handle: normalizedHandle, bio: bio.trim(), classes });
      onClose();
    } catch {
      setError('Could not save changes — try again.');
      setSaving(false);
    }
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    setUploadError(null);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20000)
      );
      const url = await Promise.race([uploadProfilePhoto(currentUser.uid, file), timeout]);
      onPhotoUploaded(url);
    } catch (err) {
      console.error(err);
      setUploadError(
        err.message === 'timeout'
          ? "Upload is stuck — this usually means Storage isn't fully set up yet (rules deployed? CORS configured?)."
          : 'Upload failed — try a smaller image.'
      );
    } finally {
      setUploading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-base)',
    marginBottom: 'var(--space-3)',
  };

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Edit Profile</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      <div style={{ padding: '0 var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <HexAvatar src={me.avatar} size="lg" status={me.status} customEmoji={me.customEmoji} />
          <label
            style={{
              marginTop: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '7px 14px',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: uploading ? 'var(--text-tertiary)' : 'var(--accent-text)',
              cursor: uploading ? 'wait' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : '📷 Change Photo'}
            <input type="file" accept="image/*" onChange={handlePhotoPick} disabled={uploading} style={{ display: 'none' }} />
          </label>
          {uploadError && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-xs)', marginTop: 4 }}>{uploadError}</p>}
        </div>

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Display Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Handle</label>
        <input style={inputStyle} value={handle} onChange={(e) => setHandle(e.target.value)} />
        {normalizedHandle && (
          <div style={{ marginTop: '-8px', marginBottom: 'var(--space-3)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            Will save as {normalizedHandle}
          </div>
        )}

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Bio</label>
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: 'none' }}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
          My Classes <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(powers Feed filtering and Miss Me?)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            placeholder="e.g. AP Bio, 3rd period"
            value={classInput}
            onChange={(e) => setClassInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClass(); } }}
          />
          <button
            className="modal-btn primary"
            style={{ padding: '0 16px', flexShrink: 0, flex: 'none' }}
            onClick={addClass}
            disabled={classes.length >= 8}
          >
            Add
          </button>
        </div>
        {classes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-4)' }}>
            {classes.map((c) => (
              <div
                key={c}
                style={{
                  background: 'var(--accent-dim)', border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-pill)', padding: '5px 8px 5px 12px',
                  fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {c}
                <span onClick={() => removeClass(c)} style={{ cursor: 'pointer', opacity: 0.7, fontWeight: 800 }}>✕</span>
              </div>
            ))}
          </div>
        )}
        {classes.length >= 8 && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: -8, marginBottom: 'var(--space-3)' }}>Max 8 classes.</p>
        )}

        {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)' }}>{error}</p>}

        <button className="modal-btn primary" style={{ width: '100%', padding: 12, marginTop: 4 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
