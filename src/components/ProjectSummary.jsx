import { motion as Motion } from 'framer-motion';

const normalizeId = (id) => (typeof id === 'string' ? id : id?.toString?.() || '');

export default function ProjectSummary({ projects = [], stats = {}, onOpenDashboard }) {
  if (!projects.length) {
    return (
      <div className="project-summary empty">
        <div className="project-summary-header">
          <h2>Project Orbits</h2>
          <button type="button" className="secondary-button" onClick={onOpenDashboard}>
            Create Project
          </button>
        </div>
        <p className="project-summary-empty">No projects yet. Start one to anchor your tasks.</p>
      </div>
    );
  }

  const cards = projects.map((project) => {
    const id = normalizeId(project.id);
    const stat = stats[id] || {};
    return {
      project,
      stat,
      id,
      score: stat.health?.score ?? stat.progress ?? 0,
    };
  });

  cards.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="project-summary">
      <div className="project-summary-header">
        <h2>Project Orbits</h2>
        <div className="project-summary-actions">
          <button type="button" className="secondary-button" onClick={onOpenDashboard}>
            Manage Projects
          </button>
        </div>
      </div>

      <div className="project-summary-grid">
        {cards.map(({ project, stat, id }, index) => {
          const progressPct = Math.round((stat.progress ?? 0) * 100);
          const dustPct = stat.dustGoal ? Math.min(100, Math.round(((stat.dustProgress ?? 0) / stat.dustGoal) * 100)) : null;
          const upcoming = stat.nextMilestone;
          const phases = stat.phases || [];
          const completedPhases = phases.filter((p) => p.status === 'done' || p.completed).length;
          const hasPhases = phases.length > 0;
          const dependencies = stat.dependencies || [];
          const color = project.color || '#8b5cf6';
          const health = stat.health || {};

          return (
            <Motion.article
              key={id}
              className={`project-card project-card-${index % 3}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ '--project-color': color }}
            >
              <header className="project-card-header">
                <span className="project-card-dot" aria-hidden style={{ background: color }} />
                <div>
                  <h3>{project.name}</h3>
                  {project.description && <p>{project.description}</p>}
                </div>
                <div className={`project-card-health ${health.status || 'stable'}`}>
                  {health.label || 'Stable'}
                </div>
              </header>

              <div className="project-card-progress">
                <div className="progress-metric">
                  <span className="label">Progress</span>
                  <span className="value">{progressPct}%</span>
                  <div className="bar">
                    <span className="fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {dustPct !== null && (
                  <div className="progress-metric">
                    <span className="label">Dust Goal</span>
                    <span className="value">{stat.dustProgress ?? 0} / {stat.dustGoal}</span>
                    <div className="bar alt">
                      <span className="fill" style={{ width: `${dustPct}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="project-card-stats">
                <div>
                  <span className="label">Tasks</span>
                  <strong>{stat.totalCount ?? 0}</strong>
                </div>
                <div>
                  <span className="label">Focus</span>
                  <strong>{stat.focusCount ?? 0}</strong>
                </div>
                <div>
                  <span className="label">Milestones</span>
                  <strong>{stat.milestoneCount ?? 0}</strong>
                </div>
                <div>
                  <span className="label">Dependencies</span>
                  <strong>{dependencies.length}</strong>
                </div>
              </div>

              {hasPhases && (
                <div className="project-card-phases">
                  <span className="label">Phases</span>
                  <div className="phase-pills">
                    {phases.map((phase) => (
                      <span
                        key={phase.id || phase.name}
                        className={`phase-pill ${phase.status || (phase.completed ? 'done' : 'pending')}`}
                      >
                        {phase.name}
                      </span>
                    ))}
                  </div>
                  <div className="phase-meta">
                    {completedPhases}/{phases.length} complete
                  </div>
                </div>
              )}

              {upcoming && (
                <div className="project-card-milestone">
                  <span className="label">Next Milestone</span>
                  <div className="milestone-name">{upcoming.name}</div>
                  {upcoming.targetDate && (
                    <div className="milestone-date">
                      Target {new Date(upcoming.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </Motion.article>
          );
        })}
      </div>
    </div>
  );
}

