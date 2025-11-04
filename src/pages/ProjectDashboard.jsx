import { useState, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

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

const COLOR_OPTIONS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#14b8a6',
  '#8b5cf6',
  '#f97316',
];

const defaultCreateState = {
  name: '',
  description: '',
  color: COLOR_OPTIONS[0],
};

export default function ProjectDashboard({
  projects = [],
  projectStats = {},
  defaultProjectId = '',
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  projectTemplates = [],
  onSaveTemplate,
  onCreateFromTemplate,
  projectMeta = {},
  onSetDependencies,
  onBack,
}) {
  const [createForm, setCreateForm] = useState(defaultCreateState);
  const [createBusy, setCreateBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingId, setPendingId] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [drafts, setDrafts] = useState({});

  // Ensure we have local drafts for each project
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      const knownIds = new Set();
      projects.forEach((project) => {
        const id = normalizeProjectId(project.id);
        knownIds.add(id);
        if (!next[id]) {
          next[id] = {
            name: project.name || '',
            description: project.description || '',
            color: project.color || COLOR_OPTIONS[0],
          };
        }
      });
      Object.keys(next).forEach((key) => {
        if (!knownIds.has(key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [projects]);

  const sortedProjects = useMemo(() => {
    const list = projects
      .slice()
      .sort((a, b) => {
        const aId = normalizeProjectId(a.id);
        const bId = normalizeProjectId(b.id);
        if (aId === defaultProjectId) return -1;
        if (bId === defaultProjectId) return 1;
        return a.name.localeCompare(b.name);
      });
    return list;
  }, [projects, defaultProjectId]);

  const nextColor = useMemo(() => {
    const current = createForm.color;
    const idx = COLOR_OPTIONS.findIndex((c) => c === current);
    if (idx === -1) return COLOR_OPTIONS[0];
    return COLOR_OPTIONS[(idx + 1) % COLOR_OPTIONS.length];
  }, [createForm.color]);

  const showMessage = (type, text) => {
    setMessage({ type, text, id: Date.now() });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!onCreateProject) return;
    const name = createForm.name.trim();
    if (!name) {
      showMessage('error', 'Name your project to begin.');
      return;
    }

    try {
      setCreateBusy(true);
      await onCreateProject({
        name,
        description: createForm.description.trim(),
        color: createForm.color,
      });
      showMessage('success', 'Project created successfully.');
      setCreateForm({
        name: '',
        description: '',
        color: nextColor,
      });
    } catch (error) {
      showMessage('error', error?.message || 'Failed to create project.');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDraftChange = (projectId, field, value) => {
    const id = normalizeProjectId(projectId);
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (project) => {
    if (!onUpdateProject) return;
    const id = normalizeProjectId(project.id);
    const draft = drafts[id];
    if (!draft) return;

    const originalColor = project.color || COLOR_OPTIONS[0];
    const noChange =
      project.name === draft.name &&
      (project.description || '') === (draft.description || '') &&
      originalColor === draft.color;

    if (noChange) {
      showMessage('info', 'No changes to save.');
      return;
    }

    try {
      setPendingId(id);
      setPendingAction('save');
      await onUpdateProject(id, draft);
      showMessage('success', 'Project updated.');
    } catch (error) {
      showMessage('error', error?.message || 'Failed to update project.');
    } finally {
      setPendingId('');
      setPendingAction('');
    }
  };

  const handleDelete = async (project) => {
    if (!onDeleteProject) return;
    const id = normalizeProjectId(project.id);

    if (id === defaultProjectId) {
      showMessage('error', 'The default workspace cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(`Delete "${project.name}" and move its tasks to your inbox?`);
    if (!confirmed) return;

    try {
      setPendingId(id);
      setPendingAction('delete');
      await onDeleteProject(id);
      showMessage('success', `"${project.name}" removed.`);
    } catch (error) {
      showMessage('error', error?.message || 'Failed to delete project.');
    } finally {
      setPendingId('');
      setPendingAction('');
    }
  };

  return (
    <div className="project-dashboard">
      <Motion.header
        className="project-dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Project Workspaces</h1>
          <p>Organize your missions into focused constellations.</p>
        </div>
        <div className="project-dashboard-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back to Tasks
          </button>
        </div>
      </Motion.header>

      <AnimatePresence>
        {message && (
          <Motion.div
            key={message.id}
            className={`project-message project-message-${message.type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.text}
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.section
        className="project-create-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Create a new project</h2>
        {Array.isArray(projectTemplates) && projectTemplates.length > 0 && (
          <div className="project-templates-row">
            <label>
              Create from template
              <select
                onChange={async (e) => {
                  const val = e.target.value;
                  if (!val) return;
                  await onCreateFromTemplate?.(val);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="">Select a template…</option>
                {projectTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <form className="project-create-form" onSubmit={handleCreate}>
          <label>
            Project name
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g. Launch the Life OS beta"
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional context for this project"
            />
          </label>
          <div className="project-color-row">
            <span>Color</span>
            <div className="project-color-options">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`project-color-swatch ${
                    createForm.color === color ? 'project-color-swatch-active' : ''
                  }`}
                  style={{ '--swatch-color': color }}
                  onClick={() => setCreateForm((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          <div className="project-create-actions">
            <Motion.button
              className="secondary-button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={createBusy}
            >
              {createBusy ? 'Creating…' : 'Create Project'}
            </Motion.button>
          </div>
        </form>
      </Motion.section>

      <section className="project-list">
        {sortedProjects.map((project) => {
          const id = normalizeProjectId(project.id);
          const draft = drafts[id] || {
            name: project.name || '',
            description: project.description || '',
            color: project.color || COLOR_OPTIONS[0],
          };
          const stats = projectStats[id] || {};
          const deps = (projectMeta?.[id]?.dependencies || []).map(String);
          const progressPct = Math.round((stats.progress || 0) * 100);
          const dustGoal = stats.dustGoal || 0;
          const dustProgress = stats.dustProgress || 0;
          const isProtected = id === defaultProjectId;
          const isSaving = pendingId === id && pendingAction === 'save';
          const isDeleting = pendingId === id && pendingAction === 'delete';

          return (
            <Motion.article
              key={id}
              className={`project-manage-card ${isProtected ? 'project-manage-card-protected' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <header className="project-manage-header">
                <span className="project-dot" style={{ background: draft.color }} />
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => handleDraftChange(id, 'name', event.target.value)}
                  placeholder="Project name"
                />
              </header>
              <textarea
                value={draft.description}
                onChange={(event) => handleDraftChange(id, 'description', event.target.value)}
                placeholder="Describe the mission or goals"
                rows="2"
              />

              <div className="project-manage-meta">
                <div>
                  <span className="label">Active</span>
                  <strong>{stats.activeCount ?? 0}</strong>
                </div>
                <div>
                  <span className="label">Focus</span>
                  <strong>{stats.focusCount ?? 0}</strong>
                </div>
                <div>
                  <span className="label">Progress</span>
                  <strong>{progressPct}%</strong>
                </div>
                <div>
                  <span className="label">Dust</span>
                  <strong>
                    {dustProgress}
                    {dustGoal ? ` / ${dustGoal}` : ''}
                  </strong>
                </div>
              </div>

              <div className="project-manage-colors">
                <span>Color</span>
                <div className="project-color-options">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={`${id}-${color}`}
                      type="button"
                      className={`project-color-swatch ${
                        draft.color === color ? 'project-color-swatch-active' : ''
                      }`}
                      style={{ '--swatch-color': color }}
                      onClick={() => handleDraftChange(id, 'color', color)}
                    />
                  ))}
                </div>
              </div>

              <div className="project-manage-deps">
                <span>Depends on</span>
                <div className="deps-grid">
                  {sortedProjects
                    .filter((p) => normalizeProjectId(p.id) !== id)
                    .map((p) => {
                      const pid = normalizeProjectId(p.id);
                      const checked = deps.includes(pid);
                      return (
                        <label key={`dep-${id}-${pid}`} className="dep-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(deps);
                              if (e.target.checked) next.add(pid); else next.delete(pid);
                              onSetDependencies?.(id, Array.from(next));
                            }}
                          />
                          <span>{p.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="project-manage-actions">
                <Motion.button
                  type="button"
                  className="secondary-button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  onClick={() => handleSave(project)}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Motion.button>
                <Motion.button
                  type="button"
                  className="ghost-button"
                  whileHover={{ scale: isProtected ? 1 : 1.03 }}
                  whileTap={{ scale: isProtected ? 1 : 0.98 }}
                  disabled={isProtected || isDeleting}
                  onClick={() => handleDelete(project)}
                >
                  {isProtected ? 'Protected' : isDeleting ? 'Deleting…' : 'Delete'}
                </Motion.button>
                <Motion.button
                  type="button"
                  className="ghost-button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSaveTemplate?.(id)}
                >
                  Save as Template
                </Motion.button>
              </div>
            </Motion.article>
          );
        })}
      </section>
    </div>
  );
}
