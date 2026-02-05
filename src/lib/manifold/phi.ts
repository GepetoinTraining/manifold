// ═══════════════════════════════════════════════════════════════════════════
// Φ (PHI) TENSOR — Physics → CSS. Deterministic. Pure.
// The actualization function that transforms physics into visual properties.
// v1.1: Enhanced with PHI-based density derivation and full physics mapping
// ═══════════════════════════════════════════════════════════════════════════

import type { CSSProperties } from "react";

// ─── PHI CONSTANTS ───────────────────────────────────────────────────────────
export const PHI = 1.618033988749895;
export const PHI_INV = 0.618033988749895;
export const PHI_SQ = PHI * PHI;           // 2.618...
export const PHI_INV_SQ = PHI_INV * PHI_INV; // 0.382...

// ─── PHYSICS INTERFACE ───────────────────────────────────────────────────────
export interface UIPhysics {
    mass?: number;        // 0-1: affects shadow depth, font weight, z-index
    density?: number;     // 0-1: derived from mass, affects opacity/packing
    temperature?: number; // 0-1: affects color warmth (cool↔warm)
    luminosity?: number;  // 0-1: affects lightness (dark↔light)
    charge?: number;      // 0-1: affects padding, gap (big targets = high charge)
    friction?: number;    // 0-1: affects border-radius (low=rounded, high=sharp)
    pressure?: number;    // 0-1: affects width, flex-grow
    buoyancy?: number;    // -1 to 1: affects flex-direction
}

// ─── DENSITY STATE (derived from mass) ───────────────────────────────────────
export type DensityState = "void" | "gas" | "liquid" | "solid" | "dense";

export function deriveDensity(mass: number): DensityState {
    if (mass < PHI_INV_SQ) return "void";     // < 0.382
    if (mass < PHI_INV) return "gas";          // < 0.618
    if (mass < 0.5) return "liquid";           // < 0.5
    if (mass < PHI_INV * PHI) return "solid";  // < 1.0
    return "dense";
}

