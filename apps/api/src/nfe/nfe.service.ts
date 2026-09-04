import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { parseNfeXml, ParsedNfe } from './nfe-xml.parser';

type ImportCtx = { companyId: string; userId: string };

type ResolveItemDto = {
  sku: string;
  name: string;
  oem?: string;
  ncm?: string;
  cest?: string;
  cst?: string;
  unit?: string;
  avgCost?: number;
  markupPercent?: number;
  freightCost?: number;
  brandId?: string;
  supplierId?: string;
  supplierCode?: string;
  equivalentToProductIds?: string[];
  applications?: {
    vehicleId: string;
    engine?: string;
    transmission?: string;
    traction?: string;
    hasAC?: boolean;
    note?: string;
  }[];
};

@Injectable()
export class NfeService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  list(companyId: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: { companyId },
      include: {
        supplier: true,
        branch: { select: { id: true, name: true, uf: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async get(companyId: string, id: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, avgCost: true },
            },
          },
          orderBy: { description: 'asc' },
        },
      },
    });
    if (!invoice) return null;

    const items = await Promise.all(
      invoice.items.map(async (item) => {
        if (item.productId || !item.ncm) {
          return { ...item, suggestions: [] };
        }
        const suggestions = await this.prisma.product.findMany({
          where: { companyId, ncm: item.ncm, active: true },
          select: { id: true, sku: true, name: true, oem: true },
          take: 5,
        });
        return { ...item, suggestions };
      }),
    );

    return { ...invoice, items };
  }

  async importXml(ctx: ImportCtx, branchId: string, xmlText: string) {
    const parsed = parseNfeXml(xmlText);

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId: ctx.companyId },
      select: { id: true, uf: true },
    });
    if (!branch) {
      throw new ForbiddenException('Hub inválido ou fora da empresa');
    }

    const duplicate = await this.prisma.purchaseInvoice.findUnique({
      where: { accessKey: parsed.accessKey },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('Esta NF-e já foi importada');
    }

    const supplierId = await this.resolveSupplier(ctx.companyId, parsed);

    const invoice = await this.prisma.purchaseInvoice.create({
      data: {
        companyId: ctx.companyId,
        branchId,
        supplierId,
        accessKey: parsed.accessKey,
        number: parsed.number,
        series: parsed.series,
        model: parsed.model,
        issuedAt: parsed.issuedAt,
        total: parsed.total,
        xml: xmlText,
        status: 'importado',
        items: {
          create: parsed.items.map((item) => ({
            sku: item.sku || null,
            ean: item.ean,
            ncm: item.ncm,
            cest: item.cest,
            cst: item.cst,
            cfop: item.cfop,
            description: item.description,
            qty: item.qty,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            icmsBase: item.icmsBase,
            icmsRate: item.icmsRate,
            status: 'pendente',
          })),
        },
      },
      include: { items: true },
    });

    await this.matchAll(ctx, invoice.id, branchId, branch.uf);

    return this.get(ctx.companyId, invoice.id);
  }

  async resolveItem(
    ctx: ImportCtx,
    invoiceId: string,
    itemId: string,
    dto: ResolveItemDto,
  ) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, companyId: ctx.companyId },
      select: { id: true, accessKey: true, branchId: true, supplierId: true },
    });
    if (!invoice) {
      throw new ForbiddenException('NF-e não encontrada');
    }

    const item = await this.prisma.purchaseInvoiceItem.findFirst({
      where: { id: itemId, invoiceId },
    });
    if (!item || item.status !== 'pendente') {
      throw new BadRequestException('Item indisponível para cadastro');
    }

    const product = await this.prisma.product.create({
      data: {
        companyId: ctx.companyId,
        sku: dto.sku,
        name: dto.name,
        oem: dto.oem,
        ncm: dto.ncm ?? item.ncm,
        cest: dto.cest ?? item.cest,
        cst: dto.cst ?? item.cst,
        unit: dto.unit ?? 'UN',
        avgCost: dto.avgCost ?? Number(item.unitCost),
        markupPercent: dto.markupPercent ?? 0,
        freightCost: dto.freightCost ?? 0,
        brandId: dto.brandId,
        supplierId: dto.supplierId ?? invoice.supplierId,
        supplierCode: dto.supplierCode ?? item.sku,
      },
    });

    if (dto.equivalentToProductIds?.length) {
      await this.prisma.productEquivalent.createMany({
        data: dto.equivalentToProductIds.map((toProductId) => ({
          fromProductId: product.id,
          toProductId,
        })),
        skipDuplicates: true,
      });
    }

    if (dto.applications?.length) {
      await this.prisma.productApplication.createMany({
        data: dto.applications.map((a) => ({
          productId: product.id,
          vehicleId: a.vehicleId,
          engine: a.engine,
          transmission: a.transmission,
          traction: a.traction,
          hasAC: a.hasAC ?? false,
          note: a.note,
        })),
      });
    }

    if (invoice.branchId) {
      await this.applyEntry(
        ctx,
        item,
        product,
        invoice.branchId,
        invoice.accessKey,
        'novo',
      );
    } else {
      await this.prisma.purchaseInvoiceItem.update({
        where: { id: item.id },
        data: { productId: product.id, status: 'novo' },
      });
    }
    await this.recomputeStatus(invoiceId);

    return this.get(ctx.companyId, invoiceId);
  }

  async ignoreItem(ctx: ImportCtx, invoiceId: string, itemId: string) {
    await this.requireInvoice(ctx, invoiceId);
    const item = await this.prisma.purchaseInvoiceItem.findFirst({
      where: { id: itemId, invoiceId },
    });
    if (!item || item.status !== 'pendente') {
      throw new BadRequestException('Item indisponível para ignorar');
    }
    await this.prisma.purchaseInvoiceItem.update({
      where: { id: itemId },
      data: { status: 'ignorado' },
    });
    await this.recomputeStatus(invoiceId);
    return this.get(ctx.companyId, invoiceId);
  }

  async conclude(ctx: ImportCtx, invoiceId: string) {
    await this.requireInvoice(ctx, invoiceId);
    await this.prisma.purchaseInvoice.update({
      where: { id: invoiceId },
      data: { status: 'concluido' },
    });
    return this.get(ctx.companyId, invoiceId);
  }

  private async requireInvoice(ctx: ImportCtx, invoiceId: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, companyId: ctx.companyId },
      select: { id: true },
    });
    if (!invoice) {
      throw new ForbiddenException('NF-e não encontrada');
    }
  }

  private async resolveSupplier(companyId: string, parsed: ParsedNfe) {
    if (!parsed.supplierCnpj) return null;
    const existing = await this.prisma.supplier.findUnique({
      where: {
        companyId_cnpj: { companyId, cnpj: parsed.supplierCnpj },
      },
    });
    if (existing) return existing.id;
    if (!parsed.supplierName) return null;
    const created = await this.prisma.supplier.create({
      data: {
        companyId,
        cnpj: parsed.supplierCnpj,
        name: parsed.supplierName,
        ie: parsed.supplierIe,
      },
    });
    return created.id;
  }

  private async matchAll(
    ctx: ImportCtx,
    invoiceId: string,
    branchId: string,
    uf: string,
  ) {
    const invoice = await this.prisma.purchaseInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { items: true },
    });

    for (const item of invoice.items) {
      const product = await this.matchProduct(ctx.companyId, invoice.supplierId, item);
      if (product) {
        await this.applyEntry(
          ctx,
          item,
          product,
          branchId,
          invoice.accessKey,
          'correspondido',
          uf,
        );
      }
    }
    await this.recomputeStatus(invoiceId);
  }

  private async matchProduct(
    companyId: string,
    supplierId: string | null,
    item: { sku?: string | null; ean?: string | null },
  ) {
    const code = item.sku;

    // 1. SKU interno (código próprio do balcão)
    if (code) {
      const p = await this.prisma.product.findFirst({
        where: { companyId, sku: code },
      });
      if (p) return p;
    }

    // 2. Código do fornecedor + MESMO fornecedor da NF (mais confiável)
    if (code && supplierId) {
      const p = await this.prisma.product.findFirst({
        where: { companyId, supplierCode: code, supplierId },
      });
      if (p) return p;
    }

    // 3. Código do fornecedor (qualquer fornecedor)
    if (code) {
      const p = await this.prisma.product.findFirst({
        where: { companyId, supplierCode: code },
      });
      if (p) return p;
    }

    // 4. EAN / GTIN (código de barras)
    if (item.ean) {
      const p = await this.prisma.product.findFirst({
        where: { companyId, ean: item.ean },
      });
      if (p) return p;
    }

    // 5. OEM (cProd como código de fabricante)
    if (code) {
      const p = await this.prisma.product.findFirst({
        where: { companyId, oem: code },
      });
      if (p) return p;
    }

    return null;
  }

  private async applyEntry(
    ctx: ImportCtx,
    item: { id: string; qty: Prisma.Decimal; unitCost: Prisma.Decimal; ncm?: string | null; cest?: string | null; cst?: string | null; icmsRate?: Prisma.Decimal | null },
    product: Product,
    branchId: string,
    accessKey: string,
    status: 'correspondido' | 'novo',
    uf?: string,
  ) {
    const incomingQty = Number(item.qty);
    const incomingCost = Number(item.unitCost);

    await this.prisma.$transaction(async (tx) => {
      await this.inventory.move(
        {
          branchId,
          productId: product.id,
          type: 'entrada',
          qty: incomingQty,
          note: `NF-e ${accessKey}`,
          createdBy: ctx.userId,
        },
        tx,
      );

      const balance = await tx.stockBalance.findUnique({
        where: { branchId_productId: { branchId, productId: product.id } },
      });
      const newQty = Number(balance?.qty ?? 0);
      const priorQty = Math.max(newQty - incomingQty, 0);
      const newCost =
        newQty > 0
          ? (Number(product.avgCost) * priorQty + incomingCost * incomingQty) /
            newQty
          : incomingCost;

      const productUpdate: Prisma.ProductUpdateInput = {
        avgCost: Number(newCost.toFixed(4)),
      };
      if (!product.ncm && item.ncm) productUpdate.ncm = item.ncm;
      if (!product.cest && item.cest) productUpdate.cest = item.cest;
      if (!product.cst && item.cst) productUpdate.cst = item.cst;
      await tx.product.update({
        where: { id: product.id },
        data: productUpdate,
      });

      if (uf && item.icmsRate != null) {
        await tx.productTax.upsert({
          where: { productId_uf: { productId: product.id, uf } },
          create: {
            productId: product.id,
            uf,
            icmsRate: Number(item.icmsRate),
          },
          update: { icmsRate: Number(item.icmsRate) },
        });
      }

      await tx.purchaseInvoiceItem.update({
        where: { id: item.id },
        data: { productId: product.id, status },
      });
    });
  }

  private async recomputeStatus(invoiceId: string) {
    const pending = await this.prisma.purchaseInvoiceItem.count({
      where: { invoiceId, status: 'pendente' },
    });
    await this.prisma.purchaseInvoice.update({
      where: { id: invoiceId },
      data: { status: pending > 0 ? 'parcial' : 'concluido' },
    });
  }
}
