import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class CreateBrandDto {
  @IsString()
  name: string;
}

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.prisma.brand.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @Roles('gestor', 'estoque')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: { companyId: user.companyId, ...dto },
    });
  }
}
