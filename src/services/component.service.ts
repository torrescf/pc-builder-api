import { prisma } from '../lib/prisma';
import { NotFoundError } from '../helpers/api-errors';
import type { CreateComponentInput,UpdateComponentInput } from '../schemas/component.schema';

export async function getAllComponents() {
  return prisma.component.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getComponentById(id: string) {
  const component = await prisma.component.findUnique({
    where: {
      id,
    },
  });

  if (!component) {
    throw new NotFoundError('Componente não encontrado');
  }

  return component;
}

export async function createComponent(data: CreateComponentInput) {
  return prisma.component.create({
    data: {
      name: data.name,
      type: data.type,
      price: data.price,
      socket: data.socket,
      ramType: data.ramType,
      powerDrawW: data.powerDrawW,
      powerSupplyW: data.powerSupplyW,
    },
  });
}

export async function updateComponent(
  id: string,
  data: UpdateComponentInput
) {
  const component = await prisma.component.findUnique({
    where: {
      id,
    },
  });

  if (!component) {
    throw new NotFoundError('Componente não encontrado');
  }

  return prisma.component.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteComponent(id: string) {
  const component = await prisma.component.findUnique({
    where: {
      id,
    },
  });

  if (!component) {
    throw new NotFoundError('Componente não encontrado');
  }

  await prisma.component.delete({
    where: {
      id,
    },
  });
}