import { NextRequest, NextResponse } from "next/server";
import { revokeSeed } from "@/lib/auth/seed";

// POST /api/auth/revoke
// Body: { id }
// Returns: { revoked: true }
export async function POST(request: NextRequest) {
    try {
        // TODO: add admin auth check here when admin system is built
        const { id } = await request.json();

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid id" },
                { status: 400 }
            );
        }

        const revoked = await revokeSeed(id);

        if (!revoked) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ revoked: true });
    } catch (error) {
        console.error("Revoke error:", error);
        return NextResponse.json(
            { error: "Revocation failed" },
            { status: 500 }
        );
    }
}
