"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS NODE — Single topology node with Φ-derived styles
// ═══════════════════════════════════════════════════════════════════════════

import { type CSSProperties, type ReactNode } from "react";
import { phi, textStyles, type UIPhysics } from "@/lib/manifold/phi";
import { decode } from "@/lib/manifold/decode";
import type { TopologyNodeV2, TopologyNodeV1 } from "@/lib/manifold/topology";
import { isNodeV2 } from "@/lib/manifold/topology";

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
    // Extract node data
    const nodeId = isNodeV2(node) ? node.id : `node.${depth}.${index}`;
    const prime = isNodeV2(node) ? node.prime : node[0];
    const text = isNodeV2(node) ? node.text : node[1];
    const overridePhysics = isNodeV2(node) ? node.physics : undefined;

    // Decode prime to physics
    const decoded = decode(prime);

    // Build UIPhysics from decoded, with overrides
    const physics: UIPhysics = {
        mass: decoded.mass as number | undefined,
        temperature: overridePhysics?.temperature,
        luminosity: overridePhysics?.luminosity,
        charge: overridePhysics?.charge,
        friction: overridePhysics?.friction,
        pressure: overridePhysics?.pressure,
        buoyancy: overridePhysics?.buoyancy,
    };

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

    const mergedStyles: CSSProperties = {
        ...baseStyles,
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

    // Determine if this is a text node or container
    const hasText = text !== null && text !== undefined;
    const isHeading = (physics.mass ?? 0.5) > 0.7;

    return (
        <div
            data-node-id={nodeId}
            onClick={handleClick}
            style={mergedStyles}
        >
            {hasText && (
                <span style={textStyles(physics.mass ?? 0.5, isHeading)}>
                    {text}
                </span>
            )}
            {children}
        </div>
    );
}
