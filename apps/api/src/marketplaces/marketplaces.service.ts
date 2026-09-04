import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceAdapter } from './marketplaces.port';
import { MercadoLivreAdapter } from './adapters/mercado-livre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { AmazonAdapter } from './adapters/amazon.adapter';

type ChannelInput = {
  slug: string;
  name: string;
  commissionPercent?: number;
  fixedFee?: number;
  shipping?: number;
  active?: boolean;
  credentials?: Record<string, any>;
  webhookSecret?: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class MarketplacesService {
  private readonly adapters: Record<string, MarketplaceAdapter> = {
    mercado_livre: new MercadoLivreAdapter(),
    shopee: new ShopeeAdapter(),
    amazon: new AmazonAdapter(),
  };

  constructor(private prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.salesChannel.findMany({
      where: { companyId },
      orderBy: { slug: 'asc' },
    });
  }

  upsert(companyId: string, dto: ChannelInput) {
    const known = Object.keys(this.adapters);
    if (!known.includes(dto.slug)) {
      throw new BadRequestException(
        `Canal inválido. Use: ${known.join(', ')}`,
      );
    }
    return this.prisma.salesChannel.upsert({
      where: { companyId_slug: { companyId, slug: dto.slug } },
      create: {
        companyId,
        slug: dto.slug,
        name: dto.name,
        commissionPercent: dto.commissionPercent ?? 0,
        fixedFee: dto.fixedFee ?? 0,
        shipping: dto.shipping ?? 0,
        active: dto.active ?? true,
        credentials: dto.credentials ?? undefined,
        webhookSecret: dto.webhookSecret,
      },
      update: {
        name: dto.name,
        commissionPercent: dto.commissionPercent ?? 0,
        fixedFee: dto.fixedFee ?? 0,
        shipping: dto.shipping ?? 0,
        active: dto.active ?? true,
        credentials: dto.credentials ?? undefined,
        webhookSecret: dto.webhookSecret,
      },
    });
  }

  adapterFor(slug: string): MarketplaceAdapter | undefined {
    return this.adapters[slug];
  }

  async calculatePrice(companyId: string, slug: string, productId: string) {
    const [channel, product] = await Promise.all([
      this.prisma.salesChannel.findUnique({
        where: { companyId_slug: { companyId, slug } },
      }),
      this.prisma.product.findFirst({
        where: { id: productId, companyId },
        select: { id: true, sku: true, name: true, avgCost: true, freightCost: true, markupPercent: true },
      }),
    ]);
    if (!channel) {
      throw new BadRequestException('Canal não configurado');
    }
    if (!product) {
      throw new BadRequestException('Produto inválido ou fora da empresa');
    }

    const cost = Number(product.avgCost) + Number(product.freightCost);
    const base = cost * (1 + Number(product.markupPercent) / 100);
    const commission = Number(channel.commissionPercent);
    const fees = Number(channel.fixedFee) + Number(channel.shipping);
    const price = commission >= 100 ? base + fees : (base + fees) / (1 - commission / 100);

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug,
      cost: round2(cost),
      base: round2(base),
      commissionPercent: commission,
      fees: round2(fees),
      suggestedPrice: round2(price),
    };
  }
}
