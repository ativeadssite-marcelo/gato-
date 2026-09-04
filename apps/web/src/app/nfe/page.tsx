'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Shell } from '../../components/shell';
import { api, apiUpload, getToken } from '../../lib/api';

type Invoice = {
  id: string;
  accessKey: string;
  number?: string;
  status: string;
  total: string;
  supplier?: { name: string } | null;
  branch?: { name: string; uf: string } | null;
  _count: { items: number };
};

type Item = {
  id: string;
  status: string;
  sku?: string;
  ean?: string;
  ncm?: string;
  cest?: string;
  cst?: string;
  description: string;
  qty: string;
  unitCost: string;
  icmsRate?: string;
  product?: { id: string; sku: string; name: string } | null;
  suggestions?: { id: string; sku: string; name: string; oem?: string }[];
};

type InvoiceDetail = Omit<Invoice, '_count'> & { items: Item[] };

type Brand = { id: string; name: string };
type Supplier = { id: string; name: string };
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

type AppRow = {
  vehicleId: string;
  engine: string;
  transmission: string;
  traction: string;
  hasAC: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  importado: 'Importado',
  parcial: 'Parcial',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  pendente: 'Pendente',
  correspondido: 'Correspondido',
  novo: 'Novo',
  ignorado: 'Ignorado',
};

const CATEGORIES = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'trator', label: 'Trator' },
];

const STEPS = [
  'Dados básicos',
  'Aplicação',
  'Veículo específico',
  'Códigos similares',
  'Marca e fornecedor',
  'Imagem',
  'Custo e markup',
];

