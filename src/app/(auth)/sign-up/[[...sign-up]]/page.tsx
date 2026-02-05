import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
            <SignUp
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
