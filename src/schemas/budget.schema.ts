import { z } from "zod";

export const createBudgetSchema = z.object({
  customerName: z
    .string()
    .min(2, "O nome do cliente precisa ter no mínimo 2 caracteres"),
  componentIds: z
    .array(z.string().uuid("ID de componente inválido"))
    .min(1, "O orçamento precisa conter pelo menos 1 peça"),
  assemblyFee: z
    .number()
    .nonnegative("A taxa de montagem não pode ser negativa")
    .optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

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

// Inferência de tipos TS automáticos a partir do Zod [46]
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateComponentInput = z.infer<typeof createComponentSchema>;
