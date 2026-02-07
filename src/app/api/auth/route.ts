/**
 * POST /api/auth
 * Body: { pin: "1234" }  → Login: returns existing user_id
 * Body: {}               → Register: creates new user with random UUID + 4-digit pin
 * 
 * Minimum viable auth. No email, no OAuth. Just a pin tied to your apps.
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
    try {
        const db = getDb();
        const body = await request.json().catch(() => ({}));
        const { pin } = body as { pin?: string };

        if (pin) {
            // ── LOGIN ──
            const result = await db.execute({
                sql: "SELECT user_id, pin FROM users WHERE pin = ?",
                args: [pin],
            });

            if (!result.rows.length) {
                return NextResponse.json({ error: "Invalid pin" }, { status: 401 });
            }

            const userId = result.rows[0].user_id as string;

            // Fetch their apps
            const apps = await db.execute({
                sql: "SELECT app_id, spectrum, world, version FROM apps WHERE owner_id = ? ORDER BY updated_at DESC",
                args: [userId],
            });

            return NextResponse.json({
                userId,
                pin,
                apps: apps.rows.map((r) => ({
                    appId: r.app_id,
                    spectrum: r.spectrum,
                    world: r.world,
                    version: r.version,
                })),
            });
        } else {
            // ── REGISTER ──
            const userId = randomUUID();
            const newPin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit

            await db.execute({
                sql: "INSERT INTO users (user_id, pin) VALUES (?, ?)",
                args: [userId, newPin],
            });

            return NextResponse.json({ userId, pin: newPin, apps: [] });
        }
    } catch (error) {
        console.error("POST /api/auth error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
