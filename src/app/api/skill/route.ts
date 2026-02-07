import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * GET /api/skill
 *
 * Serves the CLAUDE.md skill file as plain text.
 * This is the canonical .mf skill reference that Claude Web
 * (or any client) can fetch to learn how to build .mf topologies.
 *
 * Usage:
 *   - Claude Web project: add this URL as a knowledge source
 *   - API integration: fetch and inject as system context
 *   - Human reference: visit in browser
 */
export async function GET(request: NextRequest) {
  try {
    const skillPath = join(process.cwd(), "public", "CLAUDE.md");
    const content = readFileSync(skillPath, "utf-8");

    // Check if client wants JSON wrapping
    const accept = request.headers.get("accept") || "";
    if (accept.includes("application/json")) {
      return NextResponse.json({
        version: "2.1",
        format: "markdown",
        content,
      });
    }

    // Default: raw markdown
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Skill file not found" },
      { status: 404 }
    );
  }
}
