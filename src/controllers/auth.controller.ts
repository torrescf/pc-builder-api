import { Request, Response } from 'express';

import {
  registerUser,
  loginUser,
} from '../services/auth.service';

import {
  registerSchema,
  loginSchema,
} from '../schemas/auth.schema';

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const user = await registerUser(data);

  return res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const result = await loginUser(data);

  return res.status(200).json(result);
}