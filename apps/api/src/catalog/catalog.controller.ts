import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Channel, EquivalenceType, ProductSegment } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/user.types';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage.provider';

class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsEnum(ProductSegment)
  segment?: ProductSegment;

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
  @Type(() => Number)
  @IsNumber()
  costOther?: number;

  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;

  @IsOptional()
  @IsString()
  techSheetUrl?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsEnum(ProductSegment)
  segment?: ProductSegment;

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
  @Type(() => Number)
  @IsNumber()
  costOther?: number;

  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;

  @IsOptional()
  @IsString()
  techSheetUrl?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;
}

class UpsertTaxDto {
  @IsString()
  @Length(2, 2)
  uf: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  icmsRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mvaPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reducaoBase?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fcpPercent?: number;
}

class EquivalentDto {
  @IsString()
  fromProductId: string;

  @IsString()
  toProductId: string;

  @IsOptional()
  @IsEnum(EquivalenceType)
  compatibility?: EquivalenceType;

  @IsOptional()
  @IsString()
  note?: string;
}

class AddSupplierDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  preferred?: boolean;
}

class UpsertMarkupDto {
  @IsEnum(Channel)
  channel: Channel;

  @Type(() => Number)
  @IsNumber()
  percent: number;
}

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(
    private catalog: CatalogService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query('q') q?: string) {
    return this.catalog.list(user.companyId, q);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.catalog.get(user.companyId, id);
  }

  @Post()
  @Roles('gestor', 'estoque')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    return this.catalog.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles('gestor', 'estoque')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.update(user.companyId, id, dto);
  }

  @Post('equivalents')
  @Roles('gestor', 'estoque')
  equivalent(@CurrentUser() user: RequestUser, @Body() dto: EquivalentDto) {
    return this.catalog.addEquivalent(
      user.companyId,
      dto.fromProductId,
      dto.toProductId,
      dto.compatibility,
      dto.note,
    );
  }

  @Post(':id/taxes')
  @Roles('gestor', 'estoque', 'fiscal')
  upsertTax(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpsertTaxDto,
  ) {
    return this.catalog.upsertTax(user.companyId, id, dto);
  }

  @Post(':id/images')
  @Roles('gestor', 'estoque')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem não enviado');
    }
    const { url } = await this.storage.save(file);
    return this.catalog.addImage(user.companyId, id, url);
  }

  @Get(':id/suppliers')
  suppliers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.catalog.listSuppliers(user.companyId, id);
  }

  @Post(':id/suppliers')
  @Roles('gestor', 'estoque')
  addSupplier(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddSupplierDto,
  ) {
    return this.catalog.addSupplier(user.companyId, id, dto);
  }

  @Delete(':id/suppliers/:supplierId')
  @Roles('gestor', 'estoque')
  removeSupplier(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.catalog.removeSupplier(user.companyId, id, supplierId);
  }

  @Post(':id/markups')
  @Roles('gestor')
  upsertMarkup(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpsertMarkupDto,
  ) {
    return this.catalog.upsertMarkup(user.companyId, id, dto.channel, dto.percent);
  }

  @Get(':id/price-by-state')
  priceByState(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query('uf') uf?: string,
  ) {
    return this.catalog.priceByState(user.companyId, id, uf);
  }
}
