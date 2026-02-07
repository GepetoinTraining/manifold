/**
 * GET /api/apps/[id]
 * Fetch a single app by ID. Returns topology, owner_data, spectrum, version.
 * 
 * GET /api/apps/[id]?userId=xxx
 * Also returns user_data for that user (merged scan).
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const db = getDb();

        const url = new URL(_request.url);
        const userId = url.searchParams.get("userId");

        // Fetch app
        const app = await db.execute({
            sql: `SELECT app_id, topology, owner_data, defaults, spectrum, owner_id, world, name, version
            FROM apps WHERE app_id = ?`,
            args: [id],
        });

        if (!app.rows.length) {
            return NextResponse.json({ error: "App not found" }, { status: 404 });
        }

        const row = app.rows[0];
        const result: Record<string, unknown> = {
            appId: row.app_id,
            topology: row.topology,
            ownerData: JSON.parse((row.owner_data as string) || "[]"),
            defaults: JSON.parse((row.defaults as string) || "[]"),
            spectrum: row.spectrum,
            ownerId: row.owner_id,
            world: row.world,
            name: row.name,
            version: row.version,
        };

        // If userId provided, also fetch/create user data
        if (userId) {
            const existing = await db.execute({
                sql: `SELECT user_data, cached_version FROM user_apps WHERE user_id = ? AND app_id = ?`,
                args: [userId, id],
            });

            if (existing.rows.length) {
                result.userData = JSON.parse((existing.rows[0].user_data as string) || "[]");
            } else {
                // First scan — initialize from defaults
                const defaults = result.defaults as unknown[];
                await db.execute({
                    sql: `INSERT INTO user_apps (user_id, app_id, user_data, cached_version) VALUES (?, ?, ?, ?)`,
                    args: [userId, id, JSON.stringify(defaults), row.version],
                });
                result.userData = defaults;
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/apps/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
