# MANIFOLD APP BUILDER — Sprint Handover for Claude Code

> One topology. One equation. Any business.

---

## WHAT WE'RE BUILDING

A three-column web app that lets anyone create a full multi-role business application through a structured interview. No coding. No design skills. The interview extracts physics parameters that a Φ tensor converts into a working UI.

The output is a single topology (JSON seed) that can be served to any device via QR code. Different roles (customer, cook, server, cashier) see different projections of the same topology via visibility masks.

---

## CORE ARCHITECTURE PRINCIPLE

**Every business opens at seed = 1 and returns to seed = 1 by close.**

Orders, tasks, cases, patients — they multiply into the seed. Completions divide them out. The daily cycle is: start at 1, accumulate work as prime products, resolve work by dividing primes out, close at 1.

State management is seed mutation. No traditional database queries for app state. Turso stores the current seed and a delta log. Clients poll for the seed (one integer), re-derive their view locally.

---

## THE THREE-COLUMN LAYOUT

```
┌─────────────┬──────────────────────┬──────────────────────┐
│  LEFT       │  CENTER              │  RIGHT               │
│  Context    │  Conversation        │  Precipitation       │
│  Tags       │  (Interview)         │  (Live Canvas)       │
│             │                      │                      │
│ Tagged      │ Claude conducts a    │ Real-time render     │
│ phrases     │ structured interview │ of the topology      │
│ that        │ that extracts        │ using Φ tensor.      │
│ accumulate  │ topology params.     │                      │
│ as the      │                      │ User can TAP any     │
│ interview   │ Also handles         │ element to select    │
│ progresses. │ targeted edits       │ it, then describe    │
│             │ when user taps       │ changes in center    │
│ These ARE   │ elements on the      │ column.              │
│ Claude's    │ canvas.              │                      │
│ context     │                      │ Role mask toggles    │
│ window.     │                      │ at bottom switch     │
│             │                      │ between views.       │
│ Editable    │                      │                      │
│ by user.    │                      │ [Export QR] button   │
│             │                      │ per role.            │
│ [+add tag]  │                      │                      │
└─────────────┴──────────────────────┴──────────────────────┘
```

---

## THE STRUCTURED INTERVIEW (Center Column)

The interview is phased. Each phase maps to physics parameters without the user knowing.

### Phase 1 — Identity
- "Do you have a name for this? No problem if not, we can add it later!"
- "What's your app about?"
- → Extracts: app type, component vocabulary, entity list

### Phase 2 — Audience & Roles  
- "Who are the people who are going to use it, and why?"
- "How does it solve their problem?"
- Follow-up: "Are there different roles? Like customers, staff, admin?"
- → Extracts: role list, density (expert=dense, casual=airy), hierarchy

### Phase 3 — Vibes
- Two sliders appear: temperature (cool↔warm) and luminosity (dark↔light)
- User can also describe: "I want it to feel like a cozy café"
- → Extracts: temperature, density, friction (sharp↔rounded corners), mass distribution (shadow weight)

### Phase 4 — Interaction Model
- "How do you want the user to interact with the app?"
- "Does he decide something? Can he ask for something you haven't thought of?"
- → Extracts: action primes, input primes, FREE/ALLOC ratio

### Phase 5 — Role Masking (post-generation)
- Full topology renders on canvas
- User creates roles, then taps components to HIDE per role
- Φ tensor re-renders each role view with rebalanced physics
- → Produces: visibility masks per role

---

## Φ TENSOR — Physics to CSS

The renderer derives ALL visual properties from physics. No hardcoded styles.

### Physics Parameters → CSS Mapping

| Physics | CSS Output | Interview Source |
|---------|-----------|-----------------|
| Mass | box-shadow depth, font-size weight | "heavy/grounded or light/floating?" |
| Density | background opacity, content packing | "packed with info or breathing room?" |
| Temperature | color warmth, border glow | slider: cool ↔ warm |
| Charge | padding, gap | derived from audience (big targets = high charge) |
| Friction | border-radius (low=rounded, high=sharp) | "sharp professional or soft friendly?" |
| Pressure | width, flex-grow | derived from content priority |
| Buoyancy | flex-direction (horizontal/vertical) | derived from content type |

### Key Constants
```javascript
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const PHI_SQ = PHI * PHI;        // 2.618...
const PHI_INV_SQ = PHI_INV * PHI_INV; // 0.382...
```

### Density States (from mass)
```
mass < PHI_INV_SQ  → "void"   (transparent)
mass < PHI_INV     → "gas"    (very light fill)
mass < 0.5         → "liquid" (translucent)
mass < PHI_INV * PHI → "solid" (opaque)
else               → "dense"  (heavy, dark)
```

### Canvas Behavior
- Canvas = the universe. It flexes to available screen size first.
- Components precipitate WITHIN the canvas according to physics.
- Removing components (role masking) triggers re-derivation — remaining elements redistribute naturally.
- Visual vocabulary: SHAPES AND WORDS ONLY. No images, no icons. Rectangles, circles, lines, text. The math carries the design.

