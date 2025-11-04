import { motion as Motion } from 'framer-motion';

export default function TagStats({ activeTasks = [], completedTasks = [] }) {
  const addCounts = (map, tag, field) => {
    const key = (tag || '').toString().trim();
    if (!key) return;
    if (!map.has(key)) map.set(key, { tag: key, active: 0, completed: 0 });
    map.get(key)[field] += 1;
  };

  const counts = new Map();
  for (const t of activeTasks) {
    (t.tags || []).forEach((tag) => addCounts(counts, tag, 'active'));
  }
  for (const t of completedTasks) {
    (t.tags || []).forEach((tag) => addCounts(counts, tag, 'completed'));
  }

  const rows = Array.from(counts.values())
    .map((r) => ({
      ...r,
      total: r.active + r.completed,
      rate: r.active + r.completed > 0 ? Math.round((r.completed / (r.active + r.completed)) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (rows.length === 0) {
    return (
      <div className="insight-tag-stats empty">
        <span>No tag stats yet</span>
      </div>
    );
  }

  return (
    <div className="insight-tag-stats">
      <h3>Top Tags</h3>
      <div className="tag-stat-list">
        {rows.map((r) => (
          <div key={r.tag} className="tag-stat-row">
            <span className="tag-chip" data-tag={r.tag.toLowerCase()}>{r.tag}</span>
            <span className="tag-stat-count">{r.total}</span>
            <div className="tag-stat-meter">
              <Motion.div
                className="tag-stat-meter-fill"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: r.rate / 100 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="tag-stat-rate">{r.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

