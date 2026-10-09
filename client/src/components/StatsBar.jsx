import { STATUSES } from '../constants.js';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const done = stats.byStatus.done;
  const percentDone = stats.total ? Math.round((done / stats.total) * 100) : 0;

  return (
    <section className="stats-bar" aria-label="Task statistics">
      <div className="stat">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total</span>
      </div>
      {STATUSES.map((s) => (
        <div key={s.value} className={`stat status-${s.value}`}>
          <span className="stat-value">{stats.byStatus[s.value]}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
      <div className={`stat ${stats.overdue ? 'stat-overdue' : ''}`}>
        <span className="stat-value">{stats.overdue}</span>
        <span className="stat-label">Overdue</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={percentDone}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tasks completed"
      >
        <div className="progress-fill" style={{ width: `${percentDone}%` }} />
        <span className="progress-label">{percentDone}% complete</span>
      </div>
    </section>
  );
}
