import { BadRequestException, Injectable } from '@nestjs/common';
import { Channel, EquivalenceType, ProductSegment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ProductInput = {
  sku: string;
  name: string;
  shortDescription?: string;
  segment?: ProductSegment;
  oem?: string;
  ean?: string;
  ncm?: string;
  cest?: string;
  cst?: string;
  unit?: string;
  avgCost?: number;
  markupPercent?: number;
  freightCost?: number;
  costOther?: number;
  specs?: Record<string, any>;
  techSheetUrl?: string;
  brandId?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  supplierCode?: string;
};

type TaxInput = {
  uf: string;
  icmsRate?: number;
  mvaPercent?: number;
  reducaoBase?: number;
  fcpPercent?: number;
};

type SupplierInput = {
  supplierId: string;
  code?: string;
  price?: number;
  leadTimeDays?: number;
  preferred?: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, q?: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        active: true,
        ...(q
          ? {
              OR: [
                { sku: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
                { oem: { contains: q, mode: 'insensitive' } },
                { ean: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        equivalentsFrom: { include: { toProduct: true } },
        brand: true,
        supplier: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sku: 'asc' },
      take: 200,
    });
  }

  get(companyId: string, id: string) {
    return this.prisma.product.findFirst({
      where: { id, companyId },
      include: {
        brand: true,
        supplier: true,
        category: { include: { parent: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        taxes: true,
        applications: { include: { vehicle: { include: { brand: true } } } },
        equivalentsFrom: { include: { toProduct: true } },
        suppliers: { include: { supplier: true } },
        markups: true,
      },
    });
  }

  create(companyId: string, data: ProductInput) {
    return this.prisma.product.create({
      data: {
        companyId,
        sku: data.sku,
        name: data.name,
        shortDescription: data.shortDescription,
        segment: data.segment,
        oem: data.oem,
        ean: data.ean,
        ncm: data.ncm,
        cest: data.cest,
        cst: data.cst,
        unit: data.unit,
        avgCost: data.avgCost,
        markupPercent: data.markupPercent,
        freightCost: data.freightCost,
        costOther: data.costOther,
        specs: data.specs,
        techSheetUrl: data.techSheetUrl,
        brandId: data.brandId,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        supplierCode: data.supplierCode,
      },
    });
  }

  async update(companyId: string, id: string, data: Partial<ProductInput>) {
    const exists = await this.prisma.product.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException('Produto não encontrado ou fora da empresa');
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async upsertTax(companyId: string, productId: string, tax: TaxInput) {
    await this.requireProduct(companyId, productId);
    return this.prisma.productTax.upsert({
      where: { productId_uf: { productId, uf: tax.uf } },
      create: {
        productId,
        uf: tax.uf,
        icmsRate: tax.icmsRate ?? 0,
        mvaPercent: tax.mvaPercent ?? 0,
        reducaoBase: tax.reducaoBase ?? 0,
        fcpPercent: tax.fcpPercent ?? 0,
      },
      update: {
        icmsRate: tax.icmsRate ?? 0,
        mvaPercent: tax.mvaPercent ?? 0,
        reducaoBase: tax.reducaoBase ?? 0,
        fcpPercent: tax.fcpPercent ?? 0,
      },
    });
  }

  async addImage(companyId: string, productId: string, url: string) {
    await this.requireProduct(companyId, productId);
    return this.prisma.productImage.create({
      data: { productId, url },
    });
  }

  async addEquivalent(
    companyId: string,
    fromProductId: string,
    toProductId: string,
    compatibility?: EquivalenceType,
    note?: string,
  ) {
    if (fromProductId === toProductId) {
      throw new BadRequestException('Produtos devem ser diferentes');
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: [fromProductId, toProductId] }, companyId },
      select: { id: true },
    });
    if (products.length !== 2) {
      throw new BadRequestException('Produto inválido ou fora da empresa');
    }
    return this.prisma.productEquivalent.create({
      data: {
        fromProductId,
        toProductId,
        compatibility: compatibility ?? 'similar',
        note,
      },
    });
  }

  listSuppliers(companyId: string, productId: string) {
    return this.prisma.productSupplier.findMany({
      where: { productId, product: { companyId } },
      include: { supplier: true },
      orderBy: [{ preferred: 'desc' }, { supplier: { name: 'asc' } }],
    });
  }

  async addSupplier(companyId: string, productId: string, dto: SupplierInput) {
    await this.requireProduct(companyId, productId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId },
      select: { id: true },
    });
    if (!supplier) {
      throw new BadRequestException('Fornecedor inválido ou fora da empresa');
    }
    return this.prisma.productSupplier.upsert({
      where: {
        productId_supplierId: { productId, supplierId: dto.supplierId },
      },
      create: {
        productId,
        supplierId: dto.supplierId,
        code: dto.code,
        price: dto.price,
        leadTimeDays: dto.leadTimeDays,
        preferred: dto.preferred ?? false,
      },
      update: {
        code: dto.code,
        price: dto.price,
        leadTimeDays: dto.leadTimeDays,
        preferred: dto.preferred ?? false,
      },
    });
  }

  async removeSupplier(companyId: string, productId: string, supplierId: string) {
    await this.requireProduct(companyId, productId);
    return this.prisma.productSupplier.deleteMany({
      where: { productId, supplierId },
    });
  }

  async upsertMarkup(
    companyId: string,
    productId: string,
    channel: Channel,
    percent: number,
  ) {
    await this.requireProduct(companyId, productId);
    return this.prisma.productMarkup.upsert({
      where: { productId_channel: { productId, channel } },
      create: { productId, channel, percent },
      update: { percent },
    });
  }

  async priceByState(companyId: string, productId: string, uf?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      include: { taxes: true },
    });
    if (!product) {
      throw new BadRequestException('Produto inválido ou fora da empresa');
    }

    const cost =
      Number(product.avgCost) +
      Number(product.freightCost) +
      Number(product.costOther);
    const base = cost * (1 + Number(product.markupPercent) / 100);
    const ufs = uf ? [uf] : product.taxes.map((t) => t.uf);

    return ufs.map((state) => {
      const tax = product.taxes.find((t) => t.uf === state) ?? null;
      const icmsRate = tax ? Number(tax.icmsRate) : 0;
      const mva = tax ? Number(tax.mvaPercent) : 0;
      const fcp = tax ? Number(tax.fcpPercent) : 0;
      const reducao = tax ? Number(tax.reducaoBase) : 0;
      const baseCalc = base * (1 - reducao / 100);
      const suggested =
        icmsRate >= 100
          ? baseCalc * (1 + mva / 100) * (1 + fcp / 100)
          : (baseCalc * (1 + mva / 100) / (1 - icmsRate / 100)) *
            (1 + fcp / 100);
      return {
        uf: state,
        cost: round2(cost),
        base: round2(base),
        icmsRate,
        mvaPercent: mva,
        fcpPercent: fcp,
        reducaoBase: reducao,
        suggestedPrice: round2(suggested),
      };
    });
  }

  private async requireProduct(companyId: string, productId: string) {
    const p = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      select: { id: true },
    });
    if (!p) {
      throw new BadRequestException('Produto inválido ou fora da empresa');
    }
  }
}
