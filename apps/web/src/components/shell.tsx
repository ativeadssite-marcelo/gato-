'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/consulta', label: 'Consulta' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/orcamentos', label: 'Orçamentos' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/nfe', label: 'NF-e' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/veiculos', label: 'Veículos' },
  { href: '/marketplaces', label: 'Marketplaces' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [name, setName] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('gato_user');
    if (!raw) {
      router.replace('/login');
      return;
    }
    setName(JSON.parse(raw).name);
  }, [router]);

  function logout() {
    localStorage.removeItem('gato_token');
    localStorage.removeItem('gato_user');
    router.replace('/login');
  }

  return (
    <>
      <nav>
        <strong>GATO</strong>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{ opacity: path === l.href ? 1 : 0.7 }}>
            {l.label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto' }} className="muted">
          {name}
        </span>
        <button className="ghost" onClick={logout}>
          Sair
        </button>
      </nav>
      <div className="wrap">{children}</div>
    </>
  );
}
