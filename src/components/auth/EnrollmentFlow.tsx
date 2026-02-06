"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ENROLLMENT FLOW — Multi-step enrollment UI
// Step 1: Enter ID/email → request geolocation
// Step 2: POST enroll/request
// Step 3: "Awaiting approval" (poll or manual)
// Step 4: On approval, store cert, auto-authenticate
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { requestEnrollment } from "@/lib/auth/client";
import type { ClientCertificate } from "@/lib/auth/client";

type EnrollStep = "form" | "requesting" | "pending" | "approved" | "error";

interface EnrollmentFlowProps {
    onCertificateReceived: (cert: ClientCertificate) => void;
    onCancel?: () => void;
}

export function EnrollmentFlow({ onCertificateReceived, onCancel }: EnrollmentFlowProps) {
    const [step, setStep] = useState<EnrollStep>("form");
    const [id, setId] = useState("");
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [enrollToken, setEnrollToken] = useState("");

    const handleSubmit = useCallback(async () => {
        if (!id.trim()) {
            setError("Please enter a user ID");
            return;
        }

        setStep("requesting");
        setError("");

        try {
            // Request geolocation
            let geo = { lat: 0, lon: 0 };
            try {
                const pos = await new Promise<GeolocationPosition>(
                    (resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 10000,
                        })
                );
                geo = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            } catch {
                // Geolocation denied/unavailable — use zeros (still valid, less unique)
                console.warn("Geolocation unavailable, using default coordinates");
            }

            const result = await requestEnrollment(
                id.trim(),
                geo,
                email.trim() || undefined,
                displayName.trim() || undefined
            );

            // First-time user: auto-approved, certificate returned directly
            if (result.certificate) {
                setStep("approved");
                onCertificateReceived(result.certificate);
                return;
            }

            // Re-enrollment: needs approval step
            setEnrollToken(result.token!);
            setStep("pending");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Enrollment failed");
            setStep("error");
        }
    }, [id, email, displayName]);

    // For now: self-approve flow (admin approves via API or we auto-approve)
    const handleCheckApproval = useCallback(async () => {
        if (!enrollToken) return;

        try {
            const res = await fetch("/api/auth/enroll/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: enrollToken }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.certificate) {
                    setStep("approved");
                    onCertificateReceived(data.certificate);
                }
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Not yet approved");
            }
        } catch {
            setError("Failed to check approval status");
        }
    }, [enrollToken, onCertificateReceived]);

    return (
        <div style={containerStyles}>
            <div style={{ fontSize: "28px", marginBottom: "16px", opacity: 0.3 }}>⊞</div>
            <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "8px", color: "#e8e0d0" }}>
                Enroll in Manifold
            </h2>
            <p style={{ fontSize: "12px", color: "#8a8070", marginBottom: "24px" }}>
                Your enrollment moment is unique — time + place → prime factorization → identity.
            </p>

            {step === "form" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="User ID (e.g. your handle)"
                        style={inputStyles}
                    />
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name (optional)"
                        style={inputStyles}
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        style={inputStyles}
                    />
                    <button onClick={handleSubmit} style={primaryButtonStyles}>
                        Enroll →
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} style={secondaryButtonStyles}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {step === "requesting" && (
                <div style={{ color: "#c9a227", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
                    ◌ Requesting enrollment...
                </div>
            )}

            {step === "pending" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                    <div style={{ color: "#c9a227", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
                        Enrollment requested. Token: {enrollToken.slice(0, 8)}...
                    </div>
                    <p style={{ fontSize: "12px", color: "#8a8070", textAlign: "center" }}>
                        Awaiting approval. Click below to check status or auto-approve.
                    </p>
                    <button onClick={handleCheckApproval} style={primaryButtonStyles}>
                        Check / Approve
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} style={secondaryButtonStyles}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {step === "approved" && (
                <div style={{ color: "#22c55e", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
                    ✓ Enrolled! Authenticating...
                </div>
            )}

            {step === "error" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                    <div style={{ color: "#c44a2f", fontSize: "13px" }}>{error}</div>
                    <button onClick={() => setStep("form")} style={secondaryButtonStyles}>
                        Try Again
                    </button>
                </div>
            )}

            {error && step !== "error" && (
                <div style={{ color: "#c44a2f", fontSize: "12px", marginTop: "8px" }}>{error}</div>
            )}
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
};

const inputStyles: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(200,190,170,0.06)",
    border: "1px solid rgba(200,190,170,0.15)",
    color: "#e8e0d0",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
};

const primaryButtonStyles: React.CSSProperties = {
    padding: "14px 32px",
    borderRadius: "10px",
    background: "#c9a227",
    color: "#0f0e0c",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
};

const secondaryButtonStyles: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "transparent",
    border: "1px solid rgba(200,190,170,0.15)",
    color: "#8a8070",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
};
