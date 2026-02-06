import { NextRequest, NextResponse } from "next/server";
import { createSeed, storeSeed, type Certificate } from "@/lib/auth/seed";

// POST /api/auth/test-enroll
// Body: { id, geo?: { lat, lon }, email?, displayName? }
// Returns: { certificate } — direct, no pending/approval steps
// For testing only — bypasses the enrollment gate entirely
export async function POST(request: NextRequest) {
    try {
        const { id, geo, email, displayName } = await request.json();

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid id" },
                { status: 400 }
            );
        }

        const coords = geo || { lat: 0, lon: 0 };
        const record = createSeed(
            id,
            new Date(),
            coords,
            displayName,
            email
        );
        await storeSeed(record);

        const certificate: Certificate = {
            id: record.id,
            seed: record.seedNumber,
            zeta: record.zeta,
            issuedAt: Date.now(),
        };

        return NextResponse.json({ certificate });
    } catch (error) {
        console.error("Test enroll error:", error);
        return NextResponse.json(
            { error: "Test enrollment failed" },
            { status: 500 }
        );
    }
}
