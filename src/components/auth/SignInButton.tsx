"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SIGN IN BUTTON — If cert exists → auto challenge-response.
//                   If no cert → show enrollment flow.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { EnrollmentFlow } from "./EnrollmentFlow";
import {
    getCertificate,
    type ClientCertificate,
} from "@/lib/auth/client";

interface SignInButtonProps {
    children?: React.ReactNode;
    mode?: "modal" | "inline";
}

export function SignInButton({ children, mode = "modal" }: SignInButtonProps) {
    const { login, setCertificateAndLogin } = useAuth();
    const [showEnrollment, setShowEnrollment] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);
    const [error, setError] = useState("");

    const handleClick = useCallback(async () => {
        setError("");

        // Check if we already have a certificate
        const cert = getCertificate();
        if (cert) {
            // Try to authenticate with existing cert
            setAuthenticating(true);
            const success = await login(cert);
            setAuthenticating(false);

            if (success) return; // Authenticated!

            // Certificate didn't work (revoked?) — show enrollment
            setError("Your certificate is no longer valid. Please re-enroll.");
        }

        // No cert or cert failed — show enrollment
        setShowEnrollment(true);
    }, [login]);

    const handleCertificateReceived = useCallback(
        async (cert: ClientCertificate) => {
            setAuthenticating(true);
            const success = await setCertificateAndLogin(cert);
            setAuthenticating(false);

            if (!success) {
                setError("Authentication failed after enrollment. Please try again.");
            }

            setShowEnrollment(false);
        },
        [setCertificateAndLogin]
    );

    if (authenticating) {
        return (
            <div style={{ color: "#c9a227", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
                ◌ Authenticating...
            </div>
        );
    }

    if (showEnrollment) {
        if (mode === "modal") {
            return (
                <div style={modalOverlayStyles}>
                    <div style={modalContentStyles}>
                        <EnrollmentFlow
                            onCertificateReceived={handleCertificateReceived}
                            onCancel={() => setShowEnrollment(false)}
                        />
                    </div>
                </div>
            );
        }

        return (
            <EnrollmentFlow
                onCertificateReceived={handleCertificateReceived}
                onCancel={() => setShowEnrollment(false)}
            />
        );
    }

    return (
        <div>
            {children ? (
                <div onClick={handleClick} style={{ cursor: "pointer" }}>
                    {children}
                </div>
            ) : (
                <button onClick={handleClick} style={defaultButtonStyles}>
                    Sign In
                </button>
            )}
            {error && (
                <div style={{ color: "#c44a2f", fontSize: "12px", marginTop: "8px" }}>
                    {error}
                </div>
            )}
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const modalOverlayStyles: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};

const modalContentStyles: React.CSSProperties = {
    background: "#0f0e0c",
    border: "1px solid rgba(200,190,170,0.15)",
    borderRadius: "16px",
    padding: "32px",
    minWidth: "360px",
    maxWidth: "440px",
};

const defaultButtonStyles: React.CSSProperties = {
    padding: "14px 32px",
    borderRadius: "10px",
    background: "#c9a227",
    color: "#0f0e0c",
    border: "none",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
};
