import React, { useState } from 'react';
import { dateKeyToDisplay, EVENT_TYPE_META } from '../../utils/calendarGrid';
import ConfirmDialog from '../ConfirmDialog';

export default function EventDetailSheet({ event, onClose, onDelete, currentUser, isOperator }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!event) return null;
  const { day, month } = dateKeyToDisplay(event.date);
  const meta = EVENT_TYPE_META[event.type] || EVENT_TYPE_META.other;
  const canDelete = event.creatorId === currentUser?.uid || isOperator;

  async function handleDelete() {
    setConfirmingDelete(false);
    setDeleting(true);
    try {
      await onDelete(event.id);
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
    }
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Class Event</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {canDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              style={{ background: 'none', border: 'none', color: 'var(--alert)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div className="event-date-block" style={{ borderRight: 'none' }}>
            <div className="day-num">{day}</div>
            <div className="day-mon">{month}</div>
          </div>
          <div>
            <h3 style={{ marginBottom: 2 }}>{event.subject}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: meta.color, fontWeight: 600 }}>{meta.emoji} {meta.label}</p>
          </div>
        </div>
        {event.title && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{event.title}</p>
        )}
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this event?"
          message="This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
