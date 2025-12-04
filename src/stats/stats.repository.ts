import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsRepository {
  // ⚙️ Simulation de données : à remplacer par des vraies requêtes Mongo ou Prisma
  async getStats(storeId: string, filters: any) {
    return {
      storeId,
      totalOrders: 258,
      revenue: 14250000,
      activeCustomers: 82,
      growth: 14.5,
      statusDistribution: [
        { status: 'completed', count: 180 },
        { status: 'pending', count: 60 },
        { status: 'cancelled', count: 18 },
      ],
      topProducts: [
        { name: 'T-shirt Logo', sold: 130 },
        { name: 'Casquette Noir', sold: 80 },
        { name: 'Sweat Bleu', sold: 45 },
      ],
      createdAt: new Date(),
    };
  }
}