---

## SEED & DELTA STATE MANAGEMENT

### Data Model (Turso)

```sql
-- App definitions (created by interview)
CREATE TABLE apps (
  id TEXT PRIMARY KEY,
  name TEXT,
  seed_equation TEXT DEFAULT 'phi-manifold-v1',
  topology JSON NOT NULL,         -- full topology from interview
  interview_log JSON,             -- tagged choices for pattern DB
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Role visibility masks
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  app_id TEXT REFERENCES apps(id),
  name TEXT NOT NULL,              -- 'customer', 'cook', etc.
  hidden_nodes JSON DEFAULT '[]', -- array of topology node IDs to hide
  physics_overrides JSON,          -- optional per-role Φ tweaks
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Live state: current seed per app instance
CREATE TABLE seeds (
  instance_id TEXT PRIMARY KEY,    -- e.g. 'cafe-bistro-table-4'
  app_id TEXT REFERENCES apps(id),
  current_seed TEXT NOT NULL DEFAULT '1', -- BigInt as string
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Delta log: every state mutation
CREATE TABLE deltas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id TEXT REFERENCES seeds(instance_id),
  delta TEXT NOT NULL,             -- the prime product to multiply or divide
  operation TEXT CHECK(operation IN ('multiply', 'divide')),
  role TEXT,                       -- which role performed this
  device TEXT,                     -- device identifier
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (minimal)

```
GET  /api/seed/:instance_id          → { current_seed }
POST /api/delta/:instance_id         → { delta, operation, role }
GET  /api/app/:app_id                → { topology, roles }
POST /api/app                        → create from interview result
```

### Client State Flow

```
1. Client loads app topology (cached after first load)
2. Client polls GET /seed every 2-3 seconds
3. Same seed? Do nothing.
4. Different seed? Re-derive view from new seed. Done.
5. User action? POST delta. Local seed updates optimistically.
```

---

## CHOICE LOGGING (Pattern Database)

Every interview choice gets stored with full context:

```json
{
  "session_id": "uuid",
  "timestamp": "ISO8601",
  "phase": "vibes",
  "choice_key": "temperature",
  "choice_value": "warm",
  "context": {
    "app_type": "restaurant_menu",
    "roles": ["customer", "server", "cook", "cashier"],
    "prior_choices": {
      "density": "airy",
      "friction": "low"
    }
  }
}
```

Store these in a `choices` table. Over time this becomes the lattice training data — "when users say restaurant, they choose warm 78% of the time."

---

## TAP-TO-EDIT ON CANVAS

Every rendered element on the right canvas maps back to a topology node ID. When the user taps/clicks:

1. Element highlights (gold border, Manifold style)
2. Sidebar shows the topology path: "menu_card > price_display"
3. Center conversation activates: "What would you like to change about this?"
4. User describes change in natural language
5. Tags auto-extract to left column
6. Claude updates that specific topology node
7. Canvas re-precipitates

This works because the renderer maintains a `node_id → DOM element` map. No class-name archaeology. Click returns a topology coordinate, not a CSS selector.

---

## TECH STACK

```
Framework:    Next.js (App Router)
Database:     Turso (libSQL) — free tier handles 100+ businesses
Hosting:      Vercel — free tier, static + serverless
AI:           Claude API (interview conductor + topology generator)
Auth:         Clerk (for builder side only, scan side is public)
Styling:      Φ tensor output (no Tailwind, no CSS framework)
State:        Seed polling over HTTP (no WebSocket)
QR:           qrcode npm package
```

---

## FILE STRUCTURE

```
manifold-builder/
├── app/
│   ├── page.tsx                    # Landing / start interview
│   ├── build/
│   │   └── page.tsx                # Three-column builder interface
│   ├── app/[app_id]/
│   │   └── page.tsx                # Live app view (scanned via QR)
│   ├── app/[app_id]/[role]/
│   │   └── page.tsx                # Role-specific view
│   └── api/
│       ├── seed/[instance_id]/
│       │   └── route.ts            # GET seed, POST delta
│       ├── app/
│       │   └── route.ts            # Create/read app topology
│       └── interview/
│           └── route.ts            # Claude API for interview
├── lib/
│   ├── phi/
│   │   ├── tensor.ts               # Φ tensor: physics → CSS
│   │   ├── constants.ts            # φ, π, ζ constants
│   │   └── derive.ts               # Seed → full state derivation
│   ├── topology/
│   │   ├── types.ts                # Topology node types
│   │   ├── mask.ts                 # Role visibility masking
│   │   └── mutate.ts               # Seed delta operations (BigInt)
│   ├── interview/
│   │   ├── phases.ts               # Interview phase definitions
│   │   ├── extract.ts              # Answer → tags + physics extraction
│   │   └── prompt.ts               # Claude system prompt for interview
│   └── db/
│       ├── turso.ts                # Turso client
│       ├── schema.ts               # Drizzle schema
│       └── primes.ts               # Prime lookup table (queryable)
├── components/
│   ├── builder/
│   │   ├── ContextTags.tsx         # Left column: tag display/edit
│   │   ├── Interview.tsx           # Center column: conversation
│   │   ├── Canvas.tsx              # Right column: live precipitation
│   │   ├── Sliders.tsx             # Temperature/luminosity controls
│   │   └── RoleMask.tsx            # Role toggle + tap-to-hide
│   ├── renderer/
│   │   ├── Precipitate.tsx         # Topology → rendered elements
│   │   ├── PhysicsNode.tsx         # Single node with Φ-derived styles
│   │   └── SelectableWrapper.tsx   # Tap-to-select overlay
│   └── live/
│       ├── SeedPoller.tsx          # Poll seed, trigger re-derive
│       └── DeltaEmitter.tsx        # User action → POST delta
├── db/
│   └── schema.sql                  # Turso schema (see above)
└── .env.local
    # TURSO_DATABASE_URL=
    # TURSO_AUTH_TOKEN=
    # ANTHROPIC_API_KEY=
    # CLERK_SECRET_KEY=
    # NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