export default function NfePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // wizard
  const [resolving, setResolving] = useState<Item | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    ncm: '',
    cest: '',
    cst: '',
    category: 'carro',
    brandId: '',
    supplierId: '',
    avgCost: '',
    markupPercent: '',
    freightCost: '',
  });
  const [apps, setApps] = useState<AppRow[]>([]);
  const [equivalents, setEquivalents] = useState<Product[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setInvoices(await api<Invoice[]>('/nfe', { token: getToken() }));
  }

  async function loadMeta() {
    const [b, s, v] = await Promise.all([
      api<Brand[]>('/brands', { token: getToken() }),
      api<Supplier[]>('/suppliers', { token: getToken() }),
      api<Vehicle[]>('/vehicles', { token: getToken() }),
    ]);
    setBrands(b);
    setSuppliers(s);
    setVehicles(v);
  }

  useEffect(() => {
    load();
    loadMeta();
  }, []);

  async function uploadXml() {
    setErr('');
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      await apiUpload('/nfe/import', file, { token: getToken() });
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function open(id: string) {
    setDetail(await api<InvoiceDetail>(`/nfe/${id}`, { token: getToken() }));
  }

  function startResolve(item: Item) {
    setResolving(item);
    setStep(1);
    setForm({
      sku: item.sku ?? '',
      name: item.description,
      ncm: item.ncm ?? '',
      cest: item.cest ?? '',
      cst: item.cst ?? '',
      category: 'carro',
      brandId: brands[0]?.id ?? '',
      supplierId: suppliers[0]?.id ?? '',
      avgCost: item.unitCost ?? '',
      markupPercent: '',
      freightCost: '',
    });
    setApps([]);
    setEquivalents(item.suggestions ?? []);
    setSearchQ('');
    setSearchResults([]);
    setImageFile(null);
    setSaving(false);
  }

  async function doSearch() {
    if (!searchQ.trim()) return;
    const data = await api<Product[]>(
      `/products?q=${encodeURIComponent(searchQ)}`,
      { token: getToken() },
    );
    setSearchResults(data.filter((p) => !equivalents.some((e) => e.id === p.id)));
  }

  function addEquivalent(p: Product) {
    setEquivalents((e) => (e.some((x) => x.id === p.id) ? e : [...e, p]));
  }

  async function submitResolve(e: FormEvent) {
    e.preventDefault();
    if (!resolving || !detail) return;
    setSaving(true);
    try {
      const updated = await api<InvoiceDetail>(
        `/nfe/${detail.id}/items/${resolving.id}/resolve`,
        {
          method: 'POST',
          token: getToken(),
          body: JSON.stringify({
            sku: form.sku,
            name: form.name,
            ncm: form.ncm || undefined,
            cest: form.cest || undefined,
            cst: form.cst || undefined,
            avgCost: Number(form.avgCost || 0),
            markupPercent: Number(form.markupPercent || 0),
            freightCost: Number(form.freightCost || 0),
            brandId: form.brandId || undefined,
            supplierId: form.supplierId || undefined,
            equivalentToProductIds: equivalents.map((e) => e.id),
            applications: apps
              .filter((a) => a.vehicleId)
              .map((a) => ({
                vehicleId: a.vehicleId,
                engine: a.engine || undefined,
                transmission: a.transmission || undefined,
                traction: a.traction || undefined,
                hasAC: a.hasAC,
              })),
          }),
        },
      );

      if (imageFile) {
        const newProduct = updated.items.find((i) => i.id === resolving.id)?.product;
        if (newProduct) {
          await apiUpload(`/products/${newProduct.id}/images`, imageFile, {
            token: getToken(),
          });
        }
      }

      setResolving(null);
      open(detail.id);
      load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function ignore(item: Item) {
    if (!detail) return;
    await api(`/nfe/${detail.id}/items/${item.id}/ignore`, {
      method: 'POST',
      token: getToken(),
    });
    open(detail.id);
  }

  async function conclude() {
    if (!detail) return;
    await api(`/nfe/${detail.id}/conclude`, { method: 'POST', token: getToken() });
    open(detail.id);
    load();
  }

  const categoryVehicles = vehicles.filter((v) => v.category === form.category);

  return (
    <Shell>
      <h1>NF-e de compra</h1>

      <div className="card row">
        <input type="file" ref={fileRef} accept=".xml,text/xml" />
        <button onClick={uploadXml}>Importar XML</button>
      </div>
      {err && <p className="err">{err}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, marginTop: 16 }}>
        <div>
          {invoices.map((inv) => (
            <button
              key={inv.id}
              className="card"
              style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }}
              onClick={() => open(inv.id)}
            >
              <strong>
                NF {inv.number || '—'} · {inv.supplier?.name ?? 'sem fornecedor'}
              </strong>
              <div className="muted">
                {STATUS_LABEL[inv.status]} · {inv._count.items} itens · R${' '}
                {Number(inv.total).toFixed(2)}
              </div>
            </button>
          ))}
        </div>

        <div>
          {detail ? (
            <>
              <div className="row">
                <h2 style={{ margin: 0 }}>NF {detail.number || detail.accessKey.slice(0, 8)}</h2>
                <span className="muted">{STATUS_LABEL[detail.status]}</span>
                <button className="ghost" onClick={conclude}>
                  Concluir
                </button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Peça</th>
                    <th>Qtd</th>
                    <th>Custo</th>
                    <th>ICMS</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product ? `${it.product.sku} — ${it.product.name}` : it.description}</td>
                      <td>{it.qty}</td>
                      <td>R$ {Number(it.unitCost).toFixed(2)}</td>
                      <td>{it.icmsRate ? `${Number(it.icmsRate)}%` : '—'}</td>
                      <td>{STATUS_LABEL[it.status]}</td>
                      <td>
                        {it.status === 'pendente' && (
                          <>
                            <button className="ghost" onClick={() => startResolve(it)}>
                              Cadastrar
                            </button>
                            <button className="ghost" onClick={() => ignore(it)}>
                              Ignorar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {resolving && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {STEPS.map((s, i) => (
                      <span
                        key={s}
                        className="muted"
                        style={{ fontWeight: step === i + 1 ? 700 : 400 }}
                      >
                        {i + 1}. {s}
                      </span>
                    ))}
                  </div>
                  <h3 style={{ marginTop: 8 }}>
                    Passo {step} — {STEPS[step - 1]}
                  </h3>
                  <p className="muted">Item: {resolving.description}</p>

                  <form style={{ display: 'grid', gap: 8 }} onSubmit={submitResolve}>
                    {step === 1 && (
                      <div className="row">
                        <input placeholder="Código (SKU)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                        <input placeholder="Descrição" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input placeholder="NCM" value={form.ncm} onChange={(e) => setForm({ ...form, ncm: e.target.value })} />
                        <input placeholder="CEST" value={form.cest} onChange={(e) => setForm({ ...form, cest: e.target.value })} />
                        <input placeholder="CST" value={form.cst} onChange={(e) => setForm({ ...form, cst: e.target.value })} />
                      </div>
                    )}

                    {step === 2 && (
                      <div className="row">
                        {CATEGORIES.map((c) => (
                          <label key={c.value}>
                            <input
                              type="radio"
                              name="category"
                              checked={form.category === c.value}
                              onChange={() => setForm({ ...form, category: c.value })}
                            />{' '}
                            {c.label}
                          </label>
                        ))}
                      </div>
                    )}

                    {step === 3 && (
                      <div>
                        {apps.map((a, idx) => (
                          <div className="row" key={idx}>
                            <select
                              value={a.vehicleId}
                              onChange={(e) =>
                                setApps(apps.map((x, i) => (i === idx ? { ...x, vehicleId: e.target.value } : x)))
                              }
                            >
                              <option value="">Veículo</option>
                              {categoryVehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.brand.name} {v.model} ({v.yearStart}–{v.yearEnd})
                                </option>
                              ))}
                            </select>
                            <input placeholder="Motor" value={a.engine} onChange={(e) => setApps(apps.map((x, i) => (i === idx ? { ...x, engine: e.target.value } : x)))} />
                            <input placeholder="Câmbio" value={a.transmission} onChange={(e) => setApps(apps.map((x, i) => (i === idx ? { ...x, transmission: e.target.value } : x)))} />
                            <input placeholder="Tração" value={a.traction} onChange={(e) => setApps(apps.map((x, i) => (i === idx ? { ...x, traction: e.target.value } : x)))} />
                            <label>
                              <input
                                type="checkbox"
                                checked={a.hasAC}
                                onChange={(e) => setApps(apps.map((x, i) => (i === idx ? { ...x, hasAC: e.target.checked } : x)))}
                              />{' '}
                              Ar
                            </label>
                            <button type="button" className="ghost" onClick={() => setApps(apps.filter((_, i) => i !== idx))}>
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setApps([...apps, { vehicleId: '', engine: '', transmission: '', traction: '', hasAC: false }])}
                        >
                          + Aplicação
                        </button>
                      </div>
                    )}

                    {step === 4 && (
                      <div>
                        <div className="row">
                          <input placeholder="Buscar por SKU/nome/OEM" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                          <button type="button" onClick={doSearch}>
                            Buscar
                          </button>
                        </div>
                        {searchResults.map((p) => (
                          <div className="row" key={p.id}>
                            <span>
                              {p.sku} — {p.name}
                            </span>
                            <button type="button" className="ghost" onClick={() => addEquivalent(p)}>
                              + Adicionar
                            </button>
                          </div>
                        ))}
                        <div style={{ marginTop: 8 }}>
                          <strong>Selecionados:</strong>
                          {equivalents.map((e) => (
                            <div className="row" key={e.id}>
                              <span>
                                {e.sku} — {e.name}
                              </span>
                              <button type="button" className="ghost" onClick={() => setEquivalents(equivalents.filter((x) => x.id !== e.id))}>
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="row">
                        <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                          <option value="">Marca da peça</option>
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
                    )}

                    {step === 6 && (
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                    )}

                    {step === 7 && (
                      <div className="row">
                        <input placeholder="Custo" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
                        <input placeholder="Markup %" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })} />
                        <input placeholder="Frete" value={form.freightCost} onChange={(e) => setForm({ ...form, freightCost: e.target.value })} />
                      </div>
                    )}

                    <div className="row" style={{ marginTop: 8 }}>
                      {step > 1 && (
                        <button type="button" className="ghost" onClick={() => setStep(step - 1)}>
                          Voltar
                        </button>
                      )}
                      {step < 7 && (
                        <button type="button" onClick={() => setStep(step + 1)}>
                          Próximo
                        </button>
                      )}
                      {step === 7 && (
                        <button type="submit" disabled={saving}>
                          {saving ? 'Cadastrando…' : 'Cadastrar e dar entrada'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <p className="muted">Selecione uma NF para ver os itens.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
