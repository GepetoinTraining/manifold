"use client";

// ═══════════════════════════════════════════════════════════════════════════
// INTERVIEW — Center column: conversation interface
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import type { InterviewPhase } from "@/lib/interview/phases";
import { PHASES, getPhase, getNextPhase } from "@/lib/interview/phases";
import { Sliders } from "./Sliders";

export interface Message {
    role: "user" | "assistant";
    content: string;
}

interface InterviewProps {
    messages: Message[];
    currentPhase: InterviewPhase;
    selectedNodeId?: string | null;
    temperature: number;
    luminosity: number;
    friction: number;
    loading?: boolean;
    onSendMessage: (message: string) => void;
    onPhaseChange: (phase: InterviewPhase) => void;
    onTemperatureChange: (value: number) => void;
    onLuminosityChange: (value: number) => void;
    onFrictionChange: (value: number) => void;
}

export function Interview({
    messages,
    currentPhase,
    selectedNodeId,
    temperature,
    luminosity,
    friction,
    loading = false,
    onSendMessage,
    onPhaseChange,
    onTemperatureChange,
    onLuminosityChange,
    onFrictionChange,
}: InterviewProps) {
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const phase = getPhase(currentPhase);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(() => {
        if (!input.trim() || loading) return;
        onSendMessage(input.trim());
        setInput("");
    }, [input, loading, onSendMessage]);

    // Show edit prompt when a node is selected
    const editPrompt = selectedNodeId
        ? `What would you like to change about "${selectedNodeId}"?`
        : null;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRight: "1px solid rgba(200,190,170,0.08)",
            }}
        >
            {/* Phase indicator */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(200,190,170,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                {PHASES.filter((p) => !p.isPostGeneration).map((p, i) => (
                    <button
                        key={p.id}
                        onClick={() => onPhaseChange(p.id)}
                        style={{
                            padding: "6px 12px",
                            background:
                                p.id === currentPhase
                                    ? "rgba(201,162,39,0.15)"
                                    : "transparent",
                            border:
                                p.id === currentPhase
                                    ? "1px solid rgba(201,162,39,0.4)"
                                    : "1px solid rgba(200,190,170,0.1)",
                            borderRadius: "20px",
                            color: p.id === currentPhase ? "#c9a227" : "#8a8070",
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {i + 1}. {p.name}
                    </button>
                ))}
            </div>

            {/* Phase description */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(200,190,170,0.08)",
                }}
            >
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#e8e0d0" }}>
                    {phase.name}
                </div>
                <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "2px" }}>
                    {phase.description}
                </div>
            </div>

            {/* Sliders for vibes phase */}
            {currentPhase === "vibes" && (
                <div style={{ padding: "16px", borderBottom: "1px solid rgba(200,190,170,0.08)" }}>
                    <Sliders
                        temperature={temperature}
                        luminosity={luminosity}
                        friction={friction}
                        onTemperatureChange={onTemperatureChange}
                        onLuminosityChange={onLuminosityChange}
                        onFrictionChange={onFrictionChange}
                    />
                </div>
            )}

            {/* Chat messages */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                }}
            >
                {messages.length === 0 && (
                    <div
                        style={{
                            color: "#8a8070",
                            textAlign: "center",
                            marginTop: "40px",
                            fontSize: "13px",
                            lineHeight: 1.8,
                        }}
                    >
                        <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.3 }}>
                            ⊞
                        </div>
                        Let&apos;s build something amazing.
                        <br />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>
                            Describe your app and I&apos;ll help you create it.
                        </span>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background:
                                msg.role === "user"
                                    ? "rgba(201,162,39,0.08)"
                                    : "rgba(200,190,170,0.04)",
                            border: `1px solid ${msg.role === "user"
                                    ? "rgba(201,162,39,0.2)"
                                    : "rgba(200,190,170,0.08)"
                                }`,
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                                marginBottom: "6px",
                            }}
                        >
                            {msg.role === "user" ? "YOU" : "MANIFOLD"}
                        </div>
                        <div
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                whiteSpace: "pre-wrap",
                                color: "#e8e0d0",
                            }}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div
                        style={{
                            padding: "12px 16px",
                            color: "#c9a227",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "12px",
                        }}
                    >
                        ◌ Thinking...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Edit prompt when node selected */}
            {editPrompt && (
                <div
                    style={{
                        padding: "12px 16px",
                        background: "rgba(201,162,39,0.08)",
                        borderTop: "1px solid rgba(201,162,39,0.2)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#c9a227",
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        SELECTED: {selectedNodeId}
                    </div>
                    <div style={{ fontSize: "13px", color: "#e8e0d0", marginTop: "4px" }}>
                        {editPrompt}
                    </div>
                </div>
            )}

            {/* Input */}
            <div
                style={{
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(200,190,170,0.08)",
                    display: "flex",
                    gap: "8px",
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={
                        selectedNodeId
                            ? "Describe the change..."
                            : phase.questions[0] || "Describe your app..."
                    }
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "rgba(200,190,170,0.06)",
                        border: "1px solid rgba(200,190,170,0.1)",
                        color: "#e8e0d0",
                        fontSize: "14px",
                        fontFamily: "'DM Sans', sans-serif",
                        outline: "none",
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{
                        padding: "12px 20px",
                        borderRadius: "10px",
                        background: loading ? "#8a8070" : "#c9a227",
                        color: "#0f0e0c",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: loading ? "default" : "pointer",
                    }}
                >
                    →
                </button>
            </div>
        </div>
    );
}
