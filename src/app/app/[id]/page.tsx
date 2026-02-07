"use client";

// ═══════════════════════════════════════════════════════════════════════════
// APP PAGE — /app/[id]
//
// Phase 1: Gate (pin input, spectrum-themed)
// Phase 2: App  (MfRenderer with role-based views)
//
// The pin IS the session. No tokens, no cookies.
// QR → pin → role → render.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import MfRenderer from "@/components/manifold/MfRenderer";
import { Box, Text, Stack, Button, Loader, Group, Tabs } from "@mantine/core";

// ── SPECTRUM COLORS ──

const SPECTRUM_THEMES: Record<string, { bg: string; fg: string; accent: string; input: string }> = {
    eco: { bg: "#0a1a0a", fg: "#a3d9a5", accent: "#4caf50", input: "#1a2e1a" },
    void: { bg: "#0a0a14", fg: "#b0b0d0", accent: "#7c4dff", input: "#14142a" },
    brass: { bg: "#1a1408", fg: "#d4a574", accent: "#ff9800", input: "#2a2010" },
};

// ── TYPES ──

interface AppMeta {
    topology: string;
    spectrum: string;
    world: string | null;
    name: string | null;
}

interface SessionData {
    userId: string;
    username: string;
    pin: string;
    role: "owner" | "student";
    userData: unknown[];
    ownerData: unknown[];
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function PinGate({
    appMeta,
    appId,
    onVerified,
}: {
    appMeta: AppMeta;
    appId: string;
    onVerified: (session: SessionData) => void;
}) {
    const [digits, setDigits] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const theme = SPECTRUM_THEMES[appMeta.spectrum] || SPECTRUM_THEMES.eco;

    const handleDigit = useCallback(
        (index: number, value: string) => {
            if (!/^\d?$/.test(value)) return;
            const next = [...digits];
            next[index] = value;
            setDigits(next);
            setError("");

            // Auto-focus next
            if (value && index < 3) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [digits],
    );

    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent) => {
            if (e.key === "Backspace" && !digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
            if (e.key === "Enter") {
                handleSubmit();
            }
        },
        [digits],
    );

    const handleSubmit = useCallback(async () => {
        const pin = digits.join("");
        if (pin.length !== 4) {
            setError("Enter 4 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin, appId }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Auth failed");
                setDigits(["", "", "", ""]);
                inputRefs.current[0]?.focus();
                return;
            }

            onVerified({
                userId: data.userId,
                username: data.username,
                pin: digits.join(""),
                role: data.role,
                userData: data.userData,
                ownerData: data.ownerData,
            });
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [digits, appId, onVerified]);

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const displayName = appMeta.name || appMeta.spectrum || "App";

    return (
        <Box
            style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: theme.bg,
            }}
        >
            <Stack align="center" gap="lg" style={{ maxWidth: 320, width: "100%" }}>
                {/* App identity */}
                <Text size="xl" style={{ color: theme.accent }}>
                    ⊞
                </Text>
                <Text
                    size="lg"
                    fw={600}
                    style={{ color: theme.fg, textAlign: "center" }}
                >
                    {displayName}
                </Text>
                {appMeta.world && (
                    <Text
                        size="sm"
                        style={{ color: theme.fg, opacity: 0.5, marginTop: -8 }}
                    >
                        {appMeta.world}
                    </Text>
                )}

                {/* Pin inputs */}
                <Group gap="sm" justify="center" mt="md">
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) => handleDigit(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                                if (pasted.length === 4) {
                                    setDigits(pasted.split(""));
                                    inputRefs.current[3]?.focus();
                                }
                            }}
                            style={{
                                width: 56,
                                height: 64,
                                textAlign: "center",
                                fontSize: "1.5rem",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                background: theme.input,
                                color: theme.fg,
                                border: `2px solid ${error ? "#f44336" : theme.accent}40`,
                                borderRadius: 12,
                                outline: "none",
                                transition: "border-color 0.2s",
                                caretColor: theme.accent,
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = theme.accent;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = `${error ? "#f44336" : theme.accent}40`;
                            }}
                        />
                    ))}
                </Group>

                {/* Error */}
                {error && (
                    <Text size="xs" c="red.4" ff="monospace" ta="center">
                        {error}
                    </Text>
                )}

                {/* Submit */}
                <Button
                    variant="filled"
                    fullWidth
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={digits.some((d) => !d)}
                    style={{
                        background: theme.accent,
                        color: "#000",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        height: 44,
                        borderRadius: 10,
                        marginTop: 4,
                    }}
                >
                    Entrar
                </Button>

                <Text
                    size="xs"
                    ff="monospace"
                    style={{ color: theme.fg, opacity: 0.25, marginTop: 8 }}
                >
                    manifold v3.1
                </Text>
            </Stack>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP VIEW (after auth)
// ═══════════════════════════════════════════════════════════════════════════

