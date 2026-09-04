'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Customer = {
  id: string;
  name: string;
  doc?: string;
  type: string;
  discountPercent: string;
  phone?: string;
};

const TYPES = [
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'frotista', label: 'Frotista' },
  { value: 'mecanica', label: 'Mecânica' },
];

export default function ClientesPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    name: '',
    doc: '',
    type: 'consumidor',
    discountPercent: '',
    phone: '',
  });

  async function load() {
    setRows(await api<Customer[]>('/customers', { token: getToken() }));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api('/customers', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        name: form.name,
        doc: form.doc || undefined,
        type: form.type,
        discountPercent: Number(form.discountPercent || 0),
        phone: form.phone || undefined,
      }),
    });
    setForm({ name: '', doc: '', type: 'consumidor', discountPercent: '', phone: '' });
    load();
  }

  return (
    <Shell>
      <h1>Clientes</h1>
      <form className="card row" onSubmit={submit}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="CPF/CNPJ"
          value={form.doc}
          onChange={(e) => setForm({ ...form, doc: e.target.value })}
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Desconto %"
          value={form.discountPercent}
          onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
        />
        <button type="submit">Cadastrar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF/CNPJ</th>
            <th>Tipo</th>
            <th>Desconto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.doc}</td>
              <td>{c.type}</td>
              <td>{Number(c.discountPercent)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
