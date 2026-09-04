import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Channel } from '@prisma/client';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class QuoteItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  qty: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice: number;
}

class CreateQuoteDto {
  @IsString()
  branchId: string;

  @IsEnum(Channel)
  channel: Channel;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPercent?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private sales: SalesService) {}

  @Get('quotes')
  quotes(@CurrentUser() user: RequestUser) {
    return this.sales.listQuotes(user.companyId, user.branchIds);
  }

  @Get('orders')
  orders(@CurrentUser() user: RequestUser) {
    return this.sales.listOrders(user.companyId, user.branchIds);
  }

  @Post('quotes')
  @Roles('gestor', 'vendedor', 'caixa')
  createQuote(@CurrentUser() user: RequestUser, @Body() dto: CreateQuoteDto) {
    return this.sales.createQuote({
      userId: user.id,
      companyId: user.companyId,
      branchIds: user.branchIds,
      ...dto,
    });
  }

  @Post('quotes/:id/convert')
  @Roles('gestor', 'vendedor', 'caixa')
  convert(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sales.convertQuote(id, {
      userId: user.id,
      companyId: user.companyId,
      branchIds: user.branchIds,
    });
  }
}
