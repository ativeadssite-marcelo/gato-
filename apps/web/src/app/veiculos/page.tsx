'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, getToken } from '../../lib/api';

type Brand = { id: string; name: string };
type Vehicle = {
  id: string;
  brandId: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  category: string;
  brand: { name: string };
};
type Product = { id: string; sku: string; name: string };

const CATEGORIES = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'trator', label: 'Trator' },
];

export default function VeiculosPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brandName, setBrandName] = useState('');
  const [veh, setVeh] = useState({ brandId: '', model: '', yearStart: '', yearEnd: '', category: 'carro' });
  const [link, setLink] = useState({
    productId: '',
    vehicleId: '',
    engine: '',
    transmission: '',
    traction: '',
    hasAC: false,
  });

  async function load() {
    const [b, v, p] = await Promise.all([
      api<Brand[]>('/brands', { token: getToken() }),
      api<Vehicle[]>('/vehicles', { token: getToken() }),
      api<Product[]>('/products', { token: getToken() }),
    ]);
    setBrands(b);
    setVehicles(v);
    setProducts(p);
    if (!veh.brandId && b[0]) setVeh((x) => ({ ...x, brandId: b[0].id }));
    if (!link.vehicleId && v[0]) setLink((x) => ({ ...x, vehicleId: v[0].id }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addBrand(e: FormEvent) {
    e.preventDefault();
    await api('/brands', { method: 'POST', token: getToken(), body: JSON.stringify({ name: brandName }) });
    setBrandName('');
    load();
  }

  async function addVehicle(e: FormEvent) {
    e.preventDefault();
    await api('/vehicles', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        brandId: veh.brandId,
        model: veh.model,
        yearStart: Number(veh.yearStart),
        yearEnd: Number(veh.yearEnd),
        category: veh.category,
      }),
    });
    setVeh({ ...veh, model: '', yearStart: '', yearEnd: '' });
    load();
  }

  async function linkApplication(e: FormEvent) {
    e.preventDefault();
    await api('/vehicles/applications', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({
        productId: link.productId,
        vehicleId: link.vehicleId,
        engine: link.engine || undefined,
        transmission: link.transmission || undefined,
        traction: link.traction || undefined,
        hasAC: link.hasAC,
      }),
    });
    setLink({ ...link, engine: '', transmission: '', traction: '', hasAC: false });
  }

  return (
    <Shell>
      <h1>Veículos e aplicações</h1>

      <form className="card row" onSubmit={addBrand}>
        <input
          placeholder="Nova marca (ex.: Fiat)"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
        />
        <button type="submit">Cadastrar marca</button>
      </form>

      <form className="card row" onSubmit={addVehicle}>
        <select value={veh.brandId} onChange={(e) => setVeh({ ...veh, brandId: e.target.value })}>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Modelo"
          value={veh.model}
          onChange={(e) => setVeh({ ...veh, model: e.target.value })}
        />
        <input
          placeholder="Ano inicial"
          value={veh.yearStart}
          onChange={(e) => setVeh({ ...veh, yearStart: e.target.value })}
        />
        <input
          placeholder="Ano final"
          value={veh.yearEnd}
          onChange={(e) => setVeh({ ...veh, yearEnd: e.target.value })}
        />
        <select value={veh.category} onChange={(e) => setVeh({ ...veh, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="submit">Cadastrar veículo</button>
      </form>

      <form className="card row" onSubmit={linkApplication}>
        <select
          value={link.productId}
          onChange={(e) => setLink({ ...link, productId: e.target.value })}
        >
          <option value="">Peça</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
        <select
          value={link.vehicleId}
          onChange={(e) => setLink({ ...link, vehicleId: e.target.value })}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand.name} {v.model} ({v.yearStart}–{v.yearEnd})
            </option>
          ))}
        </select>
        <input placeholder="Motor" value={link.engine} onChange={(e) => setLink({ ...link, engine: e.target.value })} />
        <input placeholder="Câmbio" value={link.transmission} onChange={(e) => setLink({ ...link, transmission: e.target.value })} />
        <input placeholder="Tração" value={link.traction} onChange={(e) => setLink({ ...link, traction: e.target.value })} />
        <label>
          <input
            type="checkbox"
            checked={link.hasAC}
            onChange={(e) => setLink({ ...link, hasAC: e.target.checked })}
          />{' '}
          Ar
        </label>
        <button type="submit">Vincular</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Cat.</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Anos</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>{CATEGORIES.find((c) => c.value === v.category)?.label ?? v.category}</td>
              <td>{v.brand.name}</td>
              <td>{v.model}</td>
              <td>
                {v.yearStart}–{v.yearEnd}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
