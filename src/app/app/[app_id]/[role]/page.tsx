"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-SPECIFIC APP VIEW — Masked topology for specific role
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Precipitate } from "@/components/renderer/Precipitate";
import type { Topology, RoleMask } from "@/lib/manifold/topology";
import { applyMask } from "@/lib/topology/mask";

interface AppData {
    id: string;
    name: string;
    topology: Topology;
    roles: RoleMask[];
}

export default function RoleAppPage() {
    const params = useParams();
    const appId = params.app_id as string;
    const role = params.role as string;

    const [appData, setAppData] = useState<AppData | null>(null);
    const [maskedTopology, setMaskedTopology] = useState<Topology | null>(null);
    const [currentSeed, setCurrentSeed] = useState<string>("1");
    const [instanceId, setInstanceId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load app topology
    useEffect(() => {
        async function loadApp() {
            try {
                const response = await fetch(`/api/app?id=${appId}`);
                if (!response.ok) throw new Error("App not found");

                const data = await response.json();
                setAppData(data);

                // Apply role mask
                const topology = data.topology as Topology;
                const masked = applyMask(topology, role);
                setMaskedTopology(masked);

                // Generate instance ID
                const instance = `${appId}-${role}-${Date.now()}`;
                setInstanceId(instance);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load app");
            } finally {
                setLoading(false);
            }
        }

        loadApp();
    }, [appId, role]);

    // Poll seed every 2 seconds
    useEffect(() => {
        if (!instanceId) return;

        const pollSeed = async () => {
            try {
                const response = await fetch(`/api/seed/${instanceId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCurrentSeed(data.seed);
                }
            } catch {
                // Ignore polling errors
            }
        };

        const interval = setInterval(pollSeed, 2000);
        return () => clearInterval(interval);
    }, [instanceId]);

    // Apply delta (user action)
    const applyDelta = useCallback(
        async (delta: string, operation: "multiply" | "divide") => {
            if (!instanceId) return;

            // Optimistic update
            const currentBigInt = BigInt(currentSeed);
            const deltaBigInt = BigInt(delta);
            const newSeed =
                operation === "multiply"
                    ? currentBigInt * deltaBigInt
                    : currentBigInt / deltaBigInt;
            setCurrentSeed(newSeed.toString());

            // POST to server
            try {
                await fetch(`/api/seed/${instanceId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ delta, operation, role }),
                });
            } catch {
                // Revert on error
                setCurrentSeed(currentSeed);
            }
        },
        [instanceId, currentSeed, role]
    );

    if (loading) {
        return (
            <div style={containerStyles}>
                <div style={{ color: "#c9a227" }}>◌ Loading...</div>
            </div>
        );
    }

    if (error || !appData || !maskedTopology) {
        return (
            <div style={containerStyles}>
                <div style={{ color: "#c44a2f" }}>⚠ {error || "App not found"}</div>
            </div>
        );
    }

    const pageId = maskedTopology.nav[0];
    const page = maskedTopology.pages[pageId];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0f0e0c",
                color: "#e8e0d0",
            }}
        >
            {/* Header */}
            <header
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
                        ⊞ MANIFOLD
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>{appData.name}</div>
                    <div
                        style={{
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                            color: "#8a8070",
                            textTransform: "uppercase",
                            marginTop: "2px",
                        }}
                    >
                        {role} view
                    </div>
                </div>
                <div
                    style={{
                        fontSize: "10px",
                        fontFamily: "'DM Mono', monospace",
                        color: "#8a8070",
                    }}
                >
                    SEED: {currentSeed}
                </div>
            </header>

            {/* App content */}
            <main style={{ padding: "16px" }}>
                <Precipitate
                    nodes={page?.ui || []}
                    pageId={`page.${pageId}`}
                />
            </main>
        </div>
    );
}

const containerStyles: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0e0c",
    color: "#e8e0d0",
};
