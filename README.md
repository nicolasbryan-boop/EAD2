# Trilogia do Sucesso — Área de Membros (EAD)

Plataforma de área de membros: login, cursos/aulas, IAs com créditos,
gamificação, suporte e compra de créditos com checkout externo.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** + componentes próprios estilo shadcn
- **Framer Motion** (animações dos cards de IA)
- **Supabase** (Auth + Postgres/RLS + Storage)
- **OpenAI** (IA 1 — Fase 4)
- **Mercado Pago** (checkout/webhook — Fase 5)

## Configuração

1. Copie `.env.example` para `.env.local` e preencha as chaves.
   > `.env.local` está no `.gitignore` — **nunca** versione chaves.
2. No painel do Supabase, rode as migrations de `supabase/migrations/` no SQL Editor
   (ou `supabase db push`), começando por `0001_init.sql`.
3. Instale dependências e suba o dev server:

```bash
npm install
npm run dev
```

App em http://localhost:3000

## Estrutura

- `src/app/(auth)/` — login, recuperar/criar senha (sem menu)
- `src/app/(app)/` — área logada com menu lateral/drawer
- `src/lib/supabase/` — clientes browser/server/admin + middleware de sessão
- `src/lib/constants.ts` — navegação, IAs, conquistas, pacotes
- `supabase/migrations/` — schema versionado (RLS por padrão)

## Fases

1. ✅ Layout base, login, menu, dashboard, páginas stub.
2. Cursos/módulos/aulas + página da aula (embed) + progresso.
3. Perfil, conquistas, comentários.
4. IA 1 (OpenAI) + créditos + uploads.
5. Comprar créditos + carrinho + upsell + webhook Mercado Pago.
6. Suporte/chamados + painel admin.
