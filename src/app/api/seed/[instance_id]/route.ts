import { NextRequest, NextResponse } from "next/server";
import { getTurso } from "@/lib/db/turso";

// GET /api/seed/[instance_id] - Get current seed
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ instance_id: string }> }
) {
    try {
        const { instance_id } = await params;
        const db = getTurso();

        const result = await db.execute({
            sql: "SELECT current_seed, updated_at FROM seeds WHERE instance_id = ?",
            args: [instance_id],
        });

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Instance not found" },
                { status: 404 }
            );
        }

        const row = result.rows[0];
        return NextResponse.json({
            seed: row.current_seed,
            updatedAt: row.updated_at,
        });
    } catch (error) {
        console.error("Seed GET error:", error);
        return NextResponse.json(
            { error: "Failed to get seed" },
            { status: 500 }
        );
    }
}

// POST /api/seed/[instance_id] - Apply delta to seed
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ instance_id: string }> }
) {
    try {
        const { instance_id } = await params;
        const { delta, operation, role, device } = await request.json();

        if (!delta || !operation) {
            return NextResponse.json(
                { error: "Missing delta or operation" },
                { status: 400 }
            );
        }

        if (!["multiply", "divide"].includes(operation)) {
            return NextResponse.json(
                { error: "Invalid operation" },
                { status: 400 }
            );
        }

        const db = getTurso();

        // Get current seed
        const current = await db.execute({
            sql: "SELECT current_seed FROM seeds WHERE instance_id = ?",
            args: [instance_id],
        });

        if (current.rows.length === 0) {
            return NextResponse.json(
                { error: "Instance not found" },
                { status: 404 }
            );
        }

        const currentSeed = BigInt(current.rows[0].current_seed as string);
        const deltaValue = BigInt(delta);

        // Apply delta
        let newSeed: bigint;
        if (operation === "multiply") {
            newSeed = currentSeed * deltaValue;
        } else {
            if (currentSeed % deltaValue !== BigInt(0)) {
                return NextResponse.json(
                    { error: "Division not exact" },
                    { status: 400 }
                );
            }
            newSeed = currentSeed / deltaValue;
        }

        // Update seed and log delta
        await db.batch([
            {
                sql: "UPDATE seeds SET current_seed = ?, updated_at = CURRENT_TIMESTAMP WHERE instance_id = ?",
                args: [newSeed.toString(), instance_id],
            },
            {
                sql: "INSERT INTO deltas (instance_id, delta, operation, role, device) VALUES (?, ?, ?, ?, ?)",
                args: [instance_id, delta, operation, role || null, device || null],
            },
        ]);

        return NextResponse.json({
            seed: newSeed.toString(),
            operation,
            delta,
        });
    } catch (error) {
        console.error("Seed POST error:", error);
        return NextResponse.json(
            { error: "Failed to apply delta" },
            { status: 500 }
        );
    }
}
