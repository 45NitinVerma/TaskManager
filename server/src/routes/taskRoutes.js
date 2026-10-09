import { Router } from 'express';
import {
  getTasks,
  getStats,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.route('/').get(getTasks).post(createTask);
// Must be registered before '/:id', otherwise "stats" would be treated as an id.
router.get('/stats', getStats);
router.route('/:id').all(validateObjectId).get(getTask).put(updateTask).delete(deleteTask);

export default router;
