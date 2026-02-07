# .mf File Format Specification
## Version 1.0

---

## Overview

`.mf` is a topology description format. It encodes complete user interfaces as class-path/content pairs with indentation-based nesting. A `.mf` file compiles to binary, transmits via QR code or websocket, and precipitates into a rendered application through the Φ actualization function.

**MIME type**: `application/x-manifold`  
**Extension**: `.mf`  
**Encoding**: UTF-8 (source) / Binary (compiled)

---

## Syntax

```
class.variant.spectrum|content
```

**One node per line. Two fields separated by pipe.**

- **Left of pipe**: class path (math). Dot-separated inheritance chain.
- **Right of pipe**: content (meaning). Human-readable text, or `~` for texture.
- **Indentation**: children. Each indent level = 1 space.
- **Empty right side**: container node (has children, no own text).

### Rules

1. The pipe `|` is the ONLY separator between topology and content.
2. Indentation MUST use spaces (not tabs). Each level = 1 space.
3. Lines starting with `#` are comments (stripped at compile).
4. Blank lines are ignored.
5. The `~` character means "texture" — decoder generates contextually appropriate filler.
6. Semicolons `;` in content separate sub-fields for macro nodes (icon;title;description).

---

## Class Resolution

Classes resolve through Python-style MRO (Method Resolution Order):

```
button.primary.eco

Resolves as:
  1. Load base class:    button    → { d:4, t:2, m:12, c:5, role:0, action:0 }
  2. Apply variant:      button.primary → override { t:3, m:14, c:7 }
  3. Apply spectrum:     *.eco     → override { spectrum: "eco" }
  4. Merged result:      { d:4, t:3, m:14, c:7, role:0, action:0, spectrum:"eco" }
  5. Run Φ:              → CSS
```

Most specific wins. Right-to-left in the chain.

---

## Class Properties

Each class resolves to these properties:

| Key | Type | Description | Range |
|-----|------|-------------|-------|
| `d` | int | Density index | 1-5 (void, gas, liquid, solid, dense) |
| `t` | int | Temperature index | 1-6 (void, cold, warm, hot, critical, fusion) |
| `m` | int | Mass index | 1-18 (-0.5 to 2.0) |
| `c` | int | Charge index | 1-10 (0.1 to 1.0) |
| `role` | int | Compositional role | 0-10 (none, hero, nav, card, grid, form, section, footer, modal, list, sidebar) |
| `action` | int | Interaction type | 0-9 (none, navigate, addToCart, ...) |
| `spectrum` | string | Brand universe | "eco", "void", "brass", or custom |

---

## Φ Actualization Layers

The decoder runs three layers per node:

### Layer 1: Quantum (Physics → Base CSS)
Density → background/border. Mass → shadow/depth. Charge → spacing. Temperature → accent color. Friction → transitions.

### Layer 2: Electromagnetic (Role → Layout)
Role determines compositional behavior: hero centers with large padding, nav goes horizontal with sticky positioning, grid creates responsive columns, card gets contained with rounded corners.

### Layer 3: Crystalline (Context → Rhythm)
Position among siblings determines treatment: first child of hero = title, last child = CTA, card children follow icon/title/description pattern. No encoding needed — emerges from topology.

---

## Binary Encoding

Source `.mf` compiles to binary for transmission:

```
[1 byte]  Schema ID (which app dictionary)
[N nodes] Each node:
  [1 byte]  Indent level (0-15)
  [1 byte]  Class index (into schema dictionary)
  [1 byte]  Content type:
              0x00 = no content
              0x01 = text follows (word indices until 0xFF)
              0x02 = texture marker (~)
              0x03 = macro invocation (sub-fields follow)
  [N bytes] Word indices (2 bytes each, or varint for common)
  [1 byte]  0xFF terminator
```

### Compression Layers

1. **Class schema** — class paths → 1-byte indices (shared, never transmitted)
2. **Word dictionary** — words → 2-byte indices (shared, cached on device)
3. **Phrase lattice** — word sequences → single indices (grows with use)
4. **Texture generation** — `~` markers → contextual filler (decoder generates)
5. **Binary packing** — minimal overhead per node
6. **Gzip** — algorithmic compression on top

---

## Delta Protocol

After initial topology load, changes transmit as deltas:

```
[1 byte]  Delta type:
            0x01 = UPDATE (change node content)
            0x02 = INSERT (add node)
            0x03 = DELETE (remove node)
            0x04 = MOVE (reorder)
            0x05 = CLASS (change class path)
[2 bytes] Node address (depth-first index)
[N bytes] Payload (depends on type)
```

A price change on a restaurant menu: `0x01 0x00 0x0D [2 bytes: new word index]` = 5 bytes.

Deltas stream over websocket. The decoder patches its tree and emits DOM diffs to the main thread.

---

## Live Endpoint

A topology can declare a live data source:

```
# .mf header
@live wss://api.example.com/menu
@auth 9551
@schema eco-restaurant

nav.eco|
  text.brand|O Restaurante
  ...
```

Directives start with `@`. They configure the decoder's runtime behavior:

| Directive | Description |
|-----------|-------------|
| `@live` | Websocket URL for delta streaming |
| `@auth` | Auth prime (factorization-based access) |
| `@schema` | Schema ID (if not default) |
| `@spectrum` | Default spectrum for all nodes |
| `@lang` | Language for word dictionary / texture generation |
| `@ttl` | Cache TTL in seconds |

---

## Example

### Source (.mf)

```
# eco escola landing page
@spectrum eco
@lang pt-BR

nav.eco|
  text.brand.eco|eco escola
  link.nav|Método
  link.nav|Sobre
  button.ghost.eco|Entrar
hero.eco|
  text.title|Seu futuro começa aqui
  text.sub|~
  button.primary.eco|Matricule-se
section.eco|
  text.subtitle.eco|O que nos move
  grid.eco|
    card.eco|◈;Individualidade;~
    card.eco|◇;Adaptação;~
    card.eco|◆;Comprometimento;~
    card.eco|◊;Inovação;~
    card.eco|❖;Transformação;~
section.eco|
  text.subtitle.eco|~
  text.sub.eco|~
  button.cta.eco|Agende uma visita
footer.eco|
  text.muted|~
  link.footer.eco|Como funciona?
```

### Compiled (binary)

~110 bytes raw, ~60 bytes gzipped.

### Rendered (browser)

A complete branded landing page with sticky nav, centered hero, 5-card responsive grid, CTA section, and footer. Cream/green/magenta eco escola branding. Golden ratio spacing. Professional typography. Indistinguishable from hand-crafted.

---

## Name

`.mf` stands for **Manifold**.

The name is a topological term: a manifold is a space that locally resembles flat Euclidean space but globally can have complex structure. A `.mf` file locally is simple text — class paths and content. Globally, when decoded through Φ, it produces arbitrarily complex user interfaces.

Also, it stands for what you think it stands for.
