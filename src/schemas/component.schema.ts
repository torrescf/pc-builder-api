import { z } from 'zod';

export const createComponentSchema = z.object({
  name: z.string().min(1, 'O nome do componente é obrigatório'),

  type: z.enum([
    'CPU',
    'GPU',
    'MOTHERBOARD',
    'RAM',
    'STORAGE',
    'PSU',
    'CABINET',
  ]),

  price: z
    .number()
    .positive('O preço deve ser maior que zero'),

  socket: z.string().optional().nullable(),

  ramType: z.string().optional().nullable(),

  powerDrawW: z
    .number()
    .int()
    .nonnegative()
    .default(0),

  powerSupplyW: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export const updateComponentSchema =
  createComponentSchema.partial();

export type CreateComponentInput = z.infer<
  typeof createComponentSchema
>;

export type UpdateComponentInput = z.infer<
  typeof updateComponentSchema
>;