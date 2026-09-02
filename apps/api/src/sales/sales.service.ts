import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  listQuotes(companyId: string, branchIds: string[]) {
    return this.prisma.quote.findMany({
      where: { branch: { companyId, id: { in: branchIds } } },
      include: { items: { include: { product: true } }, branch: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createQuote(input: {
    userId: string;
    branchId: string;
    channel: Channel;
    customer?: string;
    items: { productId: string; qty: number; unitPrice: number }[];
  }) {
    return this.prisma.quote.create({
      data: {
        userId: input.userId,
        branchId: input.branchId,
        channel: input.channel,
        customer: input.customer,
        status: 'enviada',
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async convertQuote(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { items: true },
    });
    const order = await this.prisma.order.create({
      data: {
        branchId: quote.branchId,
        userId,
        quoteId: quote.id,
        status: 'aberto',
        items: {
          create: quote.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'convertida' },
    });
    for (const item of order.items) {
      await this.inventory.move({
        branchId: order.branchId,
        productId: item.productId,
        type: 'saida',
        qty: Number(item.qty),
        note: `Pedido ${order.id}`,
        createdBy: userId,
      });
    }
    return order;
  }
}
