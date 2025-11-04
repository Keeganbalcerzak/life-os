import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dust: 5, color: '#3b82f6' },
  { value: 'medium', label: 'Medium', dust: 10, color: '#06b6d4' },
  { value: 'high', label: 'High', dust: 20, color: '#facc15' },
  { value: 'milestone', label: 'Milestone', dust: 50, color: '#f97316' },
];

export default function AddTaskForm({ onAdd, projects = [], onOpenProjects, tagPrefs = {}, existingTasks = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState(null);
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [depSearch, setDepSearch] = useState('');
  const [depIds, setDepIds] = useState([]);
  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueDateLocal, setDueDateLocal] = useState(''); // yyyy-MM-ddTHH:mm
  const [deadlineType, setDeadlineType] = useState('hard');

  const DEFAULT_TAGS = ['Work', 'Personal', 'Health', 'Learning'];

  // Simple content → tag heuristics
  const KEYWORD_MAP = [
    { tag: 'Work',      rx: /(work|meeting|email|project|deadline|client|sprint|stand.?up|slide|deck)/i },
    { tag: 'Personal',  rx: /(home|errand|family|friend|party|clean|laundry|call|birthday)/i },
    { tag: 'Health',    rx: /(health|workout|gym|run|walk|yoga|doctor|dentist|sleep|medicat|therapy|hydrate)/i },
    { tag: 'Learning',  rx: /(learn|study|course|class|read|tutorial|lesson|practice|research)/i },
  ];

  const norm = (t) => {
    if (!t || typeof t !== 'string') return '';
    return t.trim().replace(/\s+/g, ' ');
  };
  const addTag = (t) => {
    if (!t) return;
    const val = norm(t);
    if (!val) return;
    setTags((prev) => {
      const prevLower = prev.map((x) => String(x).toLowerCase());
      if (prevLower.includes(val.toLowerCase())) return prev;
      return [...prev, val];
    });
  };
  const removeTag = (t) => {
    if (!t) return;
    setTags((prev) => prev.filter((x) => String(x) !== String(t)));
  };

  const content = `${title || ''} ${description || ''}`.trim();
  const smartSuggested = (() => {
    try {
      if (!content) return [];
      const pool = new Set();
      KEYWORD_MAP.forEach(({ tag, rx }) => {
        if (rx && rx.test(content)) pool.add(tag);
      });
      // Don't suggest already chosen or typed as exact tag
      const chosen = (tags || []).map((t) => String(t).toLowerCase());
      const list = Array.from(pool).filter((t) => !chosen.includes(String(t).toLowerCase()));
      // If nothing matched, suggest from defaults by fuzzy presence of tag name itself
      if (list.length === 0) {
        DEFAULT_TAGS.forEach((t) => {
          if (content.toLowerCase().includes(String(t).toLowerCase()) && !chosen.includes(String(t).toLowerCase())) {
            list.push(t);
          }
        });
      }
      return list;
    } catch (error) {
      console.error('Error calculating smart suggestions:', error);
      return [];
    }
  })();

  const handlePrioritySelect = (selectedPriority) => {
    if (!title.trim()) return;

    // Add success feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }

    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority: selectedPriority,
      tags,
      projectId: projectId || null,
      dependencies: depIds,
      dueDate: (dueDateEnabled && dueDateLocal) ? new Date(dueDateLocal) : null,
      deadlineType,
      status: 'not_started',
      completed: false,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setIsExpanded(false);
    setPriority(null);
    setTags([]);
    setTagInput('');
    setProjectId('');
    setDepIds([]);
    setDepSearch('');
    setDueDateEnabled(false);
    setDueDateLocal('');
    setDeadlineType('hard');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && title.trim() && !isExpanded) {
      e.preventDefault();
      setIsExpanded(true);
    } else if (e.key === 'Enter' && e.shiftKey && title.trim()) {
      // Shift+Enter creates with medium priority
      e.preventDefault();
      handlePrioritySelect('medium');
    }
  };

  return (
    <Motion.div
      className={`add-task-form ${isExpanded ? 'add-task-form-expanded' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="form-input-wrapper">
        <Motion.input
          type="text"
          placeholder="What needs your magic today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyPress}
          className="task-input"
          whileFocus={{ scale: 1.02 }}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <>
            <Motion.textarea
              placeholder="Add details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="task-description-input"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey && title.trim()) {
                  e.preventDefault();
                  handlePrioritySelect('medium');
                }
              }}
            />

            {/* Tag picker */}
            <Motion.div
              className="tag-picker"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <label className="priority-label">Add tags (press Enter):</label>
              <div className="tag-input-row">
                <input
                  className="tag-input"
                  type="text"
                  placeholder="e.g. Work, Personal, Health"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        addTag(tagInput);
                        setTagInput('');
                      }
                    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
                      // remove last tag quickly
                      removeTag(tags[tags.length - 1]);
                    }
                  }}
                />
              </div>
              {smartSuggested.length > 0 && (
                <div className="tag-suggestions" aria-label="Smart tag suggestions">
                  {smartSuggested.map((s) => (
                    <button
                      key={`smart-${s}`}
                      type="button"
                      className="tag-suggestion"
                      onClick={() => addTag(s)}
                      title="Suggested from your task text"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="tag-list">
                  {tags.map((t) => (
                    <span key={t} className="tag-chip" data-tag={t.toLowerCase()}>
                      {t}
                      <button className="tag-chip-remove" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="tag-suggestions">
                {/* Show configured tags from tagPrefs */}
                {(() => {
                  try {
                    const prefs = tagPrefs && typeof tagPrefs === 'object' ? tagPrefs : {};
                    const chosenLower = tags.map((x) => String(x).toLowerCase());
                    return Object.keys(prefs)
                      .filter((tag) => {
                        if (!tag || typeof tag !== 'string') return false;
                        const trimmed = tag.trim();
                        if (!trimmed) return false;
                        return !chosenLower.includes(trimmed.toLowerCase());
                      })
                      .map((tag) => {
                        const trimmed = tag.trim();
                        const pref = prefs[tag];
                        return (
                          <button
                            key={`configured-${trimmed}`}
                            type="button"
                            className="tag-suggestion tag-suggestion-configured"
                            onClick={() => addTag(trimmed)}
                            title="Your configured tag"
                          >
                            {pref?.icon && <span style={{ marginRight: 4 }}>{pref.icon}</span>}
                            {trimmed}
                          </button>
                        );
                      });
                  } catch (error) {
                    console.error('Error rendering configured tags:', error);
                    return null;
                  }
                })()}
                {/* Show default tags if not in tagPrefs */}
                {(() => {
                  try {
                    const prefs = tagPrefs && typeof tagPrefs === 'object' ? tagPrefs : {};
                    const chosenLower = tags.map((x) => String(x).toLowerCase());
                    const prefKeysLower = Object.keys(prefs).map((t) => String(t).toLowerCase());
                    return DEFAULT_TAGS.filter((s) => 
                      !chosenLower.includes(s.toLowerCase()) &&
                      !prefKeysLower.includes(s.toLowerCase())
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="tag-suggestion"
                        onClick={() => addTag(s)}
                      >
                        {s}
                      </button>
                    ));
                  } catch (error) {
                    console.error('Error rendering default tags:', error);
                    return null;
                  }
                })()}
              </div>
            </Motion.div>

            {projects.length > 0 && (
              <Motion.div
                className="project-selector"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.08 }}
              >
                <label className="priority-label">Assign to project:</label>
                <div className="project-selector-controls">
                  <select
                    className="project-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {onOpenProjects && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={onOpenProjects}
                    >
                      Manage
                    </button>
                  )}
                </div>
              </Motion.div>
            )}

            {/* Dependencies selector */}
            {existingTasks.length > 0 && (
              <Motion.div
                className="deps-selector"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.09 }}
              >
                <label className="priority-label">Depends on:</label>
                <input
                  type="text"
                  className="deps-search"
                  placeholder="Search tasks…"
                  value={depSearch}
                  onChange={(e) => setDepSearch(e.target.value)}
                />
                <div className="deps-list">
                  {existingTasks
                    .filter((t) => (t.title || '').toLowerCase().includes(depSearch.trim().toLowerCase()))
                    .map((t) => {
                      const checked = depIds.includes(t.id);
                      return (
                        <label key={t.id} className="deps-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setDepIds((prev) => {
                                const set = new Set(prev);
                                if (e.target.checked) set.add(t.id);
                                else set.delete(t.id);
                                return Array.from(set);
                              });
                            }}
                          />
                          <span className="deps-item-title">{t.title}</span>
                        </label>
                      );
                    })}
                  {existingTasks.filter((t) => (t.title || '').toLowerCase().includes(depSearch.trim().toLowerCase())).length === 0 && (
                    <div className="deps-empty">No matching tasks</div>
                  )}
                </div>
              </Motion.div>
            )}

            {/* Due date/time and deadline type */}
            <Motion.div
              className="due-editor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <label className="priority-label">Deadline</label>
              <div className="due-row">
                <label className="due-toggle">
                  <input
                    type="checkbox"
                    checked={dueDateEnabled}
                    onChange={(e) => setDueDateEnabled(e.target.checked)}
                  />
                  <span>Set due date/time</span>
                </label>
                {dueDateEnabled && (
                  <input
                    type="datetime-local"
                    className="due-input"
                    value={dueDateLocal}
                    onChange={(e) => setDueDateLocal(e.target.value)}
                  />
                )}
                <select
                  className="deadline-type"
                  value={deadlineType}
                  onChange={(e) => setDeadlineType(e.target.value)}
                >
                  <option value="hard">Hard</option>
                  <option value="soft">Soft</option>
                </select>
              </div>
            </Motion.div>
            
            <Motion.div
              className="priority-selector"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <label className="priority-label">Choose priority to create task:</label>
              <div className="priority-buttons">
                {PRIORITY_OPTIONS.map((option) => (
                  <Motion.button
                    key={option.value}
                    type="button"
                    className={`priority-button ${priority === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setPriority(option.value);
                      handlePrioritySelect(option.value);
                    }}
                    disabled={!title.trim()}
                    whileHover={title.trim() ? { scale: 1.02, y: -1 } : {}}
                    whileTap={title.trim() ? { scale: 0.98, y: 1 } : {}}
                    style={{
                      '--priority-color': option.color,
                    }}
                  >
                    <span className="priority-name">{option.label}</span>
                    <span className="priority-dust">{option.dust} dust</span>
                  </Motion.button>
                ))}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}
