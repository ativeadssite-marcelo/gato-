import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Channel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

type CreateQuoteInput = {
  userId: string;
  companyId: string;
  branchIds: string[];
  branchId: string;
  channel: Channel;
  customerId?: string;
  customerName?: string;
  discountPercent?: number;
  items: { productId: string; qty: number; unitPrice: number }[];
};

type ConvertInput = {
  userId: string;
  companyId: string;
  branchIds: string[];
};

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  listQuotes(companyId: string, branchIds: string[]) {
    return this.prisma.quote.findMany({
      where: { branch: { companyId, id: { in: branchIds } } },
      include: {
        items: { include: { product: true } },
        branch: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listOrders(companyId: string, branchIds: string[]) {
    return this.prisma.order.findMany({
      where: { branch: { companyId, id: { in: branchIds } } },
      include: {
        items: { include: { product: true } },
        branch: true,
        fiscal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createQuote(input: CreateQuoteInput) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: input.branchId },
      select: { id: true, companyId: true },
    });
    if (
      !branch ||
      branch.companyId !== input.companyId ||
      !input.branchIds.includes(input.branchId)
    ) {
      throw new ForbiddenException('Sem acesso a este hub');
    }

    let discountPercent = input.discountPercent ?? 0;
    let customerName = input.customerName;
    let customerId: string | null = input.customerId ?? null;

    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, companyId: input.companyId },
      });
      if (!customer) {
        throw new ForbiddenException('Cliente inválido ou fora da empresa');
      }
      customerName = customer.name;
      if (input.discountPercent == null) {
        discountPercent = Number(customer.discountPercent);
      }
    }

    const factor = 1 - discountPercent / 100;

    return this.prisma.quote.create({
      data: {
        userId: input.userId,
        branchId: input.branchId,
        channel: input.channel,
        customerId,
        customerName,
        discountPercent,
        status: 'enviada',
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: Number((i.unitPrice * factor).toFixed(4)),
          })),
        },
      },
      include: { items: true, customer: true },
    });
  }

  async convertQuote(quoteId: string, ctx: ConvertInput) {
    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { items: true, branch: true },
    });

    if (
      quote.branch.companyId !== ctx.companyId ||
      !ctx.branchIds.includes(quote.branchId)
    ) {
      throw new ForbiddenException('Sem acesso a este orçamento');
    }
    if (quote.status === 'convertida') {
      throw new ConflictException('Orçamento já convertido');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          branchId: quote.branchId,
          userId: ctx.userId,
          quoteId: quote.id,
          origin: 'cotacao',
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

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'convertida' },
      });

      for (const item of order.items) {
        await this.inventory.move(
          {
            branchId: order.branchId,
            productId: item.productId,
            type: 'saida',
            qty: Number(item.qty),
            note: `Pedido ${order.id}`,
            createdBy: ctx.userId,
          },
          tx,
        );
      }

      return order;
    });
  }
}
