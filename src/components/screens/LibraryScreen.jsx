import React, { useState, useMemo } from 'react';
import { LIBRARY_RESOURCES } from '../../data/seedData';
import * as fs from '../../firebase/firestore';

const FILTERS = [
  { key: 'all', label: 'All Subjects' },
  { key: 'my-classes', label: 'My Classes' },
  { key: 'top-rated', label: 'Top Rated' },
  { key: 'official', label: 'Official ✓' },
];

export default function LibraryScreen({ resources, onOpenResource, onMissMe, onAddResource, currentUser, usersById }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [upvoting, setUpvoting] = useState(null);

  const allResources = [...resources, ...LIBRARY_RESOURCES.map((r) => ({ ...r, isDemo: true }))];

  const visibleResources = useMemo(() => {
    let list = allResources;
    if (activeFilter === 'top-rated') {
      list = [...list].sort((a, b) => b.upvotes - a.upvotes);
    } else if (activeFilter === 'official') {
      list = list.filter((r) => r.official);
    }
    // "my-classes" has no class-roster data model yet — falls back to
    // showing everything rather than silently hiding resources.
    return list;
  }, [activeFilter, allResources]);

  async function handleUpvote(e, res) {
    e.stopPropagation();
    if (res.isDemo || !currentUser || res.uploaderId === currentUser.uid || upvoting === res.id) return;
    setUpvoting(res.id);
    try {
      await fs.upvoteLibraryResource(res.id, res.uploaderId, currentUser.uid);
    } catch (err) {
      console.error('Upvote failed:', err);
    } finally {
      setUpvoting(null);
    }
  }

  return (
    <div className="screen active">
      <div className="screen-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="wave-text" style={{ '--wave-delay': '0.2s' }}>Homework Library</span>
        <button className="mm-btn" data-tutorial="upload-btn" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onAddResource}>
          + Upload
        </button>
      </div>

      <div className="miss-me-banner">
        <div className="mm-icon">🤒</div>
        <div className="mm-text">
          <h4>Missed a class today?</h4>
          <p>Tap and classmates can send notes your way</p>
        </div>
        <button className="mm-btn" onClick={onMissMe}>Miss Me?</button>
      </div>

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

      <div className="section-header"><h3>Recently Added</h3></div>
      <div className="lib-grid">
        {visibleResources.length === 0 ? (
          <div className="empty-filter-state">
            <div className="e-icon">📚</div>
            <p>{activeFilter === 'official' ? 'No teacher-verified resources yet.' : 'Nothing here yet.'}</p>
          </div>
        ) : (
          visibleResources.map((res) => {
            const isOwn = !res.isDemo && currentUser && res.uploaderId === currentUser.uid;
            const uploaderName = res.isDemo
              ? `by ${res.contributorName || 'a classmate'}`
              : (isOwn ? 'by you' : `by ${usersById?.[res.uploaderId]?.displayName || 'a classmate'}`);

            return (
              <div className="resource-card" key={res.id} onClick={() => onOpenResource(res)}>
                <div className="resource-thumb">{res.icon || '📄'}</div>
                <h5>
                  {res.official && <><span className="official-badge">✓ Official</span><br /></>}
                  {res.title}
                </h5>
                <div className="resource-tag">{res.tag || (res.tags && res.tags.join(', ')) || ''}</div>
                <div className="resource-foot">
                  <span
                    onClick={(e) => handleUpvote(e, res)}
                    style={{
                      cursor: (!res.isDemo && !isOwn) ? 'pointer' : 'default',
                      opacity: upvoting === res.id ? 0.5 : 1,
                      fontWeight: (!res.isDemo && !isOwn) ? 700 : 400,
                    }}
                    title={isOwn ? "You can't upvote your own upload" : 'Upvote this — pays them 3 Hunnies'}
                  >
                    👍 {res.upvotes || 0}
                  </span>
                  <span>{uploaderName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
