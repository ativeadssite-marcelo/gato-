'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('gestor@mgn.local');
  const [password, setPassword] = useState('senha123');
  const [err, setErr] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const data = await api<{ accessToken: string; user: unknown }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      localStorage.setItem('gato_token', data.accessToken);
      localStorage.setItem('gato_user', JSON.stringify(data.user));
      router.push('/consulta');
    } catch {
      setErr('Login inválido. Suba a API e o banco antes.');
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="card">
        <h1>Gato — MGN</h1>
        <p className="muted">Estoque, balcão e gestão comercial</p>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
          />
          {err && <div className="err">{err}</div>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
