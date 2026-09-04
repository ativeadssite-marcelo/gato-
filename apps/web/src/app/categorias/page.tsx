'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Category = {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { name: string } | null;
  _count: { products: number };
};

export default function CategoriasPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', parentId: '' });

  async function load() {
    setRows(await api<Category[]>('/categories', { token: getToken() }));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api('/categories', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        name: form.name,
        parentId: form.parentId || undefined,
      }),
    });
    setForm({ name: '', parentId: '' });
    load();
  }

  return (
    <Shell>
      <h1>Categorias de peças</h1>
      <form className="card row" onSubmit={submit}>
        <input
          placeholder="Nova categoria (ex.: Freio)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.parentId}
          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
        >
          <option value="">Sem subcategoria (topo)</option>
          {rows
            .filter((c) => !c.parentId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                Subcategoria de: {c.name}
              </option>
            ))}
        </select>
        <button type="submit">Cadastrar</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Subcategoria de</th>
            <th>Peças</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.parent?.name ?? '—'}</td>
              <td>{c._count.products}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
