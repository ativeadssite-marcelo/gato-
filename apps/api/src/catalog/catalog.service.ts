import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, q?: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        active: true,
        ...(q
          ? {
              OR: [
                { sku: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
                { oem: { contains: q, mode: 'insensitive' } },
                { ean: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        equivalentsFrom: { include: { toProduct: true } },
      },
      orderBy: { sku: 'asc' },
      take: 200,
    });
  }

  create(
    companyId: string,
    data: {
      sku: string;
      name: string;
      oem?: string;
      ean?: string;
      ncm?: string;
      cest?: string;
      unit?: string;
      avgCost?: number;
      markupPercent?: number;
    },
  ) {
    return this.prisma.product.create({
      data: { companyId, ...data },
    });
  }

  addEquivalent(fromProductId: string, toProductId: string, note?: string) {
    return this.prisma.productEquivalent.create({
      data: { fromProductId, toProductId, note },
    });
  }
}
