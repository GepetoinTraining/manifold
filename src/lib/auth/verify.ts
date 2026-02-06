// ═══════════════════════════════════════════════════════════════════════════
// VERIFY — Challenge-response authentication, Turso-backed
// Server sends n → both compute M^n → fingerprints must match
// ═══════════════════════════════════════════════════════════════════════════

import { getTurso } from "@/lib/db/turso";
import { getSeed } from "./seed";
import { computeTrajectory } from "./math/matrix";

const CHALLENGE_TTL_MS = 30_000; // 30 seconds

/** Generate a challenge for a user */
export async function generateChallenge(
    id: string
): Promise<{ challengeId: string; n: number } | null> {
    const record = await getSeed(id);
    if (!record) return null;

    // Random exponent in [10, 999]
    const n = Math.floor(Math.random() * 990) + 10;

    // Compute the expected trajectory on server side
    const expectedTrajectory = computeTrajectory(record.zeta, n);

    const challengeId = crypto.randomUUID();
    const now = Date.now();

    const db = getTurso();
    await db.execute({
        sql: `INSERT INTO auth_challenges (id, user_id, exponent, expected_trajectory, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [challengeId, id, n, expectedTrajectory, now],
    });

    // Cleanup expired challenges
    await db.execute({
        sql: "DELETE FROM auth_challenges WHERE created_at < ?",
        args: [now - CHALLENGE_TTL_MS],
    });

    return { challengeId, n };
}

/** Verify a challenge response */
export async function verifyChallenge(
    challengeId: string,
    clientTrajectory: string
): Promise<{ valid: boolean; userId?: string }> {
    const db = getTurso();

    const result = await db.execute({
        sql: "SELECT * FROM auth_challenges WHERE id = ?",
        args: [challengeId],
    });

    if (result.rows.length === 0) {
        return { valid: false };
    }

    const challenge = result.rows[0];
    const createdAt = challenge.created_at as number;

    // Check TTL
    if (Date.now() - createdAt > CHALLENGE_TTL_MS) {
        await db.execute({
            sql: "DELETE FROM auth_challenges WHERE id = ?",
            args: [challengeId],
        });
        return { valid: false };
    }

    // One-time use — delete immediately
    await db.execute({
        sql: "DELETE FROM auth_challenges WHERE id = ?",
        args: [challengeId],
    });

    // THE CORE: same seed + same math = same trajectory
    const valid = clientTrajectory === (challenge.expected_trajectory as string);

    if (valid) {
        return { valid: true, userId: challenge.user_id as string };
    }
    return { valid: false };
}
