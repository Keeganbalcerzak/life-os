import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dust: 5, color: '#3b82f6' },
  { value: 'medium', label: 'Medium', dust: 10, color: '#06b6d4' },
  { value: 'high', label: 'High', dust: 20, color: '#facc15' },
];

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState(null);

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
      status: 'not_started',
      completed: false,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setIsExpanded(false);
    setPriority(null);
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
