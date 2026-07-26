import React, { useState, useEffect } from 'react';
import { uploadLibraryResourcePhoto } from '../../firebase/firestore';

export default function UploadResourceSheet({ onClose, onSubmit, currentUser }) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [noteText, setNoteText] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Revoke the blob URL whenever it's replaced or the sheet closes -
  // otherwise every photo picked (even ones the user changes their mind
  // about) stays allocated in memory for the rest of the session.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)',
    fontFamily: 'var(--font)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)',
  };

  function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    if (!photoFile && !noteText.trim()) {
      setError('Add a photo of your notes, or type them in — at least one.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let photoURL = null;
      if (photoFile) {
        photoURL = await uploadLibraryResourcePhoto(currentUser.uid, photoFile);
      }
      await onSubmit({ title: title.trim(), tag: tag.trim(), photoURL, noteText: noteText.trim() });
    } catch (err) {
      console.error(err);
      setError('Upload failed — try a smaller photo or check your connection.');
      setUploading(false);
    }
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Upload Notes</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Title</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unit 5 Study Guide" />

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Subject / Tag</label>
        <input style={inputStyle} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="AP Bio" />

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
          Photo of your notes
        </label>
        {photoPreview ? (
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <img src={photoPreview} alt="Preview" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }} />
            <button
              onClick={handleRemovePhoto}
              style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff',
                border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <label
            style={{
              display: 'block', textAlign: 'center', border: '1.5px dashed var(--border-strong)',
              borderRadius: 12, padding: '18px', marginBottom: 'var(--space-3)', cursor: 'pointer',
              color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 600,
            }}
          >
            📷 Add a photo
            <input type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
          </label>
        )}

        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
          Or type your notes {photoFile ? '(optional)' : ''}
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'none' }}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Krebs cycle happens in the mitochondria matrix..."
        />

        {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)', marginBottom: 8 }}>{error}</p>}

        <button
          className="modal-btn primary"
          style={{ width: '100%', padding: 12 }}
          onClick={handleSubmit}
          disabled={uploading || !title.trim()}
        >
          {uploading ? 'Uploading...' : 'Add to Library (+5 🍯)'}
        </button>
      </div>
    </div>
  );
}
