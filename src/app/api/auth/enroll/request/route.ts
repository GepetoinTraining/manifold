import { NextRequest, NextResponse } from "next/server";
import { requestEnrollment } from "@/lib/auth/enroll";

// POST /api/auth/enroll/request
// Body: { id, geo: { lat, lon }, email?, displayName? }
// Returns: { token }
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

        return NextResponse.json({ token });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Enrollment request failed";

        // User already enrolled is a 409
        if (message === "User already enrolled") {
            return NextResponse.json({ error: message }, { status: 409 });
        }

        console.error("Enroll request error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
