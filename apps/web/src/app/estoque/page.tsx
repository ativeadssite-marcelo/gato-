'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Balance = {
  id: string;
  qty: string;
  reserved: string;
  product: { id: string; sku: string; name: string };
  branch: { id: string; name: string; uf: string };
};

type Branch = { id: string; name: string };

export default function EstoquePage() {
  const [rows, setRows] = useState<Balance[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [move, setMove] = useState({ branchId: '', productId: '', qty: '1', type: 'entrada' });

  async function load() {
    const [b, s] = await Promise.all([
      api<Branch[]>('/branches', { token: getToken() }),
      api<Balance[]>('/inventory', { token: getToken() }),
    ]);
    setBranches(b);
    setRows(s);
    if (!move.branchId && b[0]) setMove((m) => ({ ...m, branchId: b[0].id }));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api('/inventory/moves', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        branchId: move.branchId,
        productId: move.productId,
        type: move.type,
        qty: Number(move.qty),
      }),
    });
    load();
  }

  return (
    <Shell>
      <h1>Estoque por hub</h1>
      <form className="card row" onSubmit={submit}>
        <select value={move.branchId} onChange={(e) => setMove({ ...move, branchId: e.target.value })}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select value={move.productId} onChange={(e) => setMove({ ...move, productId: e.target.value })}>
          <option value="">Peça</option>
          {[...new Map(rows.map((r) => [r.product.id, r.product])).values()].map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
        <select value={move.type} onChange={(e) => setMove({ ...move, type: e.target.value })}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="inventario">Inventário</option>
        </select>
        <input value={move.qty} onChange={(e) => setMove({ ...move, qty: e.target.value })} />
        <button type="submit">Lançar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Hub</th>
            <th>SKU</th>
            <th>Peça</th>
            <th>Qtd</th>
            <th>Reservado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {r.branch.name} ({r.branch.uf})
              </td>
              <td>{r.product.sku}</td>
              <td>{r.product.name}</td>
              <td>{r.qty}</td>
              <td>{r.reserved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
