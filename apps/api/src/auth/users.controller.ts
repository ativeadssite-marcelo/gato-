import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles, RolesGuard } from './roles.guard';
import { CurrentUser } from './current-user.decorator';
import { RequestUser } from './user.types';
import * as bcrypt from 'bcrypt';

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  defaultBranchId: string;

  @IsOptional()
  branchIds?: string[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('gestor')
  list(@CurrentUser() user: RequestUser) {
    return this.prisma.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        defaultBranchId: true,
        branchAccess: { select: { branchId: true } },
      },
    });
  }

  @Post()
  @Roles('gestor')
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const branchIds = dto.branchIds?.length
      ? dto.branchIds
      : [dto.defaultBranchId];
    return this.prisma.user.create({
      data: {
        companyId: user.companyId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        defaultBranchId: dto.defaultBranchId,
        branchAccess: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
    });
  }
}
