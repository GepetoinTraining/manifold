// ═══════════════════════════════════════════════════════════════════════════
// ELEMENT REGISTRY — The Periodic Table, queryable
//
// Server-side: reads from Turso
// Client-side: fetched once, cached in memory
// Claude API: reads to check existing, writes to create new
// ═══════════════════════════════════════════════════════════════════════════

import type { UIPhysics } from "./phi";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type RenderHint =
    | "container"
    | "text"
    | "action"
    | "input"
    | "data"
    | "layout"
    | "temporal"
    | "media";

export type ElementLayer = "atomic" | "molecular" | "organism";

export interface ElementDef {
    prime: number;
    name: string;
    layer: ElementLayer;
    defaultPhysics: Partial<UIPhysics>;
    variants: Record<string, Partial<UIPhysics>>;
    renderHint: RenderHint;
    aliases: string[];
    description: string | null;
}

// ─── REGISTRY CACHE ─────────────────────────────────────────────────────────
// In-memory cache — populated on first access, lives for session duration

let _byPrime: Map<number, ElementDef> | null = null;
let _byName: Map<string, ElementDef> | null = null;

/**
 * Parse a raw DB row into an ElementDef
 */
function parseRow(row: Record<string, unknown>): ElementDef {
    return {
        prime: row.prime as number,
        name: row.name as string,
        layer: row.layer as ElementLayer,
        defaultPhysics: JSON.parse((row.default_physics as string) || "{}"),
        variants: JSON.parse((row.variants as string) || "{}"),
        renderHint: (row.render_hint as RenderHint) || "container",
        aliases: JSON.parse((row.aliases as string) || "[]"),
        description: (row.description as string) || null,
    };
}

/**
 * Populate the registry from raw rows (fetched from API or DB)
 */
export function populateRegistry(rows: Record<string, unknown>[]): void {
    _byPrime = new Map();
    _byName = new Map();

    for (const row of rows) {
        const def = parseRow(row);
        _byPrime.set(def.prime, def);
        _byName.set(def.name.toLowerCase(), def);
        // Also index aliases
        for (const alias of def.aliases) {
            _byName.set(alias.toLowerCase(), def);
        }
    }
}

/**
 * Check if registry is loaded
 */
export function isRegistryLoaded(): boolean {
    return _byPrime !== null;
}

/**
 * Get element by prime number
 */
export function getElement(prime: number): ElementDef | null {
    return _byPrime?.get(prime) ?? null;
}

/**
 * Get element by name (case-insensitive, also checks aliases)
 */
export function getElementByName(name: string): ElementDef | null {
    return _byName?.get(name.toLowerCase()) ?? null;
}

/**
 * Get all registered elements
 */
export function getAllElements(): ElementDef[] {
    if (!_byPrime) return [];
    return Array.from(_byPrime.values());
}

/**
 * Get elements by layer
 */
export function getElementsByLayer(layer: ElementLayer): ElementDef[] {
    return getAllElements().filter((e) => e.layer === layer);
}

// ─── PHYSICS RESOLUTION ─────────────────────────────────────────────────────

/**
 * Resolve physics for a component prime with optional variant and overrides.
 *
 * Priority chain:
 *   1. Direct overrides (from topology node)
 *   2. Variant physics (from element definition)
 *   3. Default physics (from element definition)
 *   4. Φ tensor defaults (handled by phi.ts)
 *
 * @param prime - The component prime
 * @param variant - Optional variant name (e.g., "primary", "ghost", "danger")
 * @param overrides - Optional direct physics overrides from topology node
 * @returns Merged UIPhysics ready for the Φ tensor
 */
export function resolvePhysics(
    prime: number,
    variant?: string,
    overrides?: Partial<UIPhysics>
): Partial<UIPhysics> {
    const element = getElement(prime);
    if (!element) {
        // Unknown element — return overrides only, Φ will use its defaults
        return overrides ?? {};
    }

    // Start with element defaults
    const base = { ...element.defaultPhysics };

    // Layer on variant if specified
    if (variant && element.variants[variant]) {
        Object.assign(base, element.variants[variant]);
    }

    // Layer on direct overrides
    if (overrides) {
        Object.assign(base, overrides);
    }

    return base;
}

/**
 * Get the render hint for a component prime
 */
export function getRenderHint(prime: number): RenderHint {
    return getElement(prime)?.renderHint ?? "container";
}

/**
 * Find the best matching element for a natural language description.
 * Used by Claude to check if an element already exists before creating new.
 *
 * Returns candidates sorted by relevance (exact name > alias > description match)
 */
export function findElement(query: string): ElementDef[] {
    const q = query.toLowerCase().trim();
    const results: Array<{ def: ElementDef; score: number }> = [];

    for (const def of getAllElements()) {
        let score = 0;

        // Exact name match
        if (def.name.toLowerCase() === q) {
            score = 100;
        }
        // Name contains query
        else if (def.name.toLowerCase().includes(q)) {
            score = 80;
        }
        // Alias exact match
        else if (def.aliases.some((a) => a.toLowerCase() === q)) {
            score = 90;
        }
        // Alias contains query
        else if (def.aliases.some((a) => a.toLowerCase().includes(q))) {
            score = 70;
        }
        // Description contains query
        else if (def.description?.toLowerCase().includes(q)) {
            score = 50;
        }

        if (score > 0) {
            results.push({ def, score });
        }
    }

    return results.sort((a, b) => b.score - a.score).map((r) => r.def);
}

/**
 * Get the next available prime for a new element.
 * Scans existing primes and returns the next prime number after the highest.
 */
export function getNextPrime(): number {
    if (!_byPrime || _byPrime.size === 0) return 691; // fallback

    const maxPrime = Math.max(..._byPrime.keys());

    // Simple prime finder starting from maxPrime + 1
    let candidate = maxPrime + 1;
    while (!isPrime(candidate)) {
        candidate++;
    }
    return candidate;
}

function isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}
