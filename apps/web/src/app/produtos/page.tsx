'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };
type Category = { id: string; name: string; parentId?: string | null };

type Product = {
  id: string;
  sku: string;
  name: string;
  shortDescription?: string;
  segment: string;
  oem?: string;
  ncm?: string;
  avgCost: string;
  markupPercent: string;
  category?: { name: string } | null;
};

type ProductDetail = {
  id: string;
  sku: string;
  name: string;
  shortDescription?: string;
  segment: string;
  oem?: string;
  ean?: string;
  ncm?: string;
  cest?: string;
  cst?: string;
  avgCost: string;
  markupPercent: string;
  freightCost: string;
  costOther: string;
  techSheetUrl?: string;
  category?: { id: string; name: string; parent?: { name: string } | null } | null;
  brand?: { name: string } | null;
  supplier?: { name: string } | null;
  suppliers: {
    id: string;
    supplierId: string;
    supplier: { name: string };
    code?: string;
    price?: string;
    leadTimeDays?: number;
    preferred: boolean;
  }[];
  markups: { id: string; channel: string; percent: string }[];
};

const SEGMENTS = [
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'moto', label: 'Moto' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'agricola', label: 'Agrícola' },
  { value: 'geral', label: 'Geral' },
];

const CHANNELS = [
  { value: 'balcao', label: 'Balcão' },
  { value: 'site', label: 'Site' },
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'atacado', label: 'Atacado' },
];

export default function ProdutosPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    shortDescription: '',
    segment: 'automotivo',
    categoryId: '',
    brandId: '',
    supplierId: '',
    oem: '',
    ncm: '',
    cest: '',
    cst: '',
    avgCost: '',
    markupPercent: '',
    freightCost: '',
    costOther: '',
  });

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [addSup, setAddSup] = useState({ supplierId: '', code: '', price: '', leadTimeDays: '', preferred: false });
  const [addMarkup, setAddMarkup] = useState({ channel: 'balcao', percent: '' });
  const [prices, setPrices] = useState<{ uf: string; suggestedPrice: number; icmsRate: number; mvaPercent: number }[]>([]);

  async function load() {
    const [p, b, s, c] = await Promise.all([
      api<Product[]>('/products', { token: getToken() }),
      api<Brand[]>('/brands', { token: getToken() }),
      api<Supplier[]>('/suppliers', { token: getToken() }),
      api<Category[]>('/categories', { token: getToken() }),
    ]);
    setRows(p);
    setBrands(b);
    setSuppliers(s);
    setCategories(c);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api('/products', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        sku: form.sku,
        name: form.name,
        shortDescription: form.shortDescription || undefined,
        segment: form.segment,
        categoryId: form.categoryId || undefined,
        brandId: form.brandId || undefined,
        supplierId: form.supplierId || undefined,
        oem: form.oem || undefined,
        ncm: form.ncm || undefined,
        cest: form.cest || undefined,
        cst: form.cst || undefined,
        avgCost: Number(form.avgCost || 0),
        markupPercent: Number(form.markupPercent || 0),
        freightCost: Number(form.freightCost || 0),
        costOther: Number(form.costOther || 0),
      }),
    });
    setForm({ ...form, sku: '', name: '', shortDescription: '', oem: '', ncm: '', cest: '', cst: '', avgCost: '', markupPercent: '', freightCost: '', costOther: '' });
    load();
  }

  async function open(id: string) {
    const d = await api<ProductDetail>(`/products/${id}`, { token: getToken() });
    setDetail(d);
    setPrices([]);
  }

  async function addSupplier(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    await api(`/products/${detail.id}/suppliers`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        supplierId: addSup.supplierId,
        code: addSup.code || undefined,
        price: addSup.price ? Number(addSup.price) : undefined,
        leadTimeDays: addSup.leadTimeDays ? Number(addSup.leadTimeDays) : undefined,
        preferred: addSup.preferred,
      }),
    });
    setAddSup({ supplierId: '', code: '', price: '', leadTimeDays: '', preferred: false });
    open(detail.id);
  }

  async function removeSupplier(supplierId: string) {
    if (!detail) return;
    await api(`/products/${detail.id}/suppliers/${supplierId}`, { method: 'DELETE', token: getToken() });
    open(detail.id);
  }

  async function submitMarkup(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    await api(`/products/${detail.id}/markups`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ channel: addMarkup.channel, percent: Number(addMarkup.percent || 0) }),
    });
    setAddMarkup({ channel: 'balcao', percent: '' });
    open(detail.id);
  }

  async function loadPrices() {
    if (!detail) return;
    setPrices(await api(`/products/${detail.id}/price-by-state`, { token: getToken() }));
  }

  const segLabel = (v: string) => SEGMENTS.find((s) => s.value === v)?.label ?? v;

  return (
    <Shell>
      <h1>Produtos</h1>

      <form className="card" onSubmit={create} style={{ display: 'grid', gap: 8 }}>
        <div className="row">
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <input placeholder="Descrição completa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Descrição resumida" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
        </div>
        <div className="row">
          <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">Fornecedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <input placeholder="OEM" value={form.oem} onChange={(e) => setForm({ ...form, oem: e.target.value })} />
          <input placeholder="NCM" value={form.ncm} onChange={(e) => setForm({ ...form, ncm: e.target.value })} />
          <input placeholder="CEST" value={form.cest} onChange={(e) => setForm({ ...form, cest: e.target.value })} />
          <input placeholder="CST" value={form.cst} onChange={(e) => setForm({ ...form, cst: e.target.value })} />
        </div>
        <div className="row">
          <input placeholder="Custo unitário" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
          <input placeholder="Frete" value={form.freightCost} onChange={(e) => setForm({ ...form, freightCost: e.target.value })} />
          <input placeholder="Outros custos" value={form.costOther} onChange={(e) => setForm({ ...form, costOther: e.target.value })} />
          <input placeholder="Markup %" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })} />
        </div>
        <button type="submit">Cadastrar</button>
      </form>

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Peça</th>
            <th>Segmento</th>
            <th>Categoria</th>
            <th>NCM</th>
            <th>Custo</th>
            <th>Markup</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{segLabel(p.segment)}</td>
              <td>{p.category?.name ?? '—'}</td>
              <td>{p.ncm}</td>
              <td>{p.avgCost}</td>
              <td>{Number(p.markupPercent)}%</td>
              <td>
                <button className="ghost" onClick={() => open(p.id)}>
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detail && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>
            {detail.sku} — {detail.name}
          </h2>
          <p className="muted">
            {segLabel(detail.segment)} · {detail.category?.name ?? 'sem categoria'}
            {detail.brand ? ` · ${detail.brand.name}` : ''}
            {detail.supplier ? ` · fornecedor: ${detail.supplier.name}` : ''}
          </p>

          <h3>Fornecedores</h3>
          <table>
            <tbody>
              {detail.suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.supplier.name}
                    {s.preferred ? ' ★' : ''}
                  </td>
                  <td>{s.code ?? '—'}</td>
                  <td>{s.price ? `R$ ${Number(s.price).toFixed(2)}` : '—'}</td>
                  <td>{s.leadTimeDays ? `${s.leadTimeDays} dias` : '—'}</td>
                  <td>
                    <button className="ghost" onClick={() => removeSupplier(s.supplierId)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form className="row" onSubmit={addSupplier}>
            <select value={addSup.supplierId} onChange={(e) => setAddSup({ ...addSup, supplierId: e.target.value })}>
              <option value="">Fornecedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input placeholder="Código no fornecedor" value={addSup.code} onChange={(e) => setAddSup({ ...addSup, code: e.target.value })} />
            <input placeholder="Preço" value={addSup.price} onChange={(e) => setAddSup({ ...addSup, price: e.target.value })} />
            <input placeholder="Prazo (dias)" value={addSup.leadTimeDays} onChange={(e) => setAddSup({ ...addSup, leadTimeDays: e.target.value })} />
            <label>
              <input type="checkbox" checked={addSup.preferred} onChange={(e) => setAddSup({ ...addSup, preferred: e.target.checked })} /> Preferencial
            </label>
            <button type="submit">Adicionar</button>
          </form>

          <h3>Markup por canal</h3>
          <div>
            {detail.markups.map((m) => (
              <span key={m.id} className="muted" style={{ marginRight: 12 }}>
                {CHANNELS.find((c) => c.value === m.channel)?.label ?? m.channel}: {Number(m.percent)}%
              </span>
            ))}
          </div>
          <form className="row" onSubmit={submitMarkup}>
            <select value={addMarkup.channel} onChange={(e) => setAddMarkup({ ...addMarkup, channel: e.target.value })}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input placeholder="Markup %" value={addMarkup.percent} onChange={(e) => setAddMarkup({ ...addMarkup, percent: e.target.value })} />
            <button type="submit">Salvar markup</button>
          </form>

          <h3>Preço por estado</h3>
          <button className="ghost" onClick={loadPrices}>
            Calcular preço por estado
          </button>
          {prices.map((p) => (
            <div key={p.uf}>
              <strong>{p.uf}</strong>: R$ {p.suggestedPrice.toFixed(2)}{' '}
              <span className="muted">
                (ICMS {p.icmsRate}% · MVA {p.mvaPercent}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
