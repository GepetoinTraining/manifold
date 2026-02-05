// ═══════════════════════════════════════════════════════════════════════════
// TOPOLOGY — TypeScript types and validation for topology format
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A node in the topology UI tree.
 * Format: [prime_product, text, children, action_key]
 */
export type TopologyNode = [
    number,        // prime product
    string | null, // text content
    TopologyNode[], // children
    string | null  // action key
];

/**
 * Action definition for a topology.
 */
export interface ActionDef {
    target?: number;  // navigation target (page prime)
    item?: number;    // item index for cart operations
    emit?: {
        url: string;
        method?: string;
    };
}

/**
 * A single page in the topology.
 */
export interface Page {
    ui: TopologyNode[];
}

/**
 * Complete topology format (v1).
 */
export interface Topology {
    v: 1;
    api?: string;
    nav: number[];
    pages: Record<number, Page>;
    actions?: Record<string, ActionDef>;
}

/**
 * Validates if an object is a valid Topology.
 * 
 * @param obj - Object to validate
 * @returns Type predicate indicating if obj is a valid Topology
 */
export function isValidTopology(obj: unknown): obj is Topology {
    if (!obj || typeof obj !== "object") return false;

    const t = obj as Record<string, unknown>;

    // Check version
    if (t.v !== 1) return false;

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

    // Check actions (optional)
    if (t.actions !== undefined) {
        if (typeof t.actions !== "object") return false;
    }

    return true;
}

/**
 * Validates if an array is a valid TopologyNode.
 */
function isValidNode(node: unknown): boolean {
    if (!Array.isArray(node)) return false;
    if (node.length < 4) return false;

    const [prime, text, children, actionKey] = node;

    if (typeof prime !== "number") return false;
    if (text !== null && typeof text !== "string") return false;
    if (!Array.isArray(children)) return false;
    if (actionKey !== null && typeof actionKey !== "string") return false;

    // Recursively validate children
    return children.every(isValidNode);
}

/**
 * Extract all unique primes from a topology.
 */
export function extractPrimes(topology: Topology): Set<number> {
    const primes = new Set<number>();

    const collectFromNode = (node: TopologyNode) => {
        primes.add(node[0]);
        node[2].forEach(collectFromNode);
    };

    Object.values(topology.pages).forEach((page) => {
        page.ui.forEach(collectFromNode);
    });

    return primes;
}

/**
 * Calculate topology payload size.
 */
export function getTopologySize(topology: Topology): {
    totalBytes: number;
    primeBits: number;
    primeCount: number;
    pageCount: number;
} {
    const primes = extractPrimes(topology);
    const topologyStr = JSON.stringify(topology);
    const totalBytes = new TextEncoder().encode(topologyStr).length;
    const primeBits = [...primes].reduce((s, p) => s + Math.ceil(Math.log2(p + 1)), 0);

    return {
        totalBytes,
        primeBits,
        primeCount: primes.size,
        pageCount: Object.keys(topology.pages).length,
    };
}
