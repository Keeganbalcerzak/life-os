import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
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
import DependencyPanel from './components/DependencyPanel';
import DueFilter from './components/DueFilter';
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
  const userPreferencesRef = useRef({});
  const [tagPrefs, setTagPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_tagPrefs') || '{}');
    } catch {
      return {};
    }
  });
  const [projects, setProjects] = useLocalStorage('lifeOS_projects', []);
  const [projectMeta, setProjectMeta] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_projectMeta') || '{}');
    } catch {
      return {};
    }
  });
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [groupByProject, setGroupByProject] = useState(false);
  const [showProjectDashboard, setShowProjectDashboard] = useState(false);
  const [projectTemplates, setProjectTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_projectTemplates') || '[]');
    } catch {
      return [];
    }
  });
  // Task dependencies mapping: { [taskId]: string[] }
  const [taskDeps, setTaskDeps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_taskDeps') || '{}');
    } catch {
      return {};
    }
  });
  // Simple toast notifications
  const [toasts, setToasts] = useState([]);
  // Due filters and notifications
  const [dueFilter, setDueFilter] = useState(() => {
    try {
      return localStorage.getItem('lifeOS_dueFilter') || 'all';
    } catch {
      return 'all';
    }
  });
  const [dueNotified, setDueNotified] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeOS_dueNotified') || '[]');
    } catch {
      return [];
    }
  });
  // Sort by due date toggle
  const [sortByDue, setSortByDue] = useState(() => {
    try {
      return localStorage.getItem('lifeOS_sortByDue') === '1';
    } catch {
      return false;
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_tagPrefs', JSON.stringify(tagPrefs || {}));
    } catch (error) {
      console.error('Failed to persist tag preferences:', error);
    }
  }, [tagPrefs]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_projectMeta', JSON.stringify(projectMeta || {}));
    } catch (error) {
      console.error('Failed to persist project metadata:', error);
    }
  }, [projectMeta]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_projectTemplates', JSON.stringify(projectTemplates || []));
    } catch (error) {
      console.error('Failed to persist project templates:', error);
    }
  }, [projectTemplates]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_taskDeps', JSON.stringify(taskDeps || {}));
    } catch (error) {
      console.error('Failed to persist task dependencies:', error);
    }
  }, [taskDeps]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_dueFilter', dueFilter || 'all');
    } catch {}
  }, [dueFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_dueNotified', JSON.stringify(dueNotified || []));
    } catch {}
  }, [dueNotified]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeOS_sortByDue', sortByDue ? '1' : '0');
    } catch {}
  }, [sortByDue]);

  // Initialize default project if none exist
  useEffect(() => {
    if (projects.length === 0 && !usingSupabase) {
      const defaultProject = {
        id: 'local-inbox',
        name: 'Inbox',
        description: 'Default workspace',
        color: '#3b82f6',
        user_id: null,
        created_at: new Date().toISOString(),
      };
      setProjects([defaultProject]);
      if (!projectMeta['local-inbox']) {
        setProjectMeta((prev) => ({ ...prev, 'local-inbox': {} }));
      }
    }
  }, [projects, usingSupabase, setProjects, projectMeta]);

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
        dueDate: task.due_date ? new Date(task.due_date) : null,
        deadlineType: task.deadline_type || 'hard',
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
        dueDate: task.due_date ? new Date(task.due_date) : null,
        deadlineType: task.deadline_type || 'hard',
      }));
      setCompletedTasks(completedWithDates);

      // Load projects
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
        userPreferencesRef.current = prefs;
        if (prefs && typeof prefs === 'object' && prefs.tagPrefs) {
          setTagPrefs(prefs.tagPrefs || {});
        }
        if (prefs && typeof prefs === 'object' && prefs.taskDeps) {
          setTaskDeps(prefs.taskDeps || {});
        }
      }
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
    }
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks, setReservoirLevel, setProjects]);

  // Sync tag preferences to Supabase when authenticated
  useEffect(() => {
    if (!usingSupabase || !isAuthenticated || !user) return;

    const syncPreferences = async () => {
      try {
        const merged = {
          ...(userPreferencesRef.current || {}),
          tagPrefs: tagPrefs || {},
          taskDeps: taskDeps || {},
        };
        const { error } = await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, preferences: merged });
        if (error) throw error;
        userPreferencesRef.current = merged;
      } catch (error) {
        console.error('Failed to sync tag preferences:', error);
      }
    };

    syncPreferences();
  }, [tagPrefs, taskDeps, usingSupabase, isAuthenticated, user]);

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
            deadline_type: autoTask.deadlineType || 'hard',
            project_id: autoTask.projectId || null,
          })
          .select()
          .single();

        if (error) throw error;

        const supabaseTask = {
          ...autoTask,
          id: data.id,
          createdAt: data.created_at ? new Date(data.created_at) : autoTask.createdAt,
          dueDate: data.due_date ? new Date(data.due_date) : autoTask.dueDate || null,
          deadlineType: data.deadline_type || autoTask.deadlineType || 'hard',
        };

        setActiveTasks((prev) => [supabaseTask, ...prev]);
        // Save dependencies mapping if provided
        if (Array.isArray(task.dependencies)) {
          setTaskDeps((prev) => ({ ...prev, [data.id]: task.dependencies }));
        }
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
    if (Array.isArray(task.dependencies)) {
      setTaskDeps((prev) => ({ ...prev, [localTask.id]: task.dependencies }));
    }
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

  // Project handlers
  const normalizeProjectId = useCallback((id) => {
    if (id === null || id === undefined) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'number') return id.toString();
    return String(id);
  }, []);

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
  }, [normalizeProjectId]);

  const handleCreateProject = useCallback(async (input) => {
    const base = {
      name: (input?.name || '').trim(),
      description: (input?.description || '').trim(),
      color: input?.color || '#6366f1',
    };
    if (!base.name) throw new Error('Project name is required');

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({ user_id: user.id, ...base })
          .select()
          .single();
        if (error) throw error;
        setProjects((prev) => [data, ...prev]);
        return data;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    }

    const localProject = {
      id: `local-project-${Date.now()}`,
      ...base,
      created_at: new Date().toISOString(),
      user_id: null,
    };
    setProjects((prev) => [localProject, ...prev]);
    return localProject;
  }, [usingSupabase, isAuthenticated, user, setProjects]);

  const handleUpdateProject = useCallback(async (projectId, updates) => {
    const id = normalizeProjectId(projectId);
    if (!id) return null;

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        setProjects((prev) => prev.map((p) => normalizeProjectId(p.id) === id ? data : p));
        return data;
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    }

    setProjects((prev) => prev.map((p) => {
      if (normalizeProjectId(p.id) === id) {
        return { ...p, ...updates };
      }
      return p;
    }));
    return null;
  }, [usingSupabase, isAuthenticated, user, normalizeProjectId, setProjects]);

  const handleDeleteProject = useCallback(async (projectId) => {
    const id = normalizeProjectId(projectId);
    if (!id || id === 'local-inbox') {
      throw new Error('Cannot delete default project');
    }

    if (usingSupabase && isAuthenticated && user) {
      try {
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

    setProjects((prev) => prev.filter((p) => normalizeProjectId(p.id) !== id));
    setActiveTasks((prev) => prev.map((t) => {
      if (normalizeProjectId(t.projectId ?? t.project_id ?? '') === id) {
        return { ...t, projectId: null, project_id: null };
      }
      return t;
    }));
  }, [usingSupabase, isAuthenticated, user, normalizeProjectId, setProjects, setActiveTasks]);

  // Project stats calculation
  const projectStats = useMemo(() => {
    const stats = {};
    projects.forEach((project) => {
      const id = normalizeProjectId(project.id);
      const meta = projectMeta[id] || {};
      const projectTasks = [...activeTasks, ...completedTasks].filter(
        (t) => normalizeProjectId(t.projectId ?? t.project_id ?? '') === id
      );
      
      const active = projectTasks.filter((t) => t.status !== 'done').length;
      const completed = projectTasks.filter((t) => t.status === 'done').length;
      const total = projectTasks.length;
      const focusCount = projectTasks.filter((t) => t.status === 'focusing').length;
      const milestoneCount = projectTasks.filter((t) => t.priority === 'milestone').length;
      
      // Calculate dust progress from completed tasks
      const dustProgress = completedTasks
        .filter((t) => normalizeProjectId(t.projectId ?? t.project_id ?? '') === id)
        .reduce((sum, task) => sum + (PRIORITY_DUST[task.priority] || 0), 0);
      
      const dustGoal = typeof meta.dustGoal === 'number' ? meta.dustGoal : 0;
      const phases = Array.isArray(meta.phases) ? meta.phases : [];
      const milestones = Array.isArray(meta.milestones) ? meta.milestones : [];
      const dependencies = Array.isArray(meta.dependencies) ? meta.dependencies : [];
      
      // Find next milestone
      const nextMilestone = milestones.find((m) => !m.completed && !m.done) || null;
      
      // Calculate health
      let health = meta.healthOverrides || null;
      if (!health) {
        const ratio = total === 0 ? 1 : completed / total;
        health = ratio > 0.8
          ? { status: 'thriving', label: 'Thriving' }
          : ratio > 0.4
            ? { status: 'stable', label: 'Stable' }
            : { status: 'at-risk', label: 'At Risk' };
      }
      
      // Calculate progress (use milestones if no tasks, otherwise use task completion)
      let progress = 0;
      if (total > 0) {
        progress = completed / total;
      } else if (milestones.length > 0) {
        const completedMilestones = milestones.filter((m) => m.completed || m.done).length;
        progress = completedMilestones / milestones.length;
      }
      
      stats[id] = {
        totalCount: total,
        activeCount: active,
        completedCount: completed,
        focusCount,
        milestoneCount,
        progress,
        dustGoal,
        dustProgress,
        phases,
        milestones,
        dependencies,
        nextMilestone,
        health,
      };
    });
    return stats;
  }, [projects, activeTasks, completedTasks, projectMeta, normalizeProjectId]);

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
        // Auto-unblock notifications for tasks that depended on this one
        try {
          const dependents = Object.entries(taskDeps || {})
            .filter(([, deps]) => Array.isArray(deps) && deps.includes(taskId))
            .map(([tid]) => tid);
          if (dependents.length > 0) {
            // Build done set including this newly completed id
            const doneSet = new Set([taskId, ...completedTasks.map((t) => t.id)]);
            dependents.forEach((depId) => {
              const depList = (taskDeps[depId] || []).filter(Boolean);
              const allDone = depList.every((d) => doneSet.has(d));
              if (allDone) {
                const unblockedTask = activeTasks.find((t) => String(t.id) === String(depId));
                const title = unblockedTask?.title || 'A task';
                pushToast(`${title} is now unblocked`);
              }
            });
          }
        } catch (e) {
          // noop
        }
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
    // Remove task from dependencies map (as key and from all lists)
    setTaskDeps((prev) => {
      const next = { ...prev };
      delete next[taskId];
      Object.keys(next).forEach((k) => {
        next[k] = (next[k] || []).filter((d) => d !== taskId);
      });
      return next;
    });

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
      if (auto.dueDate !== undefined) {
        payload.due_date = auto.dueDate ? (auto.dueDate instanceof Date ? auto.dueDate.toISOString() : auto.dueDate) : null;
      }
      if (auto.deadlineType !== undefined) payload.deadline_type = auto.deadlineType || 'hard';
      if (auto.tags !== undefined) payload.tags = auto.tags;
      if (auto.projectId !== undefined || auto.project_id !== undefined) {
        payload.project_id = auto.projectId ?? auto.project_id ?? null;
      }
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

  // Dependency helpers
  const setDependenciesForTask = useCallback((taskId, depIds) => {
    setTaskDeps((prev) => ({
      ...prev,
      [taskId]: Array.from(new Set((depIds || []).filter((id) => String(id) !== String(taskId))))
    }));
  }, []);

  const pushToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Deadline approaching notifications (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const now = new Date();
        const soonMs = 60 * 60 * 1000; // 1 hour
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const seen = new Set(dueNotified || []);

        (activeTasks || []).forEach((t) => {
          if (!t.dueDate) return;
          const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
          const idKey = String(t.id);
          const msLeft = due.getTime() - now.getTime();
          const isOverdue = msLeft < 0;
          const isToday = due.toDateString() === now.toDateString();
          const isSoon = msLeft > 0 && msLeft <= soonMs;
          if ((isSoon || (isToday && msLeft > 0 && msLeft <= (endOfDay.getTime() - now.getTime()))) && !seen.has(idKey)) {
            pushToast(`Upcoming: ${t.title} due ${due.toLocaleString()}`);
            seen.add(idKey);
          }
          if (isOverdue && !seen.has(idKey)) {
            pushToast(`Overdue: ${t.title}`);
            seen.add(idKey);
          }
        });

        const next = Array.from(seen);
        if (next.length !== (dueNotified || []).length) setDueNotified(next);
      } catch {}
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTasks, pushToast, dueNotified]);

  const handleReservoirFull = useCallback(() => {
    setShowReward(true);
    setTimeout(() => {
      setShowReward(false);
      updateReservoirLevel(0);
    }, 3000);
  }, [updateReservoirLevel]);

  // Get task counts by status (only active tasks)
  const taskCounts = {
    not_started: activeTasks.filter((t) => t.status === 'not_started').length,
    started: activeTasks.filter((t) => t.status === 'started').length,
    focusing: activeTasks.filter((t) => t.status === 'focusing').length,
  };

  const totalActiveTasks = activeTasks.length;
  const completionRate = totalActiveTasks > 0 
    ? Math.round((completedTasks.length / (completedTasks.length + totalActiveTasks)) * 100) 
    : 0;
  const focusingTasks = activeTasks.filter((t) => t.status === 'focusing');
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

  // Filter tasks by tags and projects
  let filteredTasks = selectedTags.length === 0
    ? activeTasks
    : activeTasks.filter((t) => (t.tags || []).some((x) => isSelectedOrHasSelectedAncestor(x)));

  if (selectedProjects.length > 0) {
    filteredTasks = filteredTasks.filter((t) => {
      const taskProjectId = normalizeProjectId(t.projectId ?? t.project_id ?? '');
      return selectedProjects.map(normalizeProjectId).includes(taskProjectId);
    });
  }

  // Due filter application
  const inThisWeek = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7; // 0 for Monday
    const monday = new Date(now);
    monday.setHours(0,0,0,0);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return d >= monday && d <= sunday;
  };
  const isOverdue = (t) => t.dueDate && (new Date(t.dueDate).getTime() < Date.now());
  if (dueFilter !== 'all') {
    filteredTasks = filteredTasks.filter((t) => {
      const due = t.dueDate ? (t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate)) : null;
      if (dueFilter === 'overdue') return due && due.getTime() < Date.now();
      if (dueFilter === 'today') return due && due.toDateString() === new Date().toDateString();
      if (dueFilter === 'week') return due && inThisWeek(due);
      if (dueFilter === 'none') return !due;
      return true;
    });
  }

  const visibleTasks = filteredTasks;

  // Optional sort by due date (ascending, no due dates last)
  const visibleTasksSorted = sortByDue
    ? [...visibleTasks].sort((a, b) => {
        const ad = a.dueDate ? (a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime()) : Infinity;
        const bd = b.dueDate ? (b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime()) : Infinity;
        if (ad !== bd) return ad - bd;
        const ac = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) : 0;
        const bc = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) : 0;
        return ac - bc;
      })
    : visibleTasks;

  // Build doneId set
  const doneIdSet = useMemo(() => new Set(completedTasks.map((t) => t.id)), [completedTasks]);

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
        <Motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <GalaxyIcon size={60} />
        </Motion.div>
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
          onDelete={handleDeleteTask}
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

  // Show project dashboard page
  if (showProjectDashboard) {
    return (
      <ProjectDashboard
        projects={projects}
        projectStats={projectStats}
        defaultProjectId="local-inbox"
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        projectTemplates={projectTemplates}
        onSaveTemplate={(pid) => handleSaveProjectTemplate(pid)}
        onCreateFromTemplate={(tplId) => handleCreateProjectFromTemplate(tplId)}
        projectMeta={projectMeta}
        onSetDependencies={(pid, deps) => handleSetProjectDependencies(pid, deps)}
        onBack={() => setShowProjectDashboard(false)}
      />
    );
  }

  return (
    <div className="app">
      {/* Background particles toned down */}
      <div className="background-particles">
        {[...Array(10)].map((_, i) => {
          const color = 'rgba(255,255,255,0.5)';
          const size = 2 + ((i * 5) % 2);
          return (
            <Motion.div
              key={i}
              className="bg-particle"
              animate={{ y: [0, -40], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 28 + i * 3, repeat: Infinity, delay: i * 2.5, ease: 'linear' }}
              style={{
                position: 'fixed',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: color,
                left: `${(i * 10.5) % 100}%`,
                top: `${20 + (i * 6)}%`,
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
          <Motion.div
            className="dust-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MagicalDust count={10} color="#fbbf24" />
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Reward celebration */}
      <AnimatePresence>
        {showReward && (
          <Motion.div
            className="reward-celebration"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Motion.h1
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
            </Motion.h1>
            <Motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              You've filled your magical energy reservoir!
            </Motion.p>
            <Motion.button
              onClick={() => {
                setShowReward(false);
                updateReservoirLevel(0);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SparkleIcon size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }} />
              Claim Reward
            </Motion.button>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="app-content">
        {usingSupabase && isAuthenticated && (
          <div className="app-toolbar">
            <div className="app-toolbar-right">
              <span className="user-chip" title={user?.email || ''}>
                {user?.email || 'Logged in'}
              </span>
              <button
                className="secondary-button"
                onClick={() => setShowTagSettings(true)}
              >
                Tag Settings
              </button>
              <button
                className="logout-button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Log Out'}
              </button>
            </div>
          </div>
        )}

        {/* Clean Header */}
        <Motion.header
          className="app-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Motion.h1
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
          </Motion.h1>
          <p className="app-subtitle">Where planning meets magic</p>
        </Motion.header>

        {/* Clean Stats */}
        <Motion.section
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <header className="stats-header">
            <span className="eyebrow">Mission Pulse</span>
            <p className="stats-subtitle">A snapshot of your orbit right now</p>
          </header>
          <div className="stats-plaque">
            <div className="stats-plaque-border" aria-hidden />
            <div className="stats-plaque-sparks" aria-hidden>
              <span className="spark s1" />
              <span className="spark s2" />
            </div>
            <div className="stats-grid">
              <div className="stat-card" key={`tasks-${totalActiveTasks}`}>
                <div className="stat-value-large">
                  {totalActiveTasks}
                </div>
              <div className="stat-label-large">Active Tasks</div>
            </div>
            <div className="stat-card" key={`rate-${completionRate}`}>
              <div className="stat-value-large">
                {completionRate}%
              </div>
              <div className="stat-label-large">Complete</div>
            </div>
            <div className="stat-card energy-card" key={`energy-${reservoirLevel}`}>
              <div className="stat-value-large">
                {reservoirLevel}
                </div>
                <div className="stat-label-large">Energy</div>
              </div>
            </div>
          </div>
          {completedTasks.length > 0 && (
            <Motion.button
              className="view-completed-button"
              onClick={() => setShowCompleted(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View {completedTasks.length} Completed Task{completedTasks.length !== 1 ? 's' : ''}
            </Motion.button>
          )}
        </Motion.section>

        {/* Dual Column Layout */}
        <div className="main-layout">
          <div className="column column-primary">
            {/* Add Task Form */}
            <Motion.section
              className="task-form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AddTaskForm 
                onAdd={handleAddTask}
                projects={projects}
                onOpenProjects={() => setShowProjectDashboard(true)}
                tagPrefs={tagPrefs}
                existingTasks={activeTasks}
              />
            </Motion.section>

            {/* Tasks List - Only active tasks */}
            <Motion.section
              className="tasks-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ProjectFilter
                projects={projects}
                selectedProjects={selectedProjects}
                onToggleProject={handleToggleProject}
                onClear={() => setSelectedProjects([])}
                groupByProject={groupByProject}
                onToggleGroup={setGroupByProject}
                onOpenDashboard={() => setShowProjectDashboard(true)}
                stats={projectStats}
              />
              <DueFilter
                value={dueFilter}
                onChange={setDueFilter}
              />
              <div className="sort-controls">
                <button
                  type="button"
                  className={`due-chip ${sortByDue ? 'active' : ''}`}
                  onClick={() => setSortByDue((v) => !v)}
                >
                  Sort by Due
                </button>
              </div>
              <TagFilter
                tasks={activeTasks}
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
              {activeTasks.length === 0 ? (
                <Motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
                  >
                    <GalaxyIcon size={80} />
                  </Motion.div>
                  <h2>Your journey begins here</h2>
                  <p>Add your first task and watch the magic unfold</p>
                </Motion.div>
              ) : (
                <TaskList
                  tasks={visibleTasksSorted}
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
                  allTasks={activeTasks}
                  taskDeps={taskDeps}
                  doneIdSet={doneIdSet}
                  onChangeDependencies={setDependenciesForTask}
                />
              )}
            </Motion.section>
          </div>

          <div className="column column-secondary">
            {/* Reward Reservoir */}
            <Motion.section
              className="reservoir-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="plaque">
                <div className="plaque-border" aria-hidden />
                <div ref={reservoirRef}>
                  <RewardReservoir
                    level={reservoirLevel}
                    maxLevel={100}
                    onFull={handleReservoirFull}
                  />
                </div>
              </div>
            </Motion.section>

            <Motion.section
              className="insights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <ProjectSummary
                projects={projects}
                stats={projectStats}
                onOpenDashboard={() => setShowProjectDashboard(true)}
              />
            </Motion.section>

            <Motion.section
              className="insights-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
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
                  <Motion.div
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

              <div className="insight-deps">
                <DependencyPanel
                  activeTasks={activeTasks}
                  completedTasks={completedTasks}
                  taskDeps={taskDeps}
                />
              </div>
            </Motion.section>
          </div>
        </div>
      </div>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item">{t.message}</div>
        ))}
      </div>
    </div>
  );
}

export default App;
