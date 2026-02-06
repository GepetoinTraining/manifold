"use client";

// ═══════════════════════════════════════════════════════════════════════════
// BUILD PAGE — Three-column builder interface
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { SignInButton } from "@/components/auth/SignInButton";

import { ContextTags, type Tag } from "@/components/builder/ContextTags";
import { Interview, type Message } from "@/components/builder/Interview";
import { CanvasColumn } from "@/components/builder/Canvas";
import type { InterviewPhase } from "@/lib/interview/phases";
import type { Topology } from "@/lib/manifold/topology";

export default function BuildPage() {
    const { user, isLoaded } = useAuth();

    // ─── STATE ─────────────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("identity");
    const [tags, setTags] = useState<Tag[]>([]);
    const [topology, setTopology] = useState<Topology | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Physics sliders
    const [temperature, setTemperature] = useState(0.6);
    const [luminosity, setLuminosity] = useState(0.3);
    const [friction, setFriction] = useState(0.3);

    // Roles
    const [roles, setRoles] = useState<string[]>([]);
    const [currentRole, setCurrentRole] = useState<string | undefined>();

    // App state
    const [appId, setAppId] = useState<string | null>(null);
    const [appName, setAppName] = useState("Untitled App");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ─── HANDLERS ──────────────────────────────────────────────────────────────

    const handleSendMessage = useCallback(async (content: string) => {
        // Add user message
        const userMessage: Message = { role: "user", content };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            // Send to interview API
            const response = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    phase: currentPhase,
                    physics: { temperature, luminosity, friction },
                }),
            });

            if (!response.ok) throw new Error("Interview API error");

            const data = await response.json();

            // Add assistant message
            if (data.message) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
            }

            // Extract tags
            if (data.tags && Array.isArray(data.tags)) {
                const newTags: Tag[] = data.tags.map((t: { label: string; value: string }, i: number) => ({
                    id: `tag-${Date.now()}-${i}`,
                    label: t.label,
                    value: t.value,
                    phase: currentPhase,
                    editable: true,
                }));
                setTags((prev) => [...prev, ...newTags]);
            }

            // Extract roles
            if (data.roles && Array.isArray(data.roles)) {
                setRoles(data.roles);
                if (!currentRole && data.roles.length > 0) {
                    setCurrentRole(data.roles[0]);
                }
            }

            // Update topology if generated
            if (data.topology) {
                setTopology(data.topology);
            }

            // Move to next phase if suggested
            if (data.nextPhase) {
                setCurrentPhase(data.nextPhase);
            }
        } catch (error) {
            console.error("Interview error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I had trouble processing that. Could you try again?",
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [messages, currentPhase, temperature, luminosity, friction, currentRole]);

    const handleTagUpdate = useCallback((id: string, newValue: string) => {
        setTags((prev) =>
            prev.map((tag) => (tag.id === id ? { ...tag, value: newValue } : tag))
        );
    }, []);

    const handleTagDelete = useCallback((id: string) => {
        setTags((prev) => prev.filter((tag) => tag.id !== id));
    }, []);

    const handleTagAdd = useCallback((label: string, value: string) => {
        setTags((prev) => [
            ...prev,
            {
                id: `tag-${Date.now()}`,
                label,
                value,
                phase: currentPhase,
                editable: true,
            },
        ]);
    }, [currentPhase]);

    const handleSelectNode = useCallback((nodeId: string) => {
        setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
    }, []);

    const handleExportQR = useCallback(async (role?: string) => {
        if (!topology) return;

        try {
            const response = await fetch("/api/qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topology, role }),
            });

            if (!response.ok) throw new Error("QR generation failed");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `manifold-${role || "app"}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("QR export error:", error);
        }
    }, [topology]);

    const handleSaveApp = useCallback(async () => {
        if (!topology || !user) return;

        setSaving(true);
        setSaved(false);

        try {
            const body = {
                id: appId || undefined,
                name: appName,
                owner_id: user.id,
                topology: JSON.stringify(topology),
                workspace_type: tags.find(t => t.label === "workspace")?.value || "Document",
                entity_schema: tags.find(t => t.label === "entities")?.value || null,
                views: JSON.stringify([]),
                actions: JSON.stringify({}),
                status: "draft",
                visibility: "private",
            };

            const response = await fetch("/api/app", {
                method: appId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("Save failed");

            const data = await response.json();

            if (data.id && !appId) {
                setAppId(data.id);
            }

            // Extract app name from topology if available
            if (topology && 'name' in topology && typeof topology.name === 'string') {
                setAppName(topology.name);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    }, [topology, user, appId, appName, tags]);

    // ─── AUTH CHECK ────────────────────────────────────────────────────────────

    if (!isLoaded) {
        return (
            <div style={loaderStyles}>
                <div style={{ color: "#c9a227" }}>◌ Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={authStyles}>
                <div style={{ fontSize: "48px", marginBottom: "24px", opacity: 0.3 }}>⊞</div>
                <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Sign in to Build</h1>
                <p style={{ color: "#8a8070", marginBottom: "24px" }}>
                    Create your first app with the Manifold builder.
                </p>
                <SignInButton mode="modal" />
                <Link href="/" style={backLinkStyles}>
                    ← Back to home
                </Link>
            </div>
        );
    }

    // ─── THREE-COLUMN LAYOUT ───────────────────────────────────────────────────

    return (
        <div style={containerStyles}>
            {/* Header */}
            <header style={headerStyles}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: "18px", fontWeight: 500, color: "#c9a227" }}>
                            ⊞ Manifold
                        </span>
                    </Link>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="App Name"
                        style={{
                            background: "rgba(200,190,170,0.05)",
                            border: "1px solid rgba(200,190,170,0.1)",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            color: "#e8e0d0",
                            fontSize: "14px",
                            width: "180px",
                            fontFamily: "inherit",
                        }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#8a8070" }}>
                        {user.email}
                    </span>
                    <button
                        onClick={handleSaveApp}
                        disabled={!topology || saving}
                        style={{
                            padding: "8px 20px",
                            background: saved ? "#22c55e" : saving ? "#666" : "#c9a227",
                            color: saved ? "#fff" : "#0f0e0c",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: topology && !saving ? "pointer" : "not-allowed",
                            opacity: topology ? 1 : 0.5,
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}
                    >
                        {saved ? "✓ Saved" : saving ? "Saving..." : "Save App"}
                    </button>
                </div>
            </header>

            {/* Three columns */}
            <div style={columnsStyles}>
                {/* Left: Context Tags */}
                <div style={leftColumnStyles}>
                    <ContextTags
                        tags={tags}
                        onTagUpdate={handleTagUpdate}
                        onTagDelete={handleTagDelete}
                        onTagAdd={handleTagAdd}
                    />
                </div>

                {/* Center: Interview */}
                <div style={centerColumnStyles}>
                    <Interview
                        messages={messages}
                        currentPhase={currentPhase}
                        selectedNodeId={selectedNodeId}
                        temperature={temperature}
                        luminosity={luminosity}
                        friction={friction}
                        loading={loading}
                        onSendMessage={handleSendMessage}
                        onPhaseChange={setCurrentPhase}
                        onTemperatureChange={setTemperature}
                        onLuminosityChange={setLuminosity}
                        onFrictionChange={setFriction}
                    />
                </div>

                {/* Right: Canvas */}
                <div style={rightColumnStyles}>
                    <CanvasColumn
                        topology={topology}
                        selectedNodeId={selectedNodeId}
                        currentRole={currentRole}
                        roles={roles}
                        onSelectNode={handleSelectNode}
                        onRoleChange={setCurrentRole}
                        onExportQR={handleExportQR}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f0e0c",
    color: "#e8e0d0",
};

const headerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(200,190,170,0.08)",
};

const columnsStyles: React.CSSProperties = {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "250px 1fr 1fr",
    overflow: "hidden",
};

const leftColumnStyles: React.CSSProperties = {
    overflow: "hidden",
};

const centerColumnStyles: React.CSSProperties = {
    overflow: "hidden",
};

const rightColumnStyles: React.CSSProperties = {
    overflow: "hidden",
};

const loaderStyles: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0e0c",
};

const authStyles: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0e0c",
    color: "#e8e0d0",
    textAlign: "center",
};

const signInButtonStyles: React.CSSProperties = {
    padding: "14px 32px",
    background: "#c9a227",
    color: "#0f0e0c",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
};

const backLinkStyles: React.CSSProperties = {
    marginTop: "20px",
    color: "#8a8070",
    fontSize: "13px",
    textDecoration: "none",
};
