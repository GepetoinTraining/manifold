import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getInterviewPrompt } from "@/lib/interview/prompt";
import { getTurso } from "@/lib/db/turso";
import { populateRegistry, getAllElements } from "@/lib/manifold/elements";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: NextRequest) {
    try {
        const { messages, phase, physics } = await request.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { error: "Anthropic API key not configured" },
                { status: 500 }
            );
        }

        // Load element registry for the interview prompt
        let elements = getAllElements();
        if (elements.length === 0) {
            try {
                const db = getTurso();
                const result = await db.execute("SELECT * FROM elements ORDER BY prime");
                if (result.rows.length > 0) {
                    populateRegistry(result.rows as Record<string, unknown>[]);
                    elements = getAllElements();
                }
            } catch {
                // Registry not seeded yet — proceed without it
            }
        }

        // Build message history for Claude
        const claudeMessages = messages.map(
            (msg: { role: string; content: string }) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })
        );

        // Add context about current physics settings if in vibes phase
        if (phase === "vibes" && physics) {
            const physicsContext = `[CURRENT PHYSICS: temperature=${physics.temperature}, luminosity=${physics.luminosity}, friction=${physics.friction}]`;
            if (claudeMessages.length > 0) {
                const lastMessage = claudeMessages[claudeMessages.length - 1];
                if (lastMessage.role === "user") {
                    lastMessage.content = `${physicsContext}\n\n${lastMessage.content}`;
                }
            }
        }

        // Call Claude API with registry-aware prompt
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: getInterviewPrompt(elements),
            messages: claudeMessages,
        });

        // Extract response text
        const textBlock = response.content.find((block) => block.type === "text");
        const responseText = textBlock?.type === "text" ? textBlock.text : "";

        // Parse response for extracted data
        const result = parseInterviewResponse(responseText, phase);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Interview API error:", error);
        return NextResponse.json(
            { error: "Failed to process interview" },
            { status: 500 }
        );
    }
}

// ─── RESPONSE PARSING ────────────────────────────────────────────────────────

interface ParsedResponse {
    message: string;
    tags?: Array<{ label: string; value: string }>;
    roles?: string[];
    topology?: unknown;
    nextPhase?: string;
}

function parseInterviewResponse(text: string, currentPhase: string): ParsedResponse {
    const result: ParsedResponse = { message: text };

    // Extract [TAG: ...] markers
    const tagMatches = text.matchAll(/\[TAG:\s*([^\]]+)\]/g);
    const tags: Array<{ label: string; value: string }> = [];
    for (const match of tagMatches) {
        const parts = match[1].split(":");
        if (parts.length >= 2) {
            tags.push({
                label: parts[0].trim(),
                value: parts.slice(1).join(":").trim(),
            });
        } else {
            tags.push({ label: currentPhase, value: parts[0].trim() });
        }
    }
    if (tags.length > 0) {
        result.tags = tags;
        // Remove tags from message
        result.message = text.replace(/\[TAG:\s*[^\]]+\]/g, "").trim();
    }

    // Extract ```extracted``` block
    const extractedMatch = text.match(/```extracted\n([\s\S]*?)\n```/);
    if (extractedMatch) {
        try {
            const extracted = JSON.parse(extractedMatch[1]);

            // Convert to tags
            if (!result.tags) result.tags = [];
            for (const [key, value] of Object.entries(extracted)) {
                if (key === "roles" && Array.isArray(value)) {
                    result.roles = value as string[];
                } else if (typeof value === "string" || typeof value === "number") {
                    result.tags.push({ label: key, value: String(value) });
                } else if (Array.isArray(value)) {
                    result.tags.push({ label: key, value: value.join(", ") });
                }
            }

            // Remove extracted block from message
            result.message = result.message
                .replace(/```extracted\n[\s\S]*?\n```/g, "")
                .trim();
        } catch {
            // Ignore parse errors
        }
    }

    // Extract ```topology``` block
    const topologyMatch = text.match(/```topology\n([\s\S]*?)\n```/);
    if (topologyMatch) {
        try {
            result.topology = JSON.parse(topologyMatch[1]);
            result.message = result.message
                .replace(/```topology\n[\s\S]*?\n```/g, "")
                .trim();
        } catch {
            // Ignore parse errors
        }
    }

    // Determine if we should suggest next phase
    if (result.topology) {
        result.nextPhase = "masking";
    } else if (currentPhase === "identity" && result.tags && result.tags.length >= 2) {
        result.nextPhase = "audience";
    } else if (currentPhase === "audience" && result.roles && result.roles.length > 0) {
        result.nextPhase = "vibes";
    } else if (currentPhase === "vibes") {
        result.nextPhase = "interaction";
    }

    return result;
}
