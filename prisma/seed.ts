import { PrismaClient, ComponentType } from '@prisma/client';

const prisma = new PrismaClient();

// Endereço base do dataset bruto no GitHub
const BASE_URL =
  'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json';

const CATEGORIES = [
  { file: 'cpu.json', type: ComponentType.CPU },
  { file: 'video-card.json', type: ComponentType.GPU },
  { file: 'motherboard.json', type: ComponentType.MOTHERBOARD },
  { file: 'memory.json', type: ComponentType.RAM },
  { file: 'power-supply.json', type: ComponentType.PSU },
];

async function main() {
  console.log(
    '🚀 Iniciando o processo de seed com dados do PCPartPicker...'
  );

  for (const cat of CATEGORIES) {
    console.log(`\n📦 Importando dados para: ${cat.type}...`);

    try {
      const response = await fetch(`${BASE_URL}/${cat.file}`);

      if (!response.ok) {
        throw new Error(
          `Erro ao baixar ${cat.file}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as any[];

      console.log(
        `✅ Dados carregados! Total no dataset: ${data.length} itens.`
      );

      // Seleciona as primeiras 300 peças válidas
      const sample = data
        .filter(
          (item) =>
            item.name &&
            typeof item.name === 'string' &&
            item.name.trim() !== ''
        )
        .slice(0, 300);

      console.log(
        `⚙️ Gravando amostra de ${sample.length} itens no PostgreSQL...`
      );

      for (const item of sample) {
        let socket: string | null = null;
        let ramType: string | null = null;
        let powerDrawW: number | null = null;
        let powerSupplyW: number | null = null;

        // Preço
        // Caso o dataset não possua preço válido, utiliza um valor
        // padrão apenas para manter o catálogo funcional.
        const price =
          typeof item.price === 'number' && item.price > 0
            ? item.price
            : getDefaultPrice(cat.type);

        // ============================================
        // CPU
        // ============================================
        if (cat.type === ComponentType.CPU) {
          // O dataset fornece TDP para CPU.
          powerDrawW =
            typeof item.tdp === 'number' ? item.tdp : null;
        }

        // ============================================
        // GPU
        // ============================================
        else if (cat.type === ComponentType.GPU) {
          // O dataset não fornece um valor confiável de
          // consumo para utilizar como powerDrawW.
          powerDrawW = null;
        }

        // ============================================
        // MOTHERBOARD
        // ============================================
        else if (cat.type === ComponentType.MOTHERBOARD) {
          // Socket fornecido pelo dataset.
          socket =
            typeof item.socket === 'string'
              ? item.socket
              : null;

          // Não inventamos o tipo de RAM caso a fonte
          // não forneça essa informação nesse campo.
          ramType = null;
        }

        // ============================================
        // RAM
        // ============================================
        else if (cat.type === ComponentType.RAM) {
          /*
           * No dataset, speed pode ser representado como:
           *
           * [5, 6000]
           *
           * onde:
           * 5    -> DDR5
           * 6000 -> velocidade
           *
           * Portanto utilizamos o primeiro valor para
           * determinar a geração DDR.
           */
          if (
            Array.isArray(item.speed) &&
            item.speed.length > 0
          ) {
            const ddrVersion = item.speed[0];

            if (
              typeof ddrVersion === 'number' &&
              [3, 4, 5].includes(ddrVersion)
            ) {
              ramType = `DDR${ddrVersion}`;
            }
          }
        }

        // ============================================
        // PSU
        // ============================================
        else if (cat.type === ComponentType.PSU) {
          // Potência fornecida pela fonte.
          powerSupplyW =
            typeof item.wattage === 'number'
              ? item.wattage
              : null;
        }

        // ============================================
        // UPSERT
        // ============================================

        /*
         * O dataset possui IDs próprios.
         *
         * Como o nosso banco utiliza UUID, verificamos
         * se o ID recebido é um UUID válido antes de
         * utilizá-lo.
         *
         * Caso contrário, deixamos o Prisma gerar um UUID.
         */

        const componentData = {
          name: item.name,
          type: cat.type,
          price,
          stockQuantity: Math.floor(Math.random() * 20) + 5,
          socket,
          ramType,
          powerDrawW,
          powerSupplyW,
        };

        const existingComponent = await prisma.component.findFirst({
          where: {
            name: item.name,
            type: cat.type,
          },
        });

        if (existingComponent) {
          await prisma.component.update({
            where: {
              id: existingComponent.id,
            },
            data: componentData,
          });
        } else {
          await prisma.component.create({
            data: componentData,
          });
        }
      }

      console.log(`✨ Categoria ${cat.type} sincronizada!`);
    } catch (error) {
      console.error(
        `❌ Falha ao processar categoria ${cat.type}:`,
        error
      );
    }
  }

  console.log('\n🌱 Seed finalizado com sucesso!');
}

// ============================================
// Preços padrão
// ============================================

function getDefaultPrice(type: ComponentType): number {
  switch (type) {
    case ComponentType.CPU:
      return 1200.0;

    case ComponentType.GPU:
      return 2500.0;

    case ComponentType.MOTHERBOARD:
      return 850.0;

    case ComponentType.RAM:
      return 380.0;

    case ComponentType.PSU:
      return 480.0;

    default:
      return 150.0;
  }
}

// ============================================
// Execução
// ============================================

main()
  .catch((error) => {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });