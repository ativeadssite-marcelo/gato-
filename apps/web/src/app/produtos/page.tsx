'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Product = {
  id: string;
  sku: string;
  name: string;
  oem?: string;
  ncm?: string;
  avgCost: string;
  markupPercent: string;
};

export default function ProdutosPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [form, setForm] = useState({ sku: '', name: '', oem: '', ncm: '', avgCost: '', markupPercent: '' });

  async function load() {
    setRows(await api<Product[]>('/products', { token: getToken() }));
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
        oem: form.oem || undefined,
        ncm: form.ncm || undefined,
        avgCost: Number(form.avgCost || 0),
        markupPercent: Number(form.markupPercent || 0),
      }),
    });
    setForm({ sku: '', name: '', oem: '', ncm: '', avgCost: '', markupPercent: '' });
    load();
  }

  return (
    <Shell>
      <h1>Produtos</h1>
      <form className="card row" onSubmit={create}>
        <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="OEM" value={form.oem} onChange={(e) => setForm({ ...form, oem: e.target.value })} />
        <input placeholder="NCM" value={form.ncm} onChange={(e) => setForm({ ...form, ncm: e.target.value })} />
        <input placeholder="Custo" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
        <input placeholder="Markup %" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })} />
        <button type="submit">Cadastrar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nome</th>
            <th>OEM</th>
            <th>NCM</th>
            <th>Custo</th>
            <th>Markup</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.oem}</td>
              <td>{p.ncm}</td>
              <td>{p.avgCost}</td>
              <td>{p.markupPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
