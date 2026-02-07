/**
 * Turso DB client singleton for API routes.
 * Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from env.
 */

import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
    if (_client) return _client;

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    }

    _client = createClient({ url, authToken });
    return _client;
}
