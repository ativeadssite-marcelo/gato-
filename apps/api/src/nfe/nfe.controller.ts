import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NfeService } from './nfe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';

class RawImportDto {
  @IsString()
  xml: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

class ApplicationDto {
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

class ResolveItemDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  oem?: string;

  @IsOptional()
  @IsString()
  ncm?: string;

  @IsOptional()
  @IsString()
  cest?: string;

  @IsOptional()
  @IsString()
  cst?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  freightCost?: number;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equivalentToProductIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationDto)
  applications?: ApplicationDto[];
}

@Controller('nfe')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NfeController {
  constructor(private nfe: NfeService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.nfe.list(user.companyId);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.nfe.get(user.companyId, id);
  }

  @Post('import')
  @Roles('gestor', 'estoque', 'fiscal')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const xml = file?.buffer?.toString('utf-8');
    if (!xml) {
      throw new BadRequestException('Arquivo XML não enviado');
    }
    return this.nfe.importXml(
      { companyId: user.companyId, userId: user.id },
      this.resolveBranch(user, branchId),
      xml,
    );
  }

  @Post('import-raw')
  @Roles('gestor', 'estoque', 'fiscal')
  importRaw(@CurrentUser() user: RequestUser, @Body() dto: RawImportDto) {
    return this.nfe.importXml(
      { companyId: user.companyId, userId: user.id },
      this.resolveBranch(user, dto.branchId),
      dto.xml,
    );
  }

  @Post(':id/items/:itemId/resolve')
  @Roles('gestor', 'estoque', 'fiscal')
  resolve(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ResolveItemDto,
  ) {
    return this.nfe.resolveItem(
      { companyId: user.companyId, userId: user.id },
      id,
      itemId,
      dto,
    );
  }

  @Post(':id/items/:itemId/ignore')
  @Roles('gestor', 'estoque', 'fiscal')
  ignore(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.nfe.ignoreItem(
      { companyId: user.companyId, userId: user.id },
      id,
      itemId,
    );
  }

  @Post(':id/conclude')
  @Roles('gestor', 'estoque', 'fiscal')
  conclude(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.nfe.conclude(
      { companyId: user.companyId, userId: user.id },
      id,
    );
  }

  private resolveBranch(user: RequestUser, branchId?: string): string {
    if (branchId && user.branchIds.includes(branchId)) return branchId;
    return user.defaultBranchId;
  }
}
