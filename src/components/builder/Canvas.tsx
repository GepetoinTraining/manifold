"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS — Right column: live topology precipitation
// ═══════════════════════════════════════════════════════════════════════════

import { Precipitate } from "@/components/renderer/Precipitate";
import type { Topology, TopologyNode } from "@/lib/manifold/topology";

interface CanvasColumnProps {
    topology: Topology | null;
    currentPageId?: number;
    selectedNodeId: string | null;
    currentRole?: string;
    roles?: string[];
    onSelectNode: (nodeId: string) => void;
    onRoleChange?: (role: string) => void;
    onExportQR?: (role?: string) => void;
}

export function CanvasColumn({
    topology,
    currentPageId,
    selectedNodeId,
    currentRole,
    roles = [],
    onSelectNode,
    onRoleChange,
    onExportQR,
}: CanvasColumnProps) {
    // Get current page nodes
    const pageId = currentPageId ?? topology?.nav[0];
    const page = pageId !== undefined ? topology?.pages[pageId] : null;
    const nodes = page?.ui ?? [];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                background: "#0f0e0c",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(200,190,170,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                            color: "#c9a227",
                        }}
                    >
                        CANVAS
                    </div>
                    <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "2px" }}>
                        {topology ? topology.name || "Untitled App" : "No topology yet"}
                    </div>
                </div>

                {/* Export QR button */}
                {topology && onExportQR && (
                    <button
                        onClick={() => onExportQR(currentRole)}
                        style={{
                            padding: "6px 12px",
                            background: "rgba(201,162,39,0.1)",
                            border: "1px solid rgba(201,162,39,0.3)",
                            borderRadius: "6px",
                            color: "#c9a227",
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                            cursor: "pointer",
                        }}
                    >
                        ⊞ Export QR
                    </button>
                )}
            </div>

            {/* Canvas area */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "16px",
                }}
            >
                {topology ? (
                    <div
                        style={{
                            minHeight: "100%",
                            background: "rgba(200,190,170,0.02)",
                            borderRadius: "12px",
                            border: "1px solid rgba(200,190,170,0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <Precipitate
                            nodes={nodes}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            pageId={`page.${pageId}`}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8a8070",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }}>
                            ⊞
                        </div>
                        <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                            Your app will appear here
                        </div>
                        <div style={{ fontSize: "12px", opacity: 0.6 }}>
                            Complete the interview to generate
                        </div>
                    </div>
                )}
            </div>

            {/* Role toggles */}
            {roles.length > 0 && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderTop: "1px solid rgba(200,190,170,0.08)",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            fontFamily: "'DM Mono', monospace",
                            color: "#8a8070",
                            paddingTop: "6px",
                        }}
                    >
                        ROLE:
                    </div>
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => onRoleChange?.(role)}
                            style={{
                                padding: "6px 12px",
                                background:
                                    role === currentRole
                                        ? "rgba(201,162,39,0.15)"
                                        : "rgba(200,190,170,0.04)",
                                border:
                                    role === currentRole
                                        ? "1px solid rgba(201,162,39,0.4)"
                                        : "1px solid rgba(200,190,170,0.1)",
                                borderRadius: "20px",
                                color: role === currentRole ? "#c9a227" : "#8a8070",
                                fontSize: "11px",
                                fontFamily: "'DM Mono', monospace",
                                cursor: "pointer",
                                textTransform: "capitalize",
                            }}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
