import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
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

export default function TaskItem({ task, onStatusChange, onDelete, onUpdate, crackingTask, reservoirPosition, tagPrefs = {}, projectInfo = null }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const statusButtonRef = useRef(null);
  const taskItemRef = useRef(null);
  const titleInputRef = useRef(null);
  const isCracking = crackingTask?.id === task.id;

  // Get container dimensions
  useEffect(() => {
    if (!taskItemRef.current) return;
    
    const updateSize = () => {
      const rect = taskItemRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
    });
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
    <motion.div
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
          containerSize={containerSize}
        />
      )}

      <div className="task-content">
        <motion.button
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
              <motion.div
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
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.button>

        <motion.div
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
              <div className="task-edit-actions">
                <motion.button
                  className="task-edit-save"
                  onClick={handleSave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!editedTitle.trim()}
                >
                  Save
                </motion.button>
                <motion.button
                  className="task-edit-cancel"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
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
              </div>
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
        </motion.div>

        <motion.button
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
        </motion.button>
      </div>

      {/* Magical glow effect when hovered */}
      {isHovered && task.status !== 'done' && (
        <motion.div
          className="task-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at center, ${statusColor}33, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}
