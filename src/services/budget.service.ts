import { prisma } from '../lib/prisma';
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
  UpdateBudgetStatusInput,
} from '../schemas/budget.schema';
import {
  NotFoundError,
  OutOfStockError,
  CompatibilityError,
} from '../helpers/api-errors';
import { ComponentType, BudgetStatus } from '@prisma/client';

export async function getAllBudgets(userId: string) {
  return prisma.budget.findMany({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          component: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getBudgetById(id: string) {
  const budget = await prisma.budget.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          component: true,
        },
      },
    },
  });

  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado');
  }

  return budget;
}

export async function createBudget(
  data: CreateBudgetInput,
  userId?: string,
) {
  const componentIds = data.componentIds;

  const components = await prisma.component.findMany({
    where: {
      id: { in: componentIds },
    },
  });

  if (components.length !== componentIds.length) {
    throw new NotFoundError(
      'Um ou mais componentes selecionados não foram encontrados no banco de dados',
    );
  }

  validateCompatibility(components);

  const laborPrice = data.assemblyFee ?? 150;

  const totalComponents = components.reduce(
    (total, component) => total + component.price,
    0,
  );

  const totalPrice = totalComponents + laborPrice;

  return prisma.budget.create({
    data: {
      customerName: data.customerName,
      laborPrice,
      totalPrice,
      userId: userId ?? null,
      items: {
        create: componentIds.map((componentId) => ({
          componentId,
          quantity: 1,
        })),
      },
    },
    include: {
      items: {
        include: {
          component: true,
        },
      },
    },
  });
}

export async function updateBudget(
  budgetId: string,
  data: UpdateBudgetInput,
) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      items: true,
    },
  });

  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado');
  }

  const componentIds = data.componentIds;

  if (!componentIds) {
    return prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(data.customerName !== undefined && {
          customerName: data.customerName,
        }),
        ...(data.assemblyFee !== undefined && {
          laborPrice: data.assemblyFee,
          totalPrice:
            budget.totalPrice -
            budget.laborPrice +
            data.assemblyFee,
        }),
      },
      include: {
        items: {
          include: {
            component: true,
          },
        },
      },
    });
  }

  const components = await prisma.component.findMany({
    where: {
      id: { in: componentIds },
    },
  });

  if (components.length !== componentIds.length) {
    throw new NotFoundError(
      'Um ou mais componentes selecionados não foram encontrados no banco de dados',
    );
  }

  validateCompatibility(components);

  const laborPrice = data.assemblyFee ?? budget.laborPrice;

  const totalComponents = components.reduce(
    (total, component) => total + component.price,
    0,
  );

  const totalPrice = totalComponents + laborPrice;

  return prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({
      where: {
        budgetId,
      },
    });

    return tx.budget.update({
      where: {
        id: budgetId,
      },
      data: {
        ...(data.customerName !== undefined && {
          customerName: data.customerName,
        }),
        laborPrice,
        totalPrice,
        items: {
          create: componentIds.map((componentId) => ({
            componentId,
            quantity: 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            component: true,
          },
        },
      },
    });
  });
}

export async function updateStatus(
  budgetId: string,
  data: UpdateBudgetStatusInput,
) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { items: { include: { component: true } } },
  });
  if (!budget) throw new NotFoundError('Orçamento não encontrado');
  if (budget.status === data.status) return budget;

  return prisma.$transaction(async (tx) => {
    const enteringApproved = budget.status === BudgetStatus.PENDING &&
      (data.status === BudgetStatus.APPROVED || data.status === BudgetStatus.COMPLETED);
    const canceling = (budget.status === BudgetStatus.APPROVED || budget.status === BudgetStatus.COMPLETED) &&
      data.status === BudgetStatus.CANCELED;

    for (const item of budget.items) {
      if (enteringApproved) {
        const component = await tx.component.findUnique({ where: { id: item.componentId } });
        if (!component || component.stockQuantity < item.quantity) {
          throw new OutOfStockError(`Não é possível aprovar. O componente "${item.component?.name}" ficou sem estoque suficiente.`);
        }
        await tx.component.update({ where: { id: item.componentId }, data: { stockQuantity: { decrement: item.quantity } } });
      } else if (canceling) {
        await tx.component.update({ where: { id: item.componentId }, data: { stockQuantity: { increment: item.quantity } } });
      }
    }
    return tx.budget.update({
      where: { id: budgetId }, data: { status: data.status },
      include: { items: { include: { component: true } } },
    });
  });
}

function validateCompatibility(components: any[]) {
  const cpu = components.find((component) => component.type === ComponentType.CPU);
  const motherboard = components.find((component) => component.type === ComponentType.MOTHERBOARD);
  const ram = components.find((component) => component.type === ComponentType.RAM);
  const psu = components.find((component) => component.type === ComponentType.PSU);
  if (cpu?.socket && motherboard?.socket && cpu.socket.toUpperCase() !== motherboard.socket.toUpperCase()) {
    throw new CompatibilityError(`Incompatibilidade de Socket: o processador usa "${cpu.socket}", mas a placa-mãe suporta "${motherboard.socket}".`);
  }
  if (ram?.ramType && motherboard?.ramType && ram.ramType.toUpperCase() !== motherboard.ramType.toUpperCase()) {
    throw new CompatibilityError(`Incompatibilidade de RAM: a memória é "${ram.ramType}", mas a placa-mãe exige "${motherboard.ramType}".`);
  }
  const power = components.reduce((total, component) => total + (component.powerDrawW || 0), 0);
  if (psu?.powerSupplyW && psu.powerSupplyW < Math.ceil(power * 1.2)) {
    throw new CompatibilityError(`Incompatibilidade de Fonte: são necessários ${Math.ceil(power * 1.2)}W, mas a fonte fornece ${psu.powerSupplyW}W.`);
  }
}

export async function deleteBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: {
      id,
    },
  });

  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado');
  }

  await prisma.budget.delete({
    where: {
      id,
    },
  });
}