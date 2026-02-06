import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getInterviewPrompt } from "@/lib/interview/prompt";
import { getTurso } from "@/lib/db/turso";
import {
    populateRegistry,
    getAllElements,
    getNextPrime,
    getElementByName,
} from "@/lib/manifold/elements";

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
                const result = await db.execute(
                    "SELECT * FROM elements ORDER BY prime"
                );
                if (result.rows.length > 0) {
                    populateRegistry(
                        result.rows as Record<string, unknown>[]
                    );
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
                const lastMessage =
                    claudeMessages[claudeMessages.length - 1];
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
        const textBlock = response.content.find(
            (block) => block.type === "text"
        );
        const responseText =
            textBlock?.type === "text" ? textBlock.text : "";

        // Parse response for extracted data
        const result = parseInterviewResponse(responseText, phase);

        // ── SERVER-SIDE EXECUTION ────────────────────────────────────────
        // Execute any structured blocks Claude emitted (new_element, new_prefab)
        // Claude suggests → server executes → client gets confirmation
        const sideEffects = await executeSideEffects(
            responseText,
            result.topology
        );

        if (sideEffects.elementsCreated.length > 0) {
            result.elementsCreated = sideEffects.elementsCreated;
        }
        if (sideEffects.prefabCreated) {
            result.prefabCreated = sideEffects.prefabCreated;
        }
        if (sideEffects.errors.length > 0) {
            result.sideEffectErrors = sideEffects.errors;
        }

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
    elementsCreated?: Array<{ prime: number; name: string; layer: string }>;
    prefabCreated?: { id: string; name: string; category: string };
    sideEffectErrors?: string[];
}

function parseInterviewResponse(
    text: string,
    currentPhase: string
): ParsedResponse {
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
                } else if (
                    typeof value === "string" ||
                    typeof value === "number"
                ) {
                    result.tags.push({
                        label: key,
                        value: String(value),
                    });
                } else if (Array.isArray(value)) {
                    result.tags.push({
                        label: key,
                        value: value.join(", "),
                    });
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

    // Clean new_element and new_prefab blocks from the user-visible message
    result.message = result.message
        .replace(/```new_element\n[\s\S]*?\n```/g, "")
        .replace(/```new_prefab\n[\s\S]*?\n```/g, "")
        .trim();

    // Determine if we should suggest next phase
    if (result.topology) {
        result.nextPhase = "masking";
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
        result.nextPhase = "interaction";
    }

    return result;
}

// ─── SERVER-SIDE EXECUTION ──────────────────────────────────────────────────
// Parse Claude's structured blocks and execute DB writes.
// Claude suggests, the server executes. No MCP needed.

interface SideEffectResult {
    elementsCreated: Array<{ prime: number; name: string; layer: string }>;
    prefabCreated: { id: string; name: string; category: string } | null;
    errors: string[];
}

async function executeSideEffects(
    text: string,
    topology: unknown
): Promise<SideEffectResult> {
    const result: SideEffectResult = {
        elementsCreated: [],
        prefabCreated: null,
        errors: [],
    };

    // ── NEW ELEMENTS ─────────────────────────────────────────────────────
    const elementBlocks = [
        ...text.matchAll(/```new_element\n([\s\S]*?)\n```/g),
    ];

    for (const match of elementBlocks) {
        try {
            const elementData = JSON.parse(match[1]);
            const created = await createElementInDB(elementData);
            if (created.error) {
                result.errors.push(created.error);
            } else if (created.element) {
                result.elementsCreated.push(created.element);
            }
        } catch (err) {
            result.errors.push(
                `Failed to parse new_element block: ${err instanceof Error ? err.message : "unknown error"}`
            );
        }
    }

    // ── NEW PREFAB ───────────────────────────────────────────────────────
    const prefabMatch = text.match(/```new_prefab\n([\s\S]*?)\n```/);
    if (prefabMatch && topology) {
        try {
            const prefabData = JSON.parse(prefabMatch[1]);
            const created = await createPrefabInDB(prefabData, topology);
            if (created.error) {
                result.errors.push(created.error);
            } else if (created.prefab) {
                result.prefabCreated = created.prefab;
            }
        } catch (err) {
            result.errors.push(
                `Failed to parse new_prefab block: ${err instanceof Error ? err.message : "unknown error"}`
            );
        }
    }

    return result;
}

