const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = data.errors?.join(', ');
    throw new Error(details || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export function fetchTasks(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
  ).toString();
  return request(`/tasks${params ? `?${params}` : ''}`);
}

export function fetchStats() {
  return request('/tasks/stats');
}

export function createTask(task) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(task) });
}

export function updateTask(id, changes) {
  return request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
