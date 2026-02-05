"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    RenderNode,
    loadCache,
    getCacheStats,
    isValidTopology,
    type Topology,
    type TopologyNode,
    type TopologyNodeV1,
} from "@/lib/manifold";
import { startScanner, stopScanner, checkCameraAccess } from "@/lib/qr/scanner";

export default function ScanPage() {
    const [mode, setMode] = useState<"scanner" | "paste" | "render" | "debug">("scanner");
    const [topology, setTopology] = useState<Topology | null>(null);
    const [pasteValue, setPasteValue] = useState("");
    const [hasCamera, setHasCamera] = useState<boolean | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [appState, setAppState] = useState<{
        cart: Array<{ id: number; name: string; price: number; qty: number }>;
        data: Record<string, unknown> | null;
        loading: boolean;
    }>({ cart: [], data: null, loading: false });
    const [toast, setToast] = useState<string | null>(null);

    // Load cache on mount
    useEffect(() => {
        loadCache();
        checkCameraAccess().then(setHasCamera);
    }, []);

    // Initialize scanner
    useEffect(() => {
        if (mode === "scanner" && hasCamera) {
            startScanner("qr-reader", handleScan);
        }
        return () => {
            stopScanner();
        };
    }, [mode, hasCamera]);

    const handleScan = (topo: Topology) => {
        setTopology(topo);
        setCurrentPage(topo.nav[0]);
        setMode("render");
    };

    const handlePaste = () => {
        try {
            const topo = JSON.parse(pasteValue);
            if (isValidTopology(topo)) {
                handleScan(topo);
            } else {
                alert("Invalid topology: missing v:1 or pages");
            }
        } catch (e) {
            alert("Invalid JSON: " + (e as Error).message);
        }
    };

    // Fetch from external API if specified
    useEffect(() => {
        if (topology?.api) {
            setAppState((s) => ({ ...s, loading: true }));
            fetch(topology.api)
                .then((r) => r.json())
                .then((data) => setAppState((s) => ({ ...s, data, loading: false })))
                .catch(() => setAppState((s) => ({ ...s, loading: false })));
        }
    }, [topology?.api]);

    const actionHandler = useCallback(
        (key: string, actions: string[]) => {
            if (!topology) return;

            actions.forEach((action) => {
                switch (action) {
                    case "navigate": {
                        const targetPage = topology.actions?.[key]?.target;
                        if (targetPage) setCurrentPage(targetPage);
                        break;
                    }
                    case "addToCart": {
                        const item = topology.actions?.[key]?.item;
                        if (item !== undefined) {
                            setAppState((s) => {
                                const existing = s.cart.find((c) => c.id === item);
                                if (existing) {
                                    return {
                                        ...s,
                                        cart: s.cart.map((c) =>
                                            c.id === item ? { ...c, qty: c.qty + 1 } : c
                                        ),
                                    };
                                }
                                const itemData = (s.data as { items?: Array<{ id: number; name: string; price: number }> })?.items?.[item] || {
                                    id: item,
                                    name: `Item ${item}`,
                                    price: 0,
                                };
                                return { ...s, cart: [...s.cart, { ...itemData, qty: 1 }] };
                            });
                            setToast("Item added");
                            setTimeout(() => setToast(null), 1500);
                        }
                        break;
                    }
                    case "removeFromCart": {
                        const removeId = topology.actions?.[key]?.item;
                        setAppState((s) => ({
                            ...s,
                            cart: s.cart
                                .map((c) =>
                                    c.id === removeId ? { ...c, qty: c.qty - 1 } : c
                                )
                                .filter((c) => c.qty > 0),
                        }));
                        break;
                    }
                    case "pay": {
                        setToast("Redirecting to payment...");
                        setTimeout(() => setToast(null), 2000);
                        break;
                    }
                    case "submit": {
                        const emitTarget = topology.actions?.[key]?.emit;
                        if (emitTarget) {
                            fetch(emitTarget.url, {
                                method: emitTarget.method || "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ cart: appState.cart, state: appState }),
                            }).catch(console.error);
                        }
                        break;
                    }
                    default:
                        console.log(`[Manifold] Action: ${action}`, key);
                }
            });
        },
        [topology, appState]
    );

    // Inject live data into text nodes (v1 format only)
    const injectData = (tree: TopologyNode): TopologyNodeV1 => {
        if (!tree || !Array.isArray(tree)) return tree as unknown as TopologyNodeV1;
        const [prime, text, children, actionKey] = tree as TopologyNodeV1;

        let processedText = text;
        if (processedText && typeof processedText === "string" && appState.data) {
            processedText = processedText.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
                const val = path.split(".").reduce((o: Record<string, unknown>, k: string) =>
                    o?.[k] as Record<string, unknown>, appState.data as Record<string, unknown>);
                return val !== undefined ? String(val) : `{{${path}}}`;
            });
        }

        const processedChildren = children?.map((c) => injectData(c as TopologyNode));
        return [prime, processedText, processedChildren ?? [], actionKey] as TopologyNodeV1;
    };

    // Scanner/Paste view
    if (mode === "scanner" || mode === "paste") {
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
                    position: "relative",
                }}
            >
                <div className="grain" />

                {/* Back button */}
                <Link
                    href="/"
                    style={{
                        position: "fixed",
                        top: "16px",
                        left: "16px",
                        background: "rgba(200,190,170,0.06)",
                        border: "1px solid rgba(200,190,170,0.12)",
                        color: "#8a8070",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "11px",
                        fontFamily: "'DM Mono', monospace",
                        zIndex: 200,
                    }}
                >
                    ← HOME
                </Link>

                <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "420px", width: "100%" }}>
                    {/* Logo */}
                    <div style={{ marginBottom: "40px" }}>
                        <div
                            style={{
                                fontSize: "12px",
                                letterSpacing: "6px",
                                textTransform: "uppercase",
                                color: "#8a8070",
                                fontFamily: "'DM Mono', monospace",
                                marginBottom: "10px",
                            }}
                        >
                            ∎ MANIFOLD
                        </div>
                        <div style={{ fontSize: "26px", fontWeight: 300, letterSpacing: "1px" }}>
                            Prime Topology Decoder
                        </div>
                        <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "6px" }}>
                            number → physics → interface
                        </div>
                    </div>

                    {mode === "paste" ? (
                        <div style={{ textAlign: "left" }}>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#8a8070",
                                    fontFamily: "'DM Mono', monospace",
                                    marginBottom: "8px",
                                    letterSpacing: "1px",
                                }}
                            >
                                PASTE TOPOLOGY JSON
                            </div>
                            <textarea
                                value={pasteValue}
                                onChange={(e) => setPasteValue(e.target.value)}
                                placeholder='{"v":1,"nav":[557],"pages":{...}}'
                                style={{
                                    width: "100%",
                                    height: "200px",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    background: "rgba(200,190,170,0.04)",
                                    border: "1px solid rgba(200,190,170,0.12)",
                                    color: "#e8e0d0",
                                    fontSize: "11px",
                                    fontFamily: "'DM Mono', monospace",
                                    outline: "none",
                                    resize: "vertical",
                                    lineHeight: 1.6,
                                }}
                            />
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <button
                                    onClick={() => setMode("scanner")}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        background: "transparent",
                                        border: "1px solid rgba(200,190,170,0.15)",
                                        color: "#8a8070",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePaste}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "8px",
                                        background: "#c9a227",
                                        border: "none",
                                        color: "#0f0e0c",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                    }}
                                >
                                    Decode →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Scanner box */}
                            <div
                                id="qr-reader"
                                style={{
                                    width: "260px",
                                    height: "260px",
                                    margin: "0 auto 32px",
                                    border: "2px solid rgba(200,190,170,0.12)",
                                    borderRadius: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                    background: "transparent",
                                }}
                            >
                                {hasCamera === false && (
                                    <div style={{ textAlign: "center", padding: "20px" }}>
                                        <div style={{ fontSize: "44px", marginBottom: "12px", opacity: 0.3 }}>⊞</div>
                                        <div style={{ fontSize: "13px", color: "#8a8070" }}>
                                            No camera access
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                                            Use paste instead
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMode("paste")}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "10px",
                                    background: "rgba(201,162,39,0.08)",
                                    border: "1px solid rgba(201,162,39,0.2)",
                                    color: "#c9a227",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    fontFamily: "'DM Sans', sans-serif",
                                    marginBottom: "12px",
                                }}
                            >
                                Paste Topology JSON
                            </button>

                            {/* Stats */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "12px",
                                    marginTop: "8px",
                                    fontSize: "12px",
                                    fontFamily: "'DM Mono', monospace",
                                }}
                            >
                                {[
                                    { l: "COMPONENTS", v: "43" },
                                    { l: "PHYSICS", v: "7 axes" },
                                    { l: "CACHE", v: String(getCacheStats().size) },
                                ].map((s, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: "10px",
                                            borderRadius: "8px",
                                            background: "rgba(200,190,170,0.04)",
                                            border: "1px solid rgba(200,190,170,0.08)",
                                        }}
                                    >
                                        <div style={{ color: "#c9a227", fontSize: "16px", fontWeight: 500, marginBottom: "2px" }}>
                                            {s.v}
                                        </div>
                                        <div style={{ color: "#8a8070", fontSize: "9px", letterSpacing: "1px" }}>{s.l}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Debug panel
    if (mode === "debug" && topology) {
        const allPrimes = new Set<number>();
        const collectPrimes = (nodes: TopologyNode[]) => {
            nodes.forEach((n) => {
                if (Array.isArray(n)) {
                    allPrimes.add(n[0]);
                    if (n[2]) collectPrimes(n[2]);
                }
            });
        };
        Object.values(topology.pages || {}).forEach((p) => collectPrimes(p.ui));
        const stats = getCacheStats();

        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0f0e0c",
                    fontFamily: "'DM Mono', monospace",
                    color: "#e8e0d0",
                    padding: "20px",
                    fontSize: "12px",
                    lineHeight: 1.8,
                    maxWidth: "640px",
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid rgba(200,190,170,0.1)",
                    }}
                >
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 500, color: "#c9a227" }}>⊞ MANIFOLD DEBUG</div>
                        <div style={{ color: "#8a8070", marginTop: "4px" }}>Topology factorization</div>
                    </div>
                    <button
                        onClick={() => setMode("render")}
                        style={{
                            background: "rgba(201,162,39,0.1)",
                            border: "1px solid rgba(201,162,39,0.3)",
                            color: "#c9a227",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        ← BACK
                    </button>
                </div>

                {/* Cache stats */}
                <div
                    style={{
                        padding: "16px",
                        borderRadius: "8px",
                        background: "rgba(200,190,170,0.04)",
                        border: "1px solid rgba(200,190,170,0.08)",
                        marginBottom: "16px",
                    }}
                >
                    <div style={{ color: "#8a8070", marginBottom: "12px", fontSize: "11px", letterSpacing: "2px" }}>
                        CACHE (DEDEKIND LATTICE)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                        <div>
                            <div style={{ color: "#8a8070", fontSize: "10px" }}>Cached</div>
                            <div style={{ color: "#c9a227", fontSize: "16px", fontWeight: 500 }}>{stats.size}</div>
                        </div>
                        <div>
                            <div style={{ color: "#8a8070", fontSize: "10px" }}>Hits</div>
                            <div style={{ color: "#5a9a3a", fontSize: "16px", fontWeight: 500 }}>{stats.hits}</div>
                        </div>
                        <div>
                            <div style={{ color: "#8a8070", fontSize: "10px" }}>Misses</div>
                            <div style={{ color: "#c44a2f", fontSize: "16px", fontWeight: 500 }}>{stats.misses}</div>
                        </div>
                    </div>
                </div>

                {/* Raw topology */}
                <div
                    style={{
                        padding: "16px",
                        borderRadius: "8px",
                        background: "rgba(200,190,170,0.04)",
                        border: "1px solid rgba(200,190,170,0.08)",
                    }}
                >
                    <div style={{ color: "#8a8070", marginBottom: "12px", fontSize: "11px", letterSpacing: "2px" }}>
                        RAW TOPOLOGY ({allPrimes.size} primes)
                    </div>
                    <pre
                        style={{
                            fontSize: "10px",
                            lineHeight: "1.6",
                            color: "#8a8070",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                        }}
                    >
                        {JSON.stringify(topology, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    // Render view
    if (mode === "render" && topology) {
        const page = topology.pages?.[currentPage];
        if (!page) {
            return (
                <div style={{ color: "#c44a2f", padding: "20px", fontFamily: "monospace" }}>
                    Page {currentPage} not found in topology
                </div>
            );
        }

        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0f0e0c",
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#e8e0d0",
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "560px",
                    margin: "0 auto",
                    position: "relative",
                }}
            >
                {page.ui.map((node, i) => (
                    <RenderNode
                        key={i}
                        node={injectData(node)}
                        actionHandler={actionHandler}
                        index={i}
                    />
                ))}

                {/* Cart footer */}
                {appState.cart.length > 0 && (
                    <div
                        style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "14px 20px",
                            background: "rgba(15,14,12,0.95)",
                            backdropFilter: "blur(20px)",
                            borderTop: "1px solid rgba(201,162,39,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            maxWidth: "560px",
                            margin: "0 auto",
                            zIndex: 100,
                            animation: "slideUp 0.3s ease",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "11px", color: "#8a8070", fontFamily: "'DM Mono', monospace" }}>
                                {appState.cart.reduce((s, c) => s + c.qty, 0)} items
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: 600, color: "#c9a227", fontFamily: "'DM Mono', monospace" }}>
                                R$ {appState.cart.reduce((s, c) => s + c.price * c.qty, 0).toFixed(2)}
                            </div>
                        </div>
                        <button
                            onClick={() => actionHandler("__pay", ["pay"])}
                            style={{
                                padding: "12px 28px",
                                borderRadius: "8px",
                                background: "#c9a227",
                                color: "#0f0e0c",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Order →
                        </button>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <div
                        style={{
                            position: "fixed",
                            top: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            background: "rgba(90,154,58,0.12)",
                            border: "1px solid rgba(90,154,58,0.3)",
                            color: "#5a9a3a",
                            fontSize: "12px",
                            fontFamily: "'DM Mono', monospace",
                            zIndex: 200,
                            animation: "slideDown 0.3s ease",
                        }}
                    >
                        ✓ {toast}
                    </div>
                )}

                {/* Controls */}
                <div style={{ position: "fixed", top: "12px", right: "12px", display: "flex", gap: "6px", zIndex: 200 }}>
                    <button
                        onClick={() => setMode("debug")}
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
                        ⊞ DEBUG
                    </button>
                    <button
                        onClick={() => {
                            setMode("scanner");
                            setTopology(null);
                        }}
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
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
