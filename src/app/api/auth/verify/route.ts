/**
 * POST /api/auth/verify
 * Body: { pin, appId }
 * 
 * Verifies a user's pin and determines their role for a specific app.
 * - owner: user_id matches app's owner_id
 * - student: any other valid user
 * 
 * Creates user_apps row on first access (initializes from app defaults).
 * Returns: { userId, username, role, userData, ownerData }
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const db = getDb();
        const { pin, appId } = (await request.json()) as { pin: string; appId: string };

        if (!pin || !appId) {
            return NextResponse.json({ error: "Missing pin or appId" }, { status: 400 });
        }

        // 1. Verify pin → get user
        const userResult = await db.execute({
            sql: "SELECT user_id, username FROM users WHERE pin = ?",
            args: [pin],
        });

        if (!userResult.rows.length) {
            return NextResponse.json({ error: "Invalid pin" }, { status: 401 });
        }

        const userId = userResult.rows[0].user_id as string;
        const username = (userResult.rows[0].username as string) || userId.slice(0, 8);

        // 2. Fetch app
        const appResult = await db.execute({
            sql: "SELECT owner_id, owner_data, defaults, spectrum, world, name FROM apps WHERE app_id = ?",
            args: [appId],
        });

        if (!appResult.rows.length) {
            return NextResponse.json({ error: "App not found" }, { status: 404 });
        }

        const app = appResult.rows[0];
        const role = app.owner_id === userId ? "owner" : "student";
        const ownerData = JSON.parse((app.owner_data as string) || "[]");
        const defaults = JSON.parse((app.defaults as string) || "[]");

        // 3. Fetch or create user_apps row
        const existing = await db.execute({
            sql: "SELECT user_data FROM user_apps WHERE user_id = ? AND app_id = ?",
            args: [userId, appId],
        });

        let userData: unknown[];
        if (existing.rows.length) {
            userData = JSON.parse((existing.rows[0].user_data as string) || "[]");
        } else {
            // First access — initialize from defaults
            userData = [...defaults];
            await db.execute({
                sql: "INSERT INTO user_apps (user_id, app_id, user_data, cached_version) VALUES (?, ?, ?, 1)",
                args: [userId, appId, JSON.stringify(userData)],
            });
        }

        return NextResponse.json({
            userId,
            username,
            role,
            userData,
            ownerData,
            spectrum: app.spectrum,
            world: app.world,
            name: app.name,
        });
    } catch (error) {
        console.error("POST /api/auth/verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
