import Link from 'next/link';
import type { SVGProps } from 'react';
import './page.css';

/**
 * Landing page do Gato — ERP da MGN Autopeças.
 *
 * Página 100% estática (Server Component, sem `'use client'`).
 * O design system completo (paleta, tipografia e escala de espaçamento)
 * está documentado no topo de `./page.css`.
 */

type FeatureIconName = 'package' | 'tag' | 'file' | 'layers' | 'truck' | 'shield';

type Feature = {
  icon: FeatureIconName;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'package',
    title: 'Estoque multi-hub',
    description:
      'Saldo, reservas e movimentos por filial — São Paulo e Minas Gerais — com visão consolidada para o balcão.',
  },
  {
    icon: 'tag',
    title: 'Preço por canal',
    description:
      'Preço, markup e margem calculados por canal: balcão e site. Quem tem permissão enxerga o custo junto.',
  },
  {
    icon: 'file',
    title: 'Orçamento que vira pedido',
    description:
      'Monte o orçamento no balcão e converta em pedido com baixa automática de estoque no hub.',
  },
  {
    icon: 'layers',
    title: 'Produtos e equivalentes',
    description:
      'Busque por SKU, nome ou OEM e localize peças equivalentes sem perder tempo no catálogo.',
  },
  {
    icon: 'truck',
    title: 'Transferência entre hubs',
    description:
      'Movimente peças entre filiais com registro de entrada, saída e inventário por hub.',
  },
  {
    icon: 'shield',
    title: 'Permissões por papel',
    description:
      'RBAC por papel: custo só para gestor, estoque e fiscal; preço e markup apenas para o gestor.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Consulte',
    body: 'Busque a peça por SKU, nome ou OEM e veja preço, margem e estoque por hub.',
  },
  {
    n: '02',
    title: 'Orce',
    body: 'Monte o orçamento no balcão com o canal certo e a margem na medida.',
  },
  {
    n: '03',
    title: 'Converta',
    body: 'Vire o orçamento em pedido e o estoque baixa automaticamente.',
  },
];

const STATS = [
  { value: '2', label: 'hubs — SP e MG' },
  { value: '2', label: 'canais de preço' },
  { value: '6', label: 'papéis de acesso' },
  { value: '1', label: 'fluxo orçamento → pedido' },
];

const ROLES = [
  { role: 'Gestor', note: 'Visão completa; edita preço e markup.' },
  { role: 'Vendedor', note: 'Consulta e orçamento no balcão.' },
  { role: 'Consulta', note: 'Preço e estoque, sem ver custo.' },
  { role: 'Caixa', note: 'Operação de balcão e pedidos.' },
  { role: 'Estoque', note: 'Movimentações e transferências.' },
  { role: 'Fiscal', note: 'Custo e emissão fiscal (stub).' },
];

