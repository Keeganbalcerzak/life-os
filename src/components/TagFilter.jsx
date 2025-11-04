import { motion } from 'framer-motion';

export default function TagFilter({ tasks, selectedTags, onToggleTag, onClear, groupByTag, onToggleGroup, tagPrefs = {} }) {
  const tagSet = new Map();
  // Add tags from tasks
  (tasks || []).forEach((t) => {
    (t.tags || []).forEach((raw) => {
      const k = (raw || '').toString().trim();
      if (!k) return;
      const key = k.toLowerCase();
      tagSet.set(key, k); // preserve original casing of last seen
    });
  });
  // Add all configured tags from tagPrefs
  Object.keys(tagPrefs || {}).forEach((k) => {
    const key = k.toLowerCase();
    if (!tagSet.has(key)) {
      tagSet.set(key, k);
    }
  });
  const tags = Array.from(tagSet.entries()).map(([key, label]) => ({ key, label }));
  tags.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <span className="eyebrow">Filter by Tags</span>
        {selectedTags.length > 0 && (
          <button className="filter-clear" onClick={onClear}>Clear</button>
        )}
      </div>
      <div className="filter-tags">
        {tags.length === 0 ? (
          <span className="filter-empty">No tags yet</span>
        ) : (
          tags.map(({ key, label }) => {
            const active = selectedTags.map((t) => t.toLowerCase()).includes(key);
            const pref = tagPrefs?.[label] || {};
            const style = {};
            if (pref.color) {
              style.borderColor = pref.color;
              style.boxShadow = `0 0 14px ${pref.color}44`;
            }
            return (
              <motion.button
                key={key}
                type="button"
                className={`tag-chip filter-chip ${active ? 'active' : ''}`}
                data-tag={key}
                onClick={() => onToggleTag(label)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-pressed={active}
                style={style}
              >
                {pref.icon ? <span style={{ marginRight: 6 }}>{pref.icon}</span> : null}
                {label}
              </motion.button>
            );
          })
        )}
      </div>
      <label className="group-toggle">
        <input type="checkbox" checked={groupByTag} onChange={(e) => onToggleGroup(e.target.checked)} />
        <span>Group by tag</span>
      </label>
    </div>
  );
}
