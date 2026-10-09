import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler, notFoundRoute } from './middleware/errorHandler.js';

// The app is built separately from server.js so tests can import it without opening a port.
export function createApp({ clientOrigin } = {}) {
  const app = express();

  app.use(cors(clientOrigin ? { origin: clientOrigin } : undefined));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/tasks', taskRoutes);

  app.use(notFoundRoute);
  app.use(errorHandler);

  return app;
}
