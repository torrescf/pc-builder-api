import { z } from 'zod';

export const createBudgetSchema = z.object({
  componentIds: z.array(z.string()).min(1),

  assemblyFee: z
    .number()
    .nonnegative()
    .optional(),
});

export const updateBudgetSchema = z
  .object({
    componentIds: z.array(z.string()).min(1).optional(),

    assemblyFee: z.number().nonnegative().optional(),
  })
  .refine(
    (data) =>
      data.componentIds !== undefined ||
      data.assemblyFee !== undefined,
    {
      message: 'Informe pelo menos um campo para atualizar',
    },
  );

export const updateBudgetStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'APPROVED',
    'COMPLETED',
    'CANCELED',
  ]),
});

export type CreateBudgetInput = z.infer<
  typeof createBudgetSchema
>;

export type UpdateBudgetInput = z.infer<
  typeof updateBudgetSchema
>;

export type UpdateBudgetStatusInput = z.infer<
  typeof updateBudgetStatusSchema
>;