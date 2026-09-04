'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Channel = {
  id: string;
  slug: string;
  name: string;
  commissionPercent: string;
  fixedFee: string;
  shipping: string;
  active: boolean;
};

type PriceCalc = {
  sku: string;
  name: string;
  slug: string;
  cost: number;
  base: number;
  commissionPercent: number;
  fees: number;
  suggestedPrice: number;
};

const CHANNELS = [
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'site', label: 'Site' },
  { value: 'balcao', label: 'Balcão' },
];

export default function MarketplacesPage() {
  const [rows, setRows] = useState<Channel[]>([]);
  const [form, setForm] = useState({
    slug: 'mercado_livre',
    name: 'Mercado Livre',
    commissionPercent: '',
    fixedFee: '',
    shipping: '',
  });
  const [calc, setCalc] = useState({ slug: 'mercado_livre', productId: '' });
  const [result, setResult] = useState<PriceCalc | null>(null);

  async function load() {
    setRows(await api<Channel[]>('/marketplaces', { token: getToken() }));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await api('/marketplaces', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        commissionPercent: Number(form.commissionPercent || 0),
        fixedFee: Number(form.fixedFee || 0),
        shipping: Number(form.shipping || 0),
      }),
    });
    load();
  }

  async function calcPrice(e: FormEvent) {
    e.preventDefault();
    const data = await api<PriceCalc>(
      `/marketplaces/${calc.slug}/price?productId=${encodeURIComponent(calc.productId)}`,
      { token: getToken() },
    );
    setResult(data);
  }

  async function sync(slug: string) {
    const data = await api(`/marketplaces/${slug}/sync`, { method: 'POST', token: getToken() });
    alert(JSON.stringify(data));
  }

  return (
    <Shell>
      <h1>Marketplaces</h1>

      <form className="card row" onSubmit={save}>
        <select
          value={form.slug}
          onChange={(e) => {
            const label = CHANNELS.find((c) => c.value === e.target.value)?.label ?? '';
            setForm({ ...form, slug: e.target.value, name: label });
          }}
        >
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Comissão %" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} />
        <input placeholder="Taxa fixa" value={form.fixedFee} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />
        <input placeholder="Frete" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
        <button type="submit">Salvar canal</button>
      </form>

      <form className="card row" onSubmit={calcPrice}>
        <select value={calc.slug} onChange={(e) => setCalc({ ...calc, slug: e.target.value })}>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          placeholder="ID do produto"
          value={calc.productId}
          onChange={(e) => setCalc({ ...calc, productId: e.target.value })}
        />
        <button type="submit">Calcular preço sugerido</button>
      </form>

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <strong>
            {result.sku} — {result.name}
          </strong>
          <p>
            Custo {result.cost.toFixed(2)} · Base {result.base.toFixed(2)} · Comissão{' '}
            {result.commissionPercent}% · Taxas {result.fees.toFixed(2)}
          </p>
          <h3>Preço sugerido: R$ {result.suggestedPrice.toFixed(2)}</h3>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Canal</th>
            <th>Comissão</th>
            <th>Taxa fixa</th>
            <th>Frete</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{Number(c.commissionPercent)}%</td>
              <td>R$ {Number(c.fixedFee).toFixed(2)}</td>
              <td>R$ {Number(c.shipping).toFixed(2)}</td>
              <td>{c.active ? 'ativo' : 'inativo'}</td>
              <td>
                <button className="ghost" onClick={() => sync(c.slug)}>
                  Sync
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
