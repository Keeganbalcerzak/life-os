import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import TaskDustTransformation from './TaskDustTransformation';

const STATUS_COLORS = {
  not_started: '#3b82f6',
  started: '#06b6d4',
  focusing: '#facc15',
  done: '#f59e0b',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  milestone: 'Milestone',
};

const PRIORITY_COLORS = {
  low: '#3b82f6',
  medium: '#06b6d4',
  high: '#facc15',
  milestone: '#f97316',
};

// Animation variants for each status change
const statusAnimations = {
  not_started: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, -5, 0],
    transition: { duration: 0.5 },
  },
  started: {
    scale: [1, 1.12, 1],
    rotate: [0, 360],
    transition: { duration: 0.6 },
  },
  focusing: {
    scale: [1, 1.2, 1],
    x: [0, 10, -10, 0],
    boxShadow: [
      '0 0 20px rgba(16, 185, 129, 0.3)',
      '0 0 40px rgba(16, 185, 129, 0.6)',
      '0 0 20px rgba(16, 185, 129, 0.3)',
    ],
    transition: { duration: 0.7 },
  },
  done: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.8 },
  },
};

function hexToRGBA(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
  const r = parseInt(m?.[1] || 'ff', 16);
  const g = parseInt(m?.[2] || 'ff', 16);
  const b = parseInt(m?.[3] || 'ff', 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TaskItem({ task, onStatusChange, onDelete, onUpdate, onUpdateEstimate, crackingTask, reservoirPosition, tagPrefs = {}, projectInfo = null, allTasks = [], dependencyIds = [], doneIdSet = new Set(), onChangeDependencies }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedEstimate, setEditedEstimate] = useState(() => (task.estimatedMinutes ? String(task.estimatedMinutes) : ''));
  const [depSearch, setDepSearch] = useState('');
  const [editedDueEnabled, setEditedDueEnabled] = useState(!!task.dueDate);
  const [editedDueLocal, setEditedDueLocal] = useState(() => {
    if (!task.dueDate) return '';
    const d = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  });
  const [editedDeadlineType, setEditedDeadlineType] = useState(task.deadlineType || 'hard');
  const statusButtonRef = useRef(null);
  const taskItemRef = useRef(null);
  const titleInputRef = useRef(null);
  const isCracking = crackingTask?.id === task.id;

  // Derived
  const dependencySet = useMemo(() => new Set((dependencyIds || []).map(String)), [dependencyIds]);
  const candidateDeps = useMemo(() => {
    const list = (allTasks || []).filter((t) => String(t.id) !== String(task.id));
    if (!depSearch.trim()) return list;
    const q = depSearch.trim().toLowerCase();
    return list.filter((t) => (t.title || '').toLowerCase().includes(q));
  }, [allTasks, task.id, depSearch]);
  const isBlocked = useMemo(() => {
    const deps = Array.isArray(dependencyIds) ? dependencyIds : [];
    if (deps.length === 0) return false;
    return deps.some((id) => !doneIdSet.has(id));
  }, [dependencyIds, doneIdSet]);

  // Due helpers
  const dueDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)) : null;
  const now = new Date();
  const overdue = !!dueDate && dueDate.getTime() < now.getTime();
  const dueToday = !!dueDate && dueDate.toDateString() === now.toDateString();
  const msLeft = dueDate ? dueDate.getTime() - now.getTime() : null;
  const soon = !!dueDate && msLeft > 0 && msLeft <= 60 * 60 * 1000; // within 1 hour

  const getButtonPosition = () => {
    if (!statusButtonRef.current || !taskItemRef.current) {
      return { x: 15, y: 50 }; // Default to left side where button typically is
    }
    
    const buttonRect = statusButtonRef.current.getBoundingClientRect();
    const taskRect = taskItemRef.current.getBoundingClientRect();
    
    // Get position relative to task item in percentages
    const x = ((buttonRect.left + buttonRect.width / 2 - taskRect.left) / taskRect.width) * 100;
    const y = ((buttonRect.top + buttonRect.height / 2 - taskRect.top) / taskRect.height) * 100;
    
    return { x, y };
  };

  const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.not_started;
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent triggering edit mode
    if (isAnimating || isEditing) return;
    // Prevent status changes when blocked
    if (isBlocked && task.status !== 'done') {
      // subtle shake animation as feedback
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
      return;
    }

    setIsAnimating(true);
    const statusOrder = ['not_started', 'started', 'focusing', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];

    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Small delay to allow animation to start
    setTimeout(() => {
      onStatusChange(task.id, nextStatus);
      setTimeout(() => setIsAnimating(false), 600);
    }, 50);
  };

  const handleTaskClick = () => {
    if (!isEditing && task.status !== 'done') {
      setIsEditing(true);
      setEditedTitle(task.title);
      setEditedDescription(task.description || '');
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!editedTitle.trim()) return;

    onUpdate(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim(),
      dueDate: editedDueEnabled && editedDueLocal ? new Date(editedDueLocal) : null,
      deadlineType: editedDeadlineType || 'hard',
    });
    // Update estimate mapping separately
    if (onUpdateEstimate) {
      const minutes = editedEstimate ? Number(editedEstimate) : NaN;
      onUpdateEstimate(task.id, minutes);
    }
    setIsEditing(false);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter' && !e.shiftKey && type === 'title') {
      e.preventDefault();
      if (editedTitle.trim()) {
        handleSave(e);
      }
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  const currentAnimation = statusAnimations[task.status] || statusAnimations.not_started;
  const buttonPosition = getButtonPosition();
  const formatMinutes = (mins) => {
    const m = Number(mins);
    if (!isFinite(m) || m <= 0) return '';
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h && mm) return `${h}h ${mm}m`;
    if (h) return `${h}h`;
    return `${mm}m`;
  };

  // Convert reservoir (viewport %) to local task container % to unify coordinates
  const reservoirLocalPosition = (() => {
    if (!taskItemRef.current || !reservoirPosition) return reservoirPosition;
    const rect = taskItemRef.current.getBoundingClientRect();
    const absX = (reservoirPosition.x / 100) * window.innerWidth;
    const absY = (reservoirPosition.y / 100) * window.innerHeight;
    const x = ((absX - rect.left) / rect.width) * 100;
    const y = ((absY - rect.top) / rect.height) * 100;
    return { x, y };
  })();

  return (
    <Motion.div
      ref={taskItemRef}
      className={`task-item ${task.status === 'done' ? 'completed' : ''}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        ...(isAnimating ? currentAnimation : {}),
      }}
      exit={{ opacity: 0, scale: 0.8, x: -100 }}
      whileHover={!isAnimating ? {
        scale: 1.01,
        y: -1,
        boxShadow: "0 8px 25px rgba(139, 92, 246, 0.15)"
      } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
      data-status={task.status}
      data-priority={task.priority}
      style={{
        '--status-color': statusColor,
        '--priority-color': priorityColor,
      }}
    >
      {/* Dust transformation animation when completing */}
      {isCracking && (
        <TaskDustTransformation
          isActive={isCracking}
          onComplete={() => {}}
          reservoirPosition={reservoirLocalPosition}
          originPosition={buttonPosition}
        />
      )}

      <div className="task-content">
        <Motion.button
          ref={statusButtonRef}
          className="task-status-button"
          onClick={handleStatusClick}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          aria-label={`Change status from ${task.status}`}
          style={{ '--status-color': statusColor }}
        >
          <div className="status-indicator">
            <AnimatePresence mode="wait">
              <Motion.div
                key={task.status}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {task.status === 'not_started' && '❖'}
                {task.status === 'started' && '⟐'}
                {task.status === 'focusing' && '✧'}
                {task.status === 'done' && '✓'}
              </Motion.div>
            </AnimatePresence>
          </div>
        </Motion.button>

        <Motion.div
          className="task-text"
          onClick={handleTaskClick}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
          animate={{
            color: task.status === 'done' ? 'var(--color-text-subtle)' : 'var(--color-text)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}
        >
          {isEditing ? (
            <div className="task-edit-form">
              <input
                ref={titleInputRef}
                type="text"
                className="task-edit-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'title')}
                placeholder="Task title"
                onClick={(e) => e.stopPropagation()}
              />
              <textarea
                className="task-edit-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'description')}
                placeholder="Description (optional)"
                rows="3"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Due + type editor */}
              <div className="task-deps-editor">
                <label className="deps-label">Deadline</label>
                <div className="due-row">
                  <label className="due-toggle">
                    <input
                      type="checkbox"
                      checked={editedDueEnabled}
                      onChange={(e) => setEditedDueEnabled(e.target.checked)}
                    />
                    <span>Set due date/time</span>
                  </label>
                  {editedDueEnabled && (
                    <input
                      type="datetime-local"
                      className="due-input"
                      value={editedDueLocal}
                      onChange={(e) => setEditedDueLocal(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <select
                    className="deadline-type"
                    value={editedDeadlineType}
                    onChange={(e) => setEditedDeadlineType(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="hard">Hard</option>
                    <option value="soft">Soft</option>
                  </select>
                </div>
                {/* Quick reschedule suggestions */}
                {editedDueEnabled && (
                  <div className="due-quick">
                    <span className="deps-label">Quick reschedule:</span>
                    <div className="due-quick-row">
                      {(() => {
                        const now = new Date();
                        const clone = (d) => new Date(d.getTime());
                        const mk = (label, fn) => (
                          <button key={label} type="button" className="secondary-button" onClick={(e) => { e.stopPropagation(); const d = fn(); const pad=(n)=>String(n).padStart(2,'0'); const yyyy=d.getFullYear(); const mm=pad(d.getMonth()+1); const dd=pad(d.getDate()); const hh=pad(d.getHours()); const mi=pad(d.getMinutes()); setEditedDueLocal(`${yyyy}-${mm}-${dd}T${hh}:${mi}`); }}>
                            {label}
                          </button>
                        );
                        const tonight = (() => { const d = clone(now); d.setHours(17,0,0,0); if (d < now) d.setDate(d.getDate()+1); return d;})();
                        const tomorrow9 = (() => { const d = clone(now); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); return d;})();
                        const plus1h = (() => { const d = clone(now); d.setHours(d.getHours()+1); return d;})();
                        const nextMon9 = (() => { const d = clone(now); const day = d.getDay(); const add = (8 - day) % 7 || 7; d.setDate(d.getDate()+add); d.setHours(9,0,0,0); return d;})();
                        return [
                          mk('+1h', () => plus1h),
                          mk('Tonight 5pm', () => tonight),
                          mk('Tomorrow 9am', () => tomorrow9),
                          mk('Next Mon 9am', () => nextMon9),
                        ];
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {/* Estimated duration editor */}
              <div className="task-deps-editor">
                <label className="deps-label">Estimated duration</label>
                <div className="due-row">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="due-input"
                    placeholder="minutes (e.g., 45)"
                    value={editedEstimate}
                    onChange={(e) => setEditedEstimate(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: 160 }}
                  />
                  <div className="due-quick-row" style={{ marginLeft: 8 }}>
                    {[15, 30, 45, 60, 90, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className="secondary-button"
                        onClick={(e) => { e.stopPropagation(); setEditedEstimate(String(m)); }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Dependencies selector */}
              {Array.isArray(allTasks) && allTasks.length > 1 && (
                <div className="task-deps-editor">
                  <label className="deps-label">Depends on</label>
                  <input
                    type="text"
                    className="deps-search"
                    placeholder="Search tasks…"
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="deps-list">
                    {candidateDeps.map((t) => {
                      const checked = dependencySet.has(String(t.id));
                      return (
                        <label key={t.id} className="deps-item" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(dependencySet);
                              if (e.target.checked) next.add(String(t.id));
                              else next.delete(String(t.id));
                              onChangeDependencies && onChangeDependencies(task.id, Array.from(next));
                            }}
                          />
                          <span className="deps-item-title">{t.title}</span>
                        </label>
                      );
                    })}
                    {candidateDeps.length === 0 && (
                      <div className="deps-empty">No matching tasks</div>
                    )}
                  </div>
                </div>
              )}
              <div className="task-edit-actions">
                <Motion.button
                  className="task-edit-save"
                  onClick={handleSave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!editedTitle.trim()}
                >
                  Save
                </Motion.button>
                <Motion.button
                  className="task-edit-cancel"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </Motion.button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-header">
                <h3>{task.title}</h3>
                <span
                  className="priority-badge"
                  style={{ '--priority-color': priorityColor }}
                >
                  {PRIORITY_LABELS[task.priority]}
                </span>
                {task.estimatedMinutes ? (
                  <span className="tag-chip" style={{ marginLeft: 8 }} title="Estimated duration">
                    ⏱ {formatMinutes(task.estimatedMinutes)}
                  </span>
                ) : null}
              </div>
              {/* Due status row */}
              {dueDate && (
                <div className="task-due-row">
                  <span className={`due-badge ${overdue ? 'overdue' : soon ? 'soon' : dueToday ? 'today' : ''} ${task.deadlineType === 'soft' ? 'soft' : 'hard'}`}>
                    Due {dueDate.toLocaleString()}{task.deadlineType === 'soft' ? ' (soft)' : ''}
                  </span>
                </div>
              )}
              {isBlocked && (
                <div className="task-blocked-row" title="This task is waiting on other tasks to finish">
                  <span className="blocked-badge">Blocked</span>
                  <div className="blocked-deps">
                    {(dependencyIds || []).filter((id) => !doneIdSet.has(id)).map((id) => {
                      const t = (allTasks || []).find((x) => String(x.id) === String(id));
                      const label = t?.title || `Task ${String(id).slice(0, 6)}`;
                      return (
                        <span key={id} className="blocked-chip">{label}</span>
                      );
                    })}
                  </div>
                </div>
              )}
              {projectInfo && (
                <div className="task-project-row">
                  <span
                    className="task-project-badge"
                    style={{ '--project-color': projectInfo.color || '#6366f1' }}
                  >
                    {projectInfo.name}
                  </span>
                </div>
              )}
              {Array.isArray(task.tags) && task.tags.length > 0 && (
                <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                  {task.tags.map((t) => {
                    const pref = tagPrefs?.[t] || {};
                    const bg = pref.color ? hexToRGBA(pref.color, 0.2) : undefined;
                    const bd = pref.color ? hexToRGBA(pref.color, 0.6) : undefined;
                    const parent = (tagPrefs?.[t]?.parent) || '';
                    const label = parent ? `${parent} › ${t}` : t;
                    return (
                      <span key={t} className="tag-chip" data-tag={(t || '').toString().toLowerCase()} style={{ background: bg, borderColor: bd }}>
                        {pref.icon ? <span style={{ marginRight: 6 }}>{pref.icon}</span> : null}
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
              {task.description && <p>{task.description}</p>}
              {task.status !== 'done' && (
                <div className="task-edit-hint">
                  Click to edit
                </div>
              )}
            </>
          )}
        </Motion.div>

        <Motion.button
          className="task-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Delete task"
        >
          ×
        </Motion.button>
      </div>

      {/* Magical glow effect when hovered */}
      {isHovered && task.status !== 'done' && (
        <Motion.div
          className="task-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at center, ${statusColor}33, transparent 70%)`,
          }}
        />
      )}
    </Motion.div>
  );
}
