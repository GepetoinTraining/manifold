// ═══════════════════════════════════════════════════════════════════════════
// CACHE — Dedekind lattice cache with IndexedDB persistence
// Learns through use. Gets faster over time.
// ═══════════════════════════════════════════════════════════════════════════

import { openDB, type IDBPDatabase } from "idb";
import { decode, type DecodedPhysics } from "./decode";
import { phi, type UIPhysics } from "./phi";
import type { CSSProperties } from "react";

export interface ResolvedPrime {
    css: CSSProperties;
    physics: UIPhysics;
    actions: string[];
    emits: string[];
    componentType: string | null;
    navOrder: string | null;
    prime: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

// In-memory cache
const CACHE = new Map<number, ResolvedPrime>();
const STATS: CacheStats = { hits: 0, misses: 0, size: 0 };

// IndexedDB instance
let db: IDBPDatabase | null = null;
const DB_NAME = "manifold-cache";
const STORE_NAME = "primes";

/**
 * Initialize the IndexedDB cache.
 */
async function initDB(): Promise<IDBPDatabase> {
    if (db) return db;

    db = await openDB(DB_NAME, 1, {
        upgrade(database) {
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "prime" });
            }
        },
    });

    return db;
}

/**
 * Load cached primes from IndexedDB into memory.
 */
export async function loadCache(): Promise<void> {
    try {
        const database = await initDB();
        const all = await database.getAll(STORE_NAME);
        for (const item of all) {
            CACHE.set(item.prime, item);
        }
        STATS.size = CACHE.size;
    } catch {
        // IndexedDB not available (SSR or private browsing)
    }
}

/**
 * Save a resolved prime to IndexedDB.
 */
async function saveToIndexedDB(resolved: ResolvedPrime): Promise<void> {
    try {
        const database = await initDB();
        await database.put(STORE_NAME, resolved);
    } catch {
        // IndexedDB not available
    }
}

/**
 * Resolve a prime product into its complete visual properties.
 * Uses cache for performance, stores new resolutions.
 * 
 * @param prime - The prime product to resolve
 * @returns Complete resolved prime with CSS, physics, actions, etc.
 */
export function resolve(prime: number): ResolvedPrime {
    // Check memory cache
    if (CACHE.has(prime)) {
        STATS.hits++;
        return CACHE.get(prime)!;
    }

    STATS.misses++;

    // Decode and resolve
    const decoded = decode(prime);
    const uiPhysics: UIPhysics = {};
    const actions: string[] = [];
    const emits: string[] = [];
    let componentType: string | null = null;
    let navOrder: string | null = null;

    Object.entries(decoded).forEach(([axis, val]) => {
        if (axis === "action") actions.push(val as string);
        else if (axis === "emit") emits.push(val as string);
        else if (axis === "component") componentType = val as string;
        else if (axis === "nav") navOrder = val as string;
        else (uiPhysics as Record<string, unknown>)[axis] = val;
    });

    const result: ResolvedPrime = {
        css: phi(uiPhysics),
        physics: uiPhysics,
        actions,
        emits,
        componentType,
        navOrder,
        prime,
    };

    // Store in memory cache
    CACHE.set(prime, result);
    STATS.size = CACHE.size;

    // Persist to IndexedDB (fire and forget)
    saveToIndexedDB(result);

    return result;
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): CacheStats {
    return { ...STATS, size: CACHE.size };
}

/**
 * Clear all caches.
 */
export async function clearCache(): Promise<void> {
    CACHE.clear();
    STATS.hits = 0;
    STATS.misses = 0;
    STATS.size = 0;

    try {
        const database = await initDB();
        await database.clear(STORE_NAME);
    } catch {
        // IndexedDB not available
    }
}
