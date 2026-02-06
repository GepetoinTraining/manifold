"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AUTH PROVIDER — React context for topology-auth
// On mount: GET /api/auth/me → if 200 set user, if 401 try certificate
// ═══════════════════════════════════════════════════════════════════════════

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import {
    type AuthUser,
    type ClientCertificate,
    getCertificate,
    storeCertificate,
    clearCertificate,
    checkSession,
    authenticate,
    logout as clientLogout,
} from "@/lib/auth/client";

interface AuthContextValue {
    user: AuthUser | null;
    isLoaded: boolean;
    isAuthenticated: boolean;
    login: (cert: ClientCertificate) => Promise<boolean>;
    logout: () => Promise<void>;
    setCertificateAndLogin: (cert: ClientCertificate) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isLoaded: false,
    isAuthenticated: false,
    login: async () => false,
    logout: async () => {},
    setCertificateAndLogin: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // On mount: check existing session, then try certificate
    useEffect(() => {
        (async () => {
            // First: check if we have an active server session (cookie)
            const sessionUser = await checkSession();
            if (sessionUser) {
                setUser(sessionUser);
                setIsLoaded(true);
                return;
            }

            // No active session — try certificate-based auth
            const cert = getCertificate();
            if (cert) {
                const authUser = await authenticate(cert);
                if (authUser) {
                    setUser(authUser);
                    setIsLoaded(true);
                    return;
                }
                // Certificate failed (revoked?), clear it
                clearCertificate();
            }

            setIsLoaded(true);
        })();
    }, []);

    const login = useCallback(async (cert: ClientCertificate): Promise<boolean> => {
        const authUser = await authenticate(cert);
        if (authUser) {
            setUser(authUser);
            return true;
        }
        return false;
    }, []);

    const setCertificateAndLogin = useCallback(
        async (cert: ClientCertificate): Promise<boolean> => {
            storeCertificate(cert);
            return login(cert);
        },
        [login]
    );

    const logout = useCallback(async () => {
        await clientLogout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoaded,
                isAuthenticated: !!user,
                login,
                logout,
                setCertificateAndLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
