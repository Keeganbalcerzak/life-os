/**
 * Migration utility to move data from localStorage to Supabase
 * This should be called once when a user first logs in with Supabase
 */

export async function migrateLocalStorageToSupabase(supabaseClient) {
  // Get current user from session
  const { data: { user } } = await supabaseClient.auth.getSession();
  if (!user) {
    throw new Error('User must be authenticated to migrate data');
  }

  // Get localStorage data
  const activeTasks = JSON.parse(localStorage.getItem('lifeOS_activeTasks') || '[]');
  const completedTasks = JSON.parse(localStorage.getItem('lifeOS_completedTasks') || '[]');
  const reservoirLevel = parseInt(localStorage.getItem('lifeOS_reservoirLevel') || '0', 10);

  const migrated = {
    tasks: 0,
    errors: [],
  };

  try {
    // Migrate active tasks
    for (const task of activeTasks) {
      try {
        const { error } = await supabaseClient
          .from('tasks')
          .insert({
            id: task.id,
            user_id: user.id,
            title: task.title,
            description: task.description || null,
            status: task.status || 'not_started',
            priority: task.priority || 'medium',
            created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
            tags: task.tags || [],
            due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
            deadline_type: task.deadlineType || 'hard',
          });

        if (error) throw error;
        migrated.tasks++;
      } catch (err) {
        console.error('Error migrating task:', task.id, err);
        migrated.errors.push({ task: task.id, error: err.message });
      }
    }

    // Migrate completed tasks
    for (const task of completedTasks) {
      try {
        const { error } = await supabaseClient
          .from('tasks')
          .insert({
            id: task.id,
            user_id: user.id,
            title: task.title,
            description: task.description || null,
            status: 'done',
            priority: task.priority || 'medium',
            created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
            completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : new Date().toISOString(),
            tags: task.tags || [],
            due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
            deadline_type: task.deadlineType || 'hard',
          });

        if (error) throw error;
        migrated.tasks++;
      } catch (err) {
        console.error('Error migrating completed task:', task.id, err);
        migrated.errors.push({ task: task.id, error: err.message });
      }
    }

    // Migrate reservoir level
    if (reservoirLevel > 0) {
      const { error } = await supabaseClient
        .from('user_settings')
        .update({ reservoir_level: reservoirLevel })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error migrating reservoir level:', error);
        migrated.errors.push({ setting: 'reservoir_level', error: error.message });
      }
    }

    // Clear localStorage after successful migration
    if (migrated.tasks > 0 && migrated.errors.length === 0) {
      localStorage.removeItem('lifeOS_activeTasks');
      localStorage.removeItem('lifeOS_completedTasks');
      localStorage.removeItem('lifeOS_reservoirLevel');
      console.log('✅ Migration complete! localStorage cleared.');
    }

    return migrated;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
