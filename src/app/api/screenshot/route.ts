/**
 * Screenshot API route
 * 
 * POST /api/screenshot
 * Body: { topology: string }
 * Response: { dataUrl: string, width: number, height: number }
 * 
 * This route is designed to be called by the API Claude (or any tool)
 * to capture the rendered topology as a base64 PNG image.
 * 
 * In the current implementation, screenshots are captured client-side
 * using html2canvas. This API route serves as a proxy to store/return
 * the most recent screenshot captured by the build page.
 * 
 * The build page calls handleScreenshot() → stores result → this route returns it.
 */

import { NextResponse } from "next/server";

// In-memory store for the latest screenshot (per-session simplicity)
let latestScreenshot: { dataUrl: string; timestamp: number } | null = null;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.dataUrl) {
            // Store screenshot from client
            latestScreenshot = {
                dataUrl: body.dataUrl,
                timestamp: Date.now(),
            };
            return NextResponse.json({
                ok: true,
                timestamp: latestScreenshot.timestamp,
            });
        }

        return NextResponse.json(
            { error: "Missing dataUrl" },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process screenshot" },
            { status: 500 }
        );
    }
}

export async function GET() {
    if (!latestScreenshot) {
        return NextResponse.json(
            { error: "No screenshot available. Use the 📸 button in the build page first." },
            { status: 404 }
        );
    }

    return NextResponse.json({
        dataUrl: latestScreenshot.dataUrl,
        timestamp: latestScreenshot.timestamp,
        age: Date.now() - latestScreenshot.timestamp,
    });
}
