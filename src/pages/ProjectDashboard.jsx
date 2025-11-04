import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.header
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
      </motion.header>

      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            className={`project-message project-message-${message.type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        className="project-create-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Create a new project</h2>
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={createBusy}
            >
              {createBusy ? 'Creating…' : 'Create Project'}
            </motion.button>
          </div>
        </form>
      </motion.section>

      <section className="project-list">
        {sortedProjects.map((project) => {
          const id = normalizeProjectId(project.id);
          const draft = drafts[id] || {
            name: project.name || '',
            description: project.description || '',
            color: project.color || COLOR_OPTIONS[0],
          };
          const stats = projectStats[id] || {};
          const progressPct = Math.round((stats.progress || 0) * 100);
          const dustGoal = stats.dustGoal || 0;
          const dustProgress = stats.dustProgress || 0;
          const isProtected = id === defaultProjectId;
          const isSaving = pendingId === id && pendingAction === 'save';
          const isDeleting = pendingId === id && pendingAction === 'delete';

          return (
            <motion.article
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

              <div className="project-manage-actions">
                <motion.button
                  type="button"
                  className="secondary-button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  onClick={() => handleSave(project)}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </motion.button>
                <motion.button
                  type="button"
                  className="ghost-button"
                  whileHover={{ scale: isProtected ? 1 : 1.03 }}
                  whileTap={{ scale: isProtected ? 1 : 0.98 }}
                  disabled={isProtected || isDeleting}
                  onClick={() => handleDelete(project)}
                >
                  {isProtected ? 'Protected' : isDeleting ? 'Deleting…' : 'Delete'}
                </motion.button>
              </div>
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}
