import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import RewardReservoir from './components/RewardReservoir';
import MagicalDust from './components/MagicalDust';
import CompletedTasks from './components/CompletedTasks';
import AuthScreen from './components/Auth/AuthScreen';
import TagFilter from './components/TagFilter';
import TagStats from './components/TagStats';
import ProjectFilter from './components/ProjectFilter';
import ProjectSummary from './components/ProjectSummary';
import ProjectDashboard from './pages/ProjectDashboard';
import TagSettings from './pages/TagSettings';
import { SparkleIcon, GalaxyIcon, CelebrationIcon } from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { migrateLocalStorageToSupabase } from './utils/migration';

// Priority dust multipliers
const PRIORITY_DUST = {
  low: 5,
  medium: 10,
  high: 20,
  milestone: 50,
};

const createEmptyProjectMeta = () => ({
  dustGoal: 0,
  phases: [],
  milestones: [],
  dependencies: [],
  templates: [],
  healthOverrides: null,
  notes: '',
});

const normalizeProjectMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return {};
  const safe = {};
  Object.entries(meta).forEach(([projectId, value]) => {
    if (projectId === '__templates') {
      safe[projectId] = value;
      return;
    }
    const base = createEmptyProjectMeta();
    if (value && typeof value === 'object') {
      safe[projectId] = {
        ...base,
        ...value,
        dustGoal: typeof value.dustGoal === 'number' ? value.dustGoal : base.dustGoal,
        phases: Array.isArray(value.phases) ? value.phases : base.phases,
        milestones: Array.isArray(value.milestones) ? value.milestones : base.milestones,
        dependencies: Array.isArray(value.dependencies) ? value.dependencies : base.dependencies,
        templates: Array.isArray(value.templates) ? value.templates : base.templates,
        healthOverrides: value.healthOverrides || base.healthOverrides,
        notes: typeof value.notes === 'string' ? value.notes : base.notes,
      };
    } else {
      safe[projectId] = base;
    }
  });
  return safe;
};

const normalizeProjectId = (id) => {
  if (id === null || id === undefined) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  try {
    if (typeof id === 'object') {
      if ('id' in id) return normalizeProjectId(id.id);
      if ('valueOf' in id) {
        const value = id.valueOf();
        if (value !== id) return normalizeProjectId(value);
      }
    }
  } catch {
    // ignore
  }
  return String(id);
};

const generateLocalProjectId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `local-project-${crypto.randomUUID()}`;
    }
  } catch {
    // ignore and fall back
  }
  const random = Math.floor(Math.random() * 1e6).toString(36);
  return `local-project-${Date.now().toString(36)}-${random}`;
};

