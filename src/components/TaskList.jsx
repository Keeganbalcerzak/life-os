import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';

const normalizeProjectId = (id) => {
  if (id === null || id === undefined) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  try {
    if (typeof id === 'object') {
      if ('id' in id) return normalizeProjectId(id.id);
      if (typeof id.valueOf === 'function') {
        const value = id.valueOf();
        if (value !== id) return normalizeProjectId(value);
      }
    }
  } catch {
    // ignore conversion errors
  }
  return String(id);
};

export default function TaskList({
  tasks,
  onStatusChange,
  onDelete,
  onUpdate,
  crackingTask,
  reservoirPosition,
  groupByTag = false,
  tagPrefs = {},
  groupByProject = false,
  projects = [],
  projectStats = {},
}) {
  const notStartedTasks = tasks.filter((task) => task.status === 'not_started');
  const startedTasks = tasks.filter((task) => task.status === 'started');
  const focusingTasks = tasks.filter((task) => task.status === 'focusing');

  const projectMap = new Map(
    projects.map((project) => [normalizeProjectId(project.id), project])
  );

  const getProjectDescriptor = (task) => {
    const projectId = normalizeProjectId(task.projectId ?? task.project_id ?? '');
    if (!projectId) {
      return {
        id: '',
        name: 'No Project',
        color: '#475569',
      };
    }
    const project = projectMap.get(projectId);
    return {
      id: projectId,
      name: project?.name || 'Project',
      color: project?.color || '#6366f1',
    };
  };

  const getRoot = (tag) => {
    if (!tagPrefs) return tag || '';
    let cur = (tag || '').toString();
    const seen = new Set();
    for (let i = 0; i < 8; i += 1) {
      const pref = tagPrefs[cur];
      const parent = pref && pref.parent ? pref.parent : '';
      if (!parent) return cur;
      const next = parent.toString();
      if (seen.has(next)) return cur;
      seen.add(next);
      cur = next;
    }
    return cur;
  };

  const groupByFirstTag = (list) => {
    if (!groupByTag) return { __ungrouped: list };
    const groups = {};
    list.forEach((task) => {
      const first = Array.isArray(task.tags) && task.tags[0] ? String(task.tags[0]).trim() : '';
      const root = first ? getRoot(first) : '';
      const key = root || 'Untagged';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  };

  const renderGroup = (groupName, items, projectContext) => {
    const baseKey = projectContext?.id || 'all-projects';
    return (
      <div className="tag-group-section" key={`${baseKey}-${groupName}`}>
        {groupByTag && <h4 className="tag-group-title">{groupName}</h4>}
        <AnimatePresence mode="popLayout">
          {items.map((task) => {
            const descriptor = projectContext || getProjectDescriptor(task);
            return (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onUpdate={onUpdate}
                crackingTask={crackingTask}
                reservoirPosition={reservoirPosition}
                tagPrefs={tagPrefs}
                projectInfo={descriptor}
              />
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const renderProjectSections = (list) => {
    if (!groupByProject) {
      return Object.entries(groupByFirstTag(list)).map(([name, items]) =>
        renderGroup(name, items)
      );
    }

    const groups = new Map();
    list.forEach((task) => {
      const descriptor = getProjectDescriptor(task);
      const key = descriptor.id || '__no_project__';
      if (!groups.has(key)) {
        groups.set(key, { descriptor, tasks: [] });
      }
      groups.get(key).tasks.push(task);
    });

    return Array.from(groups.values()).map(({ descriptor, tasks: groupTasks }) => {
      const stats = descriptor.id ? projectStats[descriptor.id] || {} : {};
      const progressPct = descriptor.id ? Math.round((stats.progress || 0) * 100) : null;

      return (
        <div className="project-group-section" key={descriptor.id || 'no-project'}>
          <header className="project-group-header">
            <span className="project-group-dot" style={{ background: descriptor.color }} />
            <div className="project-group-details">
              <span className="project-group-name">
                {descriptor.name}
                {!descriptor.id && <span className="project-group-sub">Unassigned</span>}
              </span>
              {descriptor.id && (
                <span className="project-group-stats">
                  <span>{stats.activeCount ?? groupTasks.length} active</span>
                  <span>{progressPct}% complete</span>
                </span>
              )}
            </div>
          </header>
          {Object.entries(groupByFirstTag(groupTasks)).map(([name, items]) =>
            renderGroup(name, items, descriptor)
          )}
        </div>
      );
    });
  };

  const renderStatusSection = (title, tone, list) => {
    if (list.length === 0) return null;
    return (
      <div className="status-section" data-tone={tone}>
        <h3 className="section-title">{title}</h3>
        {renderProjectSections(list)}
      </div>
    );
  };

  return (
    <div className="task-list">
      {renderStatusSection('Not Started', 'not-started', notStartedTasks)}
      {renderStatusSection('In Motion', 'started', startedTasks)}
      {renderStatusSection('Focusing', 'focusing', focusingTasks)}
    </div>
  );
}
