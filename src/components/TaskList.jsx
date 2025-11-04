import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, onStatusChange, onDelete, onUpdate, crackingTask, reservoirPosition, groupByTag = false, tagPrefs = {} }) {
  // Only show active tasks - no "done" status
  const notStartedTasks = tasks.filter((t) => t.status === 'not_started');
  const startedTasks = tasks.filter((t) => t.status === 'started');
  const focusingTasks = tasks.filter((t) => t.status === 'focusing');

  const getRoot = (tag) => {
    if (!tagPrefs) return tag || '';
    let cur = (tag || '').toString();
    const seen = new Set();
    for (let i = 0; i < 8; i++) {
      const pref = tagPrefs[cur];
      const parent = pref && pref.parent ? pref.parent : '';
      if (!parent) return cur;
      const next = parent.toString();
      if (seen.has(next)) return cur; // cycle protection
      seen.add(next);
      cur = next;
    }
    return cur;
  };

  const groupByFirstTag = (list) => {
    if (!groupByTag) return { __ungrouped: list };
    const groups = {};
    for (const task of list) {
      const first = (task.tags && task.tags[0]) ? String(task.tags[0]).trim() : '';
      const root = first ? getRoot(first) : '';
      const key = root || 'Untagged';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return groups;
  };

  const renderGroup = (groupName, items) => (
    <div className="tag-group-section" key={groupName}>
      {groupByTag && (
        <h4 className="tag-group-title">{groupName}</h4>
      )}
      <AnimatePresence mode="popLayout">
        {items.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onUpdate={onUpdate}
            crackingTask={crackingTask}
            reservoirPosition={reservoirPosition}
            tagPrefs={tagPrefs}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="task-list">
      {notStartedTasks.length > 0 && (
        <div className="status-section" data-tone="not-started">
          <h3 className="section-title">Not Started</h3>
          {Object.entries(groupByFirstTag(notStartedTasks)).map(([name, items]) => renderGroup(name, items))}
        </div>
      )}

      

      {startedTasks.length > 0 && (
        <div className="status-section" data-tone="started">
          <h3 className="section-title">In Motion</h3>
          {Object.entries(groupByFirstTag(startedTasks)).map(([name, items]) => renderGroup(name, items))}
        </div>
      )}


      {focusingTasks.length > 0 && (
        <div className="status-section" data-tone="focusing">
          <h3 className="section-title">Focusing</h3>
          {Object.entries(groupByFirstTag(focusingTasks)).map(([name, items]) => renderGroup(name, items))}
        </div>
      )}
    </div>
  );
}
