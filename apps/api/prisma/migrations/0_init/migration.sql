-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('consulta', 'vendedor', 'caixa', 'estoque', 'fiscal', 'gestor');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('balcao', 'site', 'mercado_livre', 'shopee', 'amazon', 'atacado');

-- CreateEnum
CREATE TYPE "StockMoveType" AS ENUM ('entrada', 'saida', 'transferencia_in', 'transferencia_out', 'inventario', 'reserva', 'baixa_reserva');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('rascunho', 'enviada', 'aprovada', 'recusada', 'convertida');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('aberto', 'faturado', 'cancelado');

-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('balcao', 'cotacao');

-- CreateEnum
CREATE TYPE "FiscalStatus" AS ENUM ('rascunho', 'enfileirado', 'autorizado', 'rejeitado', 'cancelado');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('consumidor', 'frotista', 'mecanica');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('importado', 'parcial', 'concluido', 'cancelado');

-- CreateEnum
CREATE TYPE "PurchaseItemStatus" AS ENUM ('pendente', 'correspondido', 'novo', 'ignorado');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('moto', 'carro', 'caminhao', 'trator');

-- CreateEnum
CREATE TYPE "ProductSegment" AS ENUM ('automotivo', 'moto', 'caminhao', 'agricola', 'geral');

-- CreateEnum
CREATE TYPE "EquivalenceType" AS ENUM ('exata', 'similar', 'alternativa');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "ie" TEXT,
    "uf" TEXT NOT NULL,
    "city" TEXT,
    "isHub" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "defaultBranchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranchAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "UserBranchAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "segment" "ProductSegment" NOT NULL DEFAULT 'geral',
    "oem" TEXT,
    "ean" TEXT,
    "ncm" TEXT,
    "cest" TEXT,
    "cst" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "avgCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "markupPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "freightCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costOther" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "specs" JSONB,
    "techSheetUrl" TEXT,
    "brandId" TEXT,
    "categoryId" TEXT,
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEquivalent" (
    "id" TEXT NOT NULL,
    "fromProductId" TEXT NOT NULL,
    "toProductId" TEXT NOT NULL,
    "compatibility" "EquivalenceType" NOT NULL DEFAULT 'similar',
    "note" TEXT,

    CONSTRAINT "ProductEquivalent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTax" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "icmsRate" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "mvaPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "reducaoBase" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "fcpPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ProductTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductApplication" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "engine" TEXT,
    "transmission" TEXT,
    "traction" TEXT,
    "hasAC" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "ProductApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "ie" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER NOT NULL,
    "category" "VehicleCategory" NOT NULL DEFAULT 'carro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "code" TEXT,
    "price" DECIMAL(14,4),
    "leadTimeDays" INTEGER,
    "preferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMarkup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "percent" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ProductMarkup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doc" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'consumidor',
    "discountPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commissionPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "fixedFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shipping" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "credentials" JSONB,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "supplierId" TEXT,
    "accessKey" TEXT NOT NULL,
    "number" TEXT,
    "series" TEXT,
    "model" TEXT,
    "issuedAt" TIMESTAMP(3),
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'importado',
    "xml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT,
    "ean" TEXT,
    "ncm" TEXT,
    "cest" TEXT,
    "cst" TEXT,
    "cfop" TEXT,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "icmsBase" DECIMAL(14,2),
    "icmsRate" DECIMAL(8,2),
    "status" "PurchaseItemStatus" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "pending" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "location" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMove" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMoveType" NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "StockMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" "Channel" NOT NULL DEFAULT 'balcao',
    "customerName" TEXT,
    "discountPercent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "status" "QuoteStatus" NOT NULL DEFAULT 'rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT,
    "origin" "OrderOrigin" NOT NULL DEFAULT 'balcao',
    "status" "OrderStatus" NOT NULL DEFAULT 'aberto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "FiscalStatus" NOT NULL DEFAULT 'rascunho',
    "accessKey" TEXT,
    "providerId" TEXT,
    "xmlUrl" TEXT,
    "danfeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranchAccess_userId_branchId_key" ON "UserBranchAccess"("userId", "branchId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "Product"("companyId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEquivalent_fromProductId_toProductId_key" ON "ProductEquivalent"("fromProductId", "toProductId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTax_productId_uf_key" ON "ProductTax"("productId", "uf");

-- CreateIndex
CREATE INDEX "ProductApplication_productId_idx" ON "ProductApplication"("productId");

-- CreateIndex
CREATE INDEX "ProductApplication_vehicleId_idx" ON "ProductApplication"("vehicleId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_companyId_cnpj_key" ON "Supplier"("companyId", "cnpj");

-- CreateIndex
CREATE INDEX "Brand_companyId_idx" ON "Brand"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_companyId_name_key" ON "Brand"("companyId", "name");

-- CreateIndex
CREATE INDEX "Vehicle_companyId_idx" ON "Vehicle"("companyId");

-- CreateIndex
CREATE INDEX "Vehicle_brandId_idx" ON "Vehicle"("brandId");

-- CreateIndex
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_name_key" ON "Category"("companyId", "name");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_idx" ON "ProductSupplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_productId_supplierId_key" ON "ProductSupplier"("productId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMarkup_productId_channel_key" ON "ProductMarkup"("productId", "channel");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "SalesChannel_companyId_idx" ON "SalesChannel"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesChannel_companyId_slug_key" ON "SalesChannel"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_accessKey_key" ON "PurchaseInvoice"("accessKey");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_companyId_idx" ON "PurchaseInvoice"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_branchId_idx" ON "PurchaseInvoice"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_invoiceId_idx" ON "PurchaseInvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_productId_idx" ON "PurchaseInvoiceItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_branchId_productId_key" ON "StockBalance"("branchId", "productId");

-- CreateIndex
CREATE INDEX "StockMove_branchId_productId_idx" ON "StockMove"("branchId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_companyId_channel_key" ON "PriceList"("companyId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_productId_key" ON "PriceListItem"("priceListId", "productId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultBranchId_fkey" FOREIGN KEY ("defaultBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEquivalent" ADD CONSTRAINT "ProductEquivalent_fromProductId_fkey" FOREIGN KEY ("fromProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEquivalent" ADD CONSTRAINT "ProductEquivalent_toProductId_fkey" FOREIGN KEY ("toProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTax" ADD CONSTRAINT "ProductTax_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMarkup" ADD CONSTRAINT "ProductMarkup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesChannel" ADD CONSTRAINT "SalesChannel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoiceItem" ADD CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoiceItem" ADD CONSTRAINT "PurchaseInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

