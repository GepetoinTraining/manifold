// ═══════════════════════════════════════════════════════════════════════════
// PHI — The Golden Ratio and Fibonacci
// φ = (1 + √5) / 2 ≈ 1.618034
// ═══════════════════════════════════════════════════════════════════════════

export const PHI = (1 + Math.sqrt(5)) / 2;
export const PSI = (1 - Math.sqrt(5)) / 2;

/** Standard Fibonacci sequence */
export function fibonacci(n: number): bigint {
    if (n <= 0) return 0n;
    if (n === 1 || n === 2) return 1n;

    let a = 1n,
        b = 1n;
    for (let i = 3; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

/**
 * Seeded Fibonacci — YOUR sequence.
 * The primes from your enrollment moment determine your path.
 */
export function seededFibonacci(n: number, primes: bigint[]): bigint {
    if (n <= 0) return 0n;
    if (primes.length < 2) throw new Error("Need at least 2 primes");

    const f1 = primes[0];
    const f2 = primes[1];

    const mod =
        primes.length > 2
            ? primes.slice(2).reduce((a, b) => a * b, 1n)
            : primes[0] * primes[1];

    if (n === 1) return f1 % mod;
    if (n === 2) return f2 % mod;

    let a = f1 % mod;
    let b = f2 % mod;

    for (let i = 3; i <= n; i++) {
        [a, b] = [b, (a + b) % mod];
    }
    return b;
}

/** Universal ζ = Σ 1/F_k² (standard Fibonacci) */
export function computeZeta(terms: number = 50): number {
    let sum = 0;
    for (let k = 1; k <= terms; k++) {
        const fk = Number(fibonacci(k));
        if (fk === 0) continue;
        sum += 1 / (fk * fk);
    }
    return sum;
}

/** YOUR ζ from your prime seed */
export function computeSeededZeta(
    primes: bigint[],
    terms: number = 30
): number {
    let sum = 0;
    for (let k = 1; k <= terms; k++) {
        const fk = Number(seededFibonacci(k, primes));
        if (fk === 0) continue;
        sum += 1 / (fk * fk);
    }
    return sum;
}

export const ZETA = computeZeta(50);
export const PHI_PLUS_ZETA = PHI + ZETA; // ≈ π
