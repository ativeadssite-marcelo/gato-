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

  // ---- Marcas (peças e veículos compartilham o mesmo modelo Brand) ----
  const brandBosch = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Bosch' } },
    update: {},
    create: { companyId: company.id, name: 'Bosch' },
  });
  const brandFremax = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Fremax' } },
    update: {},
    create: { companyId: company.id, name: 'Fremax' },
  });
  const brandTecfil = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Tecfil' } },
    update: {},
    create: { companyId: company.id, name: 'Tecfil' },
  });
  const brandNakata = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Nakata' } },
    update: {},
    create: { companyId: company.id, name: 'Nakata' },
  });
  const brandToyota = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Toyota' } },
    update: {},
    create: { companyId: company.id, name: 'Toyota' },
  });
  const brandFiat = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Fiat' } },
    update: {},
    create: { companyId: company.id, name: 'Fiat' },
  });
  const brandVw = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Volkswagen' } },
    update: {},
    create: { companyId: company.id, name: 'Volkswagen' },
  });
  const brandHonda = await prisma.brand.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Honda' } },
    update: {},
    create: { companyId: company.id, name: 'Honda' },
  });

  // ---- Categorias (árvore) ----
  const catFreio = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Freio' } },
    update: {},
    create: { companyId: company.id, name: 'Freio' },
  });
  const catPastilhas = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Pastilhas' } },
    update: { parentId: catFreio.id },
    create: { companyId: company.id, name: 'Pastilhas', parentId: catFreio.id },
  });
  const catDiscos = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Discos' } },
    update: { parentId: catFreio.id },
    create: { companyId: company.id, name: 'Discos', parentId: catFreio.id },
  });
  const catFiltros = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Filtros' } },
    update: {},
    create: { companyId: company.id, name: 'Filtros' },
  });
  const catSuspensao = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Suspensão' } },
    update: {},
    create: { companyId: company.id, name: 'Suspensão' },
  });
  const catMotor = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Motor' } },
    update: {},
    create: { companyId: company.id, name: 'Motor' },
  });
  const catIgnicao = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Ignição' } },
    update: { parentId: catMotor.id },
    create: { companyId: company.id, name: 'Ignição', parentId: catMotor.id },
  });

  // ---- Fornecedores ----
  const supABC = await prisma.supplier.upsert({
    where: { companyId_cnpj: { companyId: company.id, cnpj: '12345678000190' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Distribuidora ABC de Autopeças',
      cnpj: '12345678000190',
      ie: '111222333',
      email: 'compras@abcpecas.com.br',
      phone: '(11) 4000-1000',
    },
  });
  const supSul = await prisma.supplier.upsert({
    where: { companyId_cnpj: { companyId: company.id, cnpj: '98765432000110' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Importadora Sul Peças',
      cnpj: '98765432000110',
      ie: '444555666',
      email: 'vendas@sulpecas.com.br',
      phone: '(51) 3000-2000',
    },
  });

  // ---- Veículos ----
  const vhCorolla = await prisma.vehicle.upsert({
    where: { id: 'vh-corolla' },
    update: {},
    create: {
      id: 'vh-corolla',
      companyId: company.id,
      brandId: brandToyota.id,
      model: 'Corolla',
      yearStart: 2015,
      yearEnd: 2023,
      category: 'carro',
    },
  });
  const vhStrada = await prisma.vehicle.upsert({
    where: { id: 'vh-strada' },
    update: {},
    create: {
      id: 'vh-strada',
      companyId: company.id,
      brandId: brandFiat.id,
      model: 'Strada',
      yearStart: 2014,
      yearEnd: 2022,
      category: 'carro',
    },
  });
  const vhSaveiro = await prisma.vehicle.upsert({
    where: { id: 'vh-saveiro' },
    update: {},
    create: {
      id: 'vh-saveiro',
      companyId: company.id,
      brandId: brandVw.id,
      model: 'Saveiro',
      yearStart: 2013,
      yearEnd: 2023,
      category: 'carro',
    },
  });
  const vhCg160 = await prisma.vehicle.upsert({
    where: { id: 'vh-cg160' },
    update: {},
    create: {
      id: 'vh-cg160',
      companyId: company.id,
      brandId: brandHonda.id,
      model: 'CG 160',
      yearStart: 2016,
      yearEnd: 2024,
      category: 'moto',
    },
  });

  // ---- Vincula os produtos iniciais a marca/categoria/fornecedor ----
  await prisma.product.update({
    where: { id: pastilha.id },
    data: {
      brandId: brandFremax.id,
      categoryId: catPastilhas.id,
      supplierId: supABC.id,
      supplierCode: 'FRE-0114',
      ean: '7891000000011',
    },
  });
  await prisma.product.update({
    where: { id: filtro.id },
    data: {
      brandId: brandTecfil.id,
      categoryId: catFiltros.id,
      supplierId: supABC.id,
      supplierCode: 'TEC-0288',
      ean: '7891000000028',
    },
  });

  // ---- Mais produtos do catálogo ----
  const disco = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'DIS-200' } },
    update: { avgCost: 95, markupPercent: 40 },
    create: {
      companyId: company.id,
      sku: 'DIS-200',
      name: 'Disco de freio ventilado',
      oem: '43512-0K080',
      ean: '7891000000035',
      ncm: '87083090',
      brandId: brandFremax.id,
      categoryId: catDiscos.id,
      supplierId: supABC.id,
      supplierCode: 'FRE-0215',
      avgCost: 95,
      markupPercent: 40,
    },
  });
  const amortecedor = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'AMO-300' } },
    update: { avgCost: 120, markupPercent: 50 },
    create: {
      companyId: company.id,
      sku: 'AMO-300',
      name: 'Amortecedor dianteiro',
      ncm: '87088000',
      ean: '7891000000042',
      brandId: brandNakata.id,
      categoryId: catSuspensao.id,
      supplierId: supSul.id,
      supplierCode: 'NAK-3101',
      avgCost: 120,
      markupPercent: 50,
    },
  });
  const velas = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'VEL-400' } },
    update: { avgCost: 32, markupPercent: 55 },
    create: {
      companyId: company.id,
      sku: 'VEL-400',
      name: 'Jogo de velas de ignição (4 un)',
      ncm: '85111000',
      ean: '7891000000059',
      brandId: brandBosch.id,
      categoryId: catIgnicao.id,
      supplierId: supABC.id,
      supplierCode: 'BOS-4402',
      avgCost: 32,
      markupPercent: 55,
    },
  });
  const oleo = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'OLE-500' } },
    update: { avgCost: 28, markupPercent: 65 },
    create: {
      companyId: company.id,
      sku: 'OLE-500',
      name: 'Óleo lubrificante 5W30 1L',
      ncm: '27101932',
      ean: '7891000000066',
      categoryId: catMotor.id,
      supplierId: supSul.id,
      supplierCode: 'OLE-0501',
      avgCost: 28,
      markupPercent: 65,
    },
  });
  const pastilhaAlt = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'PAS-002' } },
    update: { avgCost: 42, markupPercent: 45 },
    create: {
      companyId: company.id,
      sku: 'PAS-002',
      name: 'Pastilha de freio dianteira (linha econômica)',
      oem: '04465-0K090',
      ncm: '87083019',
      brandId: brandFremax.id,
      categoryId: catPastilhas.id,
      supplierId: supSul.id,
      supplierCode: 'FRE-0115',
      avgCost: 42,
      markupPercent: 45,
    },
  });

  // ---- Equivalentes ----
  await prisma.productEquivalent.upsert({
    where: {
      fromProductId_toProductId: {
        fromProductId: pastilha.id,
        toProductId: pastilhaAlt.id,
      },
    },
    update: { compatibility: 'similar' },
    create: {
      fromProductId: pastilha.id,
      toProductId: pastilhaAlt.id,
      compatibility: 'similar',
      note: 'Pastilha econômica compatível com a linha premium',
    },
  });

  // ---- Aplicações (peça → veículo) ----
  async function ensureApplication(data: {
    productId: string;
    vehicleId: string;
    engine?: string;
    transmission?: string;
    traction?: string;
    hasAC?: boolean;
  }) {
    const existing = await prisma.productApplication.findFirst({ where: data });
    if (!existing) {
      await prisma.productApplication.create({ data });
    }
  }

  await ensureApplication({
    productId: pastilha.id,
    vehicleId: vhCorolla.id,
    engine: '2.0',
    transmission: 'Automático',
    hasAC: true,
  });
  await ensureApplication({
    productId: pastilha.id,
    vehicleId: vhStrada.id,
    engine: '1.4',
    transmission: 'Manual',
  });
  await ensureApplication({
    productId: disco.id,
    vehicleId: vhCorolla.id,
    engine: '2.0',
  });
  await ensureApplication({
    productId: amortecedor.id,
    vehicleId: vhSaveiro.id,
    traction: '4x2',
  });
  await ensureApplication({ productId: filtro.id, vehicleId: vhCorolla.id });
  await ensureApplication({ productId: filtro.id, vehicleId: vhCg160.id });
  await ensureApplication({ productId: velas.id, vehicleId: vhCorolla.id });

  // ---- Impostos por UF (ICMS/ST) ----
  const taxas = [
    { productId: pastilha.id, uf: 'SP', icmsRate: 18, mvaPercent: 45 },
    { productId: pastilha.id, uf: 'MG', icmsRate: 18, mvaPercent: 45 },
    { productId: disco.id, uf: 'SP', icmsRate: 18, mvaPercent: 45 },
    { productId: disco.id, uf: 'MG', icmsRate: 18, mvaPercent: 45 },
    { productId: filtro.id, uf: 'SP', icmsRate: 12, mvaPercent: 30 },
    { productId: filtro.id, uf: 'MG', icmsRate: 12, mvaPercent: 30 },
  ];
  for (const t of taxas) {
    await prisma.productTax.upsert({
      where: { productId_uf: { productId: t.productId, uf: t.uf } },
      update: { icmsRate: t.icmsRate, mvaPercent: t.mvaPercent },
      create: {
        productId: t.productId,
        uf: t.uf,
        icmsRate: t.icmsRate,
        mvaPercent: t.mvaPercent,
      },
    });
  }

  // ---- Clientes por tipo ----
  await prisma.customer.upsert({
    where: { id: 'cli-rota-sul' },
    update: {},
    create: {
      id: 'cli-rota-sul',
      companyId: company.id,
      name: 'Transportadora Rota Sul',
      doc: '11222333000144',
      type: 'frotista',
      discountPercent: 5,
      phone: '(11) 3000-2000',
    },
  });
  await prisma.customer.upsert({
    where: { id: 'cli-oficina-ze' },
    update: {},
    create: {
      id: 'cli-oficina-ze',
      companyId: company.id,
      name: 'Oficina do Zé',
      doc: '22333444000155',
      type: 'mecanica',
      discountPercent: 8,
      phone: '(31) 3222-1100',
    },
  });
  await prisma.customer.upsert({
    where: { id: 'cli-joao' },
    update: {},
    create: {
      id: 'cli-joao',
      companyId: company.id,
      name: 'João da Silva',
      type: 'consumidor',
      discountPercent: 0,
    },
  });

  // ---- Canais de venda (marketplaces) ----
  const canais = [
    {
      slug: 'mercado_livre',
      name: 'Mercado Livre',
      commissionPercent: 14,
      fixedFee: 0,
      shipping: 9.9,
    },
    {
      slug: 'shopee',
      name: 'Shopee',
      commissionPercent: 14,
      fixedFee: 0,
      shipping: 8,
    },
    {
      slug: 'amazon',
      name: 'Amazon',
      commissionPercent: 15,
      fixedFee: 0,
      shipping: 12,
    },
    {
      slug: 'atacado',
      name: 'Atacado',
      commissionPercent: 0,
      fixedFee: 0,
      shipping: 0,
    },
  ];
  for (const c of canais) {
    await prisma.salesChannel.upsert({
      where: { companyId_slug: { companyId: company.id, slug: c.slug } },
      update: { commissionPercent: c.commissionPercent, shipping: c.shipping },
      create: { companyId: company.id, ...c },
    });
  }

  console.log(
    'Seed MGN ok. Logins: gestor@mgn.local / senha123 · catálogo, marcas, categorias, veículos, clientes, fornecedores e canais prontos.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
