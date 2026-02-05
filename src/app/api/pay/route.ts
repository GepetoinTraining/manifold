import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { paymentToken, amount, currency = "BRL" } = await request.json();

        // Google Pay payment processing stub
        // In production, this would integrate with a payment gateway

        console.log("[Manifold Pay] Processing payment:", {
            amount,
            currency,
            tokenPreview: paymentToken?.substring(0, 20) + "...",
        });

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // For v1, just acknowledge the payment
        return NextResponse.json({
            success: true,
            transactionId: crypto.randomUUID(),
            message: "Payment processed (stub)",
        });
    } catch (error) {
        console.error("Payment error:", error);
        return NextResponse.json(
            { error: "Payment failed" },
            { status: 500 }
        );
    }
}
