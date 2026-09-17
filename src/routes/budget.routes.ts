import { Router } from 'express';

import {
  getBudgets,
  getBudget,
  createBudgetController,
  updateBudgetController,
  deleteBudgetController,
} from '../controllers/budget.controller';

const router = Router();

router.get('/', getBudgets);
router.get('/:id', getBudget);
router.post('/', createBudgetController);
router.patch('/:id', updateBudgetController);
router.delete('/:id', deleteBudgetController);

export default router;