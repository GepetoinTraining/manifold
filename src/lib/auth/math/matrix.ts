// ═══════════════════════════════════════════════════════════════════════════
// MATRIX — The Fundamental Matrix M = [[φ, ζ], [ζ, φ]]
// Trajectories are computed via matrix exponentiation.
// Same seed + same math = same trajectory. That's the proof.
// ═══════════════════════════════════════════════════════════════════════════

import { PHI } from "./phi";

export type Matrix2 = [[number, number], [number, number]];

/** Create the fundamental matrix M for a given ζ */
export function createMatrix(zeta: number): Matrix2 {
    return [
        [PHI, zeta],
        [zeta, PHI],
    ];
}

/** 2x2 matrix multiplication */
export function matMul(a: Matrix2, b: Matrix2): Matrix2 {
    return [
        [
            a[0][0] * b[0][0] + a[0][1] * b[1][0],
            a[0][0] * b[0][1] + a[0][1] * b[1][1],
        ],
        [
            a[1][0] * b[0][0] + a[1][1] * b[1][0],
            a[1][0] * b[0][1] + a[1][1] * b[1][1],
        ],
    ];
}

/** Matrix exponentiation by squaring: M^n */
export function matPow(m: Matrix2, n: number): Matrix2 {
    if (n === 0) return [[1, 0], [0, 1]];
    if (n === 1) return m;

    if (n % 2 === 0) {
        const half = matPow(m, n / 2);
        return matMul(half, half);
    }
    return matMul(m, matPow(m, n - 1));
}

/** Eigenvalues of symmetric 2x2 [[a,b],[b,a]]: λ± = a ± b */
export function eigenvalues(m: Matrix2): { plus: number; minus: number } {
    return {
        plus: m[0][0] + m[0][1],
        minus: m[0][0] - m[0][1],
    };
}

/** Compact fingerprint: eigenvalues + trace + determinant at 10dp */
export function matrixFingerprint(m: Matrix2, n: number): string {
    const powered = matPow(m, n);
    const eigen = eigenvalues(powered);
    const trace = powered[0][0] + powered[1][1];
    const det =
        powered[0][0] * powered[1][1] - powered[0][1] * powered[1][0];

    return `${eigen.plus.toFixed(10)}:${eigen.minus.toFixed(10)}:${trace.toFixed(10)}:${det.toFixed(10)}`;
}

/** The authentication trajectory: ζ + challenge n → fingerprint proof */
export function computeTrajectory(zeta: number, n: number): string {
    const M = createMatrix(zeta);
    return matrixFingerprint(M, n);
}
