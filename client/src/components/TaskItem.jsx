import { useState } from 'react';
import TaskForm from './TaskForm.jsx';
import { STATUSES } from '../constants.js';

function formatDate(iso) {
  // Dates are stored as UTC midnight, so format in UTC to avoid showing the previous day.
  return new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate.slice(0, 10) < today;
}

// Errors are displayed by the parent via useTasks, so they only need to be caught here.
const ignoreError = () => {};

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(changes) {
    await onUpdate(task._id, changes);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="task-item editing">
        <TaskForm initialTask={task} onSubmit={handleSave} onCancel={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    <li className={`task-item status-${task.status}`}>
      <div className="task-main">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        <div className="task-meta">
          <span className={`badge priority-${task.priority}`}>{task.priority}</span>
          {task.dueDate && (
            <span className={isOverdue(task) ? 'overdue' : ''}>
              Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onUpdate(task._id, { status: e.target.value }).catch(ignoreError)}
          aria-label="Change status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="secondary" onClick={() => setIsEditing(true)}>Edit</button>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) onDelete(task._id).catch(ignoreError);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
