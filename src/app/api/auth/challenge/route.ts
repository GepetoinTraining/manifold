import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/auth/verify";

// POST /api/auth/challenge
// Body: { id }
// Returns: { challengeId, n }
export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid id" },
                { status: 400 }
            );
        }

        const challenge = await generateChallenge(id);

        if (!challenge) {
            return NextResponse.json(
                { error: "User not found or not active" },
                { status: 404 }
            );
        }

        return NextResponse.json(challenge);
    } catch (error) {
        console.error("Challenge error:", error);
        return NextResponse.json(
            { error: "Challenge generation failed" },
            { status: 500 }
        );
    }
}
