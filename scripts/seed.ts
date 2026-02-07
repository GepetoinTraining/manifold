/**
 * MANIFOLD v3.1 — Database Setup
 * 
 * Usage: npx tsx scripts/seed.ts
 * 
 * Creates the v3.1 schema (drops existing tables first).
 * No sample data — this is the production backend.
 */

import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
  console.log("🗄️  Connecting to Turso...");
  console.log(`   URL: ${url}`);

  // ── DROP ──
  console.log("\n🔥 Dropping existing tables...");
  await db.execute("DROP TABLE IF EXISTS actions");
  await db.execute("DROP TABLE IF EXISTS user_apps");
  await db.execute("DROP TABLE IF EXISTS apps");
  console.log("   ✓ Tables dropped");

  // ── CREATE (matches v3.1/core/db/turso.js exactly) ──
  console.log("\n📐 Creating v3.1 schema...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS apps (
      app_id        TEXT PRIMARY KEY,
      topology      TEXT NOT NULL,
      owner_data    JSON NOT NULL DEFAULT '[]',
      defaults      JSON NOT NULL DEFAULT '[]',
      spectrum      TEXT DEFAULT 'eco',
      owner_id      TEXT NOT NULL,
      world         TEXT,
      version       INTEGER DEFAULT 1,
      created_at    INTEGER DEFAULT (unixepoch()),
      updated_at    INTEGER DEFAULT (unixepoch())
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_apps (
      user_id       TEXT NOT NULL,
      app_id        TEXT NOT NULL,
      user_data     JSON NOT NULL DEFAULT '[]',
      cached_version INTEGER DEFAULT 0,
      offline_queue JSON DEFAULT '[]',
      first_scan    INTEGER DEFAULT (unixepoch()),
      last_sync     INTEGER DEFAULT (unixepoch()),
      PRIMARY KEY (user_id, app_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS actions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       TEXT NOT NULL,
      app_id        TEXT NOT NULL,
      action_type   INTEGER NOT NULL,
      slot_index    INTEGER NOT NULL,
      old_value     JSON,
      new_value     JSON,
      created_at    INTEGER DEFAULT (unixepoch())
    )
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_user_apps_user ON user_apps(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_user_apps_app ON user_apps(app_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_actions_app ON actions(app_id, created_at)");

  console.log("   ✓ apps");
  console.log("   ✓ user_apps");
  console.log("   ✓ actions + indexes");

  // ── VERIFY ──
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log(`\n✅ Tables: ${tables.rows.map(r => r.name).join(", ")}`);
  console.log("🎉 Schema ready.");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
