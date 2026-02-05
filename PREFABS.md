# MANIFOLD PREFABS — Pre-Factored Topology Patterns

> **For AI Context**: These are solved patterns. Pick one, fill slots. Don't rebuild from scratch.

---

## THE TWO-PLANE RULE

Every screen has exactly two independent planes:

| Plane | Purpose | Defined In | Changes |
|-------|---------|------------|---------|
| **Navigation** | WHERE am I? WHERE can I go? | `Topology` object | Rarely (structure only) |
| **Workspace** | WHAT am I doing? WHAT am I creating? | `Manifest()` function | Per request (content) |

**They are structurally independent.** Changing sidebar width ≠ touching workspace content.

---

## TOPOLOGY PATTERNS

### Pattern 1: SIDEBAR + WORKSPACE (Most Common)
```
┌──────────────────────────────────────────┐
│  HEADER (brand + actions)                │
├──────────┬───────────────────────────────┤
│          ┃←handle                        │
│ SIDEBAR  ┃         WORKSPACE             │
│ (nav)    ┃         (content)             │
│          ┃                               │
└──────────┴───────────────────────────────┘
```
**Use for**: Mind Maps, Labs, Note Taking, Chat, File Manager

```typescript
Topology = {
  type: 'SchoolShell',
  data: {
    sidebar: { title: 'MY ITEMS', ratio: 0.25, resizable: true, links: [...] },
    header: { brand: 'APP NAME', actions: [...] }
  }
}
```

### Pattern 2: TABS + WORKSPACE
```
┌──────────────────────────────────────────┐
│  HEADER                                  │
├──────────────────────────────────────────┤
│  TAB BAR  [Tab1] [Tab2] [Tab3]           │
├──────────────────────────────────────────┤
│              WORKSPACE                   │
└──────────────────────────────────────────┘
```
**Use for**: Dashboard, Settings, Multi-view editors

### Pattern 3: IMMERSIVE (Full Bleed)
```
┌──────────────────────────────────────────┐
│  ┌─────────┐                             │
│  │ OVERLAY │     WORKSPACE (full)        │
│  └─────────┘                             │
└──────────────────────────────────────────┘
```
**Use for**: Landing pages, Presentations, Games

### Pattern 4: SPLIT PANE
```
┌──────────────────────────────────────────┐
│  HEADER                                  │
├────────────────────┬─────────────────────┤
│   PRIMARY (0.618)  │  SECONDARY (0.382)  │
└────────────────────┴─────────────────────┘
```
**Use for**: Chat+Reference, Code+Preview, Editor+Outline

---

## WORKSPACE TYPES

| Type | Dimensions | Bounds | Gravity | Examples |
|------|------------|--------|---------|----------|
| `Canvas3D` | 3 | infinite | none | Mind maps, 3D labs |
| `Canvas2D` | 2 | infinite | none | Whiteboards, diagrams |
| `Grid` | 2 | discrete | down | Kanban, calendars |
| `Document` | 1 | growing | down | Notes, forms |
| `Stream` | 1 | infinite | down+auto | Chat, logs |

---

## ENTITY SCHEMAS

### MindMap (Canvas3D)
```typescript
entities: {
  node: { x, y, z, label, shape, mass, color },
  connection: { from, to, type, weight }
}
behaviors: {
  'drag node': 'update position',
  'click empty': 'create node',
  'drag node→node': 'create connection'
}
```

### Kanban (Grid)
```typescript
entities: {
  card: { lane, position, title, labels },
  lane: { title, limit }
}
behaviors: {
  'drag card': 'move between lanes',
  'click +': 'create card'
}
```

### Chat (Stream)
```typescript
entities: {
  message: { role, content, timestamp }
}
behaviors: {
  'submit': 'send message',
  'scroll': 'load history'
}
```

---

## ASSEMBLY RULE

Building a world = 3 decisions:

1. **Pick TOPOLOGY pattern** → Sidebar+Workspace, Tabs, etc.
2. **Pick WORKSPACE type** → Canvas3D, Grid, Document, Stream
3. **Define ENTITIES** → What lives in that space

Interview phases map to these:
- Phase 1 (Identity) → workspace type
- Phase 2 (Audience) → topology pattern
- Phase 3 (Vibes) → physics tuning
- Phase 4 (Interaction) → entity behaviors
- Phase 5 (Masking) → role visibility

---

## INFERENCE RULES

| User Says | Infer Pattern | Infer Workspace | Infer Entities |
|-----------|---------------|-----------------|----------------|
| "3D mind map with saved items" | Sidebar+Workspace | Canvas3D | MindMap |
| "kanban board" | Tabs+Workspace | Grid | Kanban |
| "chat app" | Sidebar+Workspace | Stream | Chat |
| "dashboard with stats" | Tabs+Workspace | Grid | Metrics |
| "landing page" | Immersive | Document | Marketing |
| "code editor with preview" | Split Pane | Document×2 | Code |

---

## HANDLES (User Tuning)

**AI picks pattern + initial ratios. User tunes with drag handles.**

```typescript
// Store RATIOS, not pixels
sidebar: { ratio: 0.25, resizable: true }

// Handle emits ratio changes
onDrag → updateRatio → re-render
```

AI re-enters only for STRUCTURE changes (add panel, switch pattern), not PROPORTION changes.

---

## BUTTONS

**Navigation buttons**: + New, Save, Share, Dashboard
**Workspace buttons**: Add Node, Delete, Undo, tools

```typescript
actions: {
  'create_map': {
    emit: { url: '/api/maps', method: 'POST' },
    then: 'navigate_to_new'
  },
  'save_app': {
    emit: { url: '/api/apps/{id}', method: 'PUT', payload: '$state' }
  }
}
```

---

## REMEMBER

1. **Two planes, always** — Navigation and Workspace are independent
2. **Prefabs are words** — don't make AI spell from letters  
3. **Handles for proportion** — AI for structure, user for tuning
4. **Ratios not pixels** — responsive by default
