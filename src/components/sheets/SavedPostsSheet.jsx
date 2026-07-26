import React, { useState, useEffect } from 'react';
import PostCard from '../PostCard';
import * as fs from '../../firebase/firestore';

export default function SavedPostsSheet({ onClose, onToggleLike, onToggleBookmark, onOpenProfile, onExpandPost, onOpenComment, me, currentUser, usersById }) {
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const unsubscribe = fs.subscribeToSavedPosts(currentUser.uid, setSavedPosts);
    return unsubscribe;
  }, [currentUser]);

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)', maxHeight: '85vh', overflowY: 'auto' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Saved Posts</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      {savedPosts.length === 0 ? (
        <div className="empty-state">
          <div className="e-icon">🔖</div>
          <p>Nothing saved yet — tap Save on any post to keep it here.</p>
        </div>
      ) : (
        <div style={{ padding: '0 var(--space-4)' }}>
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={onToggleLike}
              onToggleBookmark={onToggleBookmark}
              onOpenProfile={onOpenProfile}
              onExpand={onExpandPost}
              onOpenComment={onOpenComment}
              me={me}
              currentUser={currentUser}
              usersById={usersById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
