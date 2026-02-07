import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getInterviewPrompt } from "@/lib/interview/prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface ParsedResponse {
  message: string;
  tags?: Array<{ label: string; value: string }>;
  roles?: string[];
  topology?: string; // raw .mf source
  nextPhase?: string;
  spectrum?: string;
}

// ─── POST HANDLER ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages, phase } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Build Claude message history
    const claudeMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: getInterviewPrompt(),
      messages: claudeMessages,
    });

    // Extract text response
    const textBlock = response.content.find(
      (block) => block.type === "text"
    );
    const responseText =
      textBlock?.type === "text" ? textBlock.text : "";

    // Parse structured blocks from response
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

// ─── RESPONSE PARSING ───────────────────────────────────────────────────────

function parseInterviewResponse(
  text: string,
  currentPhase: string
): ParsedResponse {
  const result: ParsedResponse = { message: text };

  // Extract [TAG: label:value] markers
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
    result.message = text.replace(/\[TAG:\s*[^\]]+\]/g, "").trim();
  }

  // Extract ```extracted``` block
  const extractedMatch = text.match(/```extracted\n([\s\S]*?)\n```/);
  if (extractedMatch) {
    try {
      const extracted = JSON.parse(extractedMatch[1]);

      if (!result.tags) result.tags = [];
      for (const [key, value] of Object.entries(extracted)) {
        if (key === "roles" && Array.isArray(value)) {
          result.roles = value as string[];
        } else if (key === "spectrum" && typeof value === "string") {
          result.spectrum = value;
          result.tags.push({ label: "spectrum", value });
        } else if (
          typeof value === "string" ||
          typeof value === "number"
        ) {
          result.tags.push({ label: key, value: String(value) });
        } else if (Array.isArray(value)) {
          result.tags.push({ label: key, value: value.join(", ") });
        }
      }

      // Remove from visible message
      result.message = result.message
        .replace(/```extracted\n[\s\S]*?\n```/g, "")
        .trim();
    } catch {
      // Ignore parse errors
    }
  }

  // Extract ```topology``` block — this is raw .mf source
  const topologyMatch = text.match(/```topology\n([\s\S]*?)\n```/);
  if (topologyMatch) {
    result.topology = topologyMatch[1].trim();
    result.message = result.message
      .replace(/```topology\n[\s\S]*?\n```/g, "")
      .trim();
  }

  // Phase transitions
  if (result.topology) {
    result.nextPhase = "refine";
  } else if (
    currentPhase === "identity" &&
    result.tags &&
    result.tags.length >= 2
  ) {
    result.nextPhase = "audience";
  } else if (
    currentPhase === "audience" &&
    result.roles &&
    result.roles.length > 0
  ) {
    result.nextPhase = "vibes";
  } else if (currentPhase === "vibes") {
    result.nextPhase = "structure";
  }

  return result;
}
