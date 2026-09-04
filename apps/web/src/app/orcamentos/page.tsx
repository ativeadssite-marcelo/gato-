'use client';

import { useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Quote = {
  id: string;
  customerName?: string;
  customer?: { name: string } | null;
  discountPercent?: string;
  status: string;
  channel: string;
  branch: { name: string };
  items: { qty: string; unitPrice: string; product: { sku: string; name: string } }[];
};

export default function OrcamentosPage() {
  const [rows, setRows] = useState<Quote[]>([]);

  async function load() {
    setRows(await api<Quote[]>('/sales/quotes', { token: getToken() }));
  }

  useEffect(() => {
    load();
  }, []);

  async function convert(id: string) {
    await api(`/sales/quotes/${id}/convert`, { method: 'POST', token: getToken() });
    load();
  }

  return (
    <Shell>
      <h1>Orçamentos</h1>
      <p className="muted">Conversão baixa estoque no hub do orçamento.</p>
      {rows.map((q) => (
        <div key={q.id} className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <strong>{q.customer?.name ?? q.customerName ?? 'Balcão'}</strong>
            <span className="muted">
              {q.branch.name} · {q.channel} · {q.status}
              {q.discountPercent ? ` · desc ${q.discountPercent}%` : ''}
            </span>
            {q.status !== 'convertida' && (
              <button onClick={() => convert(q.id)}>Converter em pedido</button>
            )}
          </div>
          <table>
            <tbody>
              {q.items.map((i, idx) => (
                <tr key={idx}>
                  <td>
                    {i.product.sku} {i.product.name}
                  </td>
                  <td>{i.qty}</td>
                  <td>R$ {Number(i.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Shell>
  );
}
