// ═══════════════════════════════════════════════════════════════════════════
// PHI CONSTANTS — The mathematical foundation
// ═══════════════════════════════════════════════════════════════════════════

/** The golden ratio */
export const PHI = 1.618033988749895;

/** Inverse of the golden ratio (1/φ) */
export const PHI_INV = 0.618033988749895;

/** φ² — used for density thresholds */
export const PHI_SQ = PHI * PHI; // 2.618...

/** (1/φ)² — void threshold */
export const PHI_INV_SQ = PHI_INV * PHI_INV; // 0.382...

/** π — for circular calculations */
export const PI = Math.PI;

/** Euler's number */
export const E = Math.E;

// ─── SPACING SCALE (φ-based) ─────────────────────────────────────────────────
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 13, // ~8 * φ
    lg: 21, // ~13 * φ
    xl: 34, // Fibonacci
    xxl: 55, // Fibonacci
} as const;

// ─── TYPOGRAPHY SCALE (φ-based) ──────────────────────────────────────────────
export const TYPE_SCALE = {
    xs: 11,
    sm: 13,
    base: 16,
    lg: 21,   // ~16 * 1.3
    xl: 26,   // ~16 * φ
    xxl: 34,  // ~26 * 1.3
    xxxl: 42, // ~34 * 1.25
} as const;

// ─── TIMING SCALE (φ-based) ──────────────────────────────────────────────────
export const TIMING = {
    instant: 0.1,
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    glacial: 0.65, // ~0.4 * φ
} as const;

// ─── COLOR CONSTANTS ─────────────────────────────────────────────────────────
export const COLORS = {
    // Manifold brand
    gold: "#c9a227",
    charcoal: "#0f0e0c",
    paper: "#e8e0d0",

    // Neutrals
    muted: "#8a8070",
    subtle: "rgba(200,190,170,0.12)",

    // States
    success: "#5a9a3a",
    warning: "#d4842a",
    error: "#c44a2f",
    info: "#6b8fa3",
} as const;
