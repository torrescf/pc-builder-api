import { Request, Response } from 'express';

import {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
} from '../services/component.service';

import { createComponentSchema,updateComponentSchema} from '../schemas/budget.schema';

export async function getComponents(
  _req: Request,
  res: Response
) {
  const components = await getAllComponents();

  return res.json(components);
}

export async function getComponent(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const component = await getComponentById(id);

  return res.json(component);
}

export async function createComponentController(
  req: Request,
  res: Response
) {
  const data = createComponentSchema.parse(req.body);

  const component = await createComponent(data);

  return res.status(201).json(component);
}

export async function updateComponentController(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const data = updateComponentSchema.parse(req.body);

  const component = await updateComponent(id, data);

  return res.json(component);
}

export async function deleteComponentController(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  await deleteComponent(id);

  return res.status(204).send();
}