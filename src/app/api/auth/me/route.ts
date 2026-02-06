import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET /api/auth/me
// Returns: { user: { id, email, displayName } } or 401
export async function GET(request: NextRequest) {
    try {
        const session = await getSession(request);

        if (!session) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: session.userId,
                email: session.email,
                displayName: session.displayName,
            },
        });
    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json(
            { error: "Session check failed" },
            { status: 500 }
        );
    }
}
