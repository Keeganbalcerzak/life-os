import { motion as Motion } from 'framer-motion';

const getProjectColor = (project) => project?.color || '#6366f1';

const normalizeId = (id) => (typeof id === 'string' ? id : id?.toString?.() || '');

export default function ProjectFilter({
  projects = [],
  selectedProjects = [],
  onToggleProject,
  onClear,
  groupByProject,
  onToggleGroup,
  onOpenDashboard,
  stats = {},
}) {
  const selectedSet = new Set(selectedProjects.map(normalizeId));

  const mapByParent = projects.reduce((acc, project) => {
    const parent = normalizeId(project.parent_id ?? project.parentId ?? '');
    const key = parent || '__root__';
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(project);
    return acc;
  }, new Map());

  const order = [];
  const visit = (parentKey, depth) => {
    const children = mapByParent.get(parentKey) || [];
    children
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
      .forEach((child) => {
        const id = normalizeId(child.id);
        order.push({ project: child, depth, id });
        visit(id, depth + 1);
      });
  };
  visit('__root__', 0);

  const hasSelection = selectedSet.size > 0;

  return (
    <div className="filter-bar project-filter">
      <div className="filter-row">
        <span className="eyebrow">Filter by Projects</span>
        <div className="filter-actions">
          <button type="button" className="secondary-button" onClick={onOpenDashboard}>
            Manage Projects
          </button>
          {hasSelection && (
            <button type="button" className="filter-clear" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="filter-projects">
        {order.length === 0 ? (
          <div className="filter-empty">No projects yet</div>
        ) : (
          order.map(({ project, depth, id }) => {
            const isActive = selectedSet.has(id);
            const stat = stats[id] || {};
            const progressPct = Math.round((stat.progress ?? 0) * 100);
            const health = stat.health || {};
            const color = getProjectColor(project);
            return (
              <Motion.button
                key={id}
                type="button"
                className={`project-chip ${isActive ? 'active' : ''}`}
                data-project={id}
                onClick={() => onToggleProject?.(project)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  '--project-color': color,
                  paddingLeft: `${1.2 + depth * 1.2}rem`,
                }}
              >
                <span className="project-chip-color" aria-hidden style={{ background: color }} />
                <span className="project-chip-content">
                  <span className="project-chip-name">
                    {project.name}
                    {project.parent_id || project.parentId ? (
                      <span className="project-chip-sub" aria-label="Sub-project">
                        ↳
                      </span>
                    ) : null}
                  </span>
                  <span className="project-chip-meta">
                    <span className="project-chip-progress">
                      <span className="bar">
                        <span className="fill" style={{ width: `${progressPct}%` }} />
                      </span>
                      <span className="value">{progressPct}%</span>
                    </span>
                    {stat.activeCount !== undefined && stat.totalCount !== undefined && (
                      <span className="project-chip-count">
                        {stat.activeCount}/{stat.totalCount}
                      </span>
                    )}
                    {stat.dustGoal ? (
                      <span className="project-chip-goal">
                        ✨ {stat.dustProgress ?? 0}/{stat.dustGoal}
                      </span>
                    ) : null}
                    {health.label ? (
                      <span className={`project-chip-health ${health.status || 'stable'}`}>
                        {health.label}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Motion.button>
            );
          })
        )}
      </div>

      <label className="group-toggle">
        <input
          type="checkbox"
          checked={!!groupByProject}
          onChange={(e) => onToggleGroup?.(e.target.checked)}
        />
        <span>Group by project</span>
      </label>
    </div>
  );
}

