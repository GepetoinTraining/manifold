// ═══════════════════════════════════════════════════════════════════════════
// TOPOLOGY v1.1 — Types, validation, and utilities
// Now with node IDs, physics parameters, and role masking support
// ═══════════════════════════════════════════════════════════════════════════

import type { UIPhysics } from "./phi";

// ─── NODE TYPES ──────────────────────────────────────────────────────────────

/**
 * A node in the topology UI tree (v1.1 format).
 * Extended with node_id for tap-to-select and physics for direct styling.
 */
export interface TopologyNodeV2 {
    /** Unique node identifier for selection/masking */
    id: string;
    /** Prime product encoding component type and physics */
    prime: number;
    /** Text content (null for containers) */
    text: string | null;
    /** Child nodes */
    children: TopologyNodeV2[];
    /** Action key reference */
    action?: string;
    /** Direct physics overrides (optional, usually derived from prime) */
    physics?: Partial<UIPhysics>;
}

/**
 * Legacy node format (v1) for backward compatibility.
 * Format: [prime_product, text, children, action_key]
 */
export type TopologyNodeV1 = [
    number,          // prime product
    string | null,   // text content
    TopologyNodeV1[], // children
    string | null    // action key
];

/** Union type for both formats */
export type TopologyNode = TopologyNodeV1 | TopologyNodeV2;

// ─── ACTION TYPES ────────────────────────────────────────────────────────────

export interface ActionDef {
    target?: number;    // navigation target (page prime)
    item?: number;      // item index for cart operations
    delta?: string;     // prime product to multiply/divide into seed
    operation?: "multiply" | "divide";
    emit?: {
        url: string;
        method?: string;
        payload?: Record<string, unknown>;
    };
}

// ─── PAGE TYPES ──────────────────────────────────────────────────────────────

export interface Page {
    ui: TopologyNode[];
    /** Optional page-level physics that apply to all children */
    physics?: Partial<UIPhysics>;
}

// ─── ROLE MASKING ────────────────────────────────────────────────────────────

export interface RoleMask {
    /** Role identifier */
    name: string;
    /** Node IDs to hide for this role */
    hiddenNodes: string[];
    /** Optional physics overrides for this role */
    physicsOverrides?: Partial<UIPhysics>;
}

// ─── TOPOLOGY ROOT ───────────────────────────────────────────────────────────

/**
 * Complete topology format (v1.1).
 */
export interface Topology {
    v: 1 | 2;
    /** App name */
    name?: string;
    /** API endpoint for external data */
    api?: string;
    /** Navigation order (page primes) */
    nav: number[];
    /** Pages keyed by page prime */
    pages: Record<number, Page>;
    /** Action definitions */
    actions?: Record<string, ActionDef>;
    /** Role masks (v1.1) */
    roles?: RoleMask[];
    /** Global physics defaults (v1.1) */
    physics?: {
        temperature: number;
        luminosity: number;
        friction: number;
    };
    /** Interview log for pattern DB (v1.1) */
    interviewLog?: InterviewChoice[];
}

// ─── INTERVIEW TYPES ─────────────────────────────────────────────────────────

export interface InterviewChoice {
    phase: "identity" | "audience" | "vibes" | "interaction" | "masking";
    key: string;
    value: unknown;
    timestamp: string;
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

export function isValidTopology(obj: unknown): obj is Topology {
    if (!obj || typeof obj !== "object") return false;

    const t = obj as Record<string, unknown>;

    // Check version
    if (t.v !== 1 && t.v !== 2) return false;

    // Check nav array
    if (!Array.isArray(t.nav) || t.nav.length === 0) return false;
    if (!t.nav.every((n) => typeof n === "number")) return false;

    // Check pages
    if (!t.pages || typeof t.pages !== "object") return false;

    const pages = t.pages as Record<string, unknown>;
    for (const pageKey of Object.keys(pages)) {
        const page = pages[pageKey] as Record<string, unknown>;
        if (!page || typeof page !== "object") return false;
        if (!Array.isArray(page.ui)) return false;

        // Validate UI nodes recursively
        if (!page.ui.every(isValidNode)) return false;
    }

    return true;
}

function isValidNode(node: unknown): boolean {
    // v1 format (array)
    if (Array.isArray(node)) {
        if (node.length < 4) return false;
        const [prime, text, children, actionKey] = node;
        if (typeof prime !== "number") return false;
        if (text !== null && typeof text !== "string") return false;
        if (!Array.isArray(children)) return false;
        if (actionKey !== null && typeof actionKey !== "string") return false;
        return children.every(isValidNode);
    }

    // v2 format (object)
    if (typeof node === "object" && node !== null) {
        const n = node as TopologyNodeV2;
        if (typeof n.id !== "string") return false;
        if (typeof n.prime !== "number") return false;
        if (n.text !== null && typeof n.text !== "string") return false;
        if (!Array.isArray(n.children)) return false;
        return n.children.every(isValidNode);
    }

    return false;
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

/** Check if node is v2 format */
export function isNodeV2(node: TopologyNode): node is TopologyNodeV2 {
    return !Array.isArray(node) && typeof node === "object";
}

/** Convert v1 node to v2 format */
export function nodeToV2(node: TopologyNodeV1, parentId: string = "root", index: number = 0): TopologyNodeV2 {
    const id = `${parentId}.${index}`;
    return {
        id,
        prime: node[0],
        text: node[1],
        children: node[2].map((child, i) => nodeToV2(child, id, i)),
        action: node[3] ?? undefined,
    };
}

/** Extract all node IDs from a topology */
export function extractNodeIds(topology: Topology): string[] {
    const ids: string[] = [];

    const collectFromNode = (node: TopologyNode, parentId: string, index: number) => {
        if (isNodeV2(node)) {
            ids.push(node.id);
            node.children.forEach((child, i) => collectFromNode(child, node.id, i));
        } else {
            const id = `${parentId}.${index}`;
            ids.push(id);
            node[2].forEach((child, i) => collectFromNode(child, id, i));
        }
    };

    Object.entries(topology.pages).forEach(([pageKey, page]) => {
        page.ui.forEach((node, i) => collectFromNode(node, `page.${pageKey}`, i));
    });

    return ids;
}

/** Extract all unique primes from a topology */
export function extractPrimes(topology: Topology): Set<number> {
    const primes = new Set<number>();

    const collectFromNode = (node: TopologyNode) => {
        if (isNodeV2(node)) {
            primes.add(node.prime);
            node.children.forEach(collectFromNode);
        } else {
            primes.add(node[0]);
            node[2].forEach(collectFromNode);
        }
    };

    Object.values(topology.pages).forEach((page) => {
        page.ui.forEach(collectFromNode);
    });

    return primes;
}

/** Calculate topology payload size */
export function getTopologySize(topology: Topology): {
    totalBytes: number;
    primeBits: number;
    primeCount: number;
    pageCount: number;
    nodeCount: number;
} {
    const primes = extractPrimes(topology);
    const nodeIds = extractNodeIds(topology);
    const topologyStr = JSON.stringify(topology);
    const totalBytes = new TextEncoder().encode(topologyStr).length;
    const primeBits = [...primes].reduce((s, p) => s + Math.ceil(Math.log2(p + 1)), 0);

    return {
        totalBytes,
        primeBits,
        primeCount: primes.size,
        pageCount: Object.keys(topology.pages).length,
        nodeCount: nodeIds.length,
    };
}
