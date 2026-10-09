import { useState } from 'react';
import { PRIORITIES, STATUSES } from '../constants.js';

const EMPTY_TASK = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' };

// <input type="date"> needs YYYY-MM-DD, while the API returns a full ISO string.
function toFormValues(task) {
  if (!task) return EMPTY_TASK;
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
  };
}

export default function TaskForm({ initialTask, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initialTask));
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(initialTask);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!values.title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...values, dueDate: values.dueDate || null });
      if (!isEditing) setValues(EMPTY_TASK);
    } catch {
      // The error is displayed by the parent; keep the user's input so they can retry.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        name="title"
        placeholder="What needs to be done?"
        value={values.title}
        onChange={handleChange}
        maxLength={100}
        required
      />
      <textarea
        name="description"
        placeholder="Description (optional)"
        value={values.description}
        onChange={handleChange}
        maxLength={500}
        rows={2}
      />
      <div className="form-row">
        <label>
          Status
          <select name="status" value={values.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={values.priority} onChange={handleChange}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input type="date" name="dueDate" value={values.dueDate} onChange={handleChange} />
        </label>
      </div>
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting}>
          {isEditing ? 'Save' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
