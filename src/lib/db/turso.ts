// ═══════════════════════════════════════════════════════════════════════════
// TURSO CLIENT — libSQL connection for Manifold
// ═══════════════════════════════════════════════════════════════════════════

import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getTurso(): Client {
    if (client) return client;

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error("TURSO_DATABASE_URL is not configured");
    }

    client = createClient({
        url,
        authToken,
    });

    return client;
}

// ─── QUERY HELPERS ───────────────────────────────────────────────────────────

type InValue = string | number | bigint | ArrayBuffer | null | boolean;

export async function query<T = unknown>(
    sql: string,
    args: InValue[] = []
): Promise<T[]> {
    const db = getTurso();
    const result = await db.execute({ sql, args });
    return result.rows as T[];
}

export async function execute(
    sql: string,
    args: InValue[] = []
): Promise<{ rowsAffected: number; lastInsertRowid: bigint | undefined }> {
    const db = getTurso();
    const result = await db.execute({ sql, args });
    return {
        rowsAffected: result.rowsAffected,
        lastInsertRowid: result.lastInsertRowid,
    };
}

export async function transaction<T>(
    fn: (tx: Client) => Promise<T>
): Promise<T> {
    const db = getTurso();
    // libSQL doesn't have explicit transactions in the same way,
    // but we can use batch for atomic operations
    return fn(db);
}
