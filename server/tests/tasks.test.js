import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import Task from '../src/models/Task.js';

let mongod;
const app = createApp();

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

test('POST /api/tasks creates a task with defaults', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'Write README' });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Write README');
  assert.equal(res.body.status, 'todo');
  assert.equal(res.body.priority, 'medium');
});

test('POST /api/tasks rejects a missing title', async () => {
  const res = await request(app).post('/api/tasks').send({ description: 'no title' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.includes('Title is required'));
});

test('POST /api/tasks rejects an invalid status', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'x', status: 'nope' });
  assert.equal(res.status, 400);
});

test('GET /api/tasks filters by status and search', async () => {
  await Task.create([
    { title: 'Buy milk', status: 'todo' },
    { title: 'Buy bread', status: 'done' },
    { title: 'Call mom', status: 'todo' },
  ]);

  const byStatus = await request(app).get('/api/tasks?status=todo');
  assert.equal(byStatus.body.total, 2);

  const bySearch = await request(app).get('/api/tasks?search=buy');
  assert.equal(bySearch.body.total, 2);

  const combined = await request(app).get('/api/tasks?status=done&search=buy');
  assert.equal(combined.body.total, 1);
  assert.equal(combined.body.tasks[0].title, 'Buy bread');
});

test('GET /api/tasks treats search input literally', async () => {
  await Task.create([{ title: 'a.b' }, { title: 'axb' }]);
  const res = await request(app).get('/api/tasks?search=a.b');
  assert.equal(res.body.total, 1);
});

test('GET /api/tasks sorts by priority (high first)', async () => {
  await Task.create([
    { title: 'L', priority: 'low' },
    { title: 'H', priority: 'high' },
    { title: 'M', priority: 'medium' },
  ]);
  const res = await request(app).get('/api/tasks?sort=priority');
  assert.deepEqual(res.body.tasks.map((t) => t.title), ['H', 'M', 'L']);
  assert.equal(res.body.tasks[0].priorityRank, undefined, 'helper fields are not leaked');
});

test('GET /api/tasks sorts by due date with undated tasks last', async () => {
  await Task.create([
    { title: 'No date' },
    { title: 'Later', dueDate: '2030-05-01' },
    { title: 'Sooner', dueDate: '2030-01-01' },
  ]);
  const res = await request(app).get('/api/tasks?sort=dueDate');
  assert.deepEqual(res.body.tasks.map((t) => t.title), ['Sooner', 'Later', 'No date']);
});

test('GET /api/tasks paginates results', async () => {
  await Task.create(Array.from({ length: 12 }, (_, i) => ({ title: `Task ${i}` })));

  const first = await request(app).get('/api/tasks?limit=5');
  assert.equal(first.body.tasks.length, 5);
  assert.equal(first.body.total, 12);
  assert.equal(first.body.totalPages, 3);

  const last = await request(app).get('/api/tasks?limit=5&page=3');
  assert.equal(last.body.tasks.length, 2);

  const capped = await request(app).get('/api/tasks?limit=1000&page=-4');
  assert.equal(capped.body.limit, 50);
  assert.equal(capped.body.page, 1);
});

test('GET /api/tasks/stats counts tasks by status and overdue', async () => {
  await Task.create([
    { title: 'a', status: 'todo', dueDate: '2000-01-01' },
    { title: 'b', status: 'done', dueDate: '2000-01-01' },
    { title: 'c', status: 'in-progress', dueDate: '2999-01-01' },
    { title: 'd', status: 'todo' },
  ]);
  const res = await request(app).get('/api/tasks/stats');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    total: 4,
    byStatus: { todo: 2, 'in-progress': 1, done: 1 },
    overdue: 1,
  });
});

test('GET /api/tasks/stats returns zeros for an empty collection', async () => {
  const res = await request(app).get('/api/tasks/stats');
  assert.deepEqual(res.body, {
    total: 0,
    byStatus: { todo: 0, 'in-progress': 0, done: 0 },
    overdue: 0,
  });
});

test('PUT /api/tasks/:id updates allowed fields only', async () => {
  const task = await Task.create({ title: 'Old' });
  const res = await request(app)
    .put(`/api/tasks/${task._id}`)
    .send({ title: 'New', status: 'done', createdAt: '2000-01-01' });
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'New');
  assert.equal(res.body.status, 'done');
  assert.notEqual(new Date(res.body.createdAt).getFullYear(), 2000);
});

test('PUT /api/tasks/:id runs validators', async () => {
  const task = await Task.create({ title: 'Valid' });
  const res = await request(app).put(`/api/tasks/${task._id}`).send({ priority: 'urgent' });
  assert.equal(res.status, 400);
});

test('DELETE /api/tasks/:id removes the task', async () => {
  const task = await Task.create({ title: 'Temp' });
  const res = await request(app).delete(`/api/tasks/${task._id}`);
  assert.equal(res.status, 204);
  assert.equal(await Task.countDocuments(), 0);
});

test('returns 400 for an invalid id and 404 for a missing task', async () => {
  const invalid = await request(app).get('/api/tasks/not-an-id');
  assert.equal(invalid.status, 400);

  const missing = await request(app).get(`/api/tasks/${new mongoose.Types.ObjectId()}`);
  assert.equal(missing.status, 404);
});
