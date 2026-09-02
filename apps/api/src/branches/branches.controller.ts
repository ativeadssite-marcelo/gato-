import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class CreateBranchDto {
  @IsString()
  name: string;

  @IsString()
  @Length(14, 18)
  cnpj: string;

  @IsOptional()
  @IsString()
  ie?: string;

  @IsString()
  @Length(2, 2)
  uf: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isHub?: boolean;
}

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.prisma.branch.findMany({
      where: {
        companyId: user.companyId,
        id: { in: user.branchIds },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @Roles('gestor')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        companyId: user.companyId,
        ...dto,
      },
    });
  }
}
