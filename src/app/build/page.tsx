"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
    RenderNode,
    isValidTopology,
    type Topology,
    type TopologyNode,
} from "@/lib/manifold";
import { SYSTEM_PROMPT } from "@/lib/encoder/system-prompt";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function BuildPage() {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [topology, setTopology] = useState<Topology | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/encode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await response.json();
            const text = data.content || data.error || "Error: No response";
            setMessages([...newMessages, { role: "assistant", content: text }]);

            // Try to extract topology JSON from response
            const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*"v"\s*:\s*1[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    const topo = JSON.parse(jsonMatch[1].trim());
                    if (isValidTopology(topo)) {
                        setTopology(topo);
                    }
                } catch {
                    // Not valid JSON yet
                }
            }
        } catch (e) {
            setMessages([
                ...newMessages,
                { role: "assistant", content: `Error: ${(e as Error).message}` },
            ]);
        }
        setLoading(false);
    }, [input, messages]);

    // Preview modal
    if (showPreview && topology) {
        const page = topology.pages?.[topology.nav[0]];
        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.9)",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        padding: "12px 20px",
                        borderBottom: "1px solid rgba(200,190,170,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ color: "#c9a227", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
                        PREVIEW
                    </div>
                    <button
                        onClick={() => setShowPreview(false)}
                        style={{
                            background: "rgba(200,190,170,0.06)",
                            border: "1px solid rgba(200,190,170,0.12)",
                            color: "#8a8070",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        ✕ CLOSE
                    </button>
                </div>
                <div
                    style={{
                        flex: 1,
                        overflow: "auto",
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "560px",
                            margin: "0 auto",
                            background: "#0f0e0c",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(200,190,170,0.12)",
                        }}
                    >
                        {page?.ui.map((node: TopologyNode, i: number) => (
                            <RenderNode key={i} node={node} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
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
                    <Link
                        href="/"
                        style={{
                            color: "#8a8070",
                            textDecoration: "none",
                            fontSize: "14px",
                        }}
                    >
                        ←
                    </Link>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#c9a227" }}>
                            ⊞ MANIFOLD ENCODER
                        </div>
                        <div
                            style={{
                                fontSize: "11px",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                                marginTop: "2px",
                            }}
                        >
                            Describe → Topology → QR
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {topology && (
                        <button
                            onClick={() => setShowPreview(true)}
                            style={{
                                background: "rgba(90,154,58,0.12)",
                                border: "1px solid rgba(90,154,58,0.3)",
                                color: "#5a9a3a",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontFamily: "'DM Mono', monospace",
                            }}
                        >
                            ▶ PREVIEW
                        </button>
                    )}
                    {user && (
                        <div
                            style={{
                                fontSize: "11px",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                            }}
                        >
                            {user.emailAddresses[0]?.emailAddress}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "16px 20px",
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
                        <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}>⊞</div>
                        Describe the app you want to build.
                        <br />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>
                            e.g. &quot;A restaurant menu with 4 items, a cart, and checkout&quot;
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
                            {msg.role === "user" ? "YOU" : "ENCODER"}
                        </div>
                        <div
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                whiteSpace: "pre-wrap",
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
                        ◌ Building topology...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

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
                            sendMessage();
                        }
                    }}
                    placeholder="Describe your app..."
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
                    onClick={sendMessage}
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
