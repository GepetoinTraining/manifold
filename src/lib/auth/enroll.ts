// ═══════════════════════════════════════════════════════════════════════════
// ENROLL — Human-gated enrollment flow, Turso-backed
// Request → Admin verifies human → Approve → Certificate issued
// ═══════════════════════════════════════════════════════════════════════════

import { getTurso } from "@/lib/db/turso";
import { createSeed, storeSeed, type Certificate } from "./seed";

const PENDING_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Request enrollment — stores pending, returns token */
export async function requestEnrollment(
    id: string,
    geo: { lat: number; lon: number },
    email?: string,
    displayName?: string
): Promise<string> {
    const token = crypto.randomUUID();
    const now = Date.now();

    const db = getTurso();

    // Check if user already exists
    const existing = await db.execute({
        sql: "SELECT id FROM auth_seeds WHERE id = ? AND active = 1",
        args: [id],
    });
    if (existing.rows.length > 0) {
        throw new Error("User already enrolled");
    }

    // Store pending enrollment
    await db.execute({
        sql: `INSERT INTO auth_pending (token, user_id, datetime_iso, geo_lat, geo_lon, requested_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [token, id, new Date().toISOString(), geo.lat, geo.lon, now],
    });

    // If email/displayName provided, store them for when we create the seed
    // We'll pass them through the pending record metadata
    if (email || displayName) {
        // Store extra data as JSON in datetime_iso field (it already has the ISO date)
        await db.execute({
            sql: "UPDATE auth_pending SET datetime_iso = ? WHERE token = ?",
            args: [
                JSON.stringify({
                    datetime: new Date().toISOString(),
                    email: email || null,
                    displayName: displayName || null,
                }),
                token,
            ],
        });
    }

    // Cleanup expired pending enrollments
    await db.execute({
        sql: "DELETE FROM auth_pending WHERE requested_at < ?",
        args: [now - PENDING_TTL_MS],
    });

    return token;
}

/** Approve enrollment — creates seed, returns certificate */
export async function approveEnrollment(
    token: string
): Promise<Certificate | null> {
    const db = getTurso();

    const result = await db.execute({
        sql: "SELECT * FROM auth_pending WHERE token = ?",
        args: [token],
    });

    if (result.rows.length === 0) return null;

    const pending = result.rows[0];
    const userId = pending.user_id as string;
    const geoLat = pending.geo_lat as number;
    const geoLon = pending.geo_lon as number;

    // Parse extra data from datetime_iso
    let datetime: Date;
    let email: string | undefined;
    let displayName: string | undefined;

    try {
        const data = JSON.parse(pending.datetime_iso as string);
        datetime = new Date(data.datetime);
        email = data.email || undefined;
        displayName = data.displayName || undefined;
    } catch {
        datetime = new Date(pending.datetime_iso as string);
    }

    // Create and store the seed
    const record = createSeed(
        userId,
        datetime,
        { lat: geoLat, lon: geoLon },
        displayName,
        email
    );
    await storeSeed(record);

    // Delete pending
    await db.execute({
        sql: "DELETE FROM auth_pending WHERE token = ?",
        args: [token],
    });

    return {
        id: record.id,
        seed: record.seedNumber,
        zeta: record.zeta,
        issuedAt: Date.now(),
    };
}

/** List pending enrollments (admin view) */
export async function listPendingEnrollments(): Promise<
    Array<{ token: string; id: string; requestedAt: number }>
> {
    const db = getTurso();
    const result = await db.execute(
        "SELECT token, user_id, requested_at FROM auth_pending ORDER BY requested_at DESC"
    );
    return result.rows.map((row) => ({
        token: row.token as string,
        id: row.user_id as string,
        requestedAt: row.requested_at as number,
    }));
}
