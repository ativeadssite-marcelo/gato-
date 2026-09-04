'use client';

import { useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Order = {
  id: string;
  origin: string;
  status: string;
  createdAt: string;
  branch: { name: string };
  fiscal: { id: string; type: string; status: string; accessKey?: string }[];
  items: { qty: string; unitPrice: string; product: { sku: string; name: string } }[];
};

export default function PedidosPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setRows(await api<Order[]>('/sales/orders', { token: getToken() }));
  }

  useEffect(() => {
    load();
  }, []);

  async function emit(orderId: string, type: 'nfce' | 'nfe') {
    setMsg('');
    try {
      await api('/fiscal/emit', {
        method: 'POST',
        token: getToken(),
        body: JSON.stringify({ orderId, type }),
      });
      setMsg('Emissão enfileirada.');
      load();
    } catch (e) {
      setMsg(String(e));
    }
  }

  return (
    <Shell>
      <h1>Pedidos</h1>
      {msg && <p className="muted">{msg}</p>}
      {rows.map((o) => (
        <div key={o.id} className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <strong>Pedido {o.id.slice(0, 8)}</strong>
            <span className="muted">
              {o.branch.name} · {o.origin === 'cotacao' ? 'Cotação' : 'Balcão'} · {o.status} · {new Date(o.createdAt).toLocaleString('pt-BR')}
            </span>
            <button className="ghost" onClick={() => emit(o.id, 'nfce')}>
              Emitir NFC-e
            </button>
            <button className="ghost" onClick={() => emit(o.id, 'nfe')}>
              Emitir NF-e
            </button>
          </div>
          <table>
            <tbody>
              {o.items.map((i, idx) => (
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
          {o.fiscal.map((f) => (
            <p key={f.id} className="muted">
              Fiscal: {f.type} · {f.status}
              {f.accessKey ? ` · chave ${f.accessKey}` : ''}
            </p>
          ))}
        </div>
      ))}
    </Shell>
  );
}
