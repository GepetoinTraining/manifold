"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { SignInButton } from "@/components/auth/SignInButton";
import type { Topology } from "@/lib/manifold";

interface SavedTopology {
    id: string;
    name: string;
    topology: Topology;
    createdAt: string;
}

export default function DashboardPage() {
    const { user, isLoaded } = useAuth();
    const [topologies, setTopologies] = useState<SavedTopology[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTopologies();
        }
    }, [user]);

    const fetchTopologies = async () => {
        try {
            const res = await fetch("/api/topology");
            if (res.ok) {
                const data = await res.json();
                setTopologies(data.topologies || []);
            }
        } catch (e) {
            console.error("Failed to fetch topologies", e);
        }
        setLoading(false);
    };

    const deleteTopology = async (id: string) => {
        if (!confirm("Delete this topology?")) return;
        try {
            await fetch(`/api/topology?id=${id}`, { method: "DELETE" });
            setTopologies((t) => t.filter((x) => x.id !== id));
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const downloadQR = async (topo: SavedTopology) => {
        try {
            const res = await fetch("/api/qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topology: topo.topology }),
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${topo.name || "topology"}-qr.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to generate QR", e);
        }
    };

    const copyJSON = (topo: Topology) => {
        navigator.clipboard.writeText(JSON.stringify(topo, null, 2));
        alert("Copied to clipboard");
    };

    // Show loading while auth initializes
    if (!isLoaded) {
        return (
            <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#8a8070", fontFamily: "'DM Mono', monospace" }}>Loading...</div>
            </div>
        );
    }

    // Show sign-in prompt if not authenticated
    if (!user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0f0e0c",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#e8e0d0",
                    padding: "24px",
                }}
            >
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>⊞</div>
                    <h1 style={{ fontSize: "24px", fontWeight: 500, marginBottom: "12px" }}>
                        Dashboard Access Required
                    </h1>
                    <p style={{ color: "#8a8070", marginBottom: "24px", fontSize: "14px" }}>
                        Sign in to view your saved topologies.
                    </p>
                    <SignInButton mode="modal" />
                    <div style={{ marginTop: "16px" }}>
                        <Link href="/" style={{ color: "#8a8070", textDecoration: "none", fontSize: "13px" }}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0f0e0c",
                color: "#e8e0d0",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(200,190,170,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link href="/" style={{ color: "#8a8070", textDecoration: "none", fontSize: "14px" }}>
                        ←
                    </Link>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#c9a227" }}>
                            DASHBOARD
                        </div>
                        <div
                            style={{
                                fontSize: "11px",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                                marginTop: "2px",
                            }}
                        >
                            Your saved topologies
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link
                        href="/build"
                        style={{
                            background: "#c9a227",
                            color: "#0f0e0c",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: 600,
                        }}
                    >
                        + New
                    </Link>
                    <div
                        style={{
                            fontSize: "11px",
                            color: "#8a8070",
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        {user.email}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "#8a8070", padding: "40px" }}>
                        Loading...
                    </div>
                ) : topologies.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            color: "#8a8070",
                            padding: "60px 20px",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>⊞</div>
                        <div style={{ fontSize: "14px", marginBottom: "8px" }}>No topologies yet</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                            Build your first app in the encoder
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {topologies.map((t) => (
                            <div
                                key={t.id}
                                style={{
                                    padding: "16px",
                                    borderRadius: "12px",
                                    background: "rgba(200,190,170,0.04)",
                                    border: "1px solid rgba(200,190,170,0.08)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500, marginBottom: "4px" }}>{t.name}</div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#8a8070",
                                                fontFamily: "'DM Mono', monospace",
                                            }}
                                        >
                                            {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                                            {Object.keys(t.topology.pages).length} pages
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => copyJSON(t.topology)}
                                            style={{
                                                background: "rgba(200,190,170,0.06)",
                                                border: "1px solid rgba(200,190,170,0.12)",
                                                color: "#8a8070",
                                                padding: "6px 10px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                                fontFamily: "'DM Mono', monospace",
                                            }}
                                        >
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => downloadQR(t)}
                                            style={{
                                                background: "rgba(201,162,39,0.1)",
                                                border: "1px solid rgba(201,162,39,0.3)",
                                                color: "#c9a227",
                                                padding: "6px 10px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                                fontFamily: "'DM Mono', monospace",
                                            }}
                                        >
                                            QR
                                        </button>
                                        <button
                                            onClick={() => deleteTopology(t.id)}
                                            style={{
                                                background: "rgba(196,74,47,0.1)",
                                                border: "1px solid rgba(196,74,47,0.3)",
                                                color: "#c44a2f",
                                                padding: "6px 10px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                                fontFamily: "'DM Mono', monospace",
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
