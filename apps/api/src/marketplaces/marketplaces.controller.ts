import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketplacesService } from './marketplaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class UpsertChannelDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commissionPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shipping?: number;

  @IsOptional()
  active?: boolean;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

@Controller('marketplaces')
export class MarketplacesController {
  constructor(private marketplaces: MarketplacesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  list(@CurrentUser() user: RequestUser) {
    return this.marketplaces.list(user.companyId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gestor')
  upsert(@CurrentUser() user: RequestUser, @Body() dto: UpsertChannelDto) {
    return this.marketplaces.upsert(user.companyId, dto);
  }

  @Get(':slug/price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  price(
    @CurrentUser() user: RequestUser,
    @Param('slug') slug: string,
    @Query('productId') productId: string,
  ) {
    if (!productId) {
      throw new BadRequestException('Informe productId');
    }
    return this.marketplaces.calculatePrice(user.companyId, slug, productId);
  }

  @Post(':slug/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gestor')
  async sync(@Param('slug') slug: string) {
    const adapter = this.marketplaces.adapterFor(slug);
    if (!adapter) {
      throw new BadRequestException('Canal desconhecido');
    }
    const [catalog, stock, price] = await Promise.all([
      adapter.syncCatalog(),
      adapter.syncStock(),
      adapter.syncPrice(),
    ]);
    return { catalog, stock, price };
  }

  @Post(':slug/webhook')
  webhook(
    @Param('slug') slug: string,
    @Headers('x-webhook-signature') _signature?: string,
    @Body() body?: unknown,
  ) {
    // Em produção: validar a assinatura (HMAC) com o webhookSecret do canal.
    return {
      ok: true,
      slug,
      received: typeof body === 'object' && body !== null ? Object.keys(body as object) : [],
    };
  }
}
