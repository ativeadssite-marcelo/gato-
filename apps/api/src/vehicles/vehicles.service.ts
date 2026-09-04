import { BadRequestException, Injectable } from '@nestjs/common';
import { VehicleCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateVehicleInput = {
  brandId: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  category?: VehicleCategory;
};

type ApplicationInput = {
  productId: string;
  vehicleId: string;
  engine?: string;
  transmission?: string;
  traction?: string;
  hasAC?: boolean;
  note?: string;
};

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, brandId?: string, category?: VehicleCategory) {
    return this.prisma.vehicle.findMany({
      where: {
        companyId,
        ...(brandId ? { brandId } : {}),
        ...(category ? { category } : {}),
      },
      include: { brand: true },
      orderBy: [
        { category: 'asc' },
        { brand: { name: 'asc' } },
        { model: 'asc' },
      ],
    });
  }

  async create(companyId: string, dto: CreateVehicleInput) {
    const brand = await this.prisma.brand.findFirst({
      where: { id: dto.brandId, companyId },
      select: { id: true },
    });
    if (!brand) {
      throw new BadRequestException('Marca inválida ou fora da empresa');
    }
    return this.prisma.vehicle.create({
      data: {
        companyId,
        brandId: dto.brandId,
        model: dto.model,
        yearStart: dto.yearStart,
        yearEnd: dto.yearEnd,
        category: dto.category ?? 'carro',
      },
      include: { brand: true },
    });
  }

  applications(companyId: string, productId?: string) {
    return this.prisma.productApplication.findMany({
      where: {
        product: { companyId },
        ...(productId ? { productId } : {}),
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        vehicle: { include: { brand: true } },
      },
      orderBy: { productId: 'asc' },
      take: 300,
    });
  }

  async link(companyId: string, dto: ApplicationInput) {
    const [product, vehicle] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, companyId },
        select: { id: true },
      }),
      this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, companyId },
        select: { id: true },
      }),
    ]);
    if (!product || !vehicle) {
      throw new BadRequestException('Produto ou veículo inválido');
    }
    return this.prisma.productApplication.create({
      data: {
        productId: dto.productId,
        vehicleId: dto.vehicleId,
        engine: dto.engine,
        transmission: dto.transmission,
        traction: dto.traction,
        hasAC: dto.hasAC ?? false,
        note: dto.note,
      },
      include: { vehicle: { include: { brand: true } } },
    });
  }
}
