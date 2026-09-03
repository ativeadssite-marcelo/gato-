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
      include: { branch: true },
    });
    if (!order || order.branch.companyId !== user.companyId) {
      throw new ForbiddenException('Pedido não encontrado ou fora da empresa');
    }
    const result = await this.fiscal.emit(dto);
    return this.prisma.fiscalDocument.create({
      data: {
        orderId: dto.orderId,
        type: dto.type,
        status: result.status,
        providerId: result.providerId,
        accessKey: result.accessKey,
      },
    });
  }
}
