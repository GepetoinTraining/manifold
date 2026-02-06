// ═══════════════════════════════════════════════════════════════════════════
// SEED — User identity records, Turso-backed
// Your enrollment moment → prime-factorized → ζ computed → stored forever
// ═══════════════════════════════════════════════════════════════════════════

import { getTurso } from "@/lib/db/turso";
import { createSeedNumber, primeFactorize } from "./math/prime";
import { computeSeededZeta } from "./math/phi";

export interface SeedRecord {
    id: string;
    seedNumber: string;    // BigInt as string
    primeFactors: string[];  // BigInt strings
    zeta: number;
    enrolledAt: number;    // Unix ms
    geoLat: number;
    geoLon: number;
    displayName: string | null;
    email: string | null;
    active: boolean;
}

export interface Certificate {
    id: string;
    seed: string;
    zeta: number;
    issuedAt: number;
}

/** Create a SeedRecord from enrollment moment (pure, no DB) */
export function createSeed(
    id: string,
    datetime: Date,
    geo: { lat: number; lon: number },
    displayName?: string,
    email?: string
): SeedRecord {
    const seedNumber = createSeedNumber(datetime, geo);
    const primes = primeFactorize(seedNumber);
    const zeta = computeSeededZeta(primes);

    return {
        id,
        seedNumber: seedNumber.toString(),
        primeFactors: primes.map((p) => p.toString()),
        zeta,
        enrolledAt: datetime.getTime(),
        geoLat: geo.lat,
        geoLon: geo.lon,
        displayName: displayName || null,
        email: email || null,
        active: true,
    };
}

/** Store seed in Turso */
export async function storeSeed(record: SeedRecord): Promise<void> {
    const db = getTurso();
    await db.execute({
        sql: `INSERT INTO auth_seeds (id, seed_number, prime_factors, zeta, enrolled_at, geo_lat, geo_lon, display_name, email, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            record.id,
            record.seedNumber,
            JSON.stringify(record.primeFactors),
            record.zeta,
            record.enrolledAt,
            record.geoLat,
            record.geoLon,
            record.displayName,
            record.email,
            record.active ? 1 : 0,
        ],
    });
}

/** Get active seed by user ID */
export async function getSeed(id: string): Promise<SeedRecord | null> {
    const db = getTurso();
    const result = await db.execute({
        sql: "SELECT * FROM auth_seeds WHERE id = ? AND active = 1",
        args: [id],
    });

    if (result.rows.length === 0) return null;
    return rowToSeed(result.rows[0]);
}

/** Revoke a user's identity */
export async function revokeSeed(id: string): Promise<boolean> {
    const db = getTurso();
    const result = await db.execute({
        sql: "UPDATE auth_seeds SET active = 0 WHERE id = ?",
        args: [id],
    });
    // Also kill their sessions
    await db.execute({
        sql: "DELETE FROM auth_sessions WHERE user_id = ?",
        args: [id],
    });
    return result.rowsAffected > 0;
}

/** List all active seeds (admin view — strips secrets) */
export async function listActiveSeeds(): Promise<
    Array<{ id: string; email: string | null; displayName: string | null; enrolledAt: number; active: boolean }>
> {
    const db = getTurso();
    const result = await db.execute(
        "SELECT id, email, display_name, enrolled_at, active FROM auth_seeds ORDER BY enrolled_at DESC"
    );
    return result.rows.map((row) => ({
        id: row.id as string,
        email: (row.email as string) || null,
        displayName: (row.display_name as string) || null,
        enrolledAt: row.enrolled_at as number,
        active: (row.active as number) === 1,
    }));
}

function rowToSeed(row: Record<string, unknown>): SeedRecord {
    return {
        id: row.id as string,
        seedNumber: row.seed_number as string,
        primeFactors: JSON.parse((row.prime_factors as string) || "[]"),
        zeta: row.zeta as number,
        enrolledAt: row.enrolled_at as number,
        geoLat: row.geo_lat as number,
        geoLon: row.geo_lon as number,
        displayName: (row.display_name as string) || null,
        email: (row.email as string) || null,
        active: (row.active as number) === 1,
    };
}
