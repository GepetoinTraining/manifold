import { NextRequest, NextResponse } from "next/server";
import { approveEnrollment } from "@/lib/auth/enroll";

// POST /api/auth/enroll/approve
// Body: { token }
// Returns: { certificate: { id, seed, zeta, issuedAt } }
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid token" },
                { status: 400 }
            );
        }

        const certificate = await approveEnrollment(token);

        if (!certificate) {
            return NextResponse.json(
                { error: "Invalid or expired enrollment token" },
                { status: 404 }
            );
        }

        return NextResponse.json({ certificate });
    } catch (error) {
        console.error("Enroll approve error:", error);
        return NextResponse.json(
            { error: "Enrollment approval failed" },
            { status: 500 }
        );
    }
}
