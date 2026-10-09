import { useEffect, useMemo, useState } from 'react';
import TaskForm from './components/TaskForm.jsx';
import FilterBar from './components/FilterBar.jsx';
import TaskList from './components/TaskList.jsx';
import StatsBar from './components/StatsBar.jsx';
import Pagination from './components/Pagination.jsx';
import { useTasks } from './hooks/useTasks.js';
import { PAGE_SIZE } from './constants.js';

export default function App() {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'newest' });
  const [page, setPage] = useState(1);

  // Memoised so useTasks only refetches when the query actually changes.
  const query = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page]);
  const { tasks, totalPages, total, stats, loading, error, addTask, updateTask, deleteTask } =
    useTasks(query);

  // Deleting the last task on the last page would otherwise leave an empty page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function handleFiltersChange(next) {
    setFilters(next);
    setPage(1);
  }

  return (
    <main className="container">
      <header>
        <h1>Task Manager</h1>
        <p className="subtitle">A simple MERN stack to-do app</p>
      </header>

      <StatsBar stats={stats} />

      <section className="card">
        <h2>New task</h2>
        <TaskForm onSubmit={addTask} />
      </section>

      <section className="card">
        <h2>
          Tasks <span className="count">({total})</span>
        </h2>
        <FilterBar filters={filters} onChange={handleFiltersChange} />
        {error && <p className="error">{error}</p>}
        {loading && tasks.length === 0 ? (
          <p className="empty">Loading…</p>
        ) : (
          <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </section>
    </main>
  );
}
