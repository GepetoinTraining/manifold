import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
            <SignIn
                appearance={{
                    elements: {
                        rootBox: {
                            margin: "0 auto",
                        },
                    },
                }}
            />
        </div>
    );
}
