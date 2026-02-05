// ═══════════════════════════════════════════════════════════════════════════
// ENCODE — Physics properties → prime product
// ═══════════════════════════════════════════════════════════════════════════

import { ENCODE } from "./primes";

export interface PhysicsProperties {
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
 * Encodes physics properties into a prime product.
 * 
 * @param properties - Object containing physics properties to encode
 * @returns The product of all corresponding primes
 */
export function encode(properties: PhysicsProperties): number {
    let product = 1;

    Object.entries(properties).forEach(([axis, value]) => {
        const prime = ENCODE[axis]?.[value];
        if (prime) product *= prime;
    });

    return product;
}
