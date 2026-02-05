// ═══════════════════════════════════════════════════════════════════════════
// FACTORIZE — Number → prime factors
// Pure math. No dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import { ALL_PRIMES } from "./primes";

/**
 * Factorizes a number into its prime factors.
 * Uses the Manifold prime table for efficient factorization.
 * 
 * @param n - The number to factorize
 * @returns Array of prime factors in ascending order
 */
export function factorize(n: number): number[] {
    if (n <= 1) return [];

    const factors: number[] = [];
    let remainder = n;

    for (const p of ALL_PRIMES) {
        if (p * p > remainder && remainder > 1) {
            factors.push(remainder);
            break;
        }
        while (remainder % p === 0) {
            factors.push(p);
            remainder /= p;
        }
        if (remainder === 1) break;
    }

    return factors;
}
