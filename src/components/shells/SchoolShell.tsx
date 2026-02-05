"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SCHOOL SHELL — Sidebar + Workspace layout (Pattern 1)
// The most common two-plane topology
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, type ReactNode, type CSSProperties } from "react";
import { ResizeHandle } from "../handles/ResizeHandle";
import Link from "next/link";

interface NavLink {
    label: string;
    href?: string;
    action?: string;
    icon?: string;
    active?: boolean;
}

interface SidebarConfig {
    title: string;
    position?: "left" | "right";
    ratio?: number;
    resizable?: boolean;
    links?: NavLink[];
    children?: ReactNode;
}

interface HeaderConfig {
    brand: string;
    links?: NavLink[];
    actions?: { label: string; action: string; primary?: boolean }[];
}

interface SchoolShellProps {
    sidebar?: SidebarConfig;
    header?: HeaderConfig;
    children: ReactNode;
    onAction?: (actionKey: string) => void;
    onRatioChange?: (ratio: number) => void;
}

export function SchoolShell({
    sidebar,
    header,
    children,
    onAction,
    onRatioChange,
}: SchoolShellProps) {
    const [sidebarRatio, setSidebarRatio] = useState(sidebar?.ratio ?? 0.25);
    const containerWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

    const handleResize = useCallback((delta: number) => {
        setSidebarRatio((prev) => {
            const newRatio = prev + delta / containerWidth;
            return Math.min(0.5, Math.max(0.15, newRatio));
        });
    }, [containerWidth]);

    const handleResizeEnd = useCallback(() => {
        onRatioChange?.(sidebarRatio);
    }, [sidebarRatio, onRatioChange]);

    const sidebarWidth = `${sidebarRatio * 100}%`;
    const workspaceWidth = `${(1 - sidebarRatio) * 100}%`;

    const headerStyle: CSSProperties = {
        height: "56px",
        background: "rgba(15,14,12,0.95)",
        borderBottom: "1px solid rgba(200,190,170,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    };

    const sidebarStyle: CSSProperties = {
        width: sidebarWidth,
        minWidth: "180px",
        maxWidth: "400px",
        background: "rgba(200,190,170,0.03)",
        borderRight: "1px solid rgba(200,190,170,0.08)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
    };

    const workspaceStyle: CSSProperties = {
        width: workspaceWidth,
        flex: 1,
        height: "calc(100vh - 56px)",
        overflow: "auto",
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0f0e0c", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif" }}>
            {/* HEADER */}
            {header && (
                <header style={headerStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "2px", color: "#c9a227" }}>
                            {header.brand}
                        </span>
                        {header.links?.map((link, i) => (
                            <Link
                                key={i}
                                href={link.href || "#"}
                                style={{
                                    color: "#8a8070",
                                    textDecoration: "none",
                                    fontSize: "13px",
                                    transition: "color 0.15s",
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {header.actions?.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => onAction?.(action.action)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: action.primary ? "none" : "1px solid rgba(200,190,170,0.15)",
                                    background: action.primary ? "#c9a227" : "transparent",
                                    color: action.primary ? "#0f0e0c" : "#8a8070",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </header>
            )}

            {/* MAIN CONTENT */}
            <div style={{ display: "flex" }}>
                {/* SIDEBAR (Navigation Plane) */}
                {sidebar && (
                    <aside style={sidebarStyle}>
                        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(200,190,170,0.06)" }}>
                            <div style={{
                                fontSize: "10px",
                                letterSpacing: "2px",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                            }}>
                                {sidebar.title}
                            </div>
                        </div>

                        <nav style={{ flex: 1, padding: "8px", overflow: "auto" }}>
                            {sidebar.links?.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.href || "#"}
                                    onClick={(e) => {
                                        if (link.action) {
                                            e.preventDefault();
                                            onAction?.(link.action);
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "10px 12px",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                        color: link.active ? "#e8e0d0" : "#8a8070",
                                        background: link.active ? "rgba(201,162,39,0.1)" : "transparent",
                                        fontSize: "13px",
                                        marginBottom: "2px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {link.icon && <span>{link.icon}</span>}
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {sidebar.children}

                        {/* Resize Handle */}
                        {sidebar.resizable !== false && (
                            <ResizeHandle
                                direction="horizontal"
                                onResize={handleResize}
                                onResizeEnd={handleResizeEnd}
                            />
                        )}
                    </aside>
                )}

                {/* WORKSPACE (Content Plane) */}
                <main style={workspaceStyle}>
                    {children}
                </main>
            </div>
        </div>
    );
}
