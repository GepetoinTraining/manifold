-- ═══════════════════════════════════════════════════════════════════════════
-- MANIFOLD DATABASE SCHEMA (Turso/libSQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- App definitions (created by interview)
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT,
  seed_equation TEXT DEFAULT 'phi-manifold-v1.1',
  topology TEXT NOT NULL,              -- JSON topology from interview
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_app_id ON roles(app_id);
CREATE INDEX IF NOT EXISTS idx_seeds_app_id ON seeds(app_id);
CREATE INDEX IF NOT EXISTS idx_deltas_instance_id ON deltas(instance_id);
CREATE INDEX IF NOT EXISTS idx_deltas_created_at ON deltas(created_at);
CREATE INDEX IF NOT EXISTS idx_choices_session_id ON choices(session_id);
CREATE INDEX IF NOT EXISTS idx_choices_phase ON choices(phase);