function AppView({
    topology,
    session,
    spectrum,
    appId,
}: {
    topology: string;
    session: SessionData;
    spectrum: string;
    appId: string;
}) {
    const [activeView, setActiveView] = useState<string>("main");
    const [userData, setUserData] = useState<unknown[]>(session.userData);
    const [ownerData, setOwnerData] = useState<unknown[]>(session.ownerData);
    const theme = SPECTRUM_THEMES[spectrum] || SPECTRUM_THEMES.eco;

    // Owner gets view tabs; student only sees main
    const isOwner = session.role === "owner";

    // Extract view names from topology
    const viewNames = ["main"];
    const viewRegex = /@view\s+(\w+)/g;
    let match;
    while ((match = viewRegex.exec(topology)) !== null) {
        viewNames.push(match[1]);
    }

    // Ref to MfRenderer container for collecting form values
    const rendererRef = useRef<HTMLDivElement>(null);

    // ── Action handler with optimistic update ──
    const handleAction = useCallback(
        (actionType: number, slotIndex: number, payload?: unknown) => {
            // Optimistic local update
            const prevUserData = [...userData];

            // ── action:6 on admin view: collect input values as payload ──
            let finalPayload = payload;
            if (actionType === 6 && activeView === "admin" && isOwner && rendererRef.current) {
                const inputs = rendererRef.current.querySelectorAll("input");
                const values: unknown[] = [];
                inputs.forEach((input) => {
                    const v = input.value.trim();
                    values.push(v === "" ? null : isNaN(Number(v)) ? v : Number(v));
                });
                finalPayload = values;
                // Optimistic ownerData update
                const nextOwner = [...ownerData];
                for (let i = 0; i < values.length && i < nextOwner.length; i++) {
                    if (values[i] !== null) nextOwner[i] = values[i];
                }
                setOwnerData(nextOwner);
            }

            if (actionType === 4 && slotIndex >= 0 && slotIndex < userData.length) {
                // increment
                const next = [...userData];
                next[slotIndex] = (Number(next[slotIndex]) || 0) + 1;
                setUserData(next);
            } else if (actionType === 5 && slotIndex >= 0 && slotIndex < userData.length) {
                // decrement
                const next = [...userData];
                next[slotIndex] = Math.max(0, (Number(next[slotIndex]) || 0) - 1);
                setUserData(next);
            } else if (actionType === 7 && slotIndex >= 0 && slotIndex < userData.length) {
                // toggle
                const next = [...userData];
                next[slotIndex] = next[slotIndex] ? 0 : 1;
                setUserData(next);
            }

            // Fire and forget to API
            fetch(`/api/apps/${appId}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.userId,
                    pin: session.pin,
                    actionType,
                    slotIndex,
                    payload: finalPayload,
                    view: activeView,
                }),
            })
                .then((r) => {
                    if (!r.ok) {
                        setUserData(prevUserData);
                        console.error("[Manifold] Action failed:", r.status);
                    }
                    return r.json();
                })
                .then((data) => {
                    if (data.ownerData) setOwnerData(data.ownerData);
                    if (data.userData) setUserData(data.userData);
                })
                .catch(() => {
                    setUserData(prevUserData);
                });
        },
        [userData, ownerData, activeView, isOwner, appId, session.userId, session.pin],
    );

    return (
        <Box style={{ minHeight: "100vh", background: theme.bg }}>
            {/* View tabs for owner */}
            {isOwner && viewNames.length > 1 && (
                <Box
                    style={{
                        borderBottom: `1px solid ${theme.accent}20`,
                        padding: "4px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <Text size="xs" ff="monospace" style={{ color: theme.fg, opacity: 0.4 }}>
                        {session.username} · owner
                    </Text>
                    <Box style={{ flex: 1 }} />
                    <Tabs
                        value={activeView}
                        onChange={(v) => setActiveView(v || "main")}
                        variant="pills"
                        radius="sm"
                        styles={{
                            tab: {
                                color: theme.fg,
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                padding: "4px 12px",
                                "&[dataActive]": { background: `${theme.accent}30`, color: theme.accent },
                            },
                        }}
                    >
                        <Tabs.List>
                            {viewNames.map((v) => (
                                <Tabs.Tab key={v} value={v}>
                                    {v}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs>
                </Box>
            )}

            {/* Student header */}
            {!isOwner && (
                <Box
                    style={{
                        padding: "4px 16px",
                        borderBottom: `1px solid ${theme.accent}10`,
                    }}
                >
                    <Text size="xs" ff="monospace" style={{ color: theme.fg, opacity: 0.3 }}>
                        {session.username}
                    </Text>
                </Box>
            )}

            {/* Renderer */}
            <MfRenderer
                ref={rendererRef}
                source={topology}
                ownerData={ownerData}
                userData={userData}
                activeView={activeView}
                onAction={handleAction}
            />
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function AppPage() {
    const { id } = useParams();
    const [phase, setPhase] = useState<"loading" | "gate" | "app">("loading");
    const [appMeta, setAppMeta] = useState<AppMeta | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch app metadata (topology + spectrum) on mount
    useEffect(() => {
        if (!id) return;
        fetch(`/api/apps/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json();
            })
            .then((data) => {
                setAppMeta({
                    topology: data.topology,
                    spectrum: data.spectrum || "eco",
                    world: data.world || null,
                    name: data.name || null,
                });
                setPhase("gate");
            })
            .catch((e) => setError(e.message));
    }, [id]);

    // Error state
    if (error) {
        return (
            <Box
                style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#111",
                }}
            >
                <Stack align="center" gap="sm">
                    <Text size="xl">⊞</Text>
                    <Text c="red.4" size="sm" ff="monospace">
                        App not found
                    </Text>
                    <Text c="dimmed" size="xs" ff="monospace">
                        {error}
                    </Text>
                </Stack>
            </Box>
        );
    }

    // Loading state
    if (phase === "loading" || !appMeta) {
        const theme = SPECTRUM_THEMES.eco;
        return (
            <Box
                style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme.bg,
                }}
            >
                <Loader color={theme.accent} size="sm" />
            </Box>
        );
    }

    // Gate phase
    if (phase === "gate") {
        return (
            <PinGate
                appMeta={appMeta}
                appId={id as string}
                onVerified={(s) => {
                    setSession(s);
                    setPhase("app");
                }}
            />
        );
    }

    // App phase
    if (phase === "app" && session) {
        return (
            <AppView
                topology={appMeta.topology}
                session={session}
                spectrum={appMeta.spectrum}
                appId={id as string}
            />
        );
    }

    return null;
}
