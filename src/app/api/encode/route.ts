import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/encoder/system-prompt";

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY not configured" },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages,
            }),
        });

        const data = await response.json();

        if (data.error) {
            return NextResponse.json(
                { error: data.error.message },
                { status: 400 }
            );
        }

        const content = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";

        return NextResponse.json({ content });
    } catch (error) {
        console.error("Encode API error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
