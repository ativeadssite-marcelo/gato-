import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
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
  async emit(@Body() dto: EmitDto) {
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
