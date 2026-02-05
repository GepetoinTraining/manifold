import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTurso } from "@/lib/db/turso";
import { isValidTopology } from "@/lib/manifold/topology";

// POST /api/app - Create app from interview
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, topology, interviewLog } = await request.json();

        if (!topology || !isValidTopology(topology)) {
            return NextResponse.json(
                { error: "Invalid topology" },
                { status: 400 }
            );
        }

        const db = getTurso();
        const appId = crypto.randomUUID();

        // Insert app
        await db.execute({
            sql: `INSERT INTO apps (id, name, topology, interview_log) VALUES (?, ?, ?, ?)`,
            args: [
                appId,
                name || "Untitled App",
                JSON.stringify(topology),
                interviewLog ? JSON.stringify(interviewLog) : null,
            ],
        });

        // Create roles if present
        if (topology.roles && Array.isArray(topology.roles)) {
            for (const role of topology.roles) {
                await db.execute({
                    sql: `INSERT INTO roles (id, app_id, name, hidden_nodes, physics_overrides) VALUES (?, ?, ?, ?, ?)`,
                    args: [
                        crypto.randomUUID(),
                        appId,
                        role.name,
                        JSON.stringify(role.hiddenNodes || []),
                        role.physicsOverrides ? JSON.stringify(role.physicsOverrides) : null,
                    ],
                });
            }
        }

        return NextResponse.json({ appId, success: true });
    } catch (error) {
        console.error("App POST error:", error);
        return NextResponse.json(
            { error: "Failed to create app" },
            { status: 500 }
        );
    }
}

// GET /api/app?id=xxx - Get app topology
export async function GET(request: NextRequest) {
    try {
        const appId = request.nextUrl.searchParams.get("id");

        if (!appId) {
            return NextResponse.json(
                { error: "Missing app ID" },
                { status: 400 }
            );
        }

        const db = getTurso();

        // Get app
        const appResult = await db.execute({
            sql: "SELECT id, name, topology, created_at FROM apps WHERE id = ?",
            args: [appId],
        });

        if (appResult.rows.length === 0) {
            return NextResponse.json(
                { error: "App not found" },
                { status: 404 }
            );
        }

        const app = appResult.rows[0];

        // Get roles
        const rolesResult = await db.execute({
            sql: "SELECT name, hidden_nodes, physics_overrides FROM roles WHERE app_id = ?",
            args: [appId],
        });

        const roles = rolesResult.rows.map((row) => ({
            name: row.name,
            hiddenNodes: JSON.parse((row.hidden_nodes as string) || "[]"),
            physicsOverrides: row.physics_overrides
                ? JSON.parse(row.physics_overrides as string)
                : undefined,
        }));

        return NextResponse.json({
            id: app.id,
            name: app.name,
            topology: JSON.parse(app.topology as string),
            roles,
            createdAt: app.created_at,
        });
    } catch (error) {
        console.error("App GET error:", error);
        return NextResponse.json(
            { error: "Failed to get app" },
            { status: 500 }
        );
    }
}
