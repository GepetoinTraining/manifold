"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS NODE — Single topology node with Φ-derived styles
//
// Now registry-aware: decodes prime → looks up element definition →
// applies variant physics → runs Φ → renders with semantic render hints.
//
// A Button renders as <button>. A Text renders as <span>.
// A Container renders as <div>. The math still carries the design.
// ═══════════════════════════════════════════════════════════════════════════

import { type CSSProperties, type ReactNode } from "react";
import { phi, textStyles, type UIPhysics } from "@/lib/manifold/phi";
import { decode } from "@/lib/manifold/decode";
import type { TopologyNodeV2, TopologyNodeV1 } from "@/lib/manifold/topology";
import { isNodeV2 } from "@/lib/manifold/topology";
import {
    resolvePhysics,
    getRenderHint,
    isRegistryLoaded,
    type RenderHint,
} from "@/lib/manifold/elements";
import { ENCODE } from "@/lib/manifold/primes";

interface PhysicsNodeProps {
    node: TopologyNodeV2 | TopologyNodeV1;
    depth?: number;
    index?: number;
    selected?: boolean;
    onSelect?: (nodeId: string) => void;
    children?: ReactNode;
}

export function PhysicsNode({
    node,
    depth = 0,
    index = 0,
    selected = false,
    onSelect,
    children,
}: PhysicsNodeProps) {
    // Guard: bail out if node is null/undefined
    if (!node) {
        return <div data-node-id={`empty.${depth}.${index}`} />;
    }

    // Extract node data
    const nodeId = isNodeV2(node) ? node.id : `node.${depth}.${index}`;
    const prime = isNodeV2(node) ? node.prime : (Array.isArray(node) ? node[0] : 0);
    const text = isNodeV2(node) ? node.text : (Array.isArray(node) ? node[1] : null);
    const overridePhysics = isNodeV2(node) ? node.physics : undefined;

    // Decode prime to get component type + raw physics
    // Guard: decode needs a valid number
    const decoded = decode(typeof prime === "number" && prime > 0 ? prime : 1);

    // Extract variant from node physics (if provided)
    const variant = (overridePhysics as Record<string, unknown>)?.variant as
        | string
        | undefined;

    // Get the component prime for registry lookups
    const componentPrime = getComponentPrime(prime, decoded as Record<string, unknown>);

    // Resolve physics through the registry (element defaults → variant → overrides)
    // Falls back to raw decoded physics if registry isn't loaded
    let physics: UIPhysics;

    if (isRegistryLoaded() && decoded.component) {
        // Registry path: get element definition, apply variant, layer overrides
        physics = resolvePhysics(
            componentPrime,
            variant,
            overridePhysics
        ) as UIPhysics;

        // If decode also found mass/temperature from the prime product, merge those too
        if (decoded.mass !== undefined && overridePhysics?.mass === undefined) {
            physics.mass = decoded.mass as number;
        }
    } else {
        // Legacy path: raw decode → direct to Φ (backward compatible)
        physics = {
            mass: decoded.mass as number | undefined,
            temperature: overridePhysics?.temperature,
            luminosity: overridePhysics?.luminosity,
            charge: overridePhysics?.charge,
            friction: overridePhysics?.friction,
            pressure: overridePhysics?.pressure,
            buoyancy: overridePhysics?.buoyancy,
        };
    }

    // Get render hint (semantic DOM element type)
    const renderHint: RenderHint = isRegistryLoaded()
        ? getRenderHint(componentPrime)
        : inferRenderHint(decoded.component as string | undefined);

    // Get Φ-derived styles
    const baseStyles = phi(physics);

    // Selection highlight
    const selectionStyles: CSSProperties = selected
        ? {
              outline: "2px solid #c9a227",
              outlineOffset: "2px",
          }
        : {};

    // Animation
    const animationStyles: CSSProperties = {
        animation: `fadeUp ${0.2 + depth * 0.05 + index * 0.03}s ease both`,
    };

    // Render-hint-specific style additions
    const hintStyles = renderHintStyles(renderHint);

    const mergedStyles: CSSProperties = {
        ...baseStyles,
        ...hintStyles,
        ...selectionStyles,
        ...animationStyles,
        cursor: onSelect ? "pointer" : undefined,
    };

    // Handle click for selection
    const handleClick = onSelect
        ? (e: React.MouseEvent) => {
              e.stopPropagation();
              onSelect(nodeId);
          }
        : undefined;

    // Text content
    const hasText = text !== null && text !== undefined;
    const mass = physics.mass ?? 0.5;
    const isHeading = mass > 0.7;

    // Render based on hint
    return renderByHint(renderHint, {
        nodeId,
        mergedStyles,
        handleClick,
        hasText,
        text,
        mass,
        isHeading,
        children,
        componentName: decoded.component as string | undefined,
    });
}

// ─── RENDER BY HINT ─────────────────────────────────────────────────────────

