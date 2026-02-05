// ═══════════════════════════════════════════════════════════════════════════
// DECODE — Prime product → physics/action/emit/component/nav
// ═══════════════════════════════════════════════════════════════════════════

import { factorize } from "./factorize";
import { P, PRIME_AXIS, type Axis } from "./primes";

export interface DecodedPhysics {
    density?: string;
    temperature?: string;
    mass?: number;
    charge?: number;
    friction?: number;
    pressure?: number;
    buoyancy?: number;
    action?: string;
    emit?: string;
    component?: string;
    nav?: string;
}

/**
 * Decodes a prime product into its component physics properties.
 * 
 * @param primeProduct - The product of primes to decode
 * @returns Object containing all decoded physics properties
 */
export function decode(primeProduct: number): DecodedPhysics {
    const factors = factorize(primeProduct);
    const result: DecodedPhysics = {};

    for (const f of factors) {
        const axis = PRIME_AXIS[f];
        if (axis) {
            const value = (P[axis] as Record<number, string | number>)[f];
            (result as Record<string, string | number>)[axis] = value;
        }
    }

    return result;
}
