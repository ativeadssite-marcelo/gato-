# gato-

ERP MVP da MGN Autopeças: estoque multi-hub, consulta de preço, orçamento e adapter fiscal (stub).

## Stack

- `apps/api` — NestJS + Prisma + PostgreSQL
- `apps/web` — Next.js (balcão/gestão)
- `packages/shared` — papéis e regras de visibilidade de custo
- Docker: Postgres 16 + Redis 7

## Subir local

1. Docker Desktop ligado
2. Na raiz do repo:

```bash
copy .env.example .env
npm install
npm run docker:up
npm run prisma:generate --workspace=apps/api
npx prisma db push --schema apps/api/prisma/schema.prisma
npm run prisma:seed --workspace=apps/api
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Logins (senha `senha123`)

| Papel | E-mail |
|---|---|
| Gestor | gestor@mgn.local |
| Consulta | consulta@mgn.local |
| Vendedor | vendedor@mgn.local |
| Caixa | caixa@mgn.local |
| Estoque | estoque@mgn.local |

O papel `consulta` não vê custo. Hubs seed: São Paulo e Minas Gerais.

## O que já entra neste scaffold

- Auth JWT e RBAC
- Filiais/hubs
- Produtos + equivalentes (API)
- Estoque por hub, movimentos e transferência
- Consulta preço/markup/margem por canal (`balcao` / `site`)
- Orçamento → pedido (baixa estoque)
- `FiscalProvider` stub (trocar por Nuvem Fiscal / Focus NFe depois)

## Fora deste scaffold

NFC-e real, XML de compra, caixa/TEF, marketplaces e ads.
