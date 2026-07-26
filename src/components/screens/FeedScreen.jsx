import React, { useState, useMemo } from 'react';
import PostCard from '../PostCard';
import HexAvatar from '../HexAvatar';
import GiftAnnouncementBanner from '../GiftAnnouncementBanner';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'question', label: 'Questions' },
  { key: 'study-group', label: 'Study Groups' },
  { key: 'my-classes', label: 'My Classes' },
  { key: 'following', label: 'Following' },
];

// "Following" doesn't have a real data model yet (no follow-graph in
// this app), so it falls back to showing everything. "My Classes" is
// now fully real — it filters against post.classTag matching one of
// the viewer's own classes (set in Edit Profile).
const FILTERABLE_TYPES = new Set(['question', 'study-group']);

export default function FeedScreen({ posts, onToggleLike, onToggleBookmark, onOpenProfile, onExpandPost, onOpenComment, onOpenComposer, onOpenStatusPicker, me, currentUser, usersById }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const myClasses = me.classes || [];

  const visiblePosts = useMemo(() => {
    if (activeFilter === 'my-classes') {
      if (myClasses.length === 0) return [];
      return posts.filter((p) => p.classTag && myClasses.includes(p.classTag));
    }
    if (activeFilter === 'all' || !FILTERABLE_TYPES.has(activeFilter)) return posts;
    return posts.filter((p) => p.type === activeFilter);
  }, [posts, activeFilter, myClasses]);

  return (
    <div className="screen active">
      <div className="screen-title"><span className="wave-text" style={{ '--wave-delay': '0.2s' }}>Feed</span></div>

      <div className="composer-bar" onClick={onOpenComposer}>
        <div data-tutorial="composer-avatar">
          <HexAvatar
            src={me.avatar}
            size="sm"
            status={me.status}
            customEmoji={me.customEmoji}
            onClick={(e) => { e.stopPropagation(); onOpenStatusPicker?.(); }}
          />
        </div>
        <div className="composer-pill" data-tutorial="composer-pill">
          <input placeholder="Share something with your hive..." readOnly />
        </div>
      </div>

      <GiftAnnouncementBanner usersById={usersById} currentUser={currentUser} />

      <div className="filter-row">
        {FILTERS.map((f) => (
          <div
            key={f.key}
            className={`chip${activeFilter === f.key ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </div>
        ))}
      </div>

      <div id="feed-posts-container">
        {visiblePosts.length === 0 ? (
          <div className="empty-filter-state">
            <div className="e-icon">🐝</div>
            <p>
              {activeFilter === 'my-classes' && myClasses.length === 0
                ? "Add your classes in Edit Profile and posts tagged with them will show up here."
                : "Nothing here yet — try a different filter."}
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => (
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
          ))
        )}
      </div>
    </div>
  );
}
