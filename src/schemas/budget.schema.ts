import { z } from "zod";

export const createBudgetSchema = z.object({
  componentIds: z.array(z.string()).min(1),
  assemblyFee: z.number().nonnegative().optional(),
});

export const updateBudgetSchema = z.object({
  componentIds: z.array(z.string()).min(1).optional(),
  assemblyFee: z.number().nonnegative().optional(),
});

export const createComponentSchema = z.object({
  name: z.string().min(1, "O nome do componente é obrigatório"),

  type: z.enum([
    "CPU",
    "GPU",
    "MOTHERBOARD",
    "RAM",
    "STORAGE",
    "PSU",
    "CABINET",
  ]),

  price: z.number().positive("O preço deve ser maior que zero"),

  socket: z.string().optional().nullable(),

  ramType: z.string().optional().nullable(),

  powerDrawW: z.number().int().nonnegative().default(0),

  powerSupplyW: z.number().int().positive().optional().nullable(),
});

export const updateComponentSchema = createComponentSchema.partial();

export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
export const updateBudgetStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "APPROVED",
    "COMPLETED",
    "CANCELED",
  ]),
});

export type UpdateBudgetStatusInput = z.infer<
  typeof updateBudgetStatusSchema
>;
// Inferência de tipos TS automáticos a partir do Zod [46]
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
