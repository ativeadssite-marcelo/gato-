import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleCategory } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class CreateVehicleDto {
  @IsString()
  brandId: string;

  @IsString()
  model: string;

  @Type(() => Number)
  @IsNumber()
  yearStart: number;

  @Type(() => Number)
  @IsNumber()
  yearEnd: number;

  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;
}

class LinkApplicationDto {
  @IsString()
  productId: string;

  @IsString()
  vehicleId: string;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  traction?: string;

  @IsOptional()
  @IsBoolean()
  hasAC?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private vehicles: VehiclesService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('brandId') brandId?: string,
    @Query('category') category?: VehicleCategory,
  ) {
    return this.vehicles.list(user.companyId, brandId, category);
  }

  @Post()
  @Roles('gestor', 'estoque')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user.companyId, dto);
  }

  @Get('applications')
  applications(
    @CurrentUser() user: RequestUser,
    @Query('productId') productId?: string,
  ) {
    return this.vehicles.applications(user.companyId, productId);
  }

  @Post('applications')
  @Roles('gestor', 'estoque')
  link(@CurrentUser() user: RequestUser, @Body() dto: LinkApplicationDto) {
    return this.vehicles.link(user.companyId, dto);
  }
}