// ─── DB OPERATIONS ──────────────────────────────────────────────────────────

async function createElementInDB(data: {
    name?: string;
    layer?: string;
    defaultPhysics?: Record<string, unknown>;
    variants?: Record<string, Record<string, unknown>>;
    renderHint?: string;
    aliases?: string[];
    description?: string;
}): Promise<{
    element?: { prime: number; name: string; layer: string };
    error?: string;
}> {
    const { name, layer, defaultPhysics, variants, renderHint, aliases, description } = data;

    // Validation
    if (!name || !layer) {
        return { error: `Missing required fields for new element: name=${name}, layer=${layer}` };
    }

    if (!["atomic", "molecular", "organism"].includes(layer)) {
        return { error: `Invalid layer "${layer}" for element "${name}"` };
    }

    // Check if element already exists (variant over creation!)
    const existing = getElementByName(name);
    if (existing) {
        return {
            error: `Element "${name}" already exists as prime ${existing.prime}. Use a variant instead.`,
        };
    }

    // Get next available prime
    const prime = getNextPrime();

    try {
        const db = getTurso();

        // Double-check DB for collision (registry might be stale)
        const collision = await db.execute({
            sql: "SELECT prime, name FROM elements WHERE prime = ? OR LOWER(name) = LOWER(?)",
            args: [prime, name],
        });

        if (collision.rows.length > 0) {
            return {
                error: `Collision: prime ${prime} or name "${name}" already exists in DB`,
            };
        }

        const validHints = [
            "container", "text", "action", "input",
            "data", "layout", "temporal", "media",
        ];
        const hint = validHints.includes(renderHint || "")
            ? renderHint
            : "container";

        await db.execute({
            sql: `INSERT INTO elements (prime, name, layer, default_physics, variants, render_hint, aliases, description)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                prime,
                name,
                layer,
                JSON.stringify(defaultPhysics || {}),
                JSON.stringify(variants || {}),
                hint!,
                JSON.stringify(aliases || []),
                description || null,
            ],
        });

        // Refresh the in-memory registry so subsequent lookups see the new element
        const allRows = await db.execute(
            "SELECT * FROM elements ORDER BY prime"
        );
        populateRegistry(allRows.rows as Record<string, unknown>[]);

        console.log(
            `[interview] Created new element: ${name} (prime=${prime}, layer=${layer})`
        );

        return { element: { prime, name, layer } };
    } catch (err) {
        return {
            error: `DB error creating "${name}": ${err instanceof Error ? err.message : "unknown"}`,
        };
    }
}

async function createPrefabInDB(
    data: {
        name?: string;
        category?: string;
        description?: string;
        defaultPhysics?: Record<string, unknown>;
    },
    topology: unknown
): Promise<{
    prefab?: { id: string; name: string; category: string };
    error?: string;
}> {
    const { name, category, description, defaultPhysics } = data;

    if (!name || !category) {
        return { error: `Missing required fields for prefab: name=${name}, category=${category}` };
    }

    const validCategories = [
        "food_service", "healthcare", "retail", "education",
        "saas", "creative", "logistics", "social", "finance", "other",
    ];
    const cat = validCategories.includes(category) ? category : "other";

    const id = `${cat}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    try {
        const db = getTurso();

        // Upsert — allows updating existing prefabs
        await db.execute({
            sql: `INSERT OR REPLACE INTO prefabs (id, name, category, topology, default_physics, description)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                name,
                cat,
                JSON.stringify(topology),
                JSON.stringify(defaultPhysics || {}),
                description || null,
            ],
        });

        console.log(
            `[interview] Created prefab: ${name} (id=${id}, category=${cat})`
        );

        return { prefab: { id, name, category: cat } };
    } catch (err) {
        return {
            error: `DB error creating prefab "${name}": ${err instanceof Error ? err.message : "unknown"}`,
        };
    }
}
