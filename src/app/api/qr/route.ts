import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { isValidTopology } from "@/lib/manifold/topology";

export async function POST(request: NextRequest) {
    try {
        const { topology } = await request.json();

        if (!isValidTopology(topology)) {
            return NextResponse.json({ error: "Invalid topology" }, { status: 400 });
        }

        const jsonString = JSON.stringify(topology);

        // Generate QR code as PNG buffer
        const buffer = await QRCode.toBuffer(jsonString, {
            width: 512,
            margin: 2,
            color: {
                dark: "#c9a227",
                light: "#0f0e0c",
            },
        });

        // Convert Buffer to Uint8Array for NextResponse
        const uint8Array = new Uint8Array(buffer);

        return new NextResponse(uint8Array, {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": "attachment; filename=manifold-qr.png",
            },
        });
    } catch (error) {
        console.error("QR generation error:", error);
        return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
    }
}
