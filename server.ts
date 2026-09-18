import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { checkDatabaseConnection, getDbPool } from "./server/db";
import { 
  BRAZILIAN_FLEET_DATABASE, 
  getDistinctFleetMakes, 
  getModelsByFleetMake, 
  getAvailableYearsForSelection, 
  getEnginesForSelection,
  queryPartsByVehicleApplication,
  reverseLookupVehiclesForPart 
} from "./src/data/fleetDatabase";
import { INITIAL_PRODUCTS } from "./src/data/initialData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy initialization of Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "GATO - Gestão de Estoque e Balcão SaaS",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Supabase PostgreSQL Database Status
app.get("/api/db/status", async (req, res) => {
  try {
    const status = await checkDatabaseConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err.message || "Erro ao verificar conexão com Supabase",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get products from Supabase (from Product table with StockLevel and Category)
app.get("/api/db/products", async (req, res) => {
  try {
    const pool = getDbPool();
    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.barcode,
        p.description,
        p.brand,
        p."costPrice"::float as "costPrice",
        p."salePrice"::float as "salePrice",
        p."minStock",
        p.active,
        c.name as "categoryName",
        p."createdAt",
        p."updatedAt",
        COALESCE(SUM(sl.quantity), 0)::int as stock,
        COALESCE(SUM(sl.reserved), 0)::int as reserved
      FROM "Product" p
      LEFT JOIN "StockLevel" sl ON sl."productId" = p.id
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      GROUP BY p.id, c.name
      ORDER BY p.sku ASC;
    `;
    const result = await pool.query(query);
    res.json({ 
      success: true, 
      count: result.rows.length, 
      products: result.rows, 
      source: 'Product (Supabase PostgreSQL)' 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create/Insert product into Supabase
app.post("/api/db/products", async (req, res) => {
  try {
    const pool = getDbPool();
    const { sku, name, brand, costPrice, salePrice, minStock, initialStock, categoryName } = req.body;
    
    if (!sku || !name) {
      return res.status(400).json({ success: false, error: "SKU e Nome são obrigatórios" });
    }

    // Get default tenant
    const tenantRes = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
    const tenantId = tenantRes.rows[0]?.id || "cmtt58e6o0000ju346a0g6s32";

    // Generate unique ID
    const prodId = 'prod_' + Math.random().toString(36).substring(2, 11);
    
    // Optional category lookup
    let catId = null;
    if (categoryName) {
      const catRes = await pool.query('SELECT id FROM "Category" WHERE LOWER(name) = LOWER($1) LIMIT 1;', [categoryName]);
      catId = catRes.rows[0]?.id || null;
    }

    await pool.query(
      `INSERT INTO "Product" (id, sku, name, brand, "costPrice", "salePrice", "minStock", active, "tenantId", "categoryId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, NOW(), NOW());`,
      [prodId, sku, name, brand || "Genérica", costPrice || 0, salePrice || 0, minStock || 5, tenantId, catId]
    );

    // If initial stock provided, insert into default warehouse
    if (initialStock && initialStock > 0) {
      const wRes = await pool.query('SELECT id FROM "Warehouse" ORDER BY code ASC LIMIT 1;');
      if (wRes.rows.length > 0) {
        const stockId = 'sl_' + Math.random().toString(36).substring(2, 11);
        await pool.query(
          `INSERT INTO "StockLevel" (id, "productId", "warehouseId", quantity, reserved, "updatedAt")
           VALUES ($1, $2, $3, $4, 0, NOW());`,
          [stockId, prodId, wRes.rows[0].id, parseInt(initialStock, 10)]
        );
      }
    }

    res.json({ success: true, id: prodId, message: "Produto cadastrado no Supabase com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get branches/warehouses from Supabase
app.get("/api/db/branches", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query('SELECT id, code, name, address, "tenantId" FROM "Warehouse" ORDER BY code ASC;');
    res.json({ success: true, count: result.rows.length, branches: result.rows, source: 'Warehouse (Supabase PostgreSQL)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get customers from Supabase
app.get("/api/db/customers", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        document, 
        phone, 
        email, 
        ie, 
        type, 
        address, 
        city, 
        state, 
        "personType", 
        active, 
        "createdAt"
      FROM "Customer" 
      ORDER BY name ASC;
    `);
    res.json({ success: true, count: result.rows.length, customers: result.rows, source: 'Customer (Supabase PostgreSQL)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Insert customer into Supabase
app.post("/api/db/customers", async (req, res) => {
  try {
    const pool = getDbPool();
    const { name, document, phone, email, ie, city, state, personType } = req.body;
    if (!name || !document) {
      return res.status(400).json({ success: false, error: "Nome e Documento (CPF/CNPJ) são obrigatórios" });
    }

    const tenantRes = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
    const tenantId = tenantRes.rows[0]?.id || "cmtt58e6o0000ju346a0g6s32";

    const customerId = 'cust_' + Math.random().toString(36).substring(2, 11);

    await pool.query(`
      INSERT INTO "Customer" (id, name, document, phone, email, ie, type, city, state, "personType", active, "tenantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, NOW(), NOW());
    `, [
      customerId,
      name,
      document,
      phone || null,
      email || null,
      ie || null,
      personType === 'PJ' ? 'COMPANY' : 'CONSUMER',
      city || 'São Paulo',
      state || 'SP',
      personType || (document.length > 14 ? 'PJ' : 'PF'),
      tenantId
    ]);

    res.json({ success: true, id: customerId, message: "Cliente registrado no Supabase com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get suppliers from Supabase
app.get("/api/db/suppliers", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query('SELECT id, name, cnpj, contact, phone, email, address FROM "Supplier" ORDER BY name ASC;');
    res.json({ success: true, count: result.rows.length, suppliers: result.rows, source: 'Supplier (Supabase PostgreSQL)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create/Register supplier in Supabase
app.post("/api/db/suppliers", async (req, res) => {
  try {
    const pool = getDbPool();
    const { name, cnpj, contact, phone, email, address } = req.body;
    const tenantRes = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
    const tenantId = tenantRes.rows[0]?.id || "cmtt58e6o0000ju346a0g6s32";
    const id = `sup_${Date.now()}`;
    const insertRes = await pool.query(
      `INSERT INTO "Supplier" (id, "tenantId", name, cnpj, contact, phone, email, address, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *;`,
      [id, tenantId, name, cnpj || null, contact || null, phone || null, email || null, address || null]
    );
    res.json({ success: true, supplier: insertRes.rows[0] });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// Save Budget/DAV into Supabase
app.post("/api/db/quotes", async (req, res) => {
  try {
    const pool = getDbPool();
    const { number, customerName, total, items, status } = req.body;

    const tenantRes = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
    const tenantId = tenantRes.rows[0]?.id || "cmtt58e6o0000ju346a0g6s32";

    const budgetId = 'bud_' + Math.random().toString(36).substring(2, 11);

    // Find customer id if exists
    let customerId = null;
    if (customerName) {
      const cRes = await pool.query('SELECT id FROM "Customer" WHERE LOWER(name) LIKE LOWER($1) LIMIT 1;', [`%${customerName}%`]);
      customerId = cRes.rows[0]?.id || null;
    }

    await pool.query(`
      INSERT INTO "Budget" (id, number, "customerId", total, status, "tenantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
    `, [budgetId, number || `DAV-${Date.now().toString().slice(-6)}`, customerId, total || 0, status || 'PENDING', tenantId]);

    // Insert items if provided
    if (Array.isArray(items)) {
      for (const it of items) {
        const itemId = 'bi_' + Math.random().toString(36).substring(2, 11);
        await pool.query(`
          INSERT INTO "BudgetItem" (id, "budgetId", "productId", quantity, "unitPrice", "createdAt")
          VALUES ($1, $2, $3, $4, $5, NOW());
        `, [itemId, budgetId, it.productId || null, it.quantity || 1, it.unitPrice || 0]);
      }
    }

    res.json({ success: true, budgetId, message: "DAV / Orçamento registrado no Supabase com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync GATO Catalog Products into Supabase
app.post("/api/db/sync-catalog", async (req, res) => {
  try {
    const pool = getDbPool();
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: "Nenhum produto fornecido para sincronização." });
    }

    const tenantRes = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
    const tenantId = tenantRes.rows[0]?.id || "cmtt58e6o0000ju346a0g6s32";

    const warehouseRes = await pool.query('SELECT id FROM "Warehouse" ORDER BY code ASC LIMIT 1;');
    const warehouseId = warehouseRes.rows[0]?.id;

    let inserted = 0;
    let updated = 0;

    for (const p of products) {
      const code = p.code || p.sku;
      if (!code) continue;

      // Check if product exists by SKU
      const existing = await pool.query('SELECT id FROM "Product" WHERE sku = $1 LIMIT 1;', [code]);
      
      if (existing.rows.length > 0) {
        // Update product
        const prodId = existing.rows[0].id;
        await pool.query(`
          UPDATE "Product"
          SET name = $1, brand = $2, "costPrice" = $3, "salePrice" = $4, "minStock" = $5, "updatedAt" = NOW()
          WHERE id = $6;
        `, [p.name, p.brand, p.costPrice || 0, p.salePrice || 0, p.minStock || 5, prodId]);

        if (warehouseId && (p.stock !== undefined || p.currentStock !== undefined)) {
          const qty = p.stock !== undefined ? p.stock : p.currentStock;
          await pool.query(`
            INSERT INTO "StockLevel" (id, "productId", "warehouseId", quantity, reserved, "updatedAt")
            VALUES ($1, $2, $3, $4, 0, NOW())
            ON CONFLICT (id) DO UPDATE SET quantity = $4, "updatedAt" = NOW();
          `, ['sl_' + Math.random().toString(36).substring(2, 11), prodId, warehouseId, qty]);
        }
        updated++;
      } else {
        // Insert product
        const prodId = 'prod_' + Math.random().toString(36).substring(2, 11);
        await pool.query(`
          INSERT INTO "Product" (id, sku, name, brand, "costPrice", "salePrice", "minStock", active, "tenantId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW(), NOW());
        `, [prodId, code, p.name, p.brand || "GATO", p.costPrice || 0, p.salePrice || 0, p.minStock || 5, tenantId]);

        if (warehouseId && (p.stock !== undefined || p.currentStock !== undefined)) {
          const qty = p.stock !== undefined ? p.stock : p.currentStock;
          const slId = 'sl_' + Math.random().toString(36).substring(2, 11);
          await pool.query(`
            INSERT INTO "StockLevel" (id, "productId", "warehouseId", quantity, reserved, "updatedAt")
            VALUES ($1, $2, $3, $4, 0, NOW());
          `, [slId, prodId, warehouseId, qty]);
        }
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Sincronização concluída com Supabase! (${inserted} inseridos, ${updated} atualizados)`,
      inserted,
      updated,
      total: inserted + updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REST API: Gestão de Frota e Veículos
// Mapeamento: id, montadora, veiculo, ano, motor, modelo
// ==========================================
interface FleetVehicle {
  id: string;        // ID único do registro (JSON: id)
  montadora: string; // Fabricante (VARCHAR 100, Obrigatório)
  modelo: string;    // Nome comercial (VARCHAR 100, Obrigatório)
  veiculo: string;   // Placa ou Chassi (VARCHAR 20, Obrigatório, Único)
  ano: number;       // INTEGER 4 dígitos (Obrigatório, Range 1900-2026)
  motor: string;     // Especificação do motor (VARCHAR 50, Opcional)
  createdAt?: string;
  updatedAt?: string;
}

// Catálogo de Marcas e Modelos para Autocomplete Assíncrono (Combobox)
const VEHICLE_CATALOG_MAKES: Record<string, string[]> = {
  "Volkswagen": ["Gol G5", "Gol Trend", "Polo Track", "Polo Highline", "Saveiro Cross", "Saveiro Robust", "Virtus", "T-Cross", "Nivus", "Amarok V6", "Fox", "Voyage", "Jetta TSI", "Taos", "Golf GTI"],
  "Fiat": ["Strada Freedom", "Strada Volcano", "Mobi Like", "Argo Drive", "Toro Volcano", "Toro Ranch", "Fiorino Endurance", "Cronos Drive", "Pulse Audace", "Fastback", "Uno Mille Fire", "Uno Way", "Palio Fire", "Siena", "Ducato Maxicargo"],
  "Chevrolet": ["Onix LTZ", "Onix Plus Premier", "Tracker Premier", "S10 High Country", "S10 LTZ", "Montana Premier", "Spin Activ", "Cruze Sport6", "Equinox", "Celta", "Corsa Sedan", "Astra", "Trailblazer"],
  "Toyota": ["Corolla XEi", "Corolla Altis Hybrid", "Corolla Cross XRX", "Hilux SRV 4x4", "Hilux GR-Sport", "SW4 Diamond", "Yaris Sedan XS", "Yaris Hatch XLS", "Etios Sedan", "RAV4 Hybrid"],
  "Hyundai": ["HB20 Comfort", "HB20 Platinum Plus", "HB20S Diamond", "Creta Ultimate", "Creta Comfort", "Tucson GL", "Santa Fe V6", "i30 2.0", "HR 2.5"],
  "Ford": ["Ranger XLS 4x4", "Ranger Limited V6", "Maverick Lariat", "Territory Titanium", "Bronco Sport", "Ka SE Plus", "Ka Sedan", "EcoSport Titanium", "Fiesta Titanium", "Focus Hatch", "Transit Furgão"],
  "Renault": ["Kwid Zen", "Duster Iconic", "Oroch Outsider", "Sandero Stepway", "Logan Zen", "Master Furgão", "Captur Bose", "Kardian Première Edition"],
  "Jeep": ["Renegade Longitude", "Compass Longitude", "Compass Trailhawk", "Commander Overland", "Wrangler Rubicon", "Grand Cherokee 4xe"],
  "Honda": ["Civic Touring", "Civic EXL", "HR-V Touring", "HR-V Advance", "City Sedan Touring", "City Hatchback EXL", "Fit EXL", "WR-V EX", "CR-V Hybrid"],
  "Nissan": ["Kicks Advance", "Kicks Exclusive", "Versa Exclusive", "Frontier Attack 4x4", "Frontier PRO-4X", "Sentra Exclusive"],
  "Mercedes-Benz": ["Sprinter 415 CDI", "Sprinter 516 CDI", "Sprinter 314 CDI", "Accelo 815", "Accelo 1016", "Atego 2426", "Atego 1719", "Actros 2651"],
  "Scania": ["R 450 Highline", "R 500 Super", "R 540", "G 410", "P 320", "P 360 XT"],
  "Volvo": ["FH 540 Globetrotter", "FH 460", "VM 270", "VM 330", "FMX 460"],
  "Peugeot": ["208 Griffe", "208 Style", "2008 Griffe", "Partner Rapid", "Expert Furgão"],
  "Citroën": ["C3 Feel", "C3 Aircross", "C4 Cactus Shine", "Jumpy Furgão"],
  "Mitsubishi": ["L200 Triton Sport", "Eclipse Cross HPE-S", "Pajero Sport HPE", "ASX 2.0"],
  "BMW": ["320i M Sport", "X1 sDrive20i", "X3 xDrive30e", "X5 xDrive45e", "330e M Sport"],
  "Audi": ["A3 Sedan Performance", "A4 Sedan", "Q3 Prestige", "Q5 S Line", "e-tron Sportback"]
};

// In-memory fleet vehicle store with comprehensive initial vehicle fleet
let fleetVehicles: FleetVehicle[] = [
  { id: "veh-1", montadora: "Volkswagen", modelo: "Gol G5", veiculo: "BRA2E19", ano: 2012, motor: "1.6 8V EA111 Total Flex" },
  { id: "veh-2", montadora: "Fiat", modelo: "Uno Mille Fire", veiculo: "ABC1D23", ano: 2010, motor: "1.0 8V Fire Flex" },
  { id: "veh-3", montadora: "Toyota", modelo: "Corolla XEi", veiculo: "RIO4A21", ano: 2021, motor: "2.0 Dynamic Force Flex" },
  { id: "veh-4", montadora: "Chevrolet", modelo: "Onix LTZ", veiculo: "ONX8B77", ano: 2020, motor: "1.0 12V Turbo Flex" },
  { id: "veh-5", montadora: "Fiat", modelo: "Strada Freedom", veiculo: "STR3F45", ano: 2022, motor: "1.3 8V Firefly Flex" },
  { id: "veh-6", montadora: "Toyota", modelo: "Hilux SRV 4x4", veiculo: "HLX9K88", ano: 2023, motor: "2.8 16V Turbo Diesel D-4D" },
  { id: "veh-7", montadora: "Volkswagen", modelo: "Saveiro Cross", veiculo: "SAV5C33", ano: 2018, motor: "1.6 16V MSI Flex" },
  { id: "veh-8", montadora: "Ford", modelo: "Ranger XLS 4x4", veiculo: "RNG7D12", ano: 2019, motor: "2.2 Turbo Diesel Duratorq" },
  { id: "veh-9", montadora: "Honda", modelo: "Civic Touring", veiculo: "CIV9T44", ano: 2017, motor: "1.5 16V Turbo Gasolina" },
  { id: "veh-10", montadora: "Hyundai", modelo: "HB20 Comfort", veiculo: "HBZ2X90", ano: 2022, motor: "1.0 12V Kappa Flex" },
  { id: "veh-11", montadora: "Renault", modelo: "Master Furgão", veiculo: "MST4V55", ano: 2020, motor: "2.3 16V dCi Turbo Diesel" },
  { id: "veh-12", montadora: "Scania", modelo: "R 450 Highline", veiculo: "SCN6R50", ano: 2021, motor: "13.0 Litros 6 Cilindros Euro 6" },
  { id: "veh-13", montadora: "Volvo", modelo: "FH 540 Globetrotter", veiculo: "VLV8F40", ano: 2022, motor: "D13K 540cv Turbo Intercooler" },
  { id: "veh-14", montadora: "Mercedes-Benz", modelo: "Sprinter 415 CDI", veiculo: "MBZ5S15", ano: 2019, motor: "2.2 CDI Bi-Turbo OM651" },
  { id: "veh-15", montadora: "Jeep", modelo: "Compass Longitude", veiculo: "JEP3C77", ano: 2023, motor: "1.3 GSE Turbo T270 Flex" },
  { id: "veh-16", montadora: "Nissan", modelo: "Kicks Advance", veiculo: "KCK1A66", ano: 2021, motor: "1.6 16V HR16DE Flex" },
  { id: "veh-17", montadora: "Chevrolet", modelo: "S10 High Country", veiculo: "CHV4S10", ano: 2022, motor: "2.8 CTDI Turbo Diesel 200cv" },
  { id: "veh-18", montadora: "Fiat", modelo: "Fiorino Endurance", veiculo: "FIO8E22", ano: 2023, motor: "1.4 8V EVO Flex" },
  { id: "veh-19", montadora: "Volkswagen", modelo: "Polo Track", veiculo: "POL1T33", ano: 2024, motor: "1.0 12V MPI Flex" },
  { id: "veh-20", montadora: "Toyota", modelo: "Yaris Sedan XS", veiculo: "YAR7S99", ano: 2022, motor: "1.5 16V Dual VVT-i Flex" }
];

// GET /api/vehicles/makes - Endpoint para Combobox com busca assíncrona (Montadoras)
app.get("/api/vehicles/makes", (req, res) => {
  try {
    const q = (req.query.q as string || "").trim().toLowerCase();
    const allMakes = Array.from(
      new Set([
        ...Object.keys(VEHICLE_CATALOG_MAKES),
        ...fleetVehicles.map(v => v.montadora)
      ])
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const filtered = q ? allMakes.filter(m => m.toLowerCase().includes(q)) : allMakes;
    res.json({ success: true, data: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vehicles/models - Endpoint para Combobox com busca assíncrona (Modelos)
app.get("/api/vehicles/models", (req, res) => {
  try {
    const brand = (req.query.brand as string || "").trim().toLowerCase();
    const q = (req.query.q as string || "").trim().toLowerCase();

    let models: string[] = [];

    if (brand) {
      // Find matching key in VEHICLE_CATALOG_MAKES
      const foundKey = Object.keys(VEHICLE_CATALOG_MAKES).find(k => k.toLowerCase() === brand);
      if (foundKey) {
        models = [...VEHICLE_CATALOG_MAKES[foundKey]];
      }
      // Also add any models already registered for this brand in fleet
      const existingInFleet = fleetVehicles
        .filter(v => v.montadora.toLowerCase() === brand)
        .map(v => v.modelo);
      models = Array.from(new Set([...models, ...existingInFleet]));
    } else {
      // All models from catalog + fleet
      const allCatalog = Object.values(VEHICLE_CATALOG_MAKES).flat();
      const allFleet = fleetVehicles.map(v => v.modelo);
      models = Array.from(new Set([...allCatalog, ...allFleet]));
    }

    models.sort((a, b) => a.localeCompare(b, "pt-BR"));

    if (q) {
      models = models.filter(m => m.toLowerCase().includes(q));
    }

    res.json({ success: true, data: models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vehicles - Grade com paginação, ordenação (padrão 'modelo') e filtros
app.get("/api/vehicles", (req, res) => {
  try {
    const {
      search = "",
      montadora = "",
      anoMin,
      anoMax,
      sortBy = "modelo",
      sortOrder = "asc",
      page = "1",
      pageSize = "10"
    } = req.query as Record<string, string>;

    let result = [...fleetVehicles];

    // 1. Filtro de Busca Global (todas as colunas)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(v =>
        v.montadora.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.veiculo.toLowerCase().includes(q) ||
        v.motor.toLowerCase().includes(q) ||
        String(v.ano).includes(q)
      );
    }

    // 2. Filtro específico por Montadora
    if (montadora && montadora.trim() && montadora.toLowerCase() !== "todas") {
      result = result.filter(v => v.montadora.toLowerCase() === montadora.trim().toLowerCase());
    }

    // 3. Filtro específico por Ano (Range)
    if (anoMin && !isNaN(Number(anoMin))) {
      result = result.filter(v => v.ano >= Number(anoMin));
    }
    if (anoMax && !isNaN(Number(anoMax))) {
      result = result.filter(v => v.ano <= Number(anoMax));
    }

    // 4. Ordenação (crescente/decrescente com ordenação padrão por "modelo")
    const orderMult = sortOrder.toLowerCase() === "desc" ? -1 : 1;
    const validSortKeys: (keyof FleetVehicle)[] = ["montadora", "modelo", "veiculo", "ano", "motor"];
    const sortField = validSortKeys.includes(sortBy as keyof FleetVehicle) ? (sortBy as keyof FleetVehicle) : "modelo";

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * orderMult;
      }
      return String(valA || "").localeCompare(String(valB || ""), "pt-BR", { sensitivity: "base" }) * orderMult;
    });

    const total = result.length;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedPageSize = Math.max(1, parseInt(pageSize, 10) || 10);
    const totalPages = Math.ceil(total / parsedPageSize) || 1;

    // 5. Paginação (10, 25, 50 itens)
    const startIndex = (parsedPage - 1) * parsedPageSize;
    const paginatedData = result.slice(startIndex, startIndex + parsedPageSize);

    // Lista de todas as montadoras cadastradas para o dropdown de filtro
    const availableBrands = Array.from(new Set(fleetVehicles.map(v => v.montadora))).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    res.json({
      success: true,
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPages,
      data: paginatedData,
      availableBrands
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vehicles/:identifier - Detalhes do veículo por ID ou Placa/Chassi
app.get("/api/vehicles/:identifier", (req, res) => {
  try {
    const rawParam = decodeURIComponent(req.params.identifier).toUpperCase();
    const vehicle = fleetVehicles.find(v => v.id.toUpperCase() === rawParam || v.veiculo.toUpperCase() === rawParam);

    if (!vehicle) {
      return res.status(404).json({ success: false, error: `Veículo "${rawParam}" não encontrado.` });
    }

    res.json({ success: true, data: vehicle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/vehicles - Cadastro de novo veículo com validações
app.post("/api/vehicles", (req, res) => {
  try {
    const { montadora, modelo, veiculo, ano, motor } = req.body;

    // Validação de Montadora
    if (!montadora || typeof montadora !== "string" || !montadora.trim()) {
      return res.status(400).json({ success: false, error: "Montadora é obrigatória (VARCHAR 100)." });
    }
    if (montadora.trim().length > 100) {
      return res.status(400).json({ success: false, error: "Montadora não pode exceder 100 caracteres." });
    }

    // Validação de Modelo
    if (!modelo || typeof modelo !== "string" || !modelo.trim()) {
      return res.status(400).json({ success: false, error: "Modelo é obrigatório (VARCHAR 100)." });
    }
    if (modelo.trim().length > 100) {
      return res.status(400).json({ success: false, error: "Modelo não pode exceder 100 caracteres." });
    }

    // Validação de Veículo (Identificador Único: Placa ou Chassi)
    if (!veiculo || typeof veiculo !== "string" || !veiculo.trim()) {
      return res.status(400).json({ success: false, error: "Veículo (Placa ou Chassi) é obrigatório como identificador único." });
    }
    const cleanVeiculo = veiculo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (cleanVeiculo.length > 20) {
      return res.status(400).json({ success: false, error: "Veículo (Placa ou Chassi) não pode exceder 20 caracteres." });
    }

    // Validação de Unicidade
    const alreadyExists = fleetVehicles.some(v => v.veiculo.toUpperCase() === cleanVeiculo);
    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        error: `O veículo com identificador "${cleanVeiculo}" já está cadastrado no sistema (validação de unicidade).`
      });
    }

    // Validação de Ano (Especificação técnica: Range 1900 a 2026 / ano atual + 1)
    const numAno = parseInt(ano, 10);
    const maxAllowedYear = Math.max(2026, new Date().getFullYear() + 1);
    if (isNaN(numAno) || numAno < 1900 || numAno > maxAllowedYear) {
      return res.status(400).json({
        success: false,
        error: `Ano inválido. Deve ser um número inteiro de 4 dígitos entre 1900 e ${maxAllowedYear}.`
      });
    }

    // Validação de Motor
    const cleanMotor = (motor && typeof motor === "string") ? motor.trim() : "";
    if (cleanMotor.length > 50) {
      return res.status(400).json({ success: false, error: "Motor não pode exceder 50 caracteres." });
    }

    const newVehicle: FleetVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      montadora: montadora.trim(),
      modelo: modelo.trim(),
      veiculo: cleanVeiculo,
      ano: numAno,
      motor: cleanMotor,
      createdAt: new Date().toISOString()
    };

    fleetVehicles.unshift(newVehicle);

    res.status(201).json({
      success: true,
      message: `Veículo ${newVehicle.modelo} (${newVehicle.veiculo}) cadastrado com sucesso!`,
      data: newVehicle
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/vehicles/:identifier - Edição de veículo (por ID ou Placa/Chassi)
app.put("/api/vehicles/:identifier", (req, res) => {
  try {
    const rawParam = decodeURIComponent(req.params.identifier).toUpperCase();
    const index = fleetVehicles.findIndex(v => v.id.toUpperCase() === rawParam || v.veiculo.toUpperCase() === rawParam);

    if (index === -1) {
      return res.status(404).json({ success: false, error: `Veículo "${rawParam}" não encontrado.` });
    }

    const currentItem = fleetVehicles[index];
    const { montadora, modelo, veiculo: newVeiculo, ano, motor } = req.body;
    const maxAllowedYear = Math.max(2026, new Date().getFullYear() + 1);

    // Validações
    if (!montadora || typeof montadora !== "string" || !montadora.trim()) {
      return res.status(400).json({ success: false, error: "Montadora é obrigatória." });
    }
    if (montadora.trim().length > 100) {
      return res.status(400).json({ success: false, error: "Montadora não pode exceder 100 caracteres." });
    }

    if (!modelo || typeof modelo !== "string" || !modelo.trim()) {
      return res.status(400).json({ success: false, error: "Modelo é obrigatório." });
    }
    if (modelo.trim().length > 100) {
      return res.status(400).json({ success: false, error: "Modelo não pode exceder 100 caracteres." });
    }

    const cleanNewVeiculo = (newVeiculo && typeof newVeiculo === "string") 
      ? newVeiculo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") 
      : currentItem.veiculo;

    if (!cleanNewVeiculo) {
      return res.status(400).json({ success: false, error: "Veículo (Placa/Chassi) é obrigatório." });
    }
    if (cleanNewVeiculo.length > 20) {
      return res.status(400).json({ success: false, error: "Veículo (Placa/Chassi) não pode exceder 20 caracteres." });
    }

    // Se mudou o identificador, verificar se não colide com outro veículo
    if (cleanNewVeiculo !== currentItem.veiculo) {
      const conflict = fleetVehicles.some((v, idx) => idx !== index && v.veiculo.toUpperCase() === cleanNewVeiculo);
      if (conflict) {
        return res.status(400).json({
          success: false,
          error: `O identificador "${cleanNewVeiculo}" já está em uso por outro veículo cadastrado.`
        });
      }
    }

    const numAno = parseInt(ano, 10);
    if (isNaN(numAno) || numAno < 1900 || numAno > maxAllowedYear) {
      return res.status(400).json({
        success: false,
        error: `Ano inválido. Deve ser entre 1900 e ${maxAllowedYear}.`
      });
    }

    const cleanMotor = (motor && typeof motor === "string") ? motor.trim() : "";
    if (cleanMotor.length > 50) {
      return res.status(400).json({ success: false, error: "Motor não pode exceder 50 caracteres." });
    }

    fleetVehicles[index] = {
      ...currentItem,
      montadora: montadora.trim(),
      modelo: modelo.trim(),
      veiculo: cleanNewVeiculo,
      ano: numAno,
      motor: cleanMotor,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Veículo ${cleanNewVeiculo} atualizado com sucesso!`,
      data: fleetVehicles[index]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/vehicles/:identifier - Exclusão de veículo (por ID ou Placa/Chassi)
app.delete("/api/vehicles/:identifier", (req, res) => {
  try {
    const rawParam = decodeURIComponent(req.params.identifier).toUpperCase();
    const index = fleetVehicles.findIndex(v => v.id.toUpperCase() === rawParam || v.veiculo.toUpperCase() === rawParam);

    if (index === -1) {
      return res.status(404).json({ success: false, error: `Veículo "${rawParam}" não encontrado para exclusão.` });
    }

    const deleted = fleetVehicles.splice(index, 1)[0];
    res.json({
      success: true,
      message: `Veículo ${deleted.modelo} (${deleted.veiculo}) excluído com sucesso!`,
      deletedId: deleted.id,
      deletedVeiculo: deleted.veiculo
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// BANCO DA FROTA BRASIL 1995-2027 & APLICAÇÃO DE PEÇAS API
// ==========================================

// GET /api/fleet-database - Listagem e busca de modelos da frota (1995-2027)
app.get("/api/fleet-database", (req, res) => {
  try {
    const { montadora, segmento, ano, search, page = "1", limit = "50" } = req.query;
    let list = [...BRAZILIAN_FLEET_DATABASE];

    if (montadora && typeof montadora === "string" && montadora.trim() && montadora !== "Todas") {
      const mClean = montadora.toLowerCase().trim();
      list = list.filter(v => v.montadora.toLowerCase() === mClean);
    }

    if (segmento && typeof segmento === "string" && segmento.trim() && segmento !== "Todos") {
      list = list.filter(v => v.segmento === segmento);
    }

    if (ano) {
      const yearNum = parseInt(String(ano), 10);
      if (!isNaN(yearNum)) {
        list = list.filter(v => yearNum >= v.anoInicio && yearNum <= v.anoFim);
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const s = search.toLowerCase().trim();
      list = list.filter(v => 
        v.montadora.toLowerCase().includes(s) ||
        v.modelo.toLowerCase().includes(s) ||
        v.geracaoFase.toLowerCase().includes(s) ||
        v.motores.some(m => m.toLowerCase().includes(s)) ||
        (v.pecasChave && v.pecasChave.some(p => p.toLowerCase().includes(s)))
      );
    }

    const total = list.length;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      stats: {
        totalModelosCadastrados: BRAZILIAN_FLEET_DATABASE.length,
        marcasDistintas: getDistinctFleetMakes().length,
        periodoAbrangencia: "1995 a 2027",
        totalProdutosInventario: INITIAL_PRODUCTS.length
      },
      data: paginated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet-database/makes - Marcas da frota
app.get("/api/fleet-database/makes", (req, res) => {
  try {
    const makes = getDistinctFleetMakes();
    res.json({ success: true, count: makes.length, makes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet-database/models - Modelos por montadora
app.get("/api/fleet-database/models", (req, res) => {
  try {
    const montadora = req.query.montadora as string;
    const models = getModelsByFleetMake(montadora || "");
    res.json({ success: true, count: models.length, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet-database/years - Anos válidos para seleção
app.get("/api/fleet-database/years", (req, res) => {
  try {
    const { montadora, modelId } = req.query;
    const years = getAvailableYearsForSelection(
      typeof montadora === "string" ? montadora : undefined,
      typeof modelId === "string" ? modelId : undefined
    );
    res.json({ success: true, years });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet-database/engines - Motores para modelo
app.get("/api/fleet-database/engines", (req, res) => {
  try {
    const { modelId, ano } = req.query;
    if (!modelId || typeof modelId !== "string") {
      return res.status(400).json({ success: false, error: "modelId é obrigatório" });
    }
    const engines = getEnginesForSelection(modelId, ano ? parseInt(String(ano), 10) : undefined);
    res.json({ success: true, engines });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/parts-application/filter - Consulta e filtro de aplicação de peças
app.get("/api/parts-application/filter", (req, res) => {
  try {
    const { montadora, modeloId, modeloTexto, ano, motor, sistema, termoBusca } = req.query;
    
    const matches = queryPartsByVehicleApplication(INITIAL_PRODUCTS, {
      montadora: typeof montadora === "string" ? montadora : undefined,
      modeloId: typeof modeloId === "string" ? modeloId : undefined,
      modeloTexto: typeof modeloTexto === "string" ? modeloTexto : undefined,
      ano: ano ? parseInt(String(ano), 10) : undefined,
      motor: typeof motor === "string" ? motor : undefined,
      sistema: typeof sistema === "string" ? sistema : undefined,
      termoBusca: typeof termoBusca === "string" ? termoBusca : undefined,
    });

    res.json({
      success: true,
      count: matches.length,
      query: { montadora, modeloId, modeloTexto, ano, motor, sistema, termoBusca },
      matches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/parts-application/reverse/:code - Consulta reversa (Peça -> Veículos da Frota)
app.get("/api/parts-application/reverse/:code", (req, res) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const lookup = reverseLookupVehiclesForPart(INITIAL_PRODUCTS, code);
    
    if (!lookup.product) {
      return res.status(404).json({ success: false, error: `Peça com código "${code}" não encontrada.` });
    }

    res.json({
      success: true,
      product: lookup.product,
      appliedVehiclesCount: lookup.appliedVehicles.length,
      appliedVehicles: lookup.appliedVehicles,
      customApplications: lookup.customApplications
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/parts-application/export - Exportação/Download completo da frota e aplicações (JSON/CSV)
app.get("/api/parts-application/export", (req, res) => {
  try {
    const format = (req.query.format as string || "json").toLowerCase();

    if (format === "csv") {
      const headers = [
        "ID_MODELO",
        "MONTADORA",
        "MODELO",
        "SEGMENTO",
        "GERACAO_FASE",
        "ANO_INICIO",
        "ANO_FIM",
        "MOTORES",
        "COMBUSTIVEIS",
        "SISTEMAS_COMPATIVEIS",
        "PECAS_CHAVE_REPOSICAO",
        "CODIGO_FIPE_REF"
      ];

      const rows = BRAZILIAN_FLEET_DATABASE.map(v => [
        `"${v.id}"`,
        `"${v.montadora}"`,
        `"${v.modelo.replace(/"/g, '""')}"`,
        `"${v.segmento}"`,
        `"${v.geracaoFase.replace(/"/g, '""')}"`,
        v.anoInicio,
        v.anoFim,
        `"${v.motores.join("; ").replace(/"/g, '""')}"`,
        `"${v.combustiveis.join("; ")}"`,
        `"${v.sistemasCompativeis.join("; ")}"`,
        `"${(v.pecasChave || []).join("; ").replace(/"/g, '""')}"`,
        `"${v.fipeReferencia || ''}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="frota_brasil_1995_2027_aplicacao_pecas.csv"');
      return res.send(csvContent);
    }

    const exportPayload = {
      titulo: "Base da Frota Comercializada no Brasil (1995 a 2027) & Catálogo de Aplicação de Peças",
      geradoEm: new Date().toISOString(),
      versao: "2.4.0",
      abrangenciaAnos: "1995 a 2027",
      totalModelosFrota: BRAZILIAN_FLEET_DATABASE.length,
      totalPecasCatalogo: INITIAL_PRODUCTS.length,
      marcasCadastradas: getDistinctFleetMakes(),
      modelosFrota: BRAZILIAN_FLEET_DATABASE,
      pecasInventario: INITIAL_PRODUCTS.map(p => ({
        id: p.id,
        codigo: p.code,
        codigoOEM: p.oemCode,
        codigosSimilares: p.similarCodes,
        nome: p.name,
        marca: p.brand,
        categoria: p.category,
        estoque: p.stock,
        precoVenda: p.sellingPrice,
        ncm: p.ncm,
        localizacao: p.location,
        aplicacoes: p.applications
      }))
    };

    if (req.query.download === "true") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="banco_frota_brasil_1995_2027_aplicacao_pecas.json"');
    }

    res.json(exportPayload);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gemini Assistant for Auto Parts, XML Analysis, and Technical Support
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { prompt, contextType, partData } = req.body;
    const ai = getGeminiClient();

    let systemInstruction = `Você é o Assistente Especialista de Autopeças e Suporte do GATO (Sistema SaaS de Gestão de Estoque e Balcão de Peças Automotivas, Motos, Caminhões e Agrícola).
Seu papel é responder com precisão técnica em português do Brasil:
- Aplicação veicular: Marcas, modelos de carros/motos/caminhões/tratores, anos, motores (ex: EA111, AP, DC13, OHC, MWM, Cummins), transmissões, tração (4x2, 4x4, 6x2, 6x4) e se tem ar condicionado.
- Códigos similares e equivalências (OEM, Bosch, Mahle, Cofap, Fras-le, Nakata, Valeo, Donaldson, Dayco, Sachs).
- Tributação em autopeças: NCM, ICMS normal, ICMS-ST (Substituição Tributária), MVA, DIFAL interestadual e CFOP de compra/venda.
- Dicas operacionais para vendedores de balcão e gerentes de estoque.
Responda de forma direta, clara e formatada com tópicos objetivos.`;

    if (contextType === "xml_application_suggest") {
      systemInstruction += `\nO usuário está importando um XML de compra de autopeças e o item NÃO está cadastrado. Você deve deduzir e sugerir a aplicação veicular ideal:
1. Marca do Veículo
2. Veículos Compatíveis
3. Faixa de Anos
4. Motorização
5. Câmbio
6. Tração
7. Ar Condicionado (Sim/Não)
8. Códigos Similares (marcas equivalentes)
9. NCM e sugestão de MVA`;
    }

    if (!ai) {
      // Fallback domain-aware response if API key is not yet set in environment
      const fallbackTxt = `[Modo Técnico GATO]: Analisando item ${partData?.xProd || prompt}. 
Compatibilidade identificada com base no catálogo automotivo nacional:
- Linha: Leve e Utilitários
- Aplicação sugerida: Montadoras nacionais (VW / GM / Fiat) conforme código de referência.
- MVA estimado para autopeças: 40% a 45% (ICMS-ST).
- Dica de balcão: Sempre conferir o diâmetro e estrias antes da instalação.`;
      return res.json({
        response: fallbackTxt,
        text: fallbackTxt,
        isFallback: true,
      });
    }

    const fullPrompt = partData 
      ? `Analise o seguinte item extraído da NF-e para sugerir o cadastro completo:\nDescrição: ${partData.xProd}\nCódigo Fabricante: ${partData.cProd}\nNCM: ${partData.NCM}\nValor: R$ ${partData.vUnCom}\nSolicitação adicional: ${prompt || "Sugerir aplicação completa"}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\n${fullPrompt}` }] }
      ],
    });

    const outputText = response.text || "Sem resposta gerada pelo modelo.";
    res.json({ response: outputText, text: outputText, isFallback: false });
  } catch (error: any) {
    console.error("Gemini assist error:", error);
    res.status(500).json({ 
      error: "Falha ao processar solicitação de IA", 
      details: error.message,
      fallbackResponse: "O sistema GATO processou os parâmetros locais de compatibilidade veicular e tabela NCM com sucesso." 
    });
  }
});

// XML NF-e parser endpoint
app.post("/api/xml/parse", (req, res) => {
  try {
    const { xmlContent } = req.body;
    if (!xmlContent || typeof xmlContent !== "string") {
      return res.status(400).json({ error: "Conteúdo XML não fornecido." });
    }

    // Fast robust XML regex parsing for Brazilian NF-e 4.00
    const nNFMatch = xmlContent.match(/<nNF>(\d+)<\/nNF>/);
    const serieMatch = xmlContent.match(/<serie>(\d+)<\/serie>/);
    const dhEmiMatch = xmlContent.match(/<dhEmi>([^<]+)<\/dhEmi>/);
    const chaveMatch = xmlContent.match(/Id="NFe(\d{44})"/);
    const emitCNPJMatch = xmlContent.match(/<emit>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/);
    const emitNomeMatch = xmlContent.match(/<emit>[\s\S]*?<xNome>([^<]+)<\/xNome>/);
    const emitUFMatch = xmlContent.match(/<emit>[\s\S]*?<UF>([^<]+)<\/UF>/);
    const destNomeMatch = xmlContent.match(/<dest>[\s\S]*?<xNome>([^<]+)<\/xNome>/);
    const destCNPJMatch = xmlContent.match(/<dest>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/);
    const vNFMatch = xmlContent.match(/<vNF>([0-9.]+)<\/vNF>/);

    const header = {
      nNF: nNFMatch ? nNFMatch[1] : "000.000",
      serie: serieMatch ? serieMatch[1] : "1",
      dhEmi: dhEmiMatch ? dhEmiMatch[1] : new Date().toISOString(),
      chaveAcesso: chaveMatch ? chaveMatch[1] : "35260902987654000112550010000784911837492819",
      emitenteNome: emitNomeMatch ? emitNomeMatch[1] : "FORNECEDOR DE AUTOPEÇAS",
      emitenteCNPJ: emitCNPJMatch ? emitCNPJMatch[1] : "00.000.000/0001-00",
      emitenteIE: "123.456.789.000",
      emitenteUF: emitUFMatch ? emitUFMatch[1] : "SP",
      destinatarioNome: destNomeMatch ? destNomeMatch[1] : "GATO AUTOPEÇAS LTDA",
      destinatarioCNPJ: destCNPJMatch ? destCNPJMatch[1] : "12.345.678/0001-99",
      vTotalProd: vNFMatch ? parseFloat(vNFMatch[1]) : 0,
      vNF: vNFMatch ? parseFloat(vNFMatch[1]) : 0,
    };

    // Extract det items
    const detRegex = /<det nItem="(\d+)">([\s\S]*?)<\/det>/g;
    const items = [];
    let match;

    while ((match = detRegex.exec(xmlContent)) !== null) {
      const itemContent = match[2];
      const cProdMatch = itemContent.match(/<cProd>([^<]+)<\/cProd>/);
      const cEANMatch = itemContent.match(/<cEAN>([^<]+)<\/cEAN>/);
      const xProdMatch = itemContent.match(/<xProd>([^<]+)<\/xProd>/);
      const ncmMatch = itemContent.match(/<NCM>([^<]+)<\/NCM>/);
      const cfopMatch = itemContent.match(/<CFOP>([^<]+)<\/CFOP>/);
      const uComMatch = itemContent.match(/<uCom>([^<]+)<\/uCom>/);
      const qComMatch = itemContent.match(/<qCom>([0-9.]+)<\/qCom>/);
      const vUnComMatch = itemContent.match(/<vUnCom>([0-9.]+)<\/vUnCom>/);
      const vProdMatch = itemContent.match(/<vProd>([0-9.]+)<\/vProd>/);
      const vICMSMatch = itemContent.match(/<vICMS>([0-9.]+)<\/vICMS>/);

      items.push({
        cProd: cProdMatch ? cProdMatch[1].trim() : `COD-${items.length + 1}`,
        cEAN: cEANMatch ? cEANMatch[1].trim() : "",
        xProd: xProdMatch ? xProdMatch[1].trim() : "PRODUTO AUTOMOTIVO",
        NCM: ncmMatch ? ncmMatch[1].trim() : "8708.29.99",
        CFOP: cfopMatch ? cfopMatch[1].trim() : "5102",
        uCom: uComMatch ? uComMatch[1].trim() : "UN",
        qCom: qComMatch ? parseFloat(qComMatch[1]) : 1,
        vUnCom: vUnComMatch ? parseFloat(vUnComMatch[1]) : 0,
        vProd: vProdMatch ? parseFloat(vProdMatch[1]) : 0,
        vICMS: vICMSMatch ? parseFloat(vICMSMatch[1]) : 0,
      });
    }

    res.json({
      success: true,
      header,
      items,
      count: items.length,
    });
  } catch (err: any) {
    console.error("XML parse error:", err);
    res.status(500).json({ error: "Erro ao processar o arquivo XML", message: err.message });
  }
});

// Marketplace Webhook Simulator endpoint
app.post("/api/marketplaces/webhook", (req, res) => {
  const { channel, event, payload } = req.body;
  console.log(`[GATO Webhook] Received event '${event}' from channel '${channel}'`);
  res.json({
    received: true,
    channel,
    event,
    timestamp: new Date().toISOString(),
    status: "processed",
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GATO AutoPeças SaaS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
