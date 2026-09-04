import { XMLParser } from 'fast-xml-parser';

export type ParsedNfeItem = {
  sku: string;
  ean?: string;
  ncm?: string;
  cest?: string;
  cst?: string;
  cfop?: string;
  description: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  icmsBase?: number;
  icmsRate?: number;
};

export type ParsedNfe = {
  accessKey: string;
  number?: string;
  series?: string;
  model?: string;
  issuedAt?: Date;
  supplierCnpj?: string;
  supplierName?: string;
  supplierIe?: string;
  total: number;
  items: ParsedNfeItem[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === 'det',
});

function num(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function pickIcms(icms: any): { vBC?: number; pICMS?: number; CST?: string } {
  if (!icms || typeof icms !== 'object') return {};
  const key = Object.keys(icms).find((k) => /^ICMS/.test(k));
  if (!key) return {};
  let g = icms[key];
  if (Array.isArray(g)) g = g[0];
  if (!g || typeof g !== 'object') return {};
  return { vBC: num(g.vBC), pICMS: num(g.pICMS), CST: str(g.CST) };
}

export function parseNfeXml(xml: string): ParsedNfe {
  const doc = parser.parse(xml);
  const nfe = doc?.nfeProc?.NFe ?? doc?.NFe;
  const inf = nfe?.infNFe;
  if (!inf) {
    throw new Error('XML não é uma NF-e/NFC-e válida');
  }

  const accessKey = str(inf['@_Id'])?.replace(/^NFe/, '') ?? '';
  if (!accessKey) {
    throw new Error('Chave de acesso ausente no XML');
  }

  const dets = inf.det ? (Array.isArray(inf.det) ? inf.det : [inf.det]) : [];

  const items: ParsedNfeItem[] = dets.map((det: any) => {
    const prod = det?.prod ?? {};
    const icms = pickIcms(det?.imposto?.ICMS);
    return {
      sku: str(prod.cProd) ?? '',
      ean: str(prod.cEAN),
      ncm: str(prod.NCM),
      cest: str(prod.CEST),
      cst: icms.CST,
      cfop: str(prod.CFOP),
      description: str(prod.xProd) ?? '',
      qty: num(prod.qCom) ?? 0,
      unitCost: num(prod.vUnCom) ?? 0,
      totalCost: num(prod.vProd) ?? 0,
      icmsBase: icms.vBC,
      icmsRate: icms.pICMS,
    };
  });

  return {
    accessKey,
    number: str(inf.ide?.nNF),
    series: str(inf.ide?.serie),
    model: str(inf.ide?.mod),
    issuedAt: inf.ide?.dhEmi ? new Date(String(inf.ide.dhEmi)) : undefined,
    supplierCnpj: str(inf.emit?.CNPJ),
    supplierName: str(inf.emit?.xNome),
    supplierIe: str(inf.emit?.IE),
    total: num(inf.total?.ICMSTot?.vNF) ?? 0,
    items,
  };
}
