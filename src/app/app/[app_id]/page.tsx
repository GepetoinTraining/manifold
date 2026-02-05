"use client";

// ═══════════════════════════════════════════════════════════════════════════
// LIVE APP PAGE — Scanned via QR, seed polling
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Precipitate } from "@/components/renderer/Precipitate";
import type { Topology } from "@/lib/manifold/topology";

interface AppData {
    id: string;
    name: string;
    topology: Topology;
    roles: Array<{ name: string; hiddenNodes: string[] }>;
}

export default function LiveAppPage() {
    const params = useParams();
    const appId = params.app_id as string;

    const [appData, setAppData] = useState<AppData | null>(null);
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

                // Generate instance ID (could be table number, device ID, etc.)
                const instance = `${appId}-${Date.now()}`;
                setInstanceId(instance);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load app");
            } finally {
                setLoading(false);
            }
        }

        loadApp();
    }, [appId]);

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
            } catch (err) {
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
                    body: JSON.stringify({ delta, operation }),
                });
            } catch (err) {
                // Revert on error
                setCurrentSeed(currentSeed);
            }
        },
        [instanceId, currentSeed]
    );

    if (loading) {
        return (
            <div style={containerStyles}>
                <div style={{ color: "#c9a227" }}>◌ Loading...</div>
            </div>
        );
    }

    if (error || !appData) {
        return (
            <div style={containerStyles}>
                <div style={{ color: "#c44a2f" }}>⚠ {error || "App not found"}</div>
            </div>
        );
    }

    const topology = appData.topology;
    const pageId = topology.nav[0];
    const page = topology.pages[pageId];

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
