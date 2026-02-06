// ═══════════════════════════════════════════════════════════════════════════
// SESSION — DB-backed sessions via httpOnly cookies
// No JWT, no secrets to rotate. Token in DB, cookie on client.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getTurso } from "@/lib/db/turso";

const COOKIE_NAME = "manifold_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
    userId: string;
    email: string | null;
    displayName: string | null;
}

/** Create a new session in DB, returns the token */
export async function createSession(userId: string): Promise<string> {
    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;

    const db = getTurso();
    await db.execute({
        sql: "INSERT INTO auth_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        args: [token, userId, now, expiresAt],
    });

    // Clean up expired sessions opportunistically
    await db.execute({
        sql: "DELETE FROM auth_sessions WHERE expires_at < ?",
        args: [now],
    });

    return token;
}

/** Read session from cookie → look up in DB → return user or null */
export async function getSession(
    request: NextRequest
): Promise<SessionUser | null> {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const db = getTurso();
    const result = await db.execute({
        sql: `SELECT s.user_id, a.email, a.display_name
              FROM auth_sessions s
              JOIN auth_seeds a ON s.user_id = a.id
              WHERE s.token = ? AND s.expires_at > ? AND a.active = 1`,
        args: [token, Date.now()],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        userId: row.user_id as string,
        email: (row.email as string) || null,
        displayName: (row.display_name as string) || null,
    };
}

/** Delete session from DB */
export async function destroySession(token: string): Promise<void> {
    const db = getTurso();
    await db.execute({
        sql: "DELETE FROM auth_sessions WHERE token = ?",
        args: [token],
    });
}

/** Set the session cookie on a response */
export function setSessionCookie(
    response: NextResponse,
    token: string
): NextResponse {
    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_MS / 1000, // seconds
    });
    return response;
}

/** Clear the session cookie */
export function clearSessionCookie(response: NextResponse): NextResponse {
    response.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return response;
}

/** Get session token from request (for logout) */
export function getSessionToken(request: NextRequest): string | null {
    return request.cookies.get(COOKIE_NAME)?.value ?? null;
}
