import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';
import { Type } from 'class-transformer';

class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  oem?: string;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsOptional()
  @IsString()
  ncm?: string;

  @IsOptional()
  @IsString()
  cest?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avgCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  markupPercent?: number;
}

class EquivalentDto {
  @IsString()
  fromProductId: string;

  @IsString()
  toProductId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query('q') q?: string) {
    return this.catalog.list(user.companyId, q);
  }

  @Post()
  @Roles('gestor', 'estoque')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    return this.catalog.create(user.companyId, dto);
  }

  @Post('equivalents')
  @Roles('gestor', 'estoque')
  equivalent(@Body() dto: EquivalentDto) {
    return this.catalog.addEquivalent(
      dto.fromProductId,
      dto.toProductId,
      dto.note,
    );
  }
}
