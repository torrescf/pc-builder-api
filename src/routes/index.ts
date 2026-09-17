import { Router } from 'express';

import authRoutes from './auth.routes';
import budgetRoutes from './budget.routes';
import componentRoutes from './component.routes';

import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

router.use('/auth', authRoutes);

router.use('/budgets', authMiddleware, budgetRoutes);

router.use(
  '/components',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  componentRoutes,
);

export default router;