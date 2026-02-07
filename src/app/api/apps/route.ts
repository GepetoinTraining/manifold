/**
 * POST /api/apps
 * Create a new app. Body: { userId, topology, spectrum?, world? }
 * Returns: { appId, version }
 * 
 * PUT /api/apps
 * Update an existing app. Body: { userId, appId, topology, ownerData?, spectrum? }
 * Returns: { appId, version }
 * 
 * GET /api/apps
 * List all apps (or ?userId=xxx for user's apps only).
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import type { InValue } from "@libsql/client";

export async function GET(request: Request) {
    try {
        const db = getDb();
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");

        let result;
        if (userId) {
            result = await db.execute({
                sql: "SELECT app_id, spectrum, owner_id, world, version FROM apps WHERE owner_id = ? ORDER BY updated_at DESC",
                args: [userId],
            });
        } else {
            result = await db.execute(
                "SELECT app_id, spectrum, owner_id, world, version FROM apps ORDER BY created_at DESC"
            );
        }

        const apps = result.rows.map((row) => ({
            appId: row.app_id,
            spectrum: row.spectrum,
            ownerId: row.owner_id,
            world: row.world,
            version: row.version,
        }));

        return NextResponse.json({ apps });
    } catch (error) {
        console.error("GET /api/apps error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { userId, topology, spectrum, world, name, ownerData, defaults } = body as {
            userId: string;
            topology: string;
            spectrum?: string;
            world?: string;
            name?: string;
            ownerData?: unknown[];
            defaults?: unknown[];
        };

        if (!userId || !topology) {
            return NextResponse.json({ error: "Missing userId or topology" }, { status: 400 });
        }

        // Verify user exists
        const user = await db.execute({ sql: "SELECT user_id FROM users WHERE user_id = ?", args: [userId] });
        if (!user.rows.length) {
            return NextResponse.json({ error: "Invalid user" }, { status: 401 });
        }

        const appId = randomUUID();

        await db.execute({
            sql: `INSERT INTO apps (app_id, topology, owner_data, defaults, spectrum, owner_id, world, name, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            args: [
                appId,
                topology,
                JSON.stringify(ownerData || []),
                JSON.stringify(defaults || []),
                spectrum || "eco",
                userId,
                world || null,
                name || null,
            ],
        });

        return NextResponse.json({ appId, version: 1 });
    } catch (error) {
        console.error("POST /api/apps error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { userId, appId, topology, ownerData, spectrum } = body as {
            userId: string;
            appId: string;
            topology?: string;
            ownerData?: unknown[];
            spectrum?: string;
        };

        if (!userId || !appId) {
            return NextResponse.json({ error: "Missing userId or appId" }, { status: 400 });
        }

        // Verify ownership
        const app = await db.execute({
            sql: "SELECT owner_id, version FROM apps WHERE app_id = ?",
            args: [appId],
        });

        if (!app.rows.length) {
            return NextResponse.json({ error: "App not found" }, { status: 404 });
        }

        if (app.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Not your app" }, { status: 403 });
        }

        const newVersion = (app.rows[0].version as number) + 1;

        const sets: string[] = ["version = ?", "updated_at = unixepoch()"];
        const args: InValue[] = [newVersion];

        if (topology !== undefined) { sets.push("topology = ?"); args.push(topology); }
        if (ownerData !== undefined) { sets.push("owner_data = ?"); args.push(JSON.stringify(ownerData)); }
        if (spectrum !== undefined) { sets.push("spectrum = ?"); args.push(spectrum); }

        args.push(appId);

        await db.execute({
            sql: `UPDATE apps SET ${sets.join(", ")} WHERE app_id = ?`,
            args,
        });

        return NextResponse.json({ appId, version: newVersion });
    } catch (error) {
        console.error("PUT /api/apps error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
