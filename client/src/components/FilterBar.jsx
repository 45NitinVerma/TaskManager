import { PRIORITIES, SORT_OPTIONS, STATUSES } from '../constants.js';

export default function FilterBar({ filters, onChange }) {
  function handleChange(e) {
    onChange({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div className="filter-bar">
      <input
        type="search"
        name="search"
        placeholder="Search by title…"
        value={filters.search}
        onChange={handleChange}
      />
      <select name="status" value={filters.status} onChange={handleChange} aria-label="Filter by status">
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <select name="priority" value={filters.priority} onChange={handleChange} aria-label="Filter by priority">
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <select name="sort" value={filters.sort} onChange={handleChange} aria-label="Sort tasks">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
