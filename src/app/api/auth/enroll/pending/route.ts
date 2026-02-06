import { NextResponse } from "next/server";
import { listPendingEnrollments } from "@/lib/auth/enroll";

// GET /api/auth/enroll/pending
// Returns: { pending: [{ token, id, requestedAt }] }
export async function GET() {
    try {
        // TODO: add admin auth check here when admin system is built
        const pending = await listPendingEnrollments();
        return NextResponse.json({ pending });
    } catch (error) {
        console.error("List pending error:", error);
        return NextResponse.json(
            { error: "Failed to list pending enrollments" },
            { status: 500 }
        );
    }
}
