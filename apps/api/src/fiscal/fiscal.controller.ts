import {
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';
import { FiscalProvider } from './fiscal.provider';
import { PrismaService } from '../prisma/prisma.service';

class EmitDto {
  @IsString()
  orderId: string;

  @IsIn(['nfce', 'nfe'])
  type: 'nfce' | 'nfe';
}

@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FiscalController {
  constructor(
    @Inject('FISCAL_PROVIDER') private fiscal: FiscalProvider,
    private prisma: PrismaService,
  ) {}

  @Post('emit')
  @Roles('gestor', 'caixa', 'fiscal')
  async emit(@CurrentUser() user: RequestUser, @Body() dto: EmitDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        branch: true,
        items: { include: { product: true } },
      },
    });
    if (!order || order.branch.companyId !== user.companyId) {
      throw new ForbiddenException('Pedido não encontrado ou fora da empresa');
    }

    let customer: { name: string; doc: string | null } | null = null;
    if (order.quoteId) {
      const quote = await this.prisma.quote.findUnique({
        where: { id: order.quoteId },
        include: { customer: true },
      });
      customer = quote?.customer
        ? { name: quote.customer.name, doc: quote.customer.doc }
        : null;
    }

    const payload = {
      emitente: { cnpj: order.branch.cnpj, uf: order.branch.uf },
      destinatario: customer
        ? { nome: customer.name, cpf_cnpj: customer.doc }
        : undefined,
      itens: order.items.map((i) => ({
        codigo: i.product.sku,
        descricao: i.product.name,
        ncm: i.product.ncm,
        quantidade: Number(i.qty),
        valor_unitario: Number(i.unitPrice),
      })),
    };

    const result = await this.fiscal.emit({
      orderId: dto.orderId,
      type: dto.type,
      payload,
    });

    return this.prisma.fiscalDocument.create({
      data: {
        orderId: dto.orderId,
        type: dto.type,
        status: result.status,
        providerId: result.providerId ?? undefined,
        accessKey: result.accessKey,
      },
    });
  }
}
