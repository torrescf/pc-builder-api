import { Router } from 'express';

import {
  getComponents,
  getComponent,
  createComponentController,
  updateComponentController,
  deleteComponentController,
} from '../controllers/component.controller';

import { roleMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/', getComponents);
router.get('/:id', getComponent);

router.post(
  '/',
  roleMiddleware(['ADMIN']),
  createComponentController,
);

router.patch(
  '/:id',
  roleMiddleware(['ADMIN']),
  updateComponentController,
);

router.delete(
  '/:id',
  roleMiddleware(['ADMIN']),
  deleteComponentController,
);

export default router;