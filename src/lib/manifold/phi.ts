// ═══════════════════════════════════════════════════════════════════════════
// Φ (PHI) — Physics → CSS. Deterministic. Pure.
// The actualization function that transforms physics into visual properties.
// ═══════════════════════════════════════════════════════════════════════════

import type { CSSProperties } from "react";

export interface UIPhysics {
    density?: string;
    temperature?: string;
    mass?: number;
    charge?: number;
    friction?: number;
    pressure?: number;
    buoyancy?: number;
}

const DENSITY_STYLES: Record<string, Partial<CSSProperties>> = {
    void: { background: "transparent", border: "1px dashed rgba(200,190,170,0.12)" },
    gas: { background: "rgba(200,190,170,0.04)", border: "1px solid rgba(200,190,170,0.08)" },
    liquid: { background: "rgba(200,190,170,0.07)", border: "1px solid rgba(200,190,170,0.14)" },
    solid: { background: "rgba(200,190,170,0.1)", border: "1px solid rgba(200,190,170,0.2)" },
    dense: { background: "rgba(200,190,170,0.15)", border: "1px solid rgba(200,190,170,0.28)" },
};

const TEMP_COLORS: Record<string, string> = {
    void: "#64748b",
    cold: "#6b8fa3",
    warm: "#c9a227",
    hot: "#d4842a",
    critical: "#c44a2f",
    fusion: "#9b6dd7",
};

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

    // Mass affects shadow and z-index
    if (physics.mass !== undefined) {
        if (physics.mass >= 0) {
            css.boxShadow = `0 ${Math.floor(physics.mass * 20)}px ${Math.floor(physics.mass * 40)}px rgba(0,0,0,0.25)`;
            css.zIndex = Math.floor(physics.mass * 10);
        } else {
            css.boxShadow = `0 0 ${Math.abs(physics.mass) * 30}px rgba(200,160,60,0.4)`;
            css.transform = `translateY(${physics.mass * 10}px)`;
        }
    }

    // Density affects background and border
    Object.assign(css, DENSITY_STYLES[physics.density || ""] || DENSITY_STYLES.liquid);

    // Temperature affects border color
    css.borderColor = TEMP_COLORS[physics.temperature || ""] || TEMP_COLORS.warm;

    // Charge affects padding and gap
    if (physics.charge !== undefined) {
        const s = 8 + physics.charge * 24;
        css.padding = `${s}px`;
        css.gap = `${s}px`;
    }

    // Friction affects transition duration
    if (physics.friction !== undefined) {
        css.transition = `all ${0.1 + physics.friction * 0.3}s ease`;
    }

    // Pressure affects flex grow
    if (physics.pressure !== undefined) {
        css.flexGrow = physics.pressure;
    }

    // Buoyancy affects flex direction
    if (physics.buoyancy !== undefined) {
        css.flexDirection = physics.buoyancy > 0 ? "column" : "column-reverse";
    }

    // Void density special handling
    if (physics.density === "void") {
        css.flexGrow = 1;
        css.flexShrink = 1;
        css.minHeight = 0;
        css.width = "100%";
    }

    return css;
}
