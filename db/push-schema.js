// Push schema to Turso database
const { createClient } = require("@libsql/client");
const fs = require("fs");

async function pushSchema() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL || "libsql://manifoldqr-gepetointraining.aws-us-east-2.turso.io",
        authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzAzMDk1MjksImlkIjoiN2VlZTIwYTktMTQyNi00Y2UwLTk1MGMtNWU1MjM5NmIzMWQxIiwicmlkIjoiZWIzNTU0OTItNTczYi00MjQ3LWJjZGQtMzNiYzFmOWE1NGJkIn0.hMyp6GcBGbVpHfXv_1u2HL_jGYSrFj4U6N7ioHlLWjDgIKUQpVDDkYWfS1viukcDAZuyL5Y08lawNbwQRGNaCg",
    });

    // Execute each statement individually
    const statements = [
        // Apps table
        `CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT,
      seed_equation TEXT DEFAULT 'phi-manifold-v1.1',
      topology TEXT NOT NULL,
      interview_log TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

        // Roles table
        `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      hidden_nodes TEXT DEFAULT '[]',
      physics_overrides TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

        // Seeds table
        `CREATE TABLE IF NOT EXISTS seeds (
      instance_id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      current_seed TEXT NOT NULL DEFAULT '1',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

        // Deltas table
        `CREATE TABLE IF NOT EXISTS deltas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_id TEXT NOT NULL REFERENCES seeds(instance_id) ON DELETE CASCADE,
      delta TEXT NOT NULL,
      operation TEXT CHECK(operation IN ('multiply', 'divide')) NOT NULL,
      role TEXT,
      device TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

        // Choices table
        `CREATE TABLE IF NOT EXISTS choices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      app_id TEXT REFERENCES apps(id) ON DELETE SET NULL,
      phase TEXT NOT NULL,
      choice_key TEXT NOT NULL,
      choice_value TEXT NOT NULL,
      context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

        // Indexes
        `CREATE INDEX IF NOT EXISTS idx_roles_app_id ON roles(app_id)`,
        `CREATE INDEX IF NOT EXISTS idx_seeds_app_id ON seeds(app_id)`,
        `CREATE INDEX IF NOT EXISTS idx_deltas_instance_id ON deltas(instance_id)`,
        `CREATE INDEX IF NOT EXISTS idx_deltas_created_at ON deltas(created_at)`,
        `CREATE INDEX IF NOT EXISTS idx_choices_session_id ON choices(session_id)`,
        `CREATE INDEX IF NOT EXISTS idx_choices_phase ON choices(phase)`,
    ];

    console.log(`Executing ${statements.length} statements...`);

    for (const stmt of statements) {
        try {
            await client.execute(stmt);
            const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
            console.log("✓", preview + "...");
        } catch (err) {
            console.error("✗ Error:", err.message);
        }
    }

    console.log("\n✓ Schema pushed successfully!");
    process.exit(0);
}

pushSchema();
