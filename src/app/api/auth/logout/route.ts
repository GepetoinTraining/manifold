import { NextRequest, NextResponse } from "next/server";
import {
    getSessionToken,
    destroySession,
    clearSessionCookie,
} from "@/lib/auth/session";

// POST /api/auth/logout
// Clears cookie + deletes DB session
export async function POST(request: NextRequest) {
    try {
        const token = getSessionToken(request);

        if (token) {
            await destroySession(token);
        }

        const response = NextResponse.json({ success: true });
        return clearSessionCookie(response);
    } catch (error) {
        console.error("Logout error:", error);
        // Still clear the cookie even if DB delete fails
        const response = NextResponse.json({ success: true });
        return clearSessionCookie(response);
    }
}
