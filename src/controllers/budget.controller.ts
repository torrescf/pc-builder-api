import { Request, Response } from 'express';

import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../services/budget.service';

import { createBudgetSchema, updateBudgetSchema } from '../schemas/budget.schema';

export async function getBudgets(
  _req: Request,
  res: Response
) {
  const budgets = await getAllBudgets();

  return res.json(budgets);
}

export async function getBudget(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const budget = await getBudgetById(id);

  return res.json(budget);
}

export async function createBudgetController(
  req: Request,
  res: Response
) {
  const data = createBudgetSchema.parse(req.body);

  const budget = await createBudget(data, req.user!.id);

  return res.status(201).json(budget);
}

export async function updateBudgetController(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const data = updateBudgetSchema.parse(req.body);

  const budget = await updateBudget(id, data);

  return res.json(budget);
}

export async function deleteBudgetController(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  await deleteBudget(id);

  return res.status(204).send();
}