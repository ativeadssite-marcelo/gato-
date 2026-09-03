import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StockMoveType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type MoveInput = {
  branchId: string;
  productId: string;
  type: StockMoveType;
  qty: number;
  note?: string;
  createdBy?: string;
};

type TransferInput = {
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  qty: number;
  createdBy?: string;
};

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  balances(branchIds: string[], q?: string) {
    return this.prisma.stockBalance.findMany({
      where: {
        branchId: { in: branchIds },
        ...(q
          ? {
              product: {
                OR: [
                  { sku: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { oem: { contains: q, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        product: true,
        branch: { select: { id: true, name: true, uf: true } },
      },
      orderBy: { product: { sku: 'asc' } },
      take: 300,
    });
  }

  async move(input: MoveInput, tx?: Prisma.TransactionClient) {
    if (input.qty <= 0) {
      throw new BadRequestException('Quantidade deve ser positiva');
    }

    const run = async (db: Prisma.TransactionClient) => {
      const balance = await db.stockBalance.upsert({
        where: {
          branchId_productId: {
            branchId: input.branchId,
            productId: input.productId,
          },
        },
        create: {
          branchId: input.branchId,
          productId: input.productId,
          qty: 0,
          reserved: 0,
        },
        update: {},
      });

      const qty = new Prisma.Decimal(input.qty);
      let nextQty = new Prisma.Decimal(balance.qty);
      let nextReserved = new Prisma.Decimal(balance.reserved);

      if (
        input.type === 'entrada' ||
        input.type === 'transferencia_in' ||
        input.type === 'inventario'
      ) {
        if (input.type === 'inventario') {
          nextQty = qty;
        } else {
          nextQty = nextQty.add(qty);
        }
      } else if (
        input.type === 'saida' ||
        input.type === 'transferencia_out'
      ) {
        nextQty = nextQty.sub(qty);
        if (nextQty.lt(0)) {
          throw new BadRequestException('Estoque insuficiente');
        }
      } else if (input.type === 'reserva') {
        const available = nextQty.sub(nextReserved);
        if (available.lt(qty)) {
          throw new BadRequestException('Saldo disponível insuficiente');
        }
        nextReserved = nextReserved.add(qty);
      } else if (input.type === 'baixa_reserva') {
        nextReserved = nextReserved.sub(qty);
        if (nextReserved.lt(0)) nextReserved = new Prisma.Decimal(0);
      }

      await db.stockBalance.update({
        where: { id: balance.id },
        data: { qty: nextQty, reserved: nextReserved },
      });

      return db.stockMove.create({
        data: {
          branchId: input.branchId,
          productId: input.productId,
          type: input.type,
          qty,
          note: input.note,
          createdBy: input.createdBy,
        },
      });
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async transfer(input: TransferInput) {
    if (input.fromBranchId === input.toBranchId) {
      throw new BadRequestException('Hubs de origem e destino iguais');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.move(
        {
          branchId: input.fromBranchId,
          productId: input.productId,
          type: 'transferencia_out',
          qty: input.qty,
          note: `Para ${input.toBranchId}`,
          createdBy: input.createdBy,
        },
        tx,
      );
      return this.move(
        {
          branchId: input.toBranchId,
          productId: input.productId,
          type: 'transferencia_in',
          qty: input.qty,
          note: `De ${input.fromBranchId}`,
          createdBy: input.createdBy,
        },
        tx,
      );
    });
  }
}