function App() {
  const { user, loading: authLoading, usingSupabase, isAuthenticated, signOut } = useAuth();
  const [hasCheckedMigration, setHasCheckedMigration] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  
  // Use Supabase if authenticated, localStorage as fallback
  const [activeTasks, setActiveTasks] = useLocalStorage('lifeOS_activeTasks', []);
  const [completedTasks, setCompletedTasks] = useLocalStorage('lifeOS_completedTasks', []);
  const [reservoirLevel, setReservoirLevel] = useLocalStorage('lifeOS_reservoirLevel', 0);
  const [showDust, setShowDust] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [crackingTask, setCrackingTask] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTagSettings, setShowTagSettings] = useState(false);
  const reservoirRef = useRef(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [groupByTag, setGroupByTag] = useState(false);
  const [projects, setProjects] = useLocalStorage('lifeOS_projects', []);
  const [projectMeta, setProjectMeta] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lifeOS_projectMeta') || '{}');
      return normalizeProjectMeta(stored);
    } catch {
      return {};
    }
  });
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [groupByProject, setGroupByProject] = useState(false);
  const [showProjectDashboard, setShowProjectDashboard] = useState(false);
  const [tagPrefs, setTagPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_tagPrefs') || '{}');
    } catch {
      return {};
    }
  });
  const [userPreferences, setUserPreferences] = useState({});
  const [projectTemplates, setProjectTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_projectTemplates') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem('lifeOS_tagPrefs', JSON.stringify(tagPrefs || {})); } catch {}
  }, [tagPrefs]);

  useEffect(() => {
    try { localStorage.setItem('lifeOS_projectMeta', JSON.stringify(projectMeta || {})); } catch {}
  }, [projectMeta]);

  useEffect(() => {
    try { localStorage.setItem('lifeOS_projectTemplates', JSON.stringify(projectTemplates || [])); } catch {}
  }, [projectTemplates]);

  useEffect(() => {
    if (projects.length > 0) return;
    if (usingSupabase && isAuthenticated) return;
    const fallbackId = 'local-inbox';
    setProjects([{ id: fallbackId, name: 'Inbox', description: 'Default workspace', color: '#3b82f6', user_id: null, created_at: new Date().toISOString() }]);
    if (!projectMeta[fallbackId]) {
      setProjectMeta((prev) => {
        const next = { ...prev };
        next[fallbackId] = createEmptyProjectMeta();
        return next;
      });
    }
  }, [projects, setProjects, usingSupabase, isAuthenticated, projectMeta]);

  useEffect(() => {
    setSelectedProjects((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const validIds = new Set(projects.map((p) => normalizeProjectId(p.id)));
      const filtered = prev.filter((id) => validIds.has(normalizeProjectId(id)));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [projects, setSelectedProjects]);

  const syncReservoirLevel = useCallback(async (targetLevel) => {
    if (!usingSupabase || !isAuthenticated || !user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, reservoir_level: targetLevel });

    if (error) {
      console.error('Failed to sync reservoir level with Supabase:', error);
    }
  }, [usingSupabase, isAuthenticated, user]);

  const updateReservoirLevel = useCallback((valueOrUpdater) => {
    setReservoirLevel((prevLevel) => {
      const nextLevel = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prevLevel)
        : valueOrUpdater;

      syncReservoirLevel(nextLevel);
      return nextLevel;
    });
  }, [setReservoirLevel, syncReservoirLevel]);

  // Load tasks from Supabase - MUST be defined BEFORE useEffect that uses it
  const loadTasksFromSupabase = useCallback(async () => {
    if (!usingSupabase || !isAuthenticated || !user) return;

    try {
      // Load active tasks
      const result = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'done')
        .order('created_at', { ascending: false });

      const { data: tasks, error } = result;
      if (error) throw error;
      
      // Convert dates back
      const active = (tasks || []).map(task => ({
        ...task,
        createdAt: task.created_at ? new Date(task.created_at) : new Date(),
        projectId: task.project_id || null,
      }));
      setActiveTasks(active);

      // Load completed tasks
      const completedResult = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'done')
        .order('completed_at', { ascending: false });

      const { data: completed, error: completedError } = completedResult;
      if (completedError) throw completedError;
      
      const completedWithDates = (completed || []).map(task => ({
        ...task,
        createdAt: task.created_at ? new Date(task.created_at) : new Date(),
        completedAt: task.completed_at ? new Date(task.completed_at) : new Date(),
        projectId: task.project_id || null,
      }));
      setCompletedTasks(completedWithDates);

      const projectResult = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!projectResult.error && projectResult.data) {
        setProjects(projectResult.data);
      }

      // Load reservoir level and preferences
      const settingsResult = await supabase
        .from('user_settings')
        .select('reservoir_level, preferences')
        .eq('user_id', user.id)
        .single();

      const { data: settings, error: settingsError } = settingsResult;
      if (!settingsError && settings) {
        setReservoirLevel(settings.reservoir_level || 0);
        const prefs = settings.preferences || {};
        setUserPreferences(prefs);
        if (prefs && typeof prefs === 'object' && prefs.tagPrefs) {
          setTagPrefs(prefs.tagPrefs || {});
        }
      }
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
    }
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks, setReservoirLevel]);

  // Sync tag preferences to Supabase when authenticated
  useEffect(() => {
    const run = async () => {
      if (!usingSupabase || !isAuthenticated || !user) return;
      try {
        const merged = { ...(userPreferences || {}), tagPrefs: tagPrefs || {} };
        const { error } = await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, preferences: merged });
        if (error) throw error;
        setUserPreferences(merged);
      } catch (e) {
        console.error('Failed to sync tag preferences:', e);
      }
    };
    run();
    // stringify to detect structural changes without deep compare libs
  }, [JSON.stringify(tagPrefs), usingSupabase, isAuthenticated, user]);

  // Handle migration from localStorage to Supabase on first login (after loadTasksFromSupabase is defined)
  useEffect(() => {
    if (!usingSupabase || authLoading || hasCheckedMigration || !isAuthenticated) return;

    // Mark as checked immediately to prevent multiple prompts
    setHasCheckedMigration(true);

    const migrateData = async () => {
      // Check if we already have data in Supabase - if so, skip migration
      try {
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .limit(1);
        
        // If we already have tasks in Supabase, just load them
        if (existingTasks && existingTasks.length > 0) {
          loadTasksFromSupabase();
          return;
        }
      } catch (error) {
        console.error('Error checking existing tasks:', error);
      }

      // Only prompt if we have local data AND no Supabase data
      const hasLocalData = 
        localStorage.getItem('lifeOS_activeTasks') || 
        localStorage.getItem('lifeOS_completedTasks');
      
      if (hasLocalData) {
        const shouldMigrate = window.confirm(
          'Would you like to import your existing tasks from this browser?'
        );
        if (shouldMigrate) {
          try {
            await migrateLocalStorageToSupabase(supabase);
            // After migration, load from Supabase
            loadTasksFromSupabase();
          } catch (error) {
            console.error('Migration failed:', error);
            loadTasksFromSupabase();
          }
        } else {
          // User declined, just load from Supabase (which will be empty)
          loadTasksFromSupabase();
        }
      } else {
        // No local data, just load from Supabase
        loadTasksFromSupabase();
      }
    };

    migrateData();
  }, [usingSupabase, authLoading, isAuthenticated, hasCheckedMigration, loadTasksFromSupabase]);

  const handleAddTask = useCallback(async (task) => {
    const baseTask = {
      ...task,
      status: task.status || 'not_started',
      priority: task.priority || 'medium',
      createdAt: new Date(),
    };

    const applyAutomations = (t) => {
      try {
        const withTags = t.tags || [];
        let next = { ...t };
        withTags.forEach((tag) => {
          const pref = (tagPrefs || {})[tag];
          const a = pref?.automation;
          if (!a) return;
          const [kind, val] = String(a).split(':');
          if (kind === 'priority' && val) {
            next.priority = val;
          } else if (kind === 'status' && val && next.status !== 'done') {
            next.status = val;
          }
        });
        return next;
      } catch {
        return t;
      }
    };

    const autoTask = applyAutomations(baseTask);

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: autoTask.title,
            description: autoTask.description || null,
            status: autoTask.status,
            priority: autoTask.priority,
            tags: autoTask.tags || [],
            due_date: autoTask.dueDate || null,
            project_id: autoTask.projectId || null,
          })
          .select()
          .single();

        if (error) throw error;

        const supabaseTask = {
          ...autoTask,
          id: data.id,
          createdAt: data.created_at ? new Date(data.created_at) : autoTask.createdAt,
        };

        setActiveTasks((prev) => [supabaseTask, ...prev]);
        return;
      } catch (error) {
        console.error('Error creating task in Supabase:', error);
      }
    }

    const localTask = {
      ...autoTask,
      id: Date.now() + Math.random(),
    };
    setActiveTasks((prev) => [localTask, ...prev]);
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, tagPrefs]);

  const triggerDust = useCallback((amount = 10) => {
    setShowDust(true);
    setTimeout(() => setShowDust(false), 2000);
    return amount;
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!usingSupabase || !signOut || signingOut) return;
    setSigningOut(true);
    try {
      setActiveTasks([]);
      setCompletedTasks([]);
      setReservoirLevel(0);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSigningOut(false);
    }
  }, [usingSupabase, signOut, signingOut, setActiveTasks, setCompletedTasks, setReservoirLevel]);

  const handleStatusChange = useCallback((taskId, newStatus) => {
    const task = activeTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const dustAmount = PRIORITY_DUST[task.priority] || 10;
    const isCompleting = newStatus === 'done' && task.status !== 'done';
    const isUncompleting = task.status === 'done' && newStatus !== 'done';

    if (isCompleting) {
      setCrackingTask({ id: taskId, element: null });
      const completionTime = new Date();

      setTimeout(() => {
        setCompletedTasks((completed) => [
          {
            ...task,
            status: 'done',
            completedAt: completionTime,
          },
          ...completed,
        ]);

        setActiveTasks((active) => active.filter((t) => t.id !== taskId));
        updateReservoirLevel((level) => Math.min(100, level + dustAmount));
        triggerDust(dustAmount);
        setCrackingTask(null);
      }, 1100);

      if (usingSupabase && isAuthenticated && user) {
        (async () => {
          try {
            const { error } = await supabase
              .from('tasks')
              .update({
                status: 'done',
                completed_at: completionTime.toISOString(),
              })
              .eq('id', taskId)
              .eq('user_id', user.id);

            if (error) throw error;
          } catch (error) {
            console.error('Error updating task in Supabase:', error);
          }
        })();
      }

      return;
    }

    setActiveTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    if (isUncompleting) {
      updateReservoirLevel((level) => Math.max(0, level - dustAmount));
    }

    if (usingSupabase && isAuthenticated && user) {
      (async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : null,
            })
            .eq('id', taskId)
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating task in Supabase:', error);
        }
      })();
    }
  }, [activeTasks, triggerDust, updateReservoirLevel, usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks]);

  const handleDeleteTask = useCallback(async (taskId) => {
    setActiveTasks((prev) => prev.filter((task) => task.id !== taskId));
    setCompletedTasks((prev) => prev.filter((task) => task.id !== taskId));

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting task in Supabase:', error);
      }
    }
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks]);

  const handleUpdateTask = useCallback(async (taskId, updates) => {
    const current = activeTasks.find((t) => t.id === taskId) || completedTasks.find((t) => t.id === taskId);
    const applyAutomations = (t) => {
      try {
        const withTags = t.tags || [];
        let next = { ...t };
        withTags.forEach((tag) => {
          const pref = (tagPrefs || {})[tag];
          const a = pref?.automation;
          if (!a) return;
          const [kind, val] = String(a).split(':');
          if (kind === 'priority' && val) {
            next.priority = val;
          } else if (kind === 'status' && val && next.status !== 'done') {
            next.status = val;
          }
        });
        return next;
      } catch {
        return t;
      }
    };

    const merged = current ? { ...current, ...updates } : updates;
    const auto = applyAutomations(merged);

    setActiveTasks((prev) =>
      prev.map((task) => (task.id === taskId ? auto : task))
    );

    setCompletedTasks((prev) =>
      prev.map((task) => (task.id === taskId ? auto : task))
    );

    if (usingSupabase && isAuthenticated && user) {
      const payload = {};

      if (auto.title !== undefined) payload.title = auto.title;
      if (auto.description !== undefined) payload.description = auto.description || null;
      if (auto.priority !== undefined) payload.priority = auto.priority;
      if (auto.status !== undefined) payload.status = auto.status;
      if (auto.dueDate !== undefined) payload.due_date = auto.dueDate || null;
      if (auto.tags !== undefined) payload.tags = auto.tags;
      if (auto.projectId !== undefined) payload.project_id = auto.projectId || null;
      if (auto.completedAt) {
        payload.completed_at = auto.completedAt instanceof Date
          ? auto.completedAt.toISOString()
          : auto.completedAt;
      } else if (auto.status && auto.status !== 'done') {
        payload.completed_at = null;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      try {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating task in Supabase:', error);
      }
    }
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks, tagPrefs, activeTasks, completedTasks]);

  const handleReservoirFull = useCallback(() => {
    setShowReward(true);
    setTimeout(() => {
      setShowReward(false);
      updateReservoirLevel(0);
    }, 3000);
  }, [updateReservoirLevel]);

  const handleToggleProject = useCallback((project) => {
    const id = normalizeProjectId(project?.id ?? project);
    if (!id) return;
    setSelectedProjects((prev) => {
      const normalizedPrev = prev.map(normalizeProjectId);
      if (normalizedPrev.includes(id)) {
        return normalizedPrev.filter((pid) => pid !== id);
      }
      return [...normalizedPrev, id];
    });
  }, [setSelectedProjects]);

  const handleCreateProject = useCallback(async (input) => {
    const base = {
      name: (input?.name || '').trim(),
      description: (input?.description || '').trim(),
      color: input?.color || '#6366f1',
      parent_id: input?.parentId || input?.parent_id || null,
    };

    if (!base.name) {
      const err = new Error('Project name is required');
      err.code = 'invalid_project_name';
      throw err;
    }

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: base.name,
            description: base.description || null,
            color: base.color,
            parent_id: base.parent_id,
          })
          .select()
          .single();

        if (error) throw error;

        const newProject = {
          ...data,
          description: data.description || '',
          color: data.color || base.color,
        };

        setProjects((prev) => {
          const id = normalizeProjectId(newProject.id);
          const without = prev.filter((p) => normalizeProjectId(p.id) !== id);
          return [newProject, ...without];
        });

        setProjectMeta((prev) => {
          const id = normalizeProjectId(newProject.id);
          if (prev && prev[id]) return prev;
          return { ...(prev || {}), [id]: createEmptyProjectMeta() };
        });

        return newProject;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    }

    const localProject = {
      id: input?.id || generateLocalProjectId(),
      name: base.name,
      description: base.description,
      color: base.color,
      parent_id: base.parent_id,
      parentId: base.parent_id,
      created_at: new Date().toISOString(),
      user_id: null,
    };

    setProjects((prev) => [localProject, ...prev]);
    setProjectMeta((prev) => {
      if (prev && prev[localProject.id]) return prev;
      return { ...(prev || {}), [localProject.id]: createEmptyProjectMeta() };
    });
    return localProject;
  }, [usingSupabase, isAuthenticated, user, supabase, setProjects, setProjectMeta]);

  const handleUpdateProject = useCallback(async (projectId, updates = {}) => {
    const id = normalizeProjectId(projectId);
    if (!id) return null;

    const clean = {};
    if (updates.name !== undefined) clean.name = updates.name.trim();
    if (updates.description !== undefined) clean.description = updates.description.trim();
    if (updates.color !== undefined) clean.color = updates.color;
    if (updates.parentId !== undefined || updates.parent_id !== undefined) {
      clean.parent_id = updates.parentId ?? updates.parent_id ?? null;
    }

    const payload = {};
    if (clean.name !== undefined) payload.name = clean.name;
    if (clean.description !== undefined) payload.description = clean.description || null;
    if (clean.color !== undefined) payload.color = clean.color;
    if (clean.parent_id !== undefined) payload.parent_id = clean.parent_id;

    if (Object.keys(payload).length === 0) {
      return null;
    }

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        const updated = {
          ...data,
          description: data.description || '',
          color: data.color || clean.color,
        };

        setProjects((prev) =>
          prev.map((project) =>
            normalizeProjectId(project.id) === id ? { ...project, ...updated } : project
          )
        );

        return updated;
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    }

    setProjects((prev) =>
      prev.map((project) => {
        if (normalizeProjectId(project.id) !== id) return project;
        const next = { ...project };
        if (clean.name !== undefined) next.name = clean.name;
        if (clean.description !== undefined) next.description = clean.description;
        if (clean.color !== undefined) next.color = clean.color;
        if (clean.parent_id !== undefined) {
          next.parent_id = clean.parent_id;
          next.parentId = clean.parent_id;
        }
        return next;
      })
    );

    return null;
  }, [usingSupabase, isAuthenticated, user, supabase, setProjects]);

  const handleDeleteProject = useCallback(async (projectId) => {
    const id = normalizeProjectId(projectId);
    if (!id) return;

    if (projects.length <= 1) {
      const error = new Error('At least one project must remain');
      error.code = 'project_minimum';
      throw error;
    }

    const protectedIds = new Set(['local-inbox']);
    if (protectedIds.has(id)) {
      const error = new Error('The default Inbox project cannot be deleted.');
      error.code = 'project_protected';
      throw error;
    }

    const available = projects
      .map((project) => normalizeProjectId(project.id))
      .filter((pid) => pid && pid !== id);

    const fallbackId = available[0] || '';

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { error: taskUpdateError } = await supabase
          .from('tasks')
          .update({ project_id: fallbackId || null })
          .eq('project_id', id)
          .eq('user_id', user.id);

        if (taskUpdateError) throw taskUpdateError;

        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    }

    setProjects((prev) => prev.filter((project) => normalizeProjectId(project.id) !== id));

    setProjectMeta((prev) => {
      if (!prev || !prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const reassignTasks = (list) =>
      list.map((task) => {
        const projectKey = normalizeProjectId(task.projectId ?? task.project_id ?? '');
        if (projectKey !== id) return task;
        const nextProject = fallbackId || null;
        const updated = { ...task, projectId: nextProject };
        if ('project_id' in task) {
          updated.project_id = nextProject;
        }
        return updated;
      });

    setActiveTasks(reassignTasks);
    setCompletedTasks(reassignTasks);
  }, [projects, usingSupabase, isAuthenticated, user, supabase, setProjects, setProjectMeta, setActiveTasks, setCompletedTasks]);

  const projectStats = useMemo(() => {
    const stats = {};
    const ensure = (rawId) => {
      const key = normalizeProjectId(rawId);
      if (!key) return null;
      if (!stats[key]) {
        stats[key] = {
          totalCount: 0,
          activeCount: 0,
          completedCount: 0,
          focusCount: 0,
          milestoneCount: 0,
          dustGoal: 0,
          dustProgress: 0,
          phases: [],
          dependencies: [],
          milestones: [],
          nextMilestone: null,
          health: null,
        };
      }
      return stats[key];
    };

    activeTasks.forEach((task) => {
      const stat = ensure(task.projectId ?? task.project_id ?? '');
      if (!stat) return;
      stat.totalCount += 1;
      stat.activeCount += 1;
      if (task.status === 'focusing') stat.focusCount += 1;
      if (task.priority === 'milestone') stat.milestoneCount += 1;
    });

    completedTasks.forEach((task) => {
      const stat = ensure(task.projectId ?? task.project_id ?? '');
      if (!stat) return;
      stat.totalCount += 1;
      stat.completedCount += 1;
      if (task.priority === 'milestone') stat.milestoneCount += 1;
      stat.dustProgress += PRIORITY_DUST[task.priority] ?? 0;
    });

    projects.forEach((project) => {
      const key = normalizeProjectId(project.id);
      if (!key) return;
      const stat = ensure(key);
      if (!stat) return;
      const meta = projectMeta[key] || {};
      stat.dustGoal = typeof meta.dustGoal === 'number' ? meta.dustGoal : 0;
      stat.phases = Array.isArray(meta.phases) ? [...meta.phases] : [];
      stat.dependencies = Array.isArray(meta.dependencies) ? [...meta.dependencies] : [];
      stat.milestones = Array.isArray(meta.milestones) ? [...meta.milestones] : [];
      const milestoneNext = stat.milestones.find((m) => !m.completed && !m.done) || null;
      stat.nextMilestone = milestoneNext || meta.nextMilestone || null;
      if (meta.healthOverrides) {
        stat.health = meta.healthOverrides;
      }
    });

    Object.entries(stats).forEach(([key, stat]) => {
      if (stat.totalCount > 0) {
        stat.progress = stat.completedCount / stat.totalCount;
      } else {
        const milestones = stat.milestones || [];
        const totalMilestones = milestones.length;
        const done = milestones.filter((m) => m.completed || m.done).length;
        stat.progress = totalMilestones > 0 ? done / totalMilestones : 0;
      }

      if (!stat.health) {
        const ratio = stat.totalCount === 0 ? 1 : stat.completedCount / stat.totalCount;
        stat.health = ratio > 0.8
          ? { status: 'thriving', label: 'Thriving' }
          : ratio > 0.4
            ? { status: 'stable', label: 'Stable' }
            : { status: 'at-risk', label: 'At Risk' };
      }

      if (!stat.nextMilestone && stat.milestones.length > 0) {
        stat.nextMilestone = stat.milestones.find((m) => !m.completed && !m.done) || null;
      }

      if (typeof stat.dustGoal !== 'number') {
        stat.dustGoal = 0;
      }
    });

    return stats;
  }, [projects, projectMeta, activeTasks, completedTasks]);

  const inboxProjectId = useMemo(() => {
    const explicitInbox = projects.find((project) => normalizeProjectId(project.id) === 'local-inbox');
    if (explicitInbox) return normalizeProjectId(explicitInbox.id);
    const first = projects[0];
    return first ? normalizeProjectId(first.id) : '';
  }, [projects]);

  const selectedProjectIds = useMemo(
    () => selectedProjects.map(normalizeProjectId).filter(Boolean),
    [selectedProjects]
  );

  const projectFilteredTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return activeTasks;
    const selectedSet = new Set(selectedProjectIds);
    return activeTasks.filter((task) => {
      const key = normalizeProjectId(task.projectId ?? task.project_id ?? '');
      if (!key) return false;
      return selectedSet.has(key);
    });
  }, [activeTasks, selectedProjectIds]);

  const filteredCompletedTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return completedTasks;
    const selectedSet = new Set(selectedProjectIds);
    return completedTasks.filter((task) => {
      const key = normalizeProjectId(task.projectId ?? task.project_id ?? '');
      if (!key) return false;
      return selectedSet.has(key);
    });
  }, [completedTasks, selectedProjectIds]);

  const taskCounts = {
    not_started: projectFilteredTasks.filter((t) => t.status === 'not_started').length,
    started: projectFilteredTasks.filter((t) => t.status === 'started').length,
    focusing: projectFilteredTasks.filter((t) => t.status === 'focusing').length,
  };

  const totalActiveTasks = projectFilteredTasks.length;
  const completionRate = totalActiveTasks + filteredCompletedTasks.length > 0
    ? Math.round((filteredCompletedTasks.length / (filteredCompletedTasks.length + totalActiveTasks)) * 100)
    : 0;
  const focusingTasks = projectFilteredTasks.filter((t) => t.status === 'focusing');
  const energyRemaining = Math.max(0, 100 - reservoirLevel);

  // Tag filtering logic
  const normalized = (s) => (s || '').toString().trim().toLowerCase();
  const parentMap = (() => {
    const map = new Map();
    Object.entries(tagPrefs || {}).forEach(([k, v]) => {
      const parent = (v && v.parent) ? normalized(v.parent) : '';
      if (parent) map.set(normalized(k), parent);
    });
    return map;
  })();

  const isSelectedOrHasSelectedAncestor = (tag) => {
    const sel = new Set(selectedTags.map(normalized));
    let cur = normalized(tag);
    for (let i = 0; i < 8; i++) { // prevent cycles
      if (sel.has(cur)) return true;
      const next = parentMap.get(cur);
      if (!next) return false;
      cur = next;
    }
    return false;
  };

  const visibleTasks = selectedTags.length === 0
    ? projectFilteredTasks
    : projectFilteredTasks.filter((t) => (t.tags || []).some((x) => isSelectedOrHasSelectedAncestor(x)));

  const hasActiveFilters = selectedProjectIds.length > 0 || selectedTags.length > 0;

  // Get reservoir position for animations
  const getReservoirPosition = () => {
    if (reservoirRef.current) {
      const rect = reservoirRef.current.getBoundingClientRect();
      return {
        x: (rect.left + rect.width / 2) / window.innerWidth * 100,
        y: (rect.top + rect.height / 2) / window.innerHeight * 100,
      };
    }
    return { x: 50, y: 80 };
  };

  // Show auth screen if Supabase is configured but user is not authenticated
  // This check must come AFTER all hooks but BEFORE other early returns
  if (usingSupabase && !authLoading && !isAuthenticated) {
    return <AuthScreen />;
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <GalaxyIcon size={60} />
        </motion.div>
      </div>
    );
  }

  // Show completed tasks page
  if (showCompleted) {
    return (
      <div className="app">
        <CompletedTasks 
          completedTasks={completedTasks} 
          onBack={() => setShowCompleted(false)}
        />
      </div>
    );
  }

  if (showProjectDashboard) {
    return (
      <div className="app">
        <ProjectDashboard
          projects={projects}
          projectStats={projectStats}
          defaultProjectId={inboxProjectId}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onBack={() => setShowProjectDashboard(false)}
        />
      </div>
    );
  }

  // Show tag settings page
  if (showTagSettings) {
    return (
      <TagSettings
        tasks={activeTasks}
        tagPrefs={tagPrefs}
        onChange={setTagPrefs}
        onBack={() => setShowTagSettings(false)}
      />
    );
  }

  return (
    <div className="app">
      {/* Optimized background particles - fewer for performance */}
      <div className="background-particles">
        {[...Array(14)].map((_, i) => {
          const color = 'rgba(255,255,255,0.7)';
          const size = 2 + ((i * 7) % 2);
          
          return (
            <motion.div
              key={i}
              className="bg-particle"
              animate={{
                y: [0, -100],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 20 + i * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear",
              }}
              style={{
                position: 'fixed',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: color,
                left: `${(i * 12.5) % 100}%`,
                top: `${15 + (i * 7)}%`,
                boxShadow: 'none',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          );
        })}
      </div>

      {/* Magical dust overlay */}
      <AnimatePresence>
        {showDust && (
          <motion.div
            className="dust-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MagicalDust count={10} color="#fbbf24" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward celebration */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            className="reward-celebration"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <motion.h1
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <CelebrationIcon size={48} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '1rem' }} />
              Reward Unlocked!
              <CelebrationIcon size={48} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '1rem' }} />
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              You've filled your magical energy reservoir!
            </motion.p>
            <motion.button
              onClick={() => {
                setShowReward(false);
                updateReservoirLevel(0);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SparkleIcon size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }} />
              Claim Reward
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-content">
        <div className="app-toolbar">
          <div className="app-toolbar-right">
            <button
              className="secondary-button"
              onClick={() => setShowTagSettings(true)}
              type="button"
            >
              Tag Settings
            </button>
            {usingSupabase && isAuthenticated && (
              <>
                <span className="user-chip" title={user?.email || ''}>
                  {user?.email || 'Logged in'}
                </span>
                <button
                  className="logout-button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  type="button"
                >
                  {signingOut ? 'Signing out…' : 'Log Out'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clean Header */}
        <motion.header
          className="app-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="app-title"
            animate={{
              textShadow: [
                '0 0 20px rgba(139, 92, 246, 0.5)',
                '0 0 30px rgba(6, 182, 212, 0.7)',
                '0 0 20px rgba(139, 92, 246, 0.5)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Life OS
          </motion.h1>
          <p className="app-subtitle">Where planning meets magic</p>
        </motion.header>

        {/* Clean Stats */}
        <motion.section
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <header className="stats-header">
            <span className="eyebrow">Mission Pulse</span>
            <p className="stats-subtitle">A snapshot of your orbit right now</p>
          </header>
          <div className="stats-grid">
            <motion.div className="stat-card" key={`tasks-${totalActiveTasks}`}>
              <motion.div
                className="stat-value-large"
                key={totalActiveTasks}
                initial={{ scale: totalActiveTasks > 0 ? 1.2 : 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {totalActiveTasks}
              </motion.div>
              <div className="stat-label-large">Active Tasks</div>
            </motion.div>
            <motion.div className="stat-card" key={`rate-${completionRate}`}>
              <motion.div
                className="stat-value-large"
                key={completionRate}
                initial={{ scale: completionRate > 0 ? 1.2 : 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {completionRate}%
              </motion.div>
              <div className="stat-label-large">Complete</div>
            </motion.div>
            <motion.div className="stat-card highlight" key={`energy-${reservoirLevel}`}>
              <motion.div
                className="stat-value-large"
                key={reservoirLevel}
                initial={{ scale: reservoirLevel > 0 ? 1.2 : 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {reservoirLevel}
              </motion.div>
              <div className="stat-label-large">Energy</div>
            </motion.div>
          </div>
          {filteredCompletedTasks.length > 0 && (
            <motion.button
              className="view-completed-button"
              onClick={() => setShowCompleted(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View {filteredCompletedTasks.length} Completed Task{filteredCompletedTasks.length !== 1 ? 's' : ''}
            </motion.button>
          )}
        </motion.section>

        {/* Dual Column Layout */}
        <div className="main-layout">
          <div className="column column-primary">
            {/* Add Task Form */}
            <motion.section
              className="task-form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AddTaskForm
                onAdd={handleAddTask}
                availableTags={Object.keys(tagPrefs || {})}
                projects={projects}
                onOpenProjects={() => setShowProjectDashboard(true)}
              />
            </motion.section>

            {/* Tasks List - Only active tasks */}
            <motion.section
              className="tasks-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ProjectFilter
                projects={projects}
                selectedProjects={selectedProjectIds}
                onToggleProject={handleToggleProject}
                onClear={() => setSelectedProjects([])}
                groupByProject={groupByProject}
                onToggleGroup={setGroupByProject}
                onOpenDashboard={() => setShowProjectDashboard(true)}
                stats={projectStats}
              />
              <TagFilter
                tasks={projectFilteredTasks}
                selectedTags={selectedTags}
                onToggleTag={(tag) => {
                  const key = normalized(tag);
                  setSelectedTags((prev) => prev.map(normalized).includes(key)
                    ? prev.filter((t) => normalized(t) !== key)
                    : [...prev, tag]);
                }}
                onClear={() => setSelectedTags([])}
                groupByTag={groupByTag}
                onToggleGroup={setGroupByTag}
                tagPrefs={tagPrefs}
              />
              {visibleTasks.length === 0 ? (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
                  >
                    <GalaxyIcon size={80} />
                  </motion.div>
                  <h2>{hasActiveFilters ? 'No tasks match your filters' : 'Your journey begins here'}</h2>
                  <p>
                    {hasActiveFilters
                      ? 'Adjust your project or tag filters to reveal tasks.'
                      : 'Add your first task and watch the magic unfold'}
                  </p>
                </motion.div>
              ) : (
                <TaskList
                  tasks={visibleTasks}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  crackingTask={crackingTask}
                  reservoirPosition={getReservoirPosition()}
                  groupByTag={groupByTag}
                  tagPrefs={tagPrefs}
                  groupByProject={groupByProject}
                  projects={projects}
                  projectStats={projectStats}
                />
              )}
            </motion.section>
          </div>

          <div className="column column-secondary">
            {/* Reward Reservoir */}
            <motion.section
              className="reservoir-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div ref={reservoirRef}>
                <RewardReservoir
                  level={reservoirLevel}
                  maxLevel={100}
                  onFull={handleReservoirFull}
                />
              </div>
            </motion.section>

            <motion.section
              className="project-summary-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <ProjectSummary
                projects={projects}
                stats={projectStats}
                onOpenDashboard={() => setShowProjectDashboard(true)}
              />
            </motion.section>

            <motion.section
              className="insights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <header className="insights-header">
                <h2>Mission Control</h2>
                <span>Quick telemetry</span>
              </header>

              <div className="insight-grid">
                <div className="insight-tile" data-tone="not-started">
                  <span className="label">Not Started</span>
                  <strong>{taskCounts.not_started}</strong>
                </div>
                <div className="insight-tile" data-tone="started">
                  <span className="label">In Motion</span>
                  <strong>{taskCounts.started}</strong>
                </div>
                <div className="insight-tile" data-tone="focusing">
                  <span className="label">Laser Focus</span>
                  <strong>{taskCounts.focusing}</strong>
                </div>
              </div>

              <div className="insight-energy">
                <div>
                  <h3>Reservoir Charge</h3>
                  <p>
                    {energyRemaining === 0
                      ? 'Reservoir is brimming. Claim your reward!'
                      : `${energyRemaining} dust until your next reward.`}
                  </p>
                </div>
                <div className="energy-meter-wrapper">
                  <motion.div
                    className="energy-meter"
                    style={{ transformOrigin: 'left center' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: reservoirLevel / 100 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="insight-focus">
                <h3>Focus Queue</h3>
                {focusingTasks.length > 0 ? (
                  <ul>
                    {focusingTasks.slice(0, 3).map((task) => (
                      <li key={task.id}>
                        <span className="title">{task.title}</span>
                        {task.description && (
                          <span className="description">{task.description}</span>
                        )}
                      </li>
                    ))}
                    {focusingTasks.length > 3 && (
                      <li className="more">+{focusingTasks.length - 3} more in focus</li>
                    )}
                  </ul>
                ) : (
                  <div className="focus-empty">
                    <span>No focus tasks yet</span>
                    <p>Select a task to move it into your laser zone.</p>
                  </div>
                )}
              </div>

              <div className="insight-tagstats">
                <TagStats activeTasks={activeTasks} completedTasks={completedTasks} />
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
