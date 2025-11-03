import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, onStatusChange, onDelete, onUpdate, crackingTask, reservoirPosition }) {
  // Only show active tasks - no "done" status
  const notStartedTasks = tasks.filter((t) => t.status === 'not_started');
  const startedTasks = tasks.filter((t) => t.status === 'started');
  const focusingTasks = tasks.filter((t) => t.status === 'focusing');

  return (
    <div className="task-list">
      {notStartedTasks.length > 0 && (
        <div className="status-section" data-tone="not-started">
          <h3 className="section-title">Not Started</h3>
          <AnimatePresence mode="popLayout">
            {notStartedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onUpdate={onUpdate}
                crackingTask={crackingTask}
                reservoirPosition={reservoirPosition}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      

      {startedTasks.length > 0 && (
        <div className="status-section" data-tone="started">
          <h3 className="section-title">In Motion</h3>
          <AnimatePresence mode="popLayout">
            {startedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onUpdate={onUpdate}
                crackingTask={crackingTask}
                reservoirPosition={reservoirPosition}
              />
            ))}
          </AnimatePresence>
        </div>
      )}


      {focusingTasks.length > 0 && (
        <div className="status-section" data-tone="focusing">
          <h3 className="section-title">Focusing</h3>
          <AnimatePresence mode="popLayout">
            {focusingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onUpdate={onUpdate}
                crackingTask={crackingTask}
                reservoirPosition={reservoirPosition}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
