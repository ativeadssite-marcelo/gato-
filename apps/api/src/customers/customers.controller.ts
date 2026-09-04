import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  doc?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.prisma.customer.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @Roles('gestor', 'vendedor', 'caixa')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { companyId: user.companyId, ...dto },
    });
  }
}
