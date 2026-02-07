/**
 * MANIFOLD — Migrate: Add users table
 * 
 * Usage: npx tsx scripts/migrate-users.ts
 * 
 * Adds users table without touching existing tables.
 */

import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Missing env vars");
    process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
    console.log("📐 Adding users table...");

    await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_id    TEXT PRIMARY KEY,
      pin        TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);

    console.log("   ✓ users table created");

    // Verify
    const tables = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','apps','user_apps','actions') ORDER BY name"
    );
    console.log(`✅ Manifold tables: ${tables.rows.map(r => r.name).join(", ")}`);
}

main().catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
});
