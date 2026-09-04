import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { canSeeCost, CHANNEL_LABELS } from '@gato/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async consult(input: {
    companyId: string;
    branchIds: string[];
    role: string;
    q?: string;
    channel?: Channel;
  }) {
    const channel = input.channel ?? 'balcao';
    const products = await this.prisma.product.findMany({
      where: {
        companyId: input.companyId,
        active: true,
        ...(input.q
          ? {
              OR: [
                { sku: { contains: input.q, mode: 'insensitive' } },
                { name: { contains: input.q, mode: 'insensitive' } },
                { oem: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        prices: { include: { priceList: true } },
        markups: true,
        balances: {
          where: { branchId: { in: input.branchIds } },
          include: { branch: { select: { id: true, name: true, uf: true } } },
        },
      },
      take: 80,
      orderBy: { sku: 'asc' },
    });

    const showCost = canSeeCost(input.role as never);

    return products.map((p) => {
      const listItem = p.prices.find((i) => i.priceList.channel === channel);
      const cost = Number(p.avgCost);
      const channelMarkup = p.markups.find((m) => m.channel === channel);
      const markup = channelMarkup
        ? Number(channelMarkup.percent)
        : Number(p.markupPercent);
      const computed = cost * (1 + markup / 100);
      const price = listItem ? Number(listItem.price) : computed;
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        oem: p.oem,
        ncm: p.ncm,
        price,
        markupPercent: markup,
        marginPercent: Number(margin.toFixed(2)),
        cost: showCost ? cost : undefined,
        stock: p.balances.map((b) => ({
          branchId: b.branch.id,
          branch: b.branch.name,
          uf: b.branch.uf,
          qty: Number(b.qty),
          reserved: Number(b.reserved),
          available: Number(b.qty) - Number(b.reserved),
        })),
      };
    });
  }

  async upsertPrice(input: {
    companyId: string;
    productId: string;
    channel: Channel;
    price: number;
  }) {
    const list = await this.prisma.priceList.upsert({
      where: {
        companyId_channel: {
          companyId: input.companyId,
          channel: input.channel,
        },
      },
      create: {
        companyId: input.companyId,
        channel: input.channel,
        name: CHANNEL_LABELS[input.channel] ?? input.channel,
      },
      update: {},
    });
    return this.prisma.priceListItem.upsert({
      where: {
        priceListId_productId: {
          priceListId: list.id,
          productId: input.productId,
        },
      },
      create: {
        priceListId: list.id,
        productId: input.productId,
        price: input.price,
      },
      update: { price: input.price },
    });
  }
}
