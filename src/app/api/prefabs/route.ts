import { NextRequest, NextResponse } from "next/server";
import { getTurso } from "@/lib/db/turso";

// ═══════════════════════════════════════════════════════════════════════════
// PREFABS API — Reusable topology templates
//
// GET  /api/prefabs                    → list all prefabs
// GET  /api/prefabs?category=food      → filter by category
// GET  /api/prefabs?id=restaurant-v1   → single prefab
// POST /api/prefabs                    → create new prefab (Claude writes here)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const db = getTurso();
        const params = request.nextUrl.searchParams;

        const id = params.get("id");
        const category = params.get("category");

        // Single prefab by ID
        if (id) {
            const result = await db.execute({
                sql: "SELECT * FROM prefabs WHERE id = ?",
                args: [id],
            });

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: "Prefab not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(parsePrefab(result.rows[0]));
        }

        // Filter by category
        if (category) {
            const result = await db.execute({
                sql: "SELECT * FROM prefabs WHERE category = ? ORDER BY usage_count DESC",
                args: [category],
            });
            return NextResponse.json(result.rows.map(parsePrefab));
        }

        // All prefabs (sorted by popularity)
        const result = await db.execute(
            "SELECT * FROM prefabs ORDER BY usage_count DESC"
        );
        return NextResponse.json(result.rows.map(parsePrefab));
    } catch (error) {
        console.error("Prefabs GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch prefabs" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, category, topology, defaultPhysics, description } = body;

        // Validation
        if (!name || !category || !topology) {
            return NextResponse.json(
                { error: "Missing required fields: name, category, topology" },
                { status: 400 }
            );
        }

        const db = getTurso();
        const prefabId = id || `${category}-${name.toLowerCase().replace(/\s+/g, "-")}`;

        // Upsert (allows Claude to update existing prefabs)
        await db.execute({
            sql: `INSERT OR REPLACE INTO prefabs (id, name, category, topology, default_physics, description)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                prefabId,
                name,
                category,
                JSON.stringify(topology),
                JSON.stringify(defaultPhysics || {}),
                description || null,
            ],
        });

        return NextResponse.json({
            success: true,
            prefab: {
                id: prefabId,
                name,
                category,
                topology,
                defaultPhysics: defaultPhysics || {},
                description: description || null,
            },
        });
    } catch (error) {
        console.error("Prefabs POST error:", error);
        return NextResponse.json(
            { error: "Failed to create prefab" },
            { status: 500 }
        );
    }
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function parsePrefab(row: Record<string, unknown>) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        topology: JSON.parse((row.topology as string) || "{}"),
        defaultPhysics: JSON.parse((row.default_physics as string) || "{}"),
        description: row.description || null,
        usageCount: row.usage_count || 0,
        createdAt: row.created_at,
    };
}