---

## BUILD ORDER (Sprint Priority)

### 1. Φ Tensor (lib/phi/)
Build first. Everything else depends on it. Takes mass + intent → outputs complete inline styles. Must handle:
- All 7 physics→CSS mappings
- Density states (void/gas/liquid/solid/dense)
- Temperature color derivation
- Friction → border-radius
- Mass → box-shadow
- Canvas flex behavior

### 2. Topology Types + Renderer (lib/topology/ + components/renderer/)
Define the topology JSON schema. Build the Precipitate component that walks a topology tree and renders PhysicsNodes with Φ-derived styles. Each rendered node must store its topology node_id for tap-to-select.

### 3. Three-Column Layout (app/build/)
The builder interface. Left tags, center conversation, right canvas. Wire up tap-to-select on canvas → conversation activation in center → tag extraction to left.

### 4. Interview Flow (lib/interview/ + components/builder/)
The structured interview phases. Claude API integration for conducting the interview. Answer extraction → physics parameters → topology generation.

### 5. Seed & Delta System (lib/topology/mutate.ts + API routes)
BigInt seed operations. Multiply/divide deltas. API routes for seed polling and delta posting. Turso schema deployment.

### 6. Role Masking (components/builder/RoleMask.tsx)
Post-generation: tap components to hide per role. Φ tensor re-derives layout for remaining visible nodes.

### 7. QR Export
Generate QR codes per role that link to /app/[app_id]/[role]. Public, no auth required for scanning.

---

## CRITICAL CONSTRAINTS

1. **SHAPES AND WORDS ONLY.** No images, no icons, no illustrations. Rectangles, text, spacing, color, shadow, border-radius. The math carries the design.

2. **Φ TENSOR IS THE ONLY STYLING SYSTEM.** No Tailwind classes on rendered app components. No CSS variables for theming. Every visual property derives from physics parameters through the tensor.

3. **CANVAS FLEXES TO SCREEN FIRST.** The canvas measures its available space, then components precipitate within that space. Not the other way around.

4. **SINGLE TOPOLOGY, MULTIPLE VIEWS.** There is ONE topology per app. Roles are visibility masks, not separate topologies. Hiding nodes triggers physics re-derivation so the remaining layout looks intentional, not empty.

5. **SEED = STATE.** No traditional state management. The current seed BigInt IS the entire application state. Deltas are prime multiplications/divisions. Client derives full view from seed + topology + role mask.

6. **$0 INFRASTRUCTURE TARGET.** Turso free tier + Vercel free tier. Must handle 100 small businesses on this. Polling, not WebSocket. Integer responses, not JSON blobs.

7. **EVERY CHOICE GETS LOGGED.** Interview answers, tag edits, role mask decisions, tap-to-edit changes — all stored with full context for pattern database.

---

## AESTHETIC

- Primary: Warm brass gold (#c9a227) on deep charcoal (#1a1a1a)  
- The builder interface uses this palette
- Generated apps use Φ-tensor-derived colors based on interview temperature/luminosity
- Typography: system fonts, sized by mass
- Everything feels warm, mathematical, intentional

---

## TEST SCENARIO

After building, test with this interview:

```
Name: "Café Bistrô"
About: "Digital menu for a restaurant"
Audience: "Customers sitting at tables, ordering from phone"
Problem: "Waiter is slow, paper menu is fixed"
Roles: Customer, Server, Cook, Cashier
Temperature: 0.7 (warm)
Luminosity: 0.3 (darker)
Friction: 0.2 (soft, rounded)
Interaction: "Customer browses and chooses, cook sees queue, server delivers, cashier closes"
```

Expected: Full topology generates. Canvas shows a warm, rounded, spacious menu interface. Switching to Cook role shows a dense, sequential order queue. Seed starts at 1. Adding an order multiplies in. Completing it divides out. End of day: seed = 1.

---

*Topology First. Instantiation Follows.*

*φ + ζ = π*