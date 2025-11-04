import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dust: 5, color: '#3b82f6' },
  { value: 'medium', label: 'Medium', dust: 10, color: '#06b6d4' },
  { value: 'high', label: 'High', dust: 20, color: '#facc15' },
  { value: 'milestone', label: 'Milestone', dust: 50, color: '#f97316' },
];

export default function AddTaskForm({ onAdd, availableTags = [], projects = [], onOpenProjects }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [projectId, setProjectId] = useState('');

  const DEFAULT_TAGS = Array.from(new Set(['Work', 'Personal', 'Health', 'Learning', ...availableTags]));

  // Simple content → tag heuristics
  const KEYWORD_MAP = [
    { tag: 'Work',      rx: /(work|meeting|email|project|deadline|client|sprint|stand.?up|slide|deck)/i },
    { tag: 'Personal',  rx: /(home|errand|family|friend|party|clean|laundry|call|birthday)/i },
    { tag: 'Health',    rx: /(health|workout|gym|run|walk|yoga|doctor|dentist|sleep|medicat|therapy|hydrate)/i },
    { tag: 'Learning',  rx: /(learn|study|course|class|read|tutorial|lesson|practice|research)/i },
  ];

  const projectOptions = projects || [];
  useEffect(() => {
    if (projectOptions.length === 0) {
      setProjectId('');
      return;
    }
    setProjectId((prev) => {
      if (prev && projectOptions.some((p) => p.id === prev)) return prev;
      return projectOptions[0]?.id || '';
    });
  }, [projectOptions]);

  const norm = (t) => t.trim().replace(/\s+/g, ' ');
  const addTag = (t) => {
    const val = norm(t);
    if (!val) return;
    if (tags.map((x) => x.toLowerCase()).includes(val.toLowerCase())) return;
    setTags((prev) => [...prev, val]);
  };
  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const content = `${title} ${description}`.trim();
  const smartSuggested = (() => {
    if (!content) return [];
    const pool = new Set();
    KEYWORD_MAP.forEach(({ tag, rx }) => {
      if (rx.test(content)) pool.add(tag);
    });
    // Don't suggest already chosen or typed as exact tag
    const chosen = tags.map((t) => t.toLowerCase());
    const list = Array.from(pool).filter((t) => !chosen.includes(t.toLowerCase()));
    // If nothing matched, suggest from defaults by fuzzy presence of tag name itself
    if (list.length === 0) {
      DEFAULT_TAGS.forEach((t) => {
        if (content.toLowerCase().includes(t.toLowerCase()) && !chosen.includes(t.toLowerCase())) list.push(t);
      });
    }
    return list;
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
    <motion.div
      className={`add-task-form ${isExpanded ? 'add-task-form-expanded' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="form-input-wrapper">
        <motion.input
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
            <motion.textarea
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
            <motion.div
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
                {DEFAULT_TAGS.filter((s) => !tags.map((x) => x.toLowerCase()).includes(s.toLowerCase())).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => addTag(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="project-selector"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="project-selector-row">
                <label className="priority-label">Assign to project:</label>
                <div className="project-selector-controls">
                  <select
                    className="project-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projectOptions.map((project) => (
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
              </div>
            </motion.div>

            <motion.div
              className="priority-selector"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <label className="priority-label">Choose priority to create task:</label>
              <div className="priority-buttons">
                {PRIORITY_OPTIONS.map((option) => (
                  <motion.button
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
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