interface RenderProps {
    nodeId: string;
    mergedStyles: CSSProperties;
    handleClick?: (e: React.MouseEvent) => void;
    hasText: boolean;
    text: string | null;
    mass: number;
    isHeading: boolean;
    children?: ReactNode;
    componentName?: string;
}

function renderByHint(hint: RenderHint, props: RenderProps) {
    const {
        nodeId,
        mergedStyles,
        handleClick,
        hasText,
        text,
        mass,
        isHeading,
        children,
        componentName,
    } = props;

    switch (hint) {
        case "action":
            return (
                <button
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...mergedStyles,
                        border: mergedStyles.border as string,
                        background: mergedStyles.background as string,
                        cursor: "pointer",
                        fontFamily: "inherit",
                    }}
                    type="button"
                >
                    {hasText && (
                        <span style={textStyles(mass, false)}>{text}</span>
                    )}
                    {children}
                </button>
            );

        case "text":
            return (
                <span
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...textStyles(mass, isHeading),
                        ...mergedStyles,
                        // Text nodes: inline-flex, not block flex
                        display: "inline-flex",
                        alignItems: "center",
                    }}
                >
                    {text}
                    {children}
                </span>
            );

        case "input":
            return (
                <div
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={mergedStyles}
                >
                    {hasText && (
                        <label style={textStyles(Math.max(mass - 0.2, 0.1), false)}>
                            {text}
                        </label>
                    )}
                    <div
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(200,190,170,0.15)",
                            borderRadius: mergedStyles.borderRadius,
                            color: "#e8e0d0",
                            fontFamily: "inherit",
                            fontSize: "14px",
                            minHeight: "36px",
                        }}
                    />
                    {children}
                </div>
            );

        case "data":
            return (
                <div
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...mergedStyles,
                        overflow: "hidden",
                    }}
                >
                    {hasText && (
                        <span style={textStyles(mass, isHeading)}>{text}</span>
                    )}
                    {children}
                </div>
            );

        case "layout":
            return (
                <nav
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...mergedStyles,
                        width: "100%",
                    }}
                >
                    {hasText && (
                        <span style={textStyles(mass, true)}>{text}</span>
                    )}
                    {children}
                </nav>
            );

        case "temporal":
            return (
                <div
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...mergedStyles,
                        position: "relative",
                    }}
                >
                    {hasText && (
                        <span style={textStyles(mass, isHeading)}>{text}</span>
                    )}
                    {children}
                </div>
            );

        case "media":
            return (
                <div
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={{
                        ...mergedStyles,
                        aspectRatio: "1",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {hasText && (
                        <span style={textStyles(mass, false)}>{text}</span>
                    )}
                    {children}
                </div>
            );

        // container (default)
        default:
            return (
                <div
                    data-node-id={nodeId}
                    data-element={componentName}
                    onClick={handleClick}
                    style={mergedStyles}
                >
                    {hasText && (
                        <span style={textStyles(mass, isHeading)}>{text}</span>
                    )}
                    {children}
                </div>
            );
    }
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Extract the component prime from a prime product.
 * The prime product may encode multiple axes (component + physics).
 * We need the component prime specifically for registry lookup.
 */
function getComponentPrime(
    _primeProduct: number,
    decoded: Record<string, unknown>
): number {
    // The decoder already extracted the component type
    // We need to find which prime corresponds to it
    const componentName = decoded.component as string | undefined;
    if (!componentName) return 0;

    return ENCODE?.component?.[componentName] ?? 0;
}

/**
 * Infer render hint from component name when registry isn't loaded.
 * Fallback for first render before registry fetch completes.
 */
function inferRenderHint(componentName?: string): RenderHint {
    if (!componentName) return "container";

    const name = componentName.toLowerCase();

    // Actions
    if (["button", "link"].includes(name)) return "action";

    // Text
    if (["text", "badge", "pill", "icon"].includes(name)) return "text";

    // Inputs
    if (
        ["input", "select", "checkbox", "radio", "switch", "slider"].includes(
            name
        )
    )
        return "input";

    // Data
    if (
        ["table", "chart", "stat", "trend", "progress", "kanban"].includes(name)
    )
        return "data";

    // Layout
    if (["navbar", "sidebar", "tabs"].includes(name)) return "layout";

    // Temporal
    if (
        ["clock", "day", "week", "month", "year", "calendar", "spinner"].includes(
            name
        )
    )
        return "temporal";

    // Media
    if (["image", "avatar"].includes(name)) return "media";

    return "container";
}

/**
 * Additional CSS for specific render hints
 */
function renderHintStyles(hint: RenderHint): CSSProperties {
    switch (hint) {
        case "action":
            return {
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none" as const,
            };
        case "input":
            return {
                flexDirection: "column",
                alignItems: "stretch",
            };
        case "layout":
            return {
                flexShrink: 0,
            };
        default:
            return {};
    }
}
