"use client";

// ═══════════════════════════════════════════════════════════════════════════
// VIEW SWITCHER — Toggle between workspace types
// Same data, different presentation
// ═══════════════════════════════════════════════════════════════════════════

import { type CSSProperties } from "react";
import type { ViewDefinition } from "@/lib/world/types";

interface ViewSwitcherProps {
    views: ViewDefinition[];
    activeView: string;
    onViewChange: (viewKey: string) => void;
    variant?: "tabs" | "dropdown";
}

export function ViewSwitcher({
    views,
    activeView,
    onViewChange,
    variant = "tabs",
}: ViewSwitcherProps) {
    if (views.length <= 1) return null;

    if (variant === "tabs") {
        return (
            <div style={tabContainerStyle}>
                {views.map((view) => (
                    <button
                        key={view.key}
                        onClick={() => onViewChange(view.key)}
                        style={{
                            ...tabStyle,
                            ...(view.key === activeView ? activeTabStyle : {}),
                        }}
                    >
                        {view.icon && <span style={{ marginRight: "6px" }}>{view.icon}</span>}
                        {view.label}
                    </button>
                ))}
            </div>
        );
    }

    // Dropdown variant
    return (
        <select
            value={activeView}
            onChange={(e) => onViewChange(e.target.value)}
            style={dropdownStyle}
        >
            {views.map((view) => (
                <option key={view.key} value={view.key}>
                    {view.icon} {view.label}
                </option>
            ))}
        </select>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const tabContainerStyle: CSSProperties = {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "rgba(200,190,170,0.04)",
    borderRadius: "8px",
    border: "1px solid rgba(200,190,170,0.08)",
};

const tabStyle: CSSProperties = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#8a8070",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    transition: "all 0.15s",
};

const activeTabStyle: CSSProperties = {
    background: "rgba(201,162,39,0.15)",
    color: "#c9a227",
};

const dropdownStyle: CSSProperties = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(200,190,170,0.15)",
    background: "rgba(200,190,170,0.04)",
    color: "#e8e0d0",
    fontSize: "12px",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
};
