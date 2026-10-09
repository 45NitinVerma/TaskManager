import Task, { STATUSES, PRIORITIES } from '../models/Task.js';

const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

// `priorityRank` and `noDueDate` are computed in the pipeline below, because
// a plain sort can't order priorities by importance or put missing due dates last.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  dueDate: { noDueDate: 1, dueDate: 1, createdAt: -1 },
  priority: { priorityRank: -1, createdAt: -1 },
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Only copy known fields from the request body so clients can't overwrite _id, timestamps, etc.
function pickFields(body) {
  return Object.fromEntries(
    Object.entries(body ?? {}).filter(([key]) => UPDATABLE_FIELDS.includes(key))
  );
}

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function notFound(res) {
  return res.status(404).json({ message: 'Task not found' });
}

// GET /api/tasks?status=&priority=&search=&sort=&page=&limit=
export async function getTasks(req, res) {
  const { status, priority, search, sort } = req.query;
  const filter = {};

  if (STATUSES.includes(status)) filter.status = status;
  if (PRIORITIES.includes(priority)) filter.priority = priority;
  if (typeof search === 'string' && search.trim()) {
    // Escape regex special characters so user input is matched literally.
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escaped, $options: 'i' };
  }

  const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const page = toPositiveInt(req.query.page, 1);

  const [result] = await Task.aggregate([
    { $match: filter },
    {
      $addFields: {
        priorityRank: { $indexOfArray: [PRIORITIES, '$priority'] },
        noDueDate: { $eq: [{ $ifNull: ['$dueDate', null] }, null] },
      },
    },
    { $sort: SORTS[sort] ?? SORTS.newest },
    {
      // Fetch one page of results and the total count in a single query.
      $facet: {
        tasks: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { priorityRank: 0, noDueDate: 0 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result.total[0]?.count ?? 0;
  res.json({
    tasks: result.tasks,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

// GET /api/tasks/stats
export async function getStats(req, res) {
  const [result] = await Task.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        overdue: [
          { $match: { status: { $ne: 'done' }, dueDate: { $lt: startOfTodayUTC() } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  // Start every status at 0 so the client always gets the same shape.
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const { _id, count } of result.byStatus) byStatus[_id] = count;

  res.json({
    total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
    byStatus,
    overdue: result.overdue[0]?.count ?? 0,
  });
}

// GET /api/tasks/:id
export async function getTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return notFound(res);
  res.json(task);
}

// POST /api/tasks
export async function createTask(req, res) {
  const task = await Task.create(pickFields(req.body));
  res.status(201).json(task);
}

// PUT /api/tasks/:id
export async function updateTask(req, res) {
  const task = await Task.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!task) return notFound(res);
  res.json(task);
}

// DELETE /api/tasks/:id
export async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return notFound(res);
  res.status(204).end();
}
