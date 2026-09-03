import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMoveType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class MoveDto {
  @IsString()
  branchId: string;

  @IsString()
  productId: string;

  @IsEnum(StockMoveType)
  type: StockMoveType;

  @Type(() => Number)
  @IsNumber()
  qty: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class TransferDto {
  @IsString()
  fromBranchId: string;

  @IsString()
  toBranchId: string;

  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  qty: number;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('q') q?: string,
    @Query('branchId') branchId?: string,
  ) {
    const ids = branchId ? [branchId] : user.branchIds;
    return this.inventory.balances(ids, q);
  }

  @Post('moves')
  @Roles('gestor', 'estoque', 'caixa')
  move(@CurrentUser() user: RequestUser, @Body() dto: MoveDto) {
    if (!user.branchIds.includes(dto.branchId)) {
      throw new ForbiddenException('Sem acesso a este hub');
    }
    return this.inventory.move({ ...dto, createdBy: user.id });
  }

  @Post('transfers')
  @Roles('gestor', 'estoque')
  transfer(@CurrentUser() user: RequestUser, @Body() dto: TransferDto) {
    if (
      !user.branchIds.includes(dto.fromBranchId) ||
      !user.branchIds.includes(dto.toBranchId)
    ) {
      throw new ForbiddenException('Sem acesso a um dos hubs');
    }
    return this.inventory.transfer({ ...dto, createdBy: user.id });
  }
}