const ICON_PROPS: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function FeatureIcon({ name }: { name: FeatureIconName }) {
  switch (name) {
    case 'package':
      return (
        <svg {...ICON_PROPS}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...ICON_PROPS}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case 'file':
      return (
        <svg {...ICON_PROPS}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 11 17 15 13" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...ICON_PROPS}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...ICON_PROPS}>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
  }
}

export default function Home() {
  return (
    <>
      <a href="#conteudo" className="lp-skip-link">
        Pular para o conteúdo
      </a>

      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link href="/" className="lp-brand" aria-label="Gato — MGN Autopeças, página inicial">
            <span className="lp-brand-mark">GATO</span>
            <span className="lp-brand-sub">MGN Autopeças</span>
          </Link>

          <nav className="lp-header-nav" aria-label="Navegação principal">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#fluxo">Como funciona</a>
            <a href="#papeis">Papéis</a>
            <Link href="/login" className="lp-btn lp-btn-primary lp-btn-small">
              Acessar o sistema
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">ERP para autopeças · balcão e gestão</p>
              <h1>
                Estoque, preço e pedido{' '}
                <span className="lp-accent">no mesmo balcão</span>
              </h1>
              <p className="lp-lede">
                O Gato é o ERP da MGN Autopeças: controle o estoque de São Paulo
                e Minas Gerais, consulte preço e margem por canal e transforme
                orçamento em pedido sem retrabalho.
              </p>
              <div className="lp-hero-actions">
                <Link href="/login" className="lp-btn lp-btn-primary lp-btn-large">
                  Acessar o sistema
                </Link>
                <a href="#funcionalidades" className="lp-btn lp-btn-ghost lp-btn-large">
                  Conhecer funcionalidades
                </a>
              </div>
            </div>

            <div className="lp-preview" aria-hidden="true">
              <div className="lp-preview-head">
                <span className="lp-preview-window">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="lp-preview-label">Consulta · balcão</span>
              </div>
              <div className="lp-preview-table">
                <div className="lp-preview-row lp-preview-row--head">
                  <span>Peça</span>
                  <span>Preço</span>
                  <span>Margem</span>
                </div>
                <div className="lp-preview-row">
                  <span>
                    <strong>SP-1187</strong>Filtro de óleo
                  </span>
                  <span>R$ 39,90</span>
                  <span className="lp-preview-good">34%</span>
                </div>
                <div className="lp-preview-row">
                  <span>
                    <strong>MG-4412</strong>Pastilha de freio
                  </span>
                  <span>R$ 129,90</span>
                  <span className="lp-preview-good">28%</span>
                </div>
                <div className="lp-preview-row">
                  <span>
                    <strong>SP-2203</strong>Disco de freio ventilado
                  </span>
                  <span>R$ 189,00</span>
                  <span className="lp-preview-good">31%</span>
                </div>
              </div>
              <div className="lp-preview-foot">
                <span className="lp-preview-chip">São Paulo (SP) · 24</span>
                <span className="lp-preview-chip">Minas Gerais (MG) · 12</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-stats" aria-label="Números do Gato">
          <div className="lp-container lp-stats-grid">
            {STATS.map((s) => (
              <div className="lp-stat" key={s.label}>
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="funcionalidades" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <p className="lp-eyebrow">Funcionalidades</p>
              <h2>Tudo o que o balcão precisa, em um só lugar</h2>
              <p className="lp-lede">
                Do saldo por filial ao fechamento do pedido, o Gato concentra a
                operação comercial da autopeças em uma única tela.
              </p>
            </div>

            <div className="lp-features-grid">
              {FEATURES.map((f) => (
                <article className="lp-feature" key={f.title}>
                  <span className="lp-feature-icon">
                    <FeatureIcon name={f.icon} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fluxo" className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-head">
              <p className="lp-eyebrow">Como funciona</p>
              <h2>Do balcão ao pedido em três passos</h2>
            </div>

            <ol className="lp-steps">
              {STEPS.map((s) => (
                <li className="lp-step" key={s.n}>
                  <span className="lp-step-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="papeis" className="lp-section">
          <div className="lp-container lp-roles-grid">
            <div>
              <p className="lp-eyebrow">Acessos</p>
              <h2>Um sistema, o papel certo para cada pessoa</h2>
              <p className="lp-lede">
                Cada usuário enxerga só o que precisa. O custo fica restrito a
                gestor, estoque e fiscal; preço e markup só o gestor edita.
              </p>
            </div>

            <ul className="lp-roles-list">
              {ROLES.map((r) => (
                <li key={r.role}>
                  <strong>{r.role}</strong>
                  <span>{r.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container">
            <div className="lp-cta-inner">
              <h2>Pronto para agilizar o balcão?</h2>
              <p>Entre com seu usuário e comece a consultar estoque e preço agora.</p>
              <Link href="/login" className="lp-btn lp-btn-large lp-btn-on-accent">
                Acessar o sistema
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span className="lp-brand-mark">GATO</span>
          <p>MGN Autopeças · ERP de estoque, balcão e gestão comercial.</p>
          <p className="lp-footer-legal">© {new Date().getFullYear()} MGN Autopeças.</p>
        </div>
      </footer>
    </>
  );
}
