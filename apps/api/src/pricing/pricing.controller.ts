import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Channel } from '@prisma/client';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class UpsertPriceDto {
  @IsString()
  productId: string;

  @IsEnum(Channel)
  channel: Channel;

  @Type(() => Number)
  @IsNumber()
  price: number;
}

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(private pricing: PricingService) {}

  @Get('consult')
  consult(
    @CurrentUser() user: RequestUser,
    @Query('q') q?: string,
    @Query('channel') channel?: Channel,
  ) {
    return this.pricing.consult({
      companyId: user.companyId,
      branchIds: user.branchIds,
      role: user.role,
      q,
      channel,
    });
  }

  @Post()
  @Roles('gestor')
  upsert(@CurrentUser() user: RequestUser, @Body() dto: UpsertPriceDto) {
    return this.pricing.upsertPrice({
      companyId: user.companyId,
      ...dto,
    });
  }
}
