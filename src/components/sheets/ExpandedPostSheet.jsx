import React, { useState, useEffect } from 'react';
import PostCard from '../PostCard';
import HexAvatar from '../HexAvatar';
import ConfirmDialog from '../ConfirmDialog';
import { defaultAvatar } from '../../data/avatars';
import * as fs from '../../firebase/firestore';

export default function ExpandedPostSheet({ post, onClose, onToggleLike, onToggleBookmark, onOpenProfile, onOpenComment, onDeletePost, onDeleteReply, me, currentUser, usersById, isOperator }) {
  const [replies, setReplies] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!post) return;
    const unsubscribe = fs.subscribeToReplies(post.id, setReplies);
    return unsubscribe;
  }, [post?.id]);

  if (!post) return null;

  const canDeletePost = post.authorId === currentUser?.uid || isOperator;

  async function handleDeletePost() {
    setConfirmingDelete(false);
    setDeleting(true);
    try {
      await onDeletePost(post.id);
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
    }
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Post</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {canDeletePost && (
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
      <PostCard
        post={{ ...post, commentCount: replies.length }}
        onToggleLike={onToggleLike}
        onToggleBookmark={onToggleBookmark}
        onOpenProfile={onOpenProfile}
        onExpand={() => {}}
        onOpenComment={onOpenComment}
        me={me}
        currentUser={currentUser}
        usersById={usersById}
      />
      <div className="expanded-replies">
        {replies.length === 0 ? (
          <div className="empty-state">
            <div className="e-icon">💬</div>
            <p>No replies yet — be the first to help.</p>
          </div>
        ) : (
          replies.map((r) => {
            const isMe = r.authorId === currentUser?.uid;
            const replyAuthor = isMe ? me : usersById?.[r.authorId];
            const canDeleteReply = isMe || isOperator;
            return (
              <div className="reply-row" key={r.id}>
                <HexAvatar
                  src={replyAuthor?.avatar || replyAuthor?.photoURL || defaultAvatar}
                  size="sm"
                  status={replyAuthor?.status}
                  customEmoji={replyAuthor?.customEmoji}
                  cosmetics={replyAuthor?.activeCosmetics}
                />
                <div className="reply-bubble" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <b>{isMe ? me.name : (replyAuthor?.displayName || 'A classmate')}</b>
                    {canDeleteReply && (
                      <span
                        onClick={() => onDeleteReply(post.id, r.id)}
                        style={{ fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        Delete
                      </span>
                    )}
                  </div>
                  <p>{r.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this post?"
          message="This also removes all its replies. Cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeletePost}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
