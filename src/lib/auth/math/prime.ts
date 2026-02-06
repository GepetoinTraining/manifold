// ═══════════════════════════════════════════════════════════════════════════
// PRIME — Factorization of enrollment moments
// Breaking spacetime coordinates into irreducible components
// ═══════════════════════════════════════════════════════════════════════════

export function isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;

    const sqrt = BigInt(Math.floor(Math.sqrt(Number(n)))) + 1n;
    for (let i = 3n; i <= sqrt; i += 2n) {
        if (n % i === 0n) return false;
    }
    return true;
}

/** Prime factorization — returns factors with repetition */
export function primeFactorize(n: bigint): bigint[] {
    if (n <= 1n) return [];

    const factors: bigint[] = [];
    let remaining = n;

    while (remaining % 2n === 0n) {
        factors.push(2n);
        remaining /= 2n;
    }

    let i = 3n;
    while (i * i <= remaining) {
        while (remaining % i === 0n) {
            factors.push(i);
            remaining /= i;
        }
        i += 2n;
    }

    if (remaining > 2n) {
        factors.push(remaining);
    }

    return factors;
}

/** Unique prime factors only */
export function uniquePrimeFactors(n: bigint): bigint[] {
    return [...new Set(primeFactorize(n))];
}

/**
 * Create seed from enrollment moment.
 * Concatenates timestamp + abs(lat*1e6) + abs(lon*1e6) → BigInt
 */
export function createSeedNumber(
    datetime: Date | number,
    geo: { lat: number; lon: number }
): bigint {
    const ts = datetime instanceof Date ? datetime.getTime() : datetime;
    const lat = Math.abs(Math.round(geo.lat * 1e6));
    const lon = Math.abs(Math.round(geo.lon * 1e6));
    const seedStr = `${ts}${lat}${lon}`;
    return BigInt(seedStr);
}

/** Full pipeline: datetime + geo → prime factors */
export function momentToPrimes(
    datetime: Date | number,
    geo: { lat: number; lon: number }
): bigint[] {
    const seedNumber = createSeedNumber(datetime, geo);
    return primeFactorize(seedNumber);
}
