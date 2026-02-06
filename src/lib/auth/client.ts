// ═══════════════════════════════════════════════════════════════════════════
// CLIENT AUTH — Browser-side certificate management + trajectory computation
// Certificate lives in localStorage. Math duplicated from server (pure JS).
// ═══════════════════════════════════════════════════════════════════════════

const CERT_KEY = "manifold_cert";

export interface ClientCertificate {
    id: string;
    seed: string;   // BigInt as string
    zeta: number;
    issuedAt: number;
}

export interface AuthUser {
    id: string;
    email: string | null;
    displayName: string | null;
}

// ─── Certificate Storage ─────────────────────────────────────────────────────

export function getCertificate(): ClientCertificate | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CERT_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function storeCertificate(cert: ClientCertificate): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(CERT_KEY, JSON.stringify(cert));
}

export function clearCertificate(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CERT_KEY);
}

// ─── Client-Side Matrix Math (duplicated from server for trajectory) ─────────

const PHI = (1 + Math.sqrt(5)) / 2;

type Matrix2 = [[number, number], [number, number]];

function matMul(a: Matrix2, b: Matrix2): Matrix2 {
    return [
        [
            a[0][0] * b[0][0] + a[0][1] * b[1][0],
            a[0][0] * b[0][1] + a[0][1] * b[1][1],
        ],
        [
            a[1][0] * b[0][0] + a[1][1] * b[1][0],
            a[1][0] * b[0][1] + a[1][1] * b[1][1],
        ],
    ];
}

function matPow(m: Matrix2, n: number): Matrix2 {
    if (n === 0) return [[1, 0], [0, 1]];
    if (n === 1) return m;
    if (n % 2 === 0) {
        const half = matPow(m, n / 2);
        return matMul(half, half);
    }
    return matMul(m, matPow(m, n - 1));
}

function computeTrajectory(zeta: number, n: number): string {
    const M: Matrix2 = [[PHI, zeta], [zeta, PHI]];
    const powered = matPow(M, n);
    const eigenPlus = powered[0][0] + powered[0][1];
    const eigenMinus = powered[0][0] - powered[0][1];
    const trace = powered[0][0] + powered[1][1];
    const det = powered[0][0] * powered[1][1] - powered[0][1] * powered[1][0];
    return `${eigenPlus.toFixed(10)}:${eigenMinus.toFixed(10)}:${trace.toFixed(10)}:${det.toFixed(10)}`;
}

// ─── Auth API Calls ──────────────────────────────────────────────────────────

/** Request enrollment (Step 1: user requests, awaits admin approval) */
export async function requestEnrollment(
    id: string,
    geo: { lat: number; lon: number },
    email?: string,
    displayName?: string
): Promise<{ token: string }> {
    const res = await fetch("/api/auth/enroll/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, geo, email, displayName }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Enrollment request failed");
    }

    return res.json();
}

/** Check if current session is valid (GET /api/auth/me) */
export async function checkSession(): Promise<AuthUser | null> {
    try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
    } catch {
        return null;
    }
}

/** Full challenge-response authentication using stored certificate */
export async function authenticate(cert: ClientCertificate): Promise<AuthUser | null> {
    // Step 1: Request challenge
    const challengeRes = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cert.id }),
    });

    if (!challengeRes.ok) return null;
    const { challengeId, n } = await challengeRes.json();

    // Step 2: Compute trajectory on client
    const trajectory = computeTrajectory(cert.zeta, n);

    // Step 3: Send proof to server
    const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, trajectory }),
    });

    if (!verifyRes.ok) return null;
    const data = await verifyRes.json();

    if (data.authenticated && data.user) {
        return data.user;
    }
    return null;
}

/** Logout — clear server session + local certificate */
export async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearCertificate();
}
