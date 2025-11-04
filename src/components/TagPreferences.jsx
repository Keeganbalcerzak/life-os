import { useEffect, useMemo, useState } from 'react';

function hexToRGBA(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
  const r = parseInt(m?.[1] || 'ff', 16);
  const g = parseInt(m?.[2] || 'ff', 16);
  const b = parseInt(m?.[3] || 'ff', 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TagPreferences({ tasks, value, onChange, alwaysOpen = false }) {
  const [open, setOpen] = useState(alwaysOpen ? true : false);
  const [draft, setDraft] = useState(value || {});
  const [newTag, setNewTag] = useState('');

  const tags = useMemo(() => {
    const set = new Set();
    (tasks || []).forEach((t) => (t.tags || []).forEach((x) => set.add(String(x).trim())));
    Object.keys(value || {}).forEach((k) => set.add(String(k).trim()));
    Object.keys(draft || {}).forEach((k) => set.add(String(k).trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [tasks, value, draft]);

  useEffect(() => setDraft(value || {}), [value]);

  const updateTag = (tag, patch) => {
    setDraft((prev) => ({ ...prev, [tag]: { ...(prev[tag] || {}), ...patch } }));
  };

  const save = () => {
    onChange?.(draft);
    setOpen(false);
  };

  const addNewTag = () => {
    const t = (newTag || '').trim();
    if (!t) return;
    if (!draft[t]) {
      setDraft((prev) => ({ ...prev, [t]: { color: '#3b82f6', icon: '' } }));
    }
    setNewTag('');
  };

  return (
    <div className="tag-prefs">
      {!alwaysOpen && (
        <button className="tag-prefs-toggle" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close Tag Styles' : 'Edit Tag Styles'}
        </button>
      )}
      {(alwaysOpen || open) && (
        <div className="tag-prefs-panel">
          <div className="tag-prefs-add">
            <label className="tag-pref-field">
              <span>New Tag</span>
              <input
                type="text"
                placeholder="e.g. Finance"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewTag(); } }}
              />
            </label>
            <button className="secondary-button" type="button" onClick={addNewTag}>Add</button>
          </div>
          {tags.length === 0 ? (
            <div className="filter-empty">No tags yet</div>
          ) : (
            <div className="tag-prefs-grid">
              {tags.map((t) => {
                const pref = draft[t] || {};
                const bg = pref.color ? hexToRGBA(pref.color, 0.2) : undefined;
                const bd = pref.color ? hexToRGBA(pref.color, 0.6) : undefined;
                return (
                  <div key={t} className="tag-pref-row">
                    <div className="tag-pref-header">
                      <span className="tag-chip" style={{ background: bg, borderColor: bd }}>
                        {pref.icon ? <span style={{ marginRight: 6 }}>{pref.icon}</span> : null}
                        {t}
                      </span>
                    </div>
                    <div className="tag-pref-fields">
                      <label className="tag-pref-field">
                        <span>Color</span>
                        <input type="color" value={pref.color || '#3b82f6'} onChange={(e) => updateTag(t, { color: e.target.value })} />
                      </label>
                      <label className="tag-pref-field">
                        <span>Icon</span>
                        <input type="text" maxLength={2} placeholder="✨" value={pref.icon || ''} onChange={(e) => updateTag(t, { icon: e.target.value })} />
                      </label>
                      <label className="tag-pref-field">
                        <span>Parent</span>
                        <input
                          type="text"
                          placeholder="(optional) Parent tag"
                          value={pref.parent || ''}
                          onChange={(e) => updateTag(t, { parent: e.target.value })}
                          list="tag-parent-suggestions"
                        />
                      </label>
                      <label className="tag-pref-field">
                        <span>Automation</span>
                        <select
                          value={pref.automation || ''}
                          onChange={(e) => updateTag(t, { automation: e.target.value })}
                        >
                          <option value="">None</option>
                          <option value="priority:low">Set priority: Low</option>
                          <option value="priority:medium">Set priority: Medium</option>
                          <option value="priority:high">Set priority: High</option>
                          <option value="priority:milestone">Set priority: Milestone</option>
                          <option value="status:not_started">Set status: Not Started</option>
                          <option value="status:started">Set status: Started</option>
                          <option value="status:focusing">Set status: Focusing</option>
                        </select>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* datalist to provide suggestions; themed input remains */}
          <datalist id="tag-parent-suggestions">
            {tags.map((tg) => (
              <option key={`opt-${tg}`} value={tg} />
            ))}
          </datalist>
          <div className="tag-prefs-actions">
            <button className="filter-clear" onClick={() => setDraft({})}>Reset</button>
            <button className="secondary-button" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
