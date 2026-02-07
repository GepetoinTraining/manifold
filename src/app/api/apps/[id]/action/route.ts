import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/apps/[id]/action
 *
 * Handles user/owner actions on an app:
 *   4: increment  — +1 to user_data[slotIndex]
 *   5: decrement  — -1 to user_data[slotIndex]
 *   6: submit     — owner on admin: write owner_data; student: write user_data
 *   7: toggle     — flip boolean in user_data[slotIndex]
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const db = getDb();
        const { id: appId } = await params;
        const body = await request.json();
        const { userId, pin, actionType, slotIndex, payload, view } = body as {
            userId: string;
            pin: string;
            actionType: number;
            slotIndex: number;
            payload?: unknown[];
            view?: string;
        };

        if (!userId || !pin || actionType === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // ── Verify user ──
        const userRow = await db.execute({
            sql: "SELECT user_id FROM users WHERE user_id = ? AND pin = ?",
            args: [userId, pin],
        });
        if (!userRow.rows.length) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // ── Get app ──
        const appRow = await db.execute({
            sql: "SELECT owner_id, owner_data, defaults FROM apps WHERE app_id = ?",
            args: [appId],
        });
        if (!appRow.rows.length) {
            return NextResponse.json({ error: "App not found" }, { status: 404 });
        }

        const app = appRow.rows[0];
        const isOwner = app.owner_id === userId;
        let ownerData: unknown[] = JSON.parse((app.owner_data as string) || "[]");
        const defaults: unknown[] = JSON.parse((app.defaults as string) || "[]");

        // ── Get or create user_apps row ──
        let uaRow = await db.execute({
            sql: "SELECT user_data FROM user_apps WHERE user_id = ? AND app_id = ?",
            args: [userId, appId],
        });

        if (!uaRow.rows.length) {
            await db.execute({
                sql: `INSERT INTO user_apps (user_id, app_id, user_data) VALUES (?, ?, ?)`,
                args: [userId, appId, JSON.stringify(defaults)],
            });
            uaRow = await db.execute({
                sql: "SELECT user_data FROM user_apps WHERE user_id = ? AND app_id = ?",
                args: [userId, appId],
            });
        }

        const userData: unknown[] = JSON.parse((uaRow.rows[0].user_data as string) || "[]");

        // ── action:6 from owner on admin view → UPDATE apps.owner_data ──
        if (actionType === 6 && isOwner && view === "admin") {
            if (Array.isArray(payload) && payload.length > 0) {
                const newOwnerData = [...ownerData];
                for (let i = 0; i < payload.length; i++) {
                    if (payload[i] !== undefined && payload[i] !== null) {
                        // Extend array if needed
                        while (newOwnerData.length <= i) newOwnerData.push(null);
                        newOwnerData[i] = payload[i];
                    }
                }
                ownerData = newOwnerData;
                await db.execute({
                    sql: "UPDATE apps SET owner_data = ?, updated_at = unixepoch() WHERE app_id = ?",
                    args: [JSON.stringify(ownerData), appId],
                });
            }
            return NextResponse.json({ ownerData, userData });
        }

        // ── User-side actions → mutate user_data ──
        switch (actionType) {
            case 4: { // increment
                if (slotIndex >= 0 && slotIndex < userData.length) {
                    userData[slotIndex] = (Number(userData[slotIndex]) || 0) + 1;
                }
                break;
            }
            case 5: { // decrement
                if (slotIndex >= 0 && slotIndex < userData.length) {
                    const val = (Number(userData[slotIndex]) || 0) - 1;
                    userData[slotIndex] = Math.max(0, val);
                }
                break;
            }
            case 7: { // toggle
                if (slotIndex >= 0 && slotIndex < userData.length) {
                    userData[slotIndex] = userData[slotIndex] ? 0 : 1;
                }
                break;
            }
            case 6: { // submit from student
                if (Array.isArray(payload)) {
                    for (let i = 0; i < payload.length && i < userData.length; i++) {
                        if (payload[i] !== undefined && payload[i] !== null) {
                            userData[i] = payload[i];
                        }
                    }
                }
                break;
            }
            default:
                return NextResponse.json({ error: `Unknown action: ${actionType}` }, { status: 400 });
        }

        // ── Persist updated user_data ──
        await db.execute({
            sql: "UPDATE user_apps SET user_data = ?, last_sync = unixepoch() WHERE user_id = ? AND app_id = ?",
            args: [JSON.stringify(userData), userId, appId],
        });

        return NextResponse.json({ ownerData, userData });
    } catch (error) {
        console.error("Action error:", error);
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500 },
        );
    }
}
