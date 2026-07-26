import React from 'react';
import HexAvatar from './HexAvatar';
import StatusLabel from './StatusLabel';
import { defaultAvatar } from '../data/avatars';

const TYPE_PILL_LABEL = {
  'study-group': 'Study Group',
  'question': 'Question',
  'thought': 'Thought',
};

export default function PostCard({ post, onToggleLike, onToggleBookmark, onOpenProfile, onExpand, onOpenComment, currentUser, me, usersById }) {
  // Every real post resolves its author via post.authorId against the
  // live usersById map — never assume the current viewer wrote it. (This
  // was the original bug: every post rendered with "me" as the author
  // regardless of who actually posted it.)
  let author;
  let authorKeyForProfile;
  if (post.authorId === currentUser?.uid) {
    author = me;
    authorKeyForProfile = 'me';
  } else {
    const realAuthor = usersById?.[post.authorId];
    author = {
      name: realAuthor?.displayName || 'A classmate',
      handle: realAuthor?.handle || '',
      avatar: realAuthor?.photoURL || defaultAvatar,
      status: realAuthor?.status || 'online',
      customEmoji: realAuthor?.customEmoji || null,
      customExpiresAt: realAuthor?.customExpiresAt || null,
      activeCosmetics: realAuthor?.activeCosmetics || {},
    };
    authorKeyForProfile = post.authorId;
  }

  const liked = (post.likes || []).includes(currentUser?.uid);
  const likeCount = (post.likes || []).length;
  const bookmarked = (post.bookmarks || []).includes(currentUser?.uid);
  const commentCount = post.commentCount ?? 0;

  return (
    <div className="post-card" onClick={() => onExpand(post)}>
      <div className="post-head">
        <HexAvatar
          src={author.avatar}
          size="md"
          status={author.status}
          customEmoji={author.customEmoji}
          cosmetics={author.activeCosmetics}
          onClick={(e) => { e.stopPropagation(); onOpenProfile(authorKeyForProfile); }}
        />
        <div className="post-author-info">
          <div className="post-name-row">
            <span
              className="post-name"
              style={{
                cursor: 'pointer',
                color: author.activeCosmetics?.nameColor > Date.now() ? '#EC4899' : undefined,
              }}
              onClick={(e) => { e.stopPropagation(); onOpenProfile(authorKeyForProfile); }}
            >
              {author.activeCosmetics?.crown > Date.now() && '👑 '}{author.name}
            </span>
            {post.badge && <span className="rep-badge">{post.badge}</span>}
          </div>
          <div className="post-meta">
            {post.meta}{' '}
            <StatusLabel status={author.status} customEmoji={author.customEmoji} customExpiresAt={author.customExpiresAt} />
            {post.classTag && (
              <span style={{
                marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: 'var(--accent-text)',
                background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 'var(--radius-pill)',
              }}>
                {post.classTag}
              </span>
            )}
          </div>
        </div>
        {post.typeLabel && (
          <span className={`type-pill ${post.type}`}>{TYPE_PILL_LABEL[post.type] || post.typeLabel}</span>
        )}
      </div>

      <div className="post-body" style={post.italic ? { color: 'var(--text-secondary)', fontStyle: 'italic' } : undefined}>
        {post.body}
      </div>

      <div className="post-actions">
        <div
          className={`post-action${liked ? ' liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleLike(post); }}
        >
          <span>{liked ? '❤️' : '🤍'}</span> <span>{likeCount}</span>
        </div>

        {post.isShareNotes ? (
          <div
            className="post-action"
            style={{ color: 'var(--accent-text)' }}
            onClick={(e) => { e.stopPropagation(); onOpenComment(post); }}
          >
            📤 Share Notes
          </div>
        ) : (
          <div className="post-action" onClick={(e) => { e.stopPropagation(); onOpenComment(post); }}>
            💬 <span>{commentCount}</span>
          </div>
        )}

        {!post.isShareNotes && (
          <div
            className={`post-action${bookmarked ? ' bookmarked' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(post); }}
          >
            🔖 {bookmarked ? 'Saved' : 'Save'}
          </div>
        )}
      </div>
    </div>
  );
}
