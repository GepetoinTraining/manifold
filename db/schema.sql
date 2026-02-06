-- ═══════════════════════════════════════════════════════════════════════════
-- MANIFOLD DATABASE SCHEMA (Turso/libSQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- App definitions (created by interview) — v1.12 with two-plane architecture
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT,
  owner_id TEXT,                       -- Clerk user ID for ownership
  seed_equation TEXT DEFAULT 'phi-manifold-v1.12',
  
  -- Two-plane architecture
  topology TEXT NOT NULL,              -- JSON Topology (navigation plane)
  workspace_type TEXT DEFAULT 'Document', -- Canvas3D, Grid, Document, Stream
  entity_schema TEXT,                  -- MindMap, Kanban, Chat, Dashboard
  views TEXT DEFAULT '[]',             -- JSON array of ViewDefinition
  actions TEXT DEFAULT '{}',           -- JSON action bindings
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private', 'shared', 'public')),
  interview_log TEXT,                  -- JSON tagged choices for pattern DB
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Role visibility masks
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- 'customer', 'cook', etc.
  hidden_nodes TEXT DEFAULT '[]',      -- JSON array of topology node IDs to hide
  physics_overrides TEXT,              -- JSON optional per-role Φ tweaks
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Live state: current seed per app instance
CREATE TABLE IF NOT EXISTS seeds (
  instance_id TEXT PRIMARY KEY,        -- e.g. 'cafe-bistro-table-4'
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  current_seed TEXT NOT NULL DEFAULT '1', -- BigInt as string
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Delta log: every state mutation
CREATE TABLE IF NOT EXISTS deltas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id TEXT NOT NULL REFERENCES seeds(instance_id) ON DELETE CASCADE,
  delta TEXT NOT NULL,                 -- the prime product to multiply or divide
  operation TEXT CHECK(operation IN ('multiply', 'divide')) NOT NULL,
  role TEXT,                           -- which role performed this
  device TEXT,                         -- device identifier
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Interview choices (pattern database)
CREATE TABLE IF NOT EXISTS choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  app_id TEXT REFERENCES apps(id) ON DELETE SET NULL,
  phase TEXT NOT NULL,                 -- 'identity', 'audience', 'vibes', 'interaction', 'masking'
  choice_key TEXT NOT NULL,
  choice_value TEXT NOT NULL,          -- JSON value
  context TEXT,                        -- JSON context (prior choices, app type, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PERIODIC TABLE — Component type definitions with physics defaults
-- The prime IS the identity. No UUID needed.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS elements (
  prime INTEGER PRIMARY KEY,           -- assigned prime (389=Button, 397=Card, etc.)
  name TEXT NOT NULL UNIQUE,           -- 'Button', 'Card', 'OrderQueue', etc.
  layer TEXT NOT NULL CHECK(layer IN ('atomic', 'molecular', 'organism')),
  default_physics TEXT NOT NULL,       -- JSON: {mass: 0.8, density: "solid", temperature: "cold"}
  variants TEXT DEFAULT '{}',          -- JSON: {primary: {mass:1.0, temp:"warm"}, ghost: {mass:0.3}}
  render_hint TEXT DEFAULT 'container' CHECK(render_hint IN (
    'container', 'text', 'action', 'input', 'data', 'layout', 'temporal', 'media'
  )),
  aliases TEXT DEFAULT '[]',           -- JSON: ["Btn", "CTA", "Action"]
  description TEXT,                    -- what this element does (for Claude context)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PREFABS — Reusable topology templates
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prefabs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                  -- 'restaurant', 'clinic', 'salon'
  category TEXT NOT NULL,              -- 'food_service', 'healthcare', 'retail', etc.
  topology TEXT NOT NULL,              -- JSON: full Topology object
  default_physics TEXT DEFAULT '{}',   -- JSON: global physics for this prefab type
  description TEXT,                    -- for Claude context when matching
  usage_count INTEGER DEFAULT 0,      -- track popularity
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_app_id ON roles(app_id);
CREATE INDEX IF NOT EXISTS idx_seeds_app_id ON seeds(app_id);
CREATE INDEX IF NOT EXISTS idx_deltas_instance_id ON deltas(instance_id);
CREATE INDEX IF NOT EXISTS idx_deltas_created_at ON deltas(created_at);
CREATE INDEX IF NOT EXISTS idx_choices_session_id ON choices(session_id);
CREATE INDEX IF NOT EXISTS idx_choices_phase ON choices(phase);
CREATE INDEX IF NOT EXISTS idx_elements_name ON elements(name);
CREATE INDEX IF NOT EXISTS idx_elements_layer ON elements(layer);
CREATE INDEX IF NOT EXISTS idx_prefabs_category ON prefabs(category);
