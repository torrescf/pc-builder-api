import { PrismaClient, ComponentType } from '@prisma/client';

const prisma = new PrismaClient();

// Endereço base do dataset bruto no GitHub
const BASE_URL = 'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json';

const CATEGORIES = [
  { file: 'cpu.json', type: ComponentType.CPU },
  { file: 'video-card.json', type: ComponentType.GPU },
  { file: 'motherboard.json', type: ComponentType.MOTHERBOARD },
  { file: 'memory.json', type: ComponentType.RAM },
  { file: 'power-supply.json', type: ComponentType.PSU },
];

async function main() {
  console.log('🚀 Iniciando o processo de semente (seed) com dados do PCPartPicker...');

  for (const cat of CATEGORIES) {
    console.log(`\n📦 Importando dados para: ${cat.type}...`);
    try {
      const response = await fetch(`${BASE_URL}/${cat.file}`);
      if (!response.ok) {
        throw new Error(`Erro ao baixar ${cat.file}: ${response.statusText}`);
      }

      const data = await response.json() as any[];
      console.log(`✅ Dados carregados! Total no dataset: ${data.length} itens.`);

      // Seleciona as primeiras 300 peças válidas de cada categoria para um catálogo realista e equilibrado
      const sample = data
        .filter(item => item.name && item.name.trim() !== '')
        .slice(0, 300);

      console.log(`⚙️ Gravando amostra de ${sample.length} itens no PostgreSQL...`);

      for (const item of sample) {
        let socket: string | null = null;
        let ramType: string | null = null;
        let powerDrawW: number | null = null;
        let powerSupplyW: number | null = null;

        // Trata os preços nulos comuns no scraping atribuindo valores simulados coerentes
        const price = item.price && typeof item.price === 'number' && item.price > 0
          ? item.price
          : getDefaultPrice(cat.type);

        // Mapeia os dados brutos de acordo com a especificidade da categoria
        if (cat.type === ComponentType.CPU) {
          socket = item.socket || 'AM5';
          powerDrawW = item.tdp || 65;
        } else if (cat.type === ComponentType.GPU) {
          powerDrawW = item.tdp || 200;
        } else if (cat.type === ComponentType.MOTHERBOARD) {
          socket = item.socket || 'AM5';
          // Se houver múltiplos tipos de RAM suportados na placa-mãe, pega o principal
          ramType = Array.isArray(item.memory_type) ? item.memory_type[0] : (item.memory_type || 'DDR5');
        } else if (cat.type === ComponentType.RAM) {
          const speedStr = String(item.speed || '').toUpperCase();
          ramType = speedStr.includes('DDR5') ? 'DDR5' : speedStr.includes('DDR4') ? 'DDR4' : 'DDR5';
        } else if (cat.type === ComponentType.PSU) {
          powerSupplyW = item.wattage || 650;
        }

        // Realiza o Upsert para evitar duplicações caso o script seja executado mais de uma vez
        await prisma.component.upsert({
          where: { id: item.id || item.name }, // Fallback para usar o nome como identificador único na seed se id não for UUID válido
          update: {},
          create: {
            name: item.name,
            type: cat.type,
            price: price,
            stockQuantity: Math.floor(Math.random() * 20) + 5, // Estoque randômico simulado (5 a 25)
            socket,
            ramType,
            powerDrawW,
            powerSupplyW,
          }
        });
      }
      console.log(`✨ Categoria ${cat.type} sincronizada!`);
    } catch (error) {
      console.error(`❌ Falha ao processar categoria ${cat.type}:`, error);
    }
  }
}

// Fallback de preços caso os raspadores do PCPartPicker não capturem valores ativos para a peça
function getDefaultPrice(type: ComponentType): number {
  switch (type) {
    case ComponentType.CPU: return 1200.0;
    case ComponentType.GPU: return 2500.0;
    case ComponentType.MOTHERBOARD: return 850.0;
    case ComponentType.RAM: return 380.0;
    case ComponentType.PSU: return 480.0;
    default: return 150.0;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });