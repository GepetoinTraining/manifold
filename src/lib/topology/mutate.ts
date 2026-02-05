// ═══════════════════════════════════════════════════════════════════════════
// MUTATE — Seed delta operations (BigInt)
// State = seed. Actions = multiply/divide primes.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Multiply a prime product into the seed.
 * Represents: work added (order placed, task created, etc.)
 */
export function multiplySeed(seed: bigint, delta: bigint): bigint {
    return seed * delta;
}

/**
 * Divide a prime product out of the seed.
 * Represents: work completed (order fulfilled, task done, etc.)
 * Returns the original seed if division is not exact.
 */
export function divideSeed(seed: bigint, delta: bigint): bigint {
    if (delta === 0n) return seed;
    if (seed % delta !== 0n) {
        console.warn("Seed division not exact:", { seed: seed.toString(), delta: delta.toString() });
        return seed;
    }
    return seed / delta;
}

/**
 * Apply a delta operation to a seed.
 */
export function applyDelta(
    seed: bigint,
    delta: bigint,
    operation: "multiply" | "divide"
): bigint {
    return operation === "multiply"
        ? multiplySeed(seed, delta)
        : divideSeed(seed, delta);
}

/**
 * Parse a seed string to BigInt.
 */
export function parseSeed(seedStr: string): bigint {
    try {
        return BigInt(seedStr);
    } catch {
        console.error("Invalid seed string:", seedStr);
        return 1n;
    }
}

/**
 * Stringify a seed BigInt.
 */
export function stringifySeed(seed: bigint): string {
    return seed.toString();
}

/**
 * Check if a prime is present in the seed (has been multiplied in).
 */
export function hasPrime(seed: bigint, prime: bigint): boolean {
    if (prime === 0n || prime === 1n) return false;
    return seed % prime === 0n;
}

/**
 * Count how many times a prime appears in the seed.
 * Useful for counting orders, items, etc.
 */
export function countPrime(seed: bigint, prime: bigint): number {
    if (prime === 0n || prime === 1n) return 0;

    let count = 0;
    let current = seed;

    while (current % prime === 0n) {
        count++;
        current = current / prime;
    }

    return count;
}

/**
 * Extract all primes from a seed (factorize BigInt).
 * Returns array of [prime, count] pairs.
 */
export function factorizeSeed(seed: bigint): Array<[bigint, number]> {
    const factors: Array<[bigint, number]> = [];

    if (seed <= 1n) return factors;

    let current = seed;
    let divisor = 2n;

    while (divisor * divisor <= current) {
        if (current % divisor === 0n) {
            let count = 0;
            while (current % divisor === 0n) {
                count++;
                current = current / divisor;
            }
            factors.push([divisor, count]);
        }
        divisor++;
    }

    if (current > 1n) {
        factors.push([current, 1]);
    }

    return factors;
}

/**
 * Create a delta from a list of primes.
 */
export function createDelta(primes: bigint[]): bigint {
    return primes.reduce((product, prime) => product * prime, 1n);
}

/**
 * Check if seed is at rest (equals 1).
 * Business day closed = seed returns to 1.
 */
export function isAtRest(seed: bigint): boolean {
    return seed === 1n;
}

// ─── DELTA LOG TYPES ─────────────────────────────────────────────────────────

export interface Delta {
    delta: string;          // BigInt as string
    operation: "multiply" | "divide";
    role?: string;
    device?: string;
    timestamp: string;
}

export interface SeedState {
    instanceId: string;
    appId: string;
    currentSeed: string;   // BigInt as string
    updatedAt: string;
}
