import { NextRequest, NextResponse } from "next/server";
import { getTurso } from "@/lib/db/turso";

// ═══════════════════════════════════════════════════════════════════════════
// ELEMENTS API — The Periodic Table CRUD
//
// GET  /api/elements              → all elements (registry population)
// GET  /api/elements?prime=389    → single element by prime
// GET  /api/elements?name=Button  → single element by name
// GET  /api/elements?layer=atomic → filter by layer
// POST /api/elements              → create new element (Claude writes here)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const db = getTurso();
        const params = request.nextUrl.searchParams;

        const prime = params.get("prime");
        const name = params.get("name");
        const layer = params.get("layer");

        // Single element by prime
        if (prime) {
            const result = await db.execute({
                sql: "SELECT * FROM elements WHERE prime = ?",
                args: [parseInt(prime)],
            });

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: "Element not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(parseElement(result.rows[0]));
        }

        // Single element by name (case-insensitive)
        if (name) {
            const result = await db.execute({
                sql: "SELECT * FROM elements WHERE LOWER(name) = LOWER(?)",
                args: [name],
            });

            if (result.rows.length === 0) {
                // Also check aliases (JSON array contains)
                const allResult = await db.execute(
                    "SELECT * FROM elements"
                );

                const match = allResult.rows.find((row) => {
                    const aliases: string[] = JSON.parse(
                        (row.aliases as string) || "[]"
                    );
                    return aliases.some(
                        (a) => a.toLowerCase() === name.toLowerCase()
                    );
                });

                if (!match) {
                    return NextResponse.json(
                        { error: "Element not found" },
                        { status: 404 }
                    );
                }

                return NextResponse.json(parseElement(match));
            }

            return NextResponse.json(parseElement(result.rows[0]));
        }

        // Filter by layer
        if (layer) {
            const result = await db.execute({
                sql: "SELECT * FROM elements WHERE layer = ? ORDER BY prime",
                args: [layer],
            });
            return NextResponse.json(result.rows.map(parseElement));
        }

        // All elements (for registry population)
        const result = await db.execute(
            "SELECT * FROM elements ORDER BY prime"
        );
        return NextResponse.json(result.rows.map(parseElement));
    } catch (error) {
        console.error("Elements GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch elements" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prime, name, layer, defaultPhysics, variants, renderHint, aliases, description } = body;

        // Validation
        if (!prime || !name || !layer) {
            return NextResponse.json(
                { error: "Missing required fields: prime, name, layer" },
                { status: 400 }
            );
        }

        if (!["atomic", "molecular", "organism"].includes(layer)) {
            return NextResponse.json(
                { error: "Invalid layer. Must be: atomic, molecular, organism" },
                { status: 400 }
            );
        }

        if (!isPrime(prime)) {
            return NextResponse.json(
                { error: `${prime} is not a prime number` },
                { status: 400 }
            );
        }

        const db = getTurso();

        // Check for collision
        const existing = await db.execute({
            sql: "SELECT prime, name FROM elements WHERE prime = ? OR LOWER(name) = LOWER(?)",
            args: [prime, name],
        });

        if (existing.rows.length > 0) {
            const conflict = existing.rows[0];
            return NextResponse.json(
                {
                    error: `Element already exists: prime ${conflict.prime} = ${conflict.name}`,
                    existing: parseElement(conflict),
                },
                { status: 409 }
            );
        }

        // Insert
        await db.execute({
            sql: `INSERT INTO elements (prime, name, layer, default_physics, variants, render_hint, aliases, description)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                prime,
                name,
                layer,
                JSON.stringify(defaultPhysics || {}),
                JSON.stringify(variants || {}),
                renderHint || "container",
                JSON.stringify(aliases || []),
                description || null,
            ],
        });

        return NextResponse.json({
            success: true,
            element: {
                prime,
                name,
                layer,
                defaultPhysics: defaultPhysics || {},
                variants: variants || {},
                renderHint: renderHint || "container",
                aliases: aliases || [],
                description: description || null,
            },
        });
    } catch (error) {
        console.error("Elements POST error:", error);
        return NextResponse.json(
            { error: "Failed to create element" },
            { status: 500 }
        );
    }
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function parseElement(row: Record<string, unknown>) {
    return {
        prime: row.prime,
        name: row.name,
        layer: row.layer,
        defaultPhysics: JSON.parse((row.default_physics as string) || "{}"),
        variants: JSON.parse((row.variants as string) || "{}"),
        renderHint: row.render_hint || "container",
        aliases: JSON.parse((row.aliases as string) || "[]"),
        description: row.description || null,
    };
}

function isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}
