'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Row = {
  id: string;
  sku: string;
  name: string;
  oem?: string;
  price: number;
  cost?: number;
  marginPercent: number;
  stock: { branch: string; uf: string; available: number }[];
};

export default function ConsultaPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  async function search(e?: FormEvent) {
    e?.preventDefault();
    setErr('');
    try {
      const data = await api<Row[]>(
        `/pricing/consult?q=${encodeURIComponent(q)}&channel=balcao`,
        { token: getToken() },
      );
      setRows(data);
    } catch (ex) {
      setErr(String(ex));
    }
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell>
      <h1>Consulta estoque e preço</h1>
      <form className="row" onSubmit={search}>
        <input
          placeholder="SKU, nome ou OEM"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>
      {err && <p className="err">{err}</p>}
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Peça</th>
            <th>OEM</th>
            <th>Preço</th>
            <th>Custo</th>
            <th>Margem</th>
            <th>Estoque</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.sku}</td>
              <td>{r.name}</td>
              <td>{r.oem}</td>
              <td>R$ {r.price.toFixed(2)}</td>
              <td>{r.cost != null ? `R$ ${r.cost.toFixed(2)}` : '—'}</td>
              <td>{r.marginPercent}%</td>
              <td>
                {r.stock.map((s) => (
                  <div key={s.branch}>
                    {s.branch} ({s.uf}): {s.available}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
