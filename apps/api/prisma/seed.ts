import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('senha123', 10);

  const company = await prisma.company.upsert({
    where: { id: 'mgn-company' },
    update: {},
    create: {
      id: 'mgn-company',
      name: 'MGN Autopeças',
      tradeName: 'MGN',
    },
  });

  const sp = await prisma.branch.upsert({
    where: { id: 'hub-sp' },
    update: {},
    create: {
      id: 'hub-sp',
      companyId: company.id,
      name: 'Hub São Paulo',
      cnpj: '00000000000191',
      ie: '123456789',
      uf: 'SP',
      city: 'São Paulo',
      isHub: true,
    },
  });

  const mg = await prisma.branch.upsert({
    where: { id: 'hub-mg' },
    update: {},
    create: {
      id: 'hub-mg',
      companyId: company.id,
      name: 'Hub Minas Gerais',
      cnpj: '00000000000272',
      ie: '987654321',
      uf: 'MG',
      city: 'Belo Horizonte',
      isHub: true,
    },
  });

  const users = [
    { email: 'gestor@mgn.local', name: 'Gestor MGN', role: 'gestor' as const },
    { email: 'consulta@mgn.local', name: 'Consulta', role: 'consulta' as const },
    { email: 'vendedor@mgn.local', name: 'Vendedor', role: 'vendedor' as const },
    { email: 'caixa@mgn.local', name: 'Caixa', role: 'caixa' as const },
    { email: 'estoque@mgn.local', name: 'Estoque', role: 'estoque' as const },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        companyId: company.id,
        defaultBranchId: sp.id,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
    await prisma.userBranchAccess.deleteMany({ where: { userId: user.id } });
    await prisma.userBranchAccess.createMany({
      data: [
        { userId: user.id, branchId: sp.id },
        { userId: user.id, branchId: mg.id },
      ],
    });
  }

  const pastilha = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'PAS-001' } },
    update: {},
    create: {
      companyId: company.id,
      sku: 'PAS-001',
      name: 'Pastilha de freio dianteira',
      oem: '04465-0K080',
      ncm: '87083019',
      cest: '0100100',
      avgCost: 48.5,
      markupPercent: 45,
    },
  });

  const filtro = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'FOL-010' } },
    update: {},
    create: {
      companyId: company.id,
      sku: 'FOL-010',
      name: 'Filtro de óleo',
      oem: '90915-YZZD2',
      ncm: '84212300',
      avgCost: 18.9,
      markupPercent: 60,
    },
  });

  for (const list of [
    { channel: 'balcao' as const, name: 'Balcão' },
    { channel: 'site' as const, name: 'Site' },
  ]) {
    await prisma.priceList.upsert({
      where: {
        companyId_channel: { companyId: company.id, channel: list.channel },
      },
      update: {},
      create: { companyId: company.id, ...list },
    });
  }

  const balcao = await prisma.priceList.findUniqueOrThrow({
    where: { companyId_channel: { companyId: company.id, channel: 'balcao' } },
  });

  await prisma.priceListItem.upsert({
    where: {
      priceListId_productId: { priceListId: balcao.id, productId: pastilha.id },
    },
    update: { price: 89.9 },
    create: { priceListId: balcao.id, productId: pastilha.id, price: 89.9 },
  });
  await prisma.priceListItem.upsert({
    where: {
      priceListId_productId: { priceListId: balcao.id, productId: filtro.id },
    },
    update: { price: 32.5 },
    create: { priceListId: balcao.id, productId: filtro.id, price: 32.5 },
  });

  await prisma.stockBalance.upsert({
    where: {
      branchId_productId: { branchId: sp.id, productId: pastilha.id },
    },
    update: { qty: 40 },
    create: { branchId: sp.id, productId: pastilha.id, qty: 40 },
  });
  await prisma.stockBalance.upsert({
    where: { branchId_productId: { branchId: mg.id, productId: pastilha.id } },
    update: { qty: 12 },
    create: { branchId: mg.id, productId: pastilha.id, qty: 12 },
  });
  await prisma.stockBalance.upsert({
    where: { branchId_productId: { branchId: sp.id, productId: filtro.id } },
    update: { qty: 80 },
    create: { branchId: sp.id, productId: filtro.id, qty: 80 },
  });

  console.log('Seed MGN ok. Logins: gestor@mgn.local / senha123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
