import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { PricingModule } from './pricing/pricing.module';
import { SalesModule } from './sales/sales.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { StorageModule } from './storage/storage.module';
import { NfeModule } from './nfe/nfe.module';
import { MarketplacesModule } from './marketplaces/marketplaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    CatalogModule,
    InventoryModule,
    PricingModule,
    SalesModule,
    FiscalModule,
    SuppliersModule,
    BrandsModule,
    CategoriesModule,
    CustomersModule,
    VehiclesModule,
    StorageModule,
    NfeModule,
    MarketplacesModule,
  ],
})
export class AppModule {}
