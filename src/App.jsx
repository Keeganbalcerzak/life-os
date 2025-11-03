import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import RewardReservoir from './components/RewardReservoir';
import MagicalDust from './components/MagicalDust';
import CompletedTasks from './components/CompletedTasks';
import AuthScreen from './components/Auth/AuthScreen';
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
  const reservoirRef = useRef(null);

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
      }));
      setCompletedTasks(completedWithDates);

      // Load reservoir level
      const settingsResult = await supabase
        .from('user_settings')
        .select('reservoir_level')
        .eq('user_id', user.id)
        .single();

      const { data: settings, error: settingsError } = settingsResult;
      if (!settingsError && settings) {
        setReservoirLevel(settings.reservoir_level || 0);
      }
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
    }
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks, setReservoirLevel]);

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

    if (usingSupabase && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: baseTask.title,
            description: baseTask.description || null,
            status: baseTask.status,
            priority: baseTask.priority,
            tags: baseTask.tags || [],
            due_date: baseTask.dueDate || null,
          })
          .select()
          .single();

        if (error) throw error;

        const supabaseTask = {
          ...baseTask,
          id: data.id,
          createdAt: data.created_at ? new Date(data.created_at) : baseTask.createdAt,
        };

        setActiveTasks((prev) => [supabaseTask, ...prev]);
        return;
      } catch (error) {
        console.error('Error creating task in Supabase:', error);
      }
    }

    const localTask = {
      ...baseTask,
      id: Date.now() + Math.random(),
    };
    setActiveTasks((prev) => [localTask, ...prev]);
  }, [usingSupabase, isAuthenticated, user, setActiveTasks]);

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
    setActiveTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );

    setCompletedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );

    if (usingSupabase && isAuthenticated && user) {
      const payload = {};

      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description || null;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.completedAt) {
        payload.completed_at = updates.completedAt instanceof Date
          ? updates.completedAt.toISOString()
          : updates.completedAt;
      } else if (updates.status && updates.status !== 'done') {
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
  }, [usingSupabase, isAuthenticated, user, setActiveTasks, setCompletedTasks]);

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

  return (
    <div className="app">
      {/* Optimized background particles - fewer for performance */}
      <div className="background-particles">
        {[...Array(12)].map((_, i) => {
          const colors = ['#ffffff', '#e0e0e0', '#bfbfbf'];
          const color = colors[i % colors.length];
          const size = 2 + (i % 2);
          
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
        {usingSupabase && isAuthenticated && (
          <div className="app-toolbar">
            <div className="app-toolbar-right">
              <span className="user-chip" title={user?.email || ''}>
                {user?.email || 'Logged in'}
              </span>
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
          {completedTasks.length > 0 && (
            <motion.button
              className="view-completed-button"
              onClick={() => setShowCompleted(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View {completedTasks.length} Completed Task{completedTasks.length !== 1 ? 's' : ''}
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
              <AddTaskForm onAdd={handleAddTask} />
            </motion.section>

            {/* Tasks List - Only active tasks */}
            <motion.section
              className="tasks-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {activeTasks.length === 0 ? (
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
                  <h2>Your journey begins here</h2>
                  <p>Add your first task and watch the magic unfold</p>
                </motion.div>
              ) : (
                <TaskList
                  tasks={activeTasks}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  crackingTask={crackingTask}
                  reservoirPosition={getReservoirPosition()}
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
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