// ─── TEMPERATURE → HSL COLOR ─────────────────────────────────────────────────
// Maps temperature (0-1) to hue: cool=200° (blue-ish) → warm=45° (gold)
// Luminosity affects lightness
function temperatureToHSL(temp: number, lum: number): string {
    // Hue: interpolate from cool (200) to warm (45)
    const hue = 200 - temp * 155; // 200→45
    // Saturation: higher for warm colors
    const saturation = 40 + temp * 30; // 40%→70%
    // Lightness: based on luminosity
    const lightness = 20 + lum * 50; // 20%→70%
    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

// Gold accent (for highlights)
function goldFromTemperature(temp: number): string {
    // More saturated gold for warmer temps
    const saturation = 60 + temp * 20;
    return `hsl(45, ${Math.round(saturation)}%, ${45 + temp * 10}%)`;
}

// ─── DENSITY STATE → BACKGROUND STYLES ───────────────────────────────────────
function densityToBackground(state: DensityState, temp: number, lum: number): Partial<CSSProperties> {
    const baseColor = temperatureToHSL(temp, lum);

    switch (state) {
        case "void":
            return {
                background: "transparent",
                border: "1px dashed rgba(200,190,170,0.12)",
            };
        case "gas":
            return {
                background: `color-mix(in srgb, ${baseColor} 4%, transparent)`,
                border: "1px solid rgba(200,190,170,0.08)",
            };
        case "liquid":
            return {
                background: `color-mix(in srgb, ${baseColor} 10%, transparent)`,
                border: "1px solid rgba(200,190,170,0.14)",
            };
        case "solid":
            return {
                background: `color-mix(in srgb, ${baseColor} 20%, transparent)`,
                border: "1px solid rgba(200,190,170,0.2)",
            };
        case "dense":
            return {
                background: `color-mix(in srgb, ${baseColor} 35%, transparent)`,
                border: "1px solid rgba(200,190,170,0.28)",
            };
    }
}

// ─── FRICTION → BORDER RADIUS ────────────────────────────────────────────────
// Low friction = rounded (soft, friendly)
// High friction = sharp (professional, precise)
function frictionToBorderRadius(friction: number): string {
    const maxRadius = 24;
    const radius = maxRadius * (1 - friction); // Inverted: low friction = high radius
    return `${Math.round(radius)}px`;
}

// ─── MASS → SHADOW ───────────────────────────────────────────────────────────
function massToShadow(mass: number, temp: number): string {
    if (mass <= 0) {
        // Negative mass = glow effect
        const glowIntensity = Math.abs(mass);
        const glowColor = goldFromTemperature(temp);
        return `0 0 ${Math.round(glowIntensity * 30)}px ${glowColor}`;
    }

    // Positive mass = drop shadow
    const y = Math.round(mass * 20);
    const blur = Math.round(mass * 40);
    const spread = Math.round(mass * 2);
    return `0 ${y}px ${blur}px ${spread}px rgba(0,0,0,${0.1 + mass * 0.15})`;
}

// ─── CHARGE → SPACING ────────────────────────────────────────────────────────
function chargeToSpacing(charge: number): { padding: string; gap: string } {
    const base = 8;
    const scale = 32;
    const spacing = base + charge * scale;
    return {
        padding: `${Math.round(spacing)}px`,
        gap: `${Math.round(spacing * 0.75)}px`,
    };
}

// ─── PRESSURE → WIDTH/FLEX ───────────────────────────────────────────────────
function pressureToFlex(pressure: number): Partial<CSSProperties> {
    return {
        flexGrow: pressure,
        flexShrink: 1 - pressure * 0.5,
        flexBasis: pressure > 0.5 ? "auto" : "0",
    };
}

// ─── BUOYANCY → DIRECTION ────────────────────────────────────────────────────
function buoyancyToDirection(buoyancy: number): "row" | "column" | "row-reverse" | "column-reverse" {
    if (buoyancy > 0.3) return "column";
    if (buoyancy < -0.3) return "row";
    if (buoyancy > 0) return "column";
    return "row";
}

// ═══════════════════════════════════════════════════════════════════════════
// Φ TENSOR — The Actualization Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Φ - The actualization function.
 * Transforms physics properties into CSS properties.
 * Deterministic and pure - same input always produces same output.
 *
 * @param physics - The UI physics to transform
 * @returns CSS properties object for React styling
 */
export function phi(physics: UIPhysics): CSSProperties {
    const css: CSSProperties = {};

    // Defaults
    const mass = physics.mass ?? 0.5;
    const temp = physics.temperature ?? 0.6; // Default warm
    const lum = physics.luminosity ?? 0.3;   // Default darker
    const charge = physics.charge ?? 0.3;
    const friction = physics.friction ?? 0.3;
    const pressure = physics.pressure ?? 0.5;
    const buoyancy = physics.buoyancy ?? 0.5;

    // ─── DENSITY (derived from mass) ───────────────────────────────────────────
    const densityState = deriveDensity(mass);
    Object.assign(css, densityToBackground(densityState, temp, lum));

    // ─── MASS → SHADOW + Z-INDEX ───────────────────────────────────────────────
    css.boxShadow = massToShadow(mass, temp);
    css.zIndex = Math.floor(mass * 10);

    // ─── TEMPERATURE → BORDER COLOR ────────────────────────────────────────────
    css.borderColor = goldFromTemperature(temp);

    // ─── FRICTION → BORDER RADIUS ──────────────────────────────────────────────
    css.borderRadius = frictionToBorderRadius(friction);

    // ─── CHARGE → PADDING/GAP ──────────────────────────────────────────────────
    const spacing = chargeToSpacing(charge);
    css.padding = spacing.padding;
    css.gap = spacing.gap;

    // ─── PRESSURE → FLEX PROPERTIES ────────────────────────────────────────────
    Object.assign(css, pressureToFlex(pressure));

    // ─── BUOYANCY → FLEX DIRECTION ─────────────────────────────────────────────
    css.flexDirection = buoyancyToDirection(buoyancy);
    css.display = "flex";

    // ─── TRANSITIONS ───────────────────────────────────────────────────────────
    css.transition = `all ${0.15 + friction * 0.15}s ease`;

    // ─── VOID DENSITY SPECIAL HANDLING ─────────────────────────────────────────
    if (densityState === "void") {
        css.flexGrow = 1;
        css.flexShrink = 1;
        css.minHeight = 0;
        css.width = "100%";
    }

    return css;
}

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS PHYSICS — For the precipitation container
// ═══════════════════════════════════════════════════════════════════════════

export function canvasStyles(): CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        background: "#0f0e0c",
        padding: "16px",
        gap: "12px",
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PHYSICS — Font sizing from mass
// ═══════════════════════════════════════════════════════════════════════════

export function textStyles(mass: number, isHeading: boolean = false): CSSProperties {
    const baseSize = isHeading ? 18 : 13;
    const sizeScale = isHeading ? 12 : 4;
    const weightBase = isHeading ? 500 : 400;
    const weightScale = isHeading ? 200 : 100;

    return {
        fontSize: `${baseSize + mass * sizeScale}px`,
        fontWeight: weightBase + Math.floor(mass * weightScale),
        lineHeight: 1.5,
        color: "#e8e0d0",
    };
}
