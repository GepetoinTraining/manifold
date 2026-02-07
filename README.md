# Manifold

**Turn conversations into interfaces.** Speak → Claude writes `.mf` → physics renders → QR deploys.

## What is this

Manifold is a topology-driven UI system. Instead of HTML/CSS/JS, you describe interfaces in `.mf` — a compact format where class names encode physics coordinates and a function (Φ) actualizes them into CSS.

```
@spectrum brass

grid.brass|c:1,3
 sidebar.brass|
  text.brand.brass|Forno & Massa
  text.bold.brass|R$ @=
 section.brass|
  card.brass|🍕;Margherita;R$ @
  card.brass|🔥;Diavola;R$ @
```

`@` = owner data (prices), `@@` = user data (quantities), `@=` = computed (subtotals).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Mantine UI** for the builder chrome
- **Turso** (libSQL) for edge data
- **Claude** for `.mf` generation via interview

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # add your Turso credentials
npm run dev
```

## Routes

| Route | What |
|-------|------|
| `/build` | Claude-powered interview → generates `.mf` → live preview |
| `/app/[id]` | PIN gate → role-based rendering (owner gets admin view) |
| `/api/apps` | CRUD for apps |
| `/api/apps/[id]/action` | Mutations (increment, decrement, toggle, submit) |
| `/api/auth/verify` | PIN verification + role detection |

## Key Concepts

- **Positional slots**: `@` reads from `owner_data[]`, `@@` from `user_data[]`, `@=` computes client-side
- **Spectrums**: `eco` (cream/green), `void` (dark/purple), `brass` (dark/gold)
- **Φ function**: translates 4D coordinates (density, temperature, mass, charge) → CSS
- **Actions**: `[action:4]` = increment, `[action:5]` = decrement, `[action:6]` = submit, `[action:7]` = toggle
- **Views**: `@view admin` creates owner-only sections within the same topology

## Project Structure

```
src/
├── app/
│   ├── build/          # Interview + builder UI
│   ├── app/[id]/       # Gate + live app rendering
│   └── api/            # REST endpoints
├── components/
│   └── manifold/
│       └── MfRenderer  # Topology → DOM renderer
└── lib/
    ├── manifold/
    │   └── engine.ts   # Parser, Φ, class resolver, serializer
    ├── interview/
    │   └── prompt.ts   # Claude system prompt builder
    └── db.ts           # Turso client
```

## License

Proprietary — NodeZero
