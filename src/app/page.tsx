import Link from "next/link";

export default function HomePage() {
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
      {/* Grain texture */}
      <div className="grain" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "8px",
            textTransform: "uppercase",
            color: "#8a8070",
            fontFamily: "'DM Mono', monospace",
            marginBottom: "12px",
          }}
        >
          ∎
        </div>
        <h1
          style={{
            fontSize: "42px",
            fontWeight: 300,
            letterSpacing: "4px",
            marginBottom: "12px",
          }}
        >
          MANIFOLD
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#8a8070",
            marginBottom: "8px",
            lineHeight: 1.7,
          }}
        >
          Prime-encoded topology decoder.
        </p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "56px",
          }}
        >
          number → physics → interface
        </p>

        {/* CTAs */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <Link
            href="/scan"
            style={{
              padding: "18px 32px",
              borderRadius: "12px",
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.25)",
              color: "#c9a227",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "22px" }}>⊞</span> Scan / Decode
          </Link>

          <Link
            href="/build"
            style={{
              padding: "18px 32px",
              borderRadius: "12px",
              background: "rgba(200,190,170,0.04)",
              border: "1px solid rgba(200,190,170,0.12)",
              color: "#e8e0d0",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "22px" }}>◇</span> Build / Encode
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: "56px",
            fontSize: "10px",
            color: "#64748b",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 2,
          }}
        >
          43 components · 7 physics axes · 178 variants
          <br />
          18 bytes topology · ∞ applications
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(200,190,170,0.08)",
            fontSize: "10px",
            color: "#64748b",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          © 2026 Manifold · Node Zero
        </div>
      </div>
    </div>
  );
}
