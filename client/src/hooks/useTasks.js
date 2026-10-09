import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/tasks.js';

const EMPTY_PAGE = { tasks: [], page: 1, total: 0, totalPages: 1 };

// Owns task state and keeps it in sync with the API for the given query
// (filters, sort, page and limit).
export function useTasks(query) {
  const [data, setData] = useState(EMPTY_PAGE);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.fetchTasks(query));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Stats ignore filters, so they only need refreshing on mount and after changes.
  const loadStats = useCallback(async () => {
    try {
      setStats(await api.fetchStats());
    } catch {
      // Not critical: the task list still works without stats.
    }
  }, []);

  useEffect(() => {
    // Debounce so typing in the search box doesn't fire a request per keystroke.
    const timer = setTimeout(loadTasks, 300);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Wraps a mutation so errors surface in the UI and the list is refetched,
  // which keeps filters, sort order and pagination correct after any change.
  const mutate = useCallback(
    async (action) => {
      setError('');
      try {
        await action();
        await Promise.all([loadTasks(), loadStats()]);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [loadTasks, loadStats]
  );

  return {
    ...data,
    stats,
    loading,
    error,
    addTask: (task) => mutate(() => api.createTask(task)),
    updateTask: (id, changes) => mutate(() => api.updateTask(id, changes)),
    deleteTask: (id) => mutate(() => api.deleteTask(id)),
  };
}
