# BonSafar

A travel agency in your pocket, that understands Moroccan darija.

**Live demo: coming soon.**

Built for the Meta Global AI Developer Hackathon, Indie track. All the
intelligence runs on Meta models through the Meta Model API, and every price
comes from a live Kiwi.com or trivago result.

## Stack

- Next.js 16 (App Router, `src/`, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4, design tokens in `@theme` inside `src/app/globals.css`
- `motion` for the animations, `@phosphor-icons/react` for the icons
- Supabase (`@supabase/ssr`) for auth, database and the poster bucket
- Meta Model API through the `openai` SDK, Kiwi.com and trivago through the
  official MCP servers
- `zod` on every external input and every model output

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the secrets
npm run dev
```

Open http://localhost:3000. The component kit lives at
http://localhost:3000/dev/kit.

Database and storage: run `supabase/schema.sql` once in the Supabase SQL editor.

```bash
npm run lint
npm run build
```

## Licence

MIT, see [LICENSE](./LICENSE).
