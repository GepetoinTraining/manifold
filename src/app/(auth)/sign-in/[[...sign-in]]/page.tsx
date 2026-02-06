"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { SignInButton } from "@/components/auth/SignInButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
    const { isAuthenticated, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isAuthenticated) {
            router.push("/build");
        }
    }, [isLoaded, isAuthenticated, router]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0f0e0c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
            }}
        >
            <SignInButton mode="inline" />
        </div>
    );
}
