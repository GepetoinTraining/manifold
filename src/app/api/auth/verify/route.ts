import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/auth/verify";
import {
    createSession,
    setSessionCookie,
} from "@/lib/auth/session";
import { getSeed } from "@/lib/auth/seed";

// POST /api/auth/verify
// Body: { challengeId, trajectory }
// Returns: { authenticated: true, user: { id, email, displayName } } + sets cookie
export async function POST(request: NextRequest) {
    try {
        const { challengeId, trajectory } = await request.json();

        if (!challengeId || typeof challengeId !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid challengeId" },
                { status: 400 }
            );
        }

        if (!trajectory || typeof trajectory !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid trajectory" },
                { status: 400 }
            );
        }

        const result = await verifyChallenge(challengeId, trajectory);

        if (!result.valid || !result.userId) {
            return NextResponse.json(
                { authenticated: false, error: "Invalid trajectory" },
                { status: 401 }
            );
        }

        // Create session
        const token = await createSession(result.userId);

        // Get user info for response
        const seed = await getSeed(result.userId);

        const response = NextResponse.json({
            authenticated: true,
            user: {
                id: result.userId,
                email: seed?.email || null,
                displayName: seed?.displayName || null,
            },
        });

        // Set httpOnly session cookie
        return setSessionCookie(response, token);
    } catch (error) {
        console.error("Verify error:", error);
        return NextResponse.json(
            { error: "Verification failed" },
            { status: 500 }
        );
    }
}
