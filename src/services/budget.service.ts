import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../helpers/api-errors';
import { validateCompatibility } from './compatibility.service';
import type { CreateBudgetInput, UpdateBudgetInput, } from '../schemas/budget.schema';

export async function getAllBudgets() {
  return prisma.budget.findMany({
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

export async function createBudget(data: CreateBudgetInput) {
  const components = await prisma.component.findMany({
    where: {
      id: {
        in: data.componentIds,
      },
    },
  });
 
  

  if (components.length !== data.componentIds.length) {
    throw new NotFoundError('Um ou mais componentes não foram encontrados');
  }

  const compatibility = await validateCompatibility(data.componentIds);

if (!compatibility.compatible) {
  throw new BadRequestError(
    compatibility.errors.join('; ')
  );
}

  const laborPrice = data.assemblyFee ?? 150;

  const totalComponents = components.reduce(
    (total, component) => total + component.price,
    0
  );

  const totalPrice = totalComponents + laborPrice;

  return prisma.budget.create({
    data: {
      customerName: data.customerName,
      laborPrice,
      totalPrice,
      items: {
        create: components.map((component) => ({
          componentId: component.id,
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
  id: string,
  data: UpdateBudgetInput
) {
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

  let components = budget.items.map((item) => item.component);

  if (data.componentIds) {
    components = await prisma.component.findMany({
      where: {
        id: {
          in: data.componentIds,
        },
      },
    });

    if (components.length !== data.componentIds.length) {
      throw new NotFoundError(
        'Um ou mais componentes não foram encontrados'
      );
    }
  }

  const laborPrice = data.assemblyFee ?? budget.laborPrice;

  const totalComponents = components.reduce(
    (total, component) => total + component.price,
    0
  );

  const totalPrice = totalComponents + laborPrice;

  return prisma.$transaction(async (tx) => {
    if (data.componentIds) {
      await tx.budgetItem.deleteMany({
        where: {
          budgetId: id,
        },
      });
    }

    return tx.budget.update({
      where: {
        id,
      },
      data: {
        customerName:
          data.customerName ?? budget.customerName,

        laborPrice,
        totalPrice,

        ...(data.componentIds && {
          items: {
            create: components.map((component) => ({
              componentId: component.id,
              quantity: 1,
            })),
          },
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
  });
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