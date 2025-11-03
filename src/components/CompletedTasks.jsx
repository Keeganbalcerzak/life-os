import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CompletedTasks({ completedTasks, onBack }) {
  const [expandedDate, setExpandedDate] = useState(null);

  // Group tasks by date
  const tasksByDate = completedTasks.reduce((acc, task) => {
    // Handle both Date objects and ISO strings from localStorage
    const date = task.completedAt instanceof Date 
      ? task.completedAt 
      : new Date(task.completedAt);
    const dateKey = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const formatTime = (dateValue) => {
    // Handle both Date objects and ISO strings
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="completed-tasks-page">
      <motion.div
        className="completed-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1 className="completed-title">Completed Tasks</h1>
        <p className="completed-subtitle">
          {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
        </p>
      </motion.div>

      {completedTasks.length === 0 ? (
        <motion.div
          className="empty-completed"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>No completed tasks yet</h2>
          <p>Complete your first task to see it here</p>
        </motion.div>
      ) : (
        <div className="completed-list">
          {sortedDates.map((dateKey) => (
            <motion.div
              key={dateKey}
              className="date-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                className="date-header"
                onClick={() => setExpandedDate(expandedDate === dateKey ? null : dateKey)}
              >
                <span className="date-title">{dateKey}</span>
                <span className="date-count">{tasksByDate[dateKey].length}</span>
              </button>

              {(expandedDate === dateKey || sortedDates.length === 1) && (
                <motion.div
                  className="date-tasks"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {tasksByDate[dateKey]
                    .sort((a, b) => {
                      const dateA = a.completedAt instanceof Date ? a.completedAt : new Date(a.completedAt);
                      const dateB = b.completedAt instanceof Date ? b.completedAt : new Date(b.completedAt);
                      return dateB - dateA;
                    })
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        className="completed-task-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="completed-task-content">
                          <h3 className="completed-task-title">{task.title}</h3>
                          {task.description && (
                            <p className="completed-task-description">{task.description}</p>
                          )}
                          <div className="completed-task-meta">
                            <span className="completed-time">{formatTime(task.completedAt)}</span>
                            <span
                              className="completed-priority"
                              style={{
                                color: 
                                  task.priority === 'high' ? 'var(--color-accent)' :
                                  task.priority === 'medium' ? 'var(--color-primary)' : 'var(--color-secondary)'
                              }}
                            >
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

