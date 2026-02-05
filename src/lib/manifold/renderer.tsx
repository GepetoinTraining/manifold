"use client";

// ═══════════════════════════════════════════════════════════════════════════
// RENDERER — Recursive topology → React elements
// The heart of the decoder.
// ═══════════════════════════════════════════════════════════════════════════

import type { CSSProperties, ReactNode } from "react";
import { resolve } from "./cache";
import { TEMP_COLORS } from "./primes";
import type { TopologyNode } from "./topology";

interface RenderNodeProps {
    node: TopologyNode;
    depth?: number;
    index?: number;
    actionHandler?: (key: string, actions: string[]) => void;
}

/**
 * RenderNode — Recursive component that renders a TopologyNode.
 * Resolves the prime, applies component-type-specific styles, renders children.
 */
export function RenderNode({
    node,
    depth = 0,
    index = 0,
    actionHandler,
}: RenderNodeProps): ReactNode {
    if (!node || !Array.isArray(node)) return null;

    const [prime, text, children = [], actionKey] = node;
    const resolved = resolve(prime);
    const { css, componentType, actions, physics } = resolved;

    const isInteractive = actions.length > 0 || actionKey;
    const Tag = isInteractive ? "button" : "div";

    // Component-type-specific style overrides
    const typeStyle: CSSProperties = {};

    if (componentType === "Text") {
        typeStyle.background = "transparent";
        typeStyle.border = "none";
        typeStyle.boxShadow = "none";
        typeStyle.padding = "0";
        const mass = physics.mass as number | undefined;
        if (mass !== undefined && mass >= 0.8) {
            typeStyle.fontSize = "18px";
            typeStyle.fontWeight = 600;
        } else if (mass !== undefined && mass >= 0.3) {
            typeStyle.fontSize = "14px";
            typeStyle.lineHeight = "1.6";
        } else {
            typeStyle.fontSize = "12px";
            typeStyle.color = "#8a8070";
        }
    }

    if (componentType === "Button") {
        typeStyle.cursor = "pointer";
        typeStyle.borderRadius = "8px";
        typeStyle.padding = typeStyle.padding || "12px 24px";
        typeStyle.fontSize = "14px";
        typeStyle.fontWeight = 500;
        if (physics.temperature === "warm") {
            typeStyle.background = "#c9a227";
            typeStyle.color = "#0f0e0c";
            typeStyle.border = "none";
        }
    }

    if (componentType === "Card") {
        typeStyle.borderRadius = "12px";
        typeStyle.padding = typeStyle.padding || "16px";
    }

    if (componentType === "Navbar") {
        typeStyle.position = "sticky";
        typeStyle.top = 0;
        typeStyle.backdropFilter = "blur(20px)";
        typeStyle.padding = "14px 20px";
        typeStyle.display = "flex";
        typeStyle.alignItems = "center";
        typeStyle.justifyContent = "space-between";
        typeStyle.zIndex = 100;
    }

    if (componentType === "Badge") {
        typeStyle.fontSize = "10px";
        typeStyle.padding = "3px 8px";
        typeStyle.borderRadius = "4px";
        typeStyle.fontFamily = "'DM Mono', monospace";
        typeStyle.display = "inline-block";
        const tc = TEMP_COLORS[physics.temperature as string] || TEMP_COLORS.warm;
        typeStyle.color = tc;
        typeStyle.background = tc + "18";
        typeStyle.borderColor = tc + "40";
    }

    if (componentType === "Container") {
        typeStyle.display = "flex";
        typeStyle.flexDirection = "column";
        typeStyle.gap = typeStyle.gap || "12px";
    }

    if (componentType === "Spacer") {
        typeStyle.flexGrow = 1;
    }

    if (componentType === "Divider") {
        typeStyle.height = "1px";
        typeStyle.background = "rgba(200,190,170,0.1)";
        typeStyle.border = "none";
        typeStyle.boxShadow = "none";
    }

    if (componentType === "Input") {
        typeStyle.borderRadius = "8px";
        typeStyle.padding = "10px 14px";
        typeStyle.fontSize = "14px";
        typeStyle.outline = "none";
        typeStyle.color = "#e8e0d0";
    }

    if (componentType === "Image") {
        typeStyle.borderRadius = "8px";
        typeStyle.overflow = "hidden";
        typeStyle.minHeight = "120px";
        typeStyle.display = "flex";
        typeStyle.alignItems = "center";
        typeStyle.justifyContent = "center";
        typeStyle.color = "#8a8070";
        typeStyle.fontSize = "12px";
    }

    if (componentType === "Toast") {
        typeStyle.position = "fixed";
        typeStyle.top = "80px";
        typeStyle.left = "50%";
        typeStyle.transform = "translateX(-50%)";
        typeStyle.zIndex = 200;
        typeStyle.borderRadius = "8px";
        typeStyle.padding = "10px 20px";
        typeStyle.fontSize = "13px";
    }

    const mergedStyle: CSSProperties = {
        ...css,
        ...typeStyle,
        animation: `fadeUp ${0.2 + depth * 0.05 + index * 0.04}s ease both`,
    };

    if (isInteractive) {
        mergedStyle.WebkitTapHighlightColor = "transparent";
        mergedStyle.fontFamily = "inherit";
    }

    const handleClick = isInteractive
        ? () => {
            if (actionHandler && actionKey) actionHandler(actionKey, actions);
        }
        : undefined;

    // Input special case
    if (componentType === "Input") {
        return (
            <input
                placeholder={text || ""}
                style={mergedStyle}
            />
        );
    }

    return (
        <Tag onClick={handleClick} style={mergedStyle}>
            {text && <span>{text}</span>}
            {children &&
                children.map((child: TopologyNode, i: number) => (
                    <RenderNode
                        key={i}
                        node={child}
                        depth={depth + 1}
                        index={i}
                        actionHandler={actionHandler}
                    />
                ))}
        </Tag>
    );
}
