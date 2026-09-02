import { Router } from 'express';

import {
  getBudgets,
  getBudget,
  createBudgetController,
  updateBudgetController,
  deleteBudgetController,
} from '../controllers/budget.controller';

const router = Router();

router.get('/budgets', getBudgets);
router.get('/budgets/:id', getBudget);
router.post('/budgets', createBudgetController);
router.patch('/budgets/:id', updateBudgetController);
router.delete('/budget/:id', deleteBudgetController);

export default router;
