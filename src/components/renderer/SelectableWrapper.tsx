"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SELECTABLE WRAPPER — Tap-to-select overlay for canvas nodes
// ═══════════════════════════════════════════════════════════════════════════

import { type CSSProperties, type ReactNode, useState } from "react";

interface SelectableWrapperProps {
    nodeId: string;
    selected: boolean;
    onSelect: (nodeId: string) => void;
    children: ReactNode;
    style?: CSSProperties;
}

export function SelectableWrapper({
    nodeId,
    selected,
    onSelect,
    children,
    style,
}: SelectableWrapperProps) {
    const [hovered, setHovered] = useState(false);

    const wrapperStyles: CSSProperties = {
        position: "relative",
        cursor: "pointer",
        ...style,
    };

    const overlayStyles: CSSProperties = {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        transition: "all 0.15s ease",
        ...(selected
            ? {
                outline: "2px solid #c9a227",
                outlineOffset: "2px",
                boxShadow: "0 0 20px rgba(201,162,39,0.3)",
            }
            : hovered
                ? {
                    outline: "1px dashed rgba(201,162,39,0.5)",
                    outlineOffset: "2px",
                }
                : {}),
    };

    const labelStyles: CSSProperties = {
        position: "absolute",
        top: "-20px",
        left: "4px",
        fontSize: "10px",
        fontFamily: "'DM Mono', monospace",
        color: "#c9a227",
        background: "rgba(15,14,12,0.9)",
        padding: "2px 6px",
        borderRadius: "4px",
        opacity: selected || hovered ? 1 : 0,
        transition: "opacity 0.15s ease",
        pointerEvents: "none",
        whiteSpace: "nowrap",
    };

    return (
        <div
            style={wrapperStyles}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(nodeId);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
            <div style={overlayStyles} />
            <div style={labelStyles}>{nodeId}</div>
        </div>
    );
}
