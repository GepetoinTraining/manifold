// ═══════════════════════════════════════════════════════════════════════════
// PARSER — Extract topology JSON from Claude response
// ═══════════════════════════════════════════════════════════════════════════

import { isValidTopology, type Topology } from "@/lib/manifold/topology";

/**
 * Extract topology JSON from Claude's response text.
 * Handles both markdown code blocks and raw JSON.
 * 
 * @param text - Claude's response text
 * @returns Extracted topology or null if not found/invalid
 */
export function extractTopology(text: string): Topology | null {
    // Try markdown code block first
    const codeBlockMatch = text.match(/```(?:json)?\\s*([\\s\\S]*?)```/);
    if (codeBlockMatch) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1].trim());
            if (isValidTopology(parsed)) {
                return parsed;
            }
        } catch {
            // Not valid JSON in code block
        }
    }

    // Try raw JSON object
    const jsonMatch = text.match(/(\\{[\\s\\S]*"v"\\s*:\\s*1[\\s\\S]*\\})/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            if (isValidTopology(parsed)) {
                return parsed;
            }
        } catch {
            // Not valid JSON
        }
    }

    return null;
}

/**
 * Check if text contains a valid topology.
 */
export function hasTopology(text: string): boolean {
    return extractTopology(text) !== null;
}
