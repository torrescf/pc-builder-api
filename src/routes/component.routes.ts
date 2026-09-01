import { Router } from 'express';

import {
  getComponents,
  getComponent,
  createComponentController,
  updateComponentController,
  deleteComponentController,
} from '../controllers/component.controller';

const router = Router();

router.get('/components', getComponents);

router.get('/components/:id', getComponent);

router.post('/components', createComponentController);

router.patch('/components/:id', updateComponentController);

router.delete('/components/:id', deleteComponentController)

export default router;