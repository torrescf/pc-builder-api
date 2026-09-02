import { prisma } from '../lib/prisma';

export async function validateCompatibility(componentIds: string[]) {
  const components = await prisma.component.findMany({
    where: {
      id: {
        in: componentIds,
      },
    },
  });

  const errors: string[] = [];

  const cpu = components.find((component) => component.type === 'CPU');
  const motherboard = components.find(
    (component) => component.type === 'MOTHERBOARD'
  );
  const ram = components.find((component) => component.type === 'RAM');
  const psu = components.find((component) => component.type === 'PSU');

  // CPU x Placa-mãe
  if (cpu && motherboard) {
    if (
      cpu.socket &&
      motherboard.socket &&
      cpu.socket !== motherboard.socket
    ) {
      errors.push(
        `CPU utiliza socket ${cpu.socket}, mas a placa-mãe utiliza ${motherboard.socket}`
      );
    }
  }

  // RAM x Placa-mãe
  if (ram && motherboard) {
    if (
      ram.ramType &&
      motherboard.ramType &&
      ram.ramType !== motherboard.ramType
    ) {
      errors.push(
        `Memória ${ram.ramType} incompatível com placa-mãe ${motherboard.ramType}`
      );
    }
  }

  // Consumo x Fonte
  if (psu && psu.powerSupplyW) {
    const totalPowerDraw = components.reduce(
      (total, component) => total + (component.powerDrawW ?? 0),
      0
    );

    const recommendedPower = totalPowerDraw * 1.3;

    if (psu.powerSupplyW < recommendedPower) {
      errors.push(
        `Fonte de ${psu.powerSupplyW}W insuficiente. Consumo estimado: ${totalPowerDraw}W`
      );
    }
  }

  return {
    compatible: errors.length === 0,
    errors,
  };
}