import { NextRequest, NextResponse } from "next/server";
import { requestEnrollment, approveEnrollment } from "@/lib/auth/enroll";
import { getSeed } from "@/lib/auth/seed";

// POST /api/auth/enroll/request
// Body: { id, geo: { lat, lon }, email?, displayName? }
// Returns: { certificate } for first-time users (auto-approved)
//          { token } for re-enrollment (requires approval)
export async function POST(request: NextRequest) {
    try {
        const { id, geo, email, displayName } = await request.json();

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid id" },
                { status: 400 }
            );
        }

        if (!geo || typeof geo.lat !== "number" || typeof geo.lon !== "number") {
            return NextResponse.json(
                { error: "Missing or invalid geo coordinates" },
                { status: 400 }
            );
        }

        const token = await requestEnrollment(id, geo, email, displayName);

        // First-time user: auto-approve, no second step needed
        const existing = await getSeed(id);
        if (!existing) {
            const certificate = await approveEnrollment(token);
            if (certificate) {
                return NextResponse.json({ certificate });
            }
        }

        // Re-enrollment: requires approval step
        return NextResponse.json({ token });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Enrollment request failed";

        console.error("Enroll request error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
