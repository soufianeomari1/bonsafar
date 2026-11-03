# BonSafar: guide for coding agents

BonSafar is a voice travel agent for Moroccan darija speakers: "a travel agency in your pocket".
Meta Global AI Developer Hackathon, Indie track, theme "Build for Your World". Solo builder: Soufiane Omari.
Internal deadline: submit on 2026-11-04 before 18:00 Paris time. Every hour counts: ship a beautiful path that really works, not many features.

## Read before any task

1. `docs/README.md`: index of all docs.
2. `docs/battuta-contexte.md`: source of truth (rules, decisions, audiences).
3. `docs/meta-model-api.md`: verified facts about the Meta Model API. It wins over your memory.
4. `docs/parcours-et-interfaces.md` + `design/maquettes/`: every screen, token, animation and haptic.
5. The prompt of the current block in `docs/prompts/`.

The planning docs are written in French. Everything that ships is in English: code, comments, commit messages, README, judge-facing UI. End-user UI strings live in `src/lib/i18n` (en, fr, darija-latn, darija-arab, ar).

## Stack (current versions, do not downgrade)

- Next.js 16, App Router, `src/` dir, Turbopack, React 19.2, TypeScript strict. Node 20.9+. npm.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (exported function `proxy`). Never create `middleware.ts`.
- Tailwind CSS v4, CSS-first: tokens in `@theme` inside `src/app/globals.css`. No `tailwind.config.js`.
- shadcn/ui (Tailwind v4 mode) only as a base; the look comes from our tokens and mockups.
- `motion` (import from `motion/react`), `@phosphor-icons/react`.
- Supabase with `@supabase/ssr` (cookies `getAll`/`setAll` only). New key names: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser) and `SUPABASE_SECRET_KEY` (server only).
- `openai` SDK pointed at the Meta Model API (`baseURL` from env, `apiKey` passed explicitly: the SDK does not read `META_API_KEY` by itself).
- `@modelcontextprotocol/sdk` (Streamable HTTP client) for Kiwi.com and trivago.
- `zod` for every external input and every model JSON output.
- Hosting on Vercel, domain bonsafar.com.

## Commands

- `npm run dev`: local server on http://localhost:3000
- `npm run lint`
- `npm run build`

## Target structure

```
src/
  app/            routes, layouts, API routes (src/app/api/*)
  components/     UI (bs/ for BonSafar primitives, screens/ for screens)
  lib/
    ai/           Meta Model API clients, prompts, cost table, event log
    agent/        agent loop and tools
    mcp/          Kiwi.com and trivago clients
    prices/       price store, currency conversion, totals
    supabase/     browser and server clients
    i18n/         dictionaries and useT()
    haptics.ts
  proxy.ts        Supabase session refresh (Next.js 16)
supabase/schema.sql
docs/  design/maquettes/
```

## Definition of done (every task)

1. `npm run lint` and `npm run build` pass with no error.
2. No secret in client code, in logs or in git. `.env.local` is never committed.
3. The screen matches its mockup (PNG for the look, HTML for exact values).
4. Finish with: list of files changed, what to test by hand (desktop and Android Chrome), and anything you were unsure about.

## Working style

- For any multi-file task, write a short plan first, then execute it.
- Never invent a model ID, an API parameter, an MCP tool name or a schema. Read `docs/meta-model-api.md`, the live docs, or call `listTools` at runtime. If something is unclear, say so instead of guessing.
- Small, focused commits with conventional commit messages in English.
- If two docs contradict each other, stop and ask. The order of authority is: the current block prompt, then `docs/meta-model-api.md`, then `docs/battuta-contexte.md`, then the other docs.
