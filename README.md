# Task Manager — MERN Stack

A small full-stack task manager built with **MongoDB, Express, React and Node.js**. You can create, edit, delete, and filter tasks. Each task has a status, a priority, and an optional due date.

## Features

- Create, view, edit and delete tasks (full CRUD)
- Task fields: title, description, status (`todo` / `in-progress` / `done`), priority (`low` / `medium` / `high`), due date
- Change a task's status inline from the list
- Filter by status and priority; search by title (debounced, case-insensitive)
- Sort by newest, oldest, due date (tasks without a date go last) or priority (high → low)
- Server-side pagination with Previous / Next controls
- Stats dashboard (total, per-status counts, overdue count, completion progress bar) built with a MongoDB aggregation pipeline
- Overdue tasks are highlighted
- Server-side validation with clear error messages shown in the UI
- Protection against mass-assignment (only known fields are accepted) and regex injection in search
- Centralised error handling (validation errors, invalid IDs, malformed JSON, unknown routes)
- API integration tests using an in-memory MongoDB
- Responsive layout

## Technologies Used

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, plain CSS |
| Backend  | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Testing  | Node's built-in test runner, Supertest, mongodb-memory-server |

## Project Structure

```
.
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── api/tasks.js        # fetch wrapper for the REST API
│       ├── hooks/useTasks.js   # task state, loading/error handling, refetch after changes
│       ├── components/         # TaskForm, TaskList, TaskItem, FilterBar, StatsBar, Pagination
│       ├── constants.js        # status & priority options
│       └── App.jsx
└── server/                 # Express REST API
    ├── src/
    │   ├── config/db.js        # MongoDB connection
    │   ├── models/Task.js      # Mongoose schema + validation
    │   ├── controllers/        # request handlers
    │   ├── routes/             # route definitions
    │   ├── middleware/         # ObjectId validation, error handling
    │   ├── app.js              # Express app factory (used by tests)
    │   └── server.js           # entry point: connect DB + listen
    └── tests/tasks.test.js
```

## API Endpoints

| Method | Endpoint          | Description |
|--------|-------------------|-------------|
| GET    | `/api/health`     | Health check |
| GET    | `/api/tasks`      | List tasks (paginated). Optional query: `status`, `priority`, `search`, `sort` (`newest`/`oldest`/`dueDate`/`priority`), `page`, `limit` (max 50) |
| GET    | `/api/tasks/stats`| Counts by status, total and overdue |
| GET    | `/api/tasks/:id`  | Get one task |

Example response from `GET /api/tasks?sort=priority&page=1&limit=5`:

```json
{ "tasks": [ { "_id": "…", "title": "…", "priority": "high", "status": "todo" } ],
  "page": 1, "limit": 5, "total": 7, "totalPages": 2 }
```
| POST   | `/api/tasks`      | Create a task (`title` required) |
| PUT    | `/api/tasks/:id`  | Update a task |
| DELETE | `/api/tasks/:id`  | Delete a task |

## Setup and Installation

**Prerequisites:** Node.js 20+ and a MongoDB database. Either:
- a local MongoDB install, or
- a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
git clone <your-repo-url>
cd <repo-folder>

# Backend
cd server
npm install
cp .env.example .env      # then edit MONGO_URI if needed

# Frontend
cd ../client
npm install
```

### Environment variables (`server/.env`)

| Variable        | Example | Description |
|-----------------|---------|-------------|
| `PORT`          | `5000`  | API port |
| `MONGO_URI`     | `mongodb://127.0.0.1:27017/task-manager` | MongoDB connection string (local or Atlas) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## How to Run

Open two terminals:

```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — React app on http://localhost:5173
cd client
npm run dev
```

Then open **http://localhost:5173**. In development, Vite forwards `/api` requests to the Express server.

### Run the tests

```bash
cd server
npm test
```

The tests start an in-memory MongoDB instance, so they don't need a real database. The first run downloads a MongoDB binary.

### Production build

```bash
cd client
npm run build     # outputs to client/dist
```

---

## AI Development Experience

An AI coding assistant was used throughout development. The assistant generated code from my prompts. I then reviewed it, ran it, and checked the results against tests and a full-stack smoke test before keeping any change.

### Tasks where AI was used

1. **API creation:** Generating the Express REST API: Mongoose model with validation, controllers, routes, and middleware for invalid ObjectIds and centralised error handling.
2. **Component development:** Building the React components (`TaskForm`, `TaskItem`, `FilterBar`, `StatsBar`, `Pagination`) and the `useTasks` hook that manages loading, errors and refetching.
3. **Database integration:** Writing the MongoDB aggregation pipelines for custom sorting (priority order, undated tasks last), pagination with `$facet`, and the stats endpoint.
4. **Testing:** Writing integration tests with Supertest and an in-memory MongoDB, covering CRUD, validation, filtering, sorting, pagination and stats.
5. **Debugging:** Diagnosing failures found while running the tests and the app (see below).
