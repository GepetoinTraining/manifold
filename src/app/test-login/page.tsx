"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { storeCertificate, authenticate, type ClientCertificate } from "@/lib/auth/client";

export default function TestLoginPage() {
    const { user, isAuthenticated, isLoaded } = useAuth();
    const [id, setId] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const handleTestEnroll = async () => {
        if (!id.trim()) {
            setError("Enter an ID");
            return;
        }

        setStatus("Creating test certificate...");
        setError("");

        try {
            const res = await fetch("/api/auth/test-enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id.trim() }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const { certificate } = await res.json();
            setStatus("Certificate received. Storing and authenticating...");

            // Store cert in localStorage
            storeCertificate(certificate as ClientCertificate);

            // Authenticate with challenge-response
            const authUser = await authenticate(certificate as ClientCertificate);
            if (authUser) {
                setStatus(`Logged in as ${authUser.id}! Redirecting...`);
                setTimeout(() => {
                    window.location.href = "/build";
                }, 1000);
            } else {
                setError("Certificate stored but challenge-response failed. Try refreshing.");
                setStatus("");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Test enrollment failed");
            setStatus("");
        }
    };

    if (!isLoaded) {
        return <div style={pageStyles}><p style={{ color: "#8a8070" }}>Loading...</p></div>;
    }

    if (isAuthenticated && user) {
        return (
            <div style={pageStyles}>
                <h2 style={{ color: "#22c55e" }}>Already logged in</h2>
                <p style={{ color: "#8a8070" }}>User: {user.id}</p>
                <a href="/build" style={{ color: "#c9a227" }}>Go to Build</a>
            </div>
        );
    }

    return (
        <div style={pageStyles}>
            <h1 style={{ fontSize: "20px", color: "#e8e0d0", marginBottom: "8px" }}>Test Login</h1>
            <p style={{ fontSize: "12px", color: "#8a8070", marginBottom: "24px" }}>
                Bypass enrollment — direct certificate issuance
            </p>

            <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Test user ID"
                style={inputStyles}
            />
            <button onClick={handleTestEnroll} style={buttonStyles}>
                Create & Login
            </button>

            {status && <p style={{ color: "#c9a227", fontSize: "12px", marginTop: "16px" }}>{status}</p>}
            {error && <p style={{ color: "#c44a2f", fontSize: "12px", marginTop: "16px" }}>{error}</p>}
        </div>
    );
}

const pageStyles: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0f0e0c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e8e0d0",
    padding: "24px",
};

const inputStyles: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(200,190,170,0.06)",
    border: "1px solid rgba(200,190,170,0.15)",
    color: "#e8e0d0",
    fontSize: "14px",
    width: "260px",
    marginBottom: "12px",
    outline: "none",
};

const buttonStyles: React.CSSProperties = {
    padding: "14px 32px",
    borderRadius: "10px",
    background: "#c9a227",
    color: "#0f0e0c",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
};
