// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE PAY — Web Payments API integration
// ═══════════════════════════════════════════════════════════════════════════

declare global {
    interface Window {
        google?: {
            payments: {
                api: {
                    PaymentsClient: new (config: { environment: string }) => GooglePayClient;
                };
            };
        };
    }
}

interface GooglePayClient {
    isReadyToPay(config: GooglePayConfig): Promise<{ result: boolean }>;
    loadPaymentData(config: GooglePayConfig & TransactionConfig): Promise<GooglePayPaymentData>;
    createButton(config: { onClick: () => void }): HTMLElement;
}

interface GooglePayConfig {
    apiVersion: number;
    apiVersionMinor: number;
    allowedPaymentMethods: PaymentMethod[];
}

interface PaymentMethod {
    type: string;
    parameters: {
        allowedAuthMethods: string[];
        allowedCardNetworks: string[];
    };
    tokenizationSpecification: {
        type: string;
        parameters: {
            gateway: string;
            gatewayMerchantId: string;
        };
    };
}

interface TransactionConfig {
    transactionInfo: {
        totalPriceStatus: string;
        totalPrice: string;
        currencyCode: string;
    };
    merchantInfo: {
        merchantId: string;
        merchantName: string;
    };
}

interface GooglePayPaymentData {
    paymentMethodData: {
        tokenizationData: {
            token: string;
        };
    };
}

const GPAY_CONFIG: GooglePayConfig = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
        {
            type: "CARD",
            parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["MASTERCARD", "VISA"],
            },
            tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                    gateway: "example", // Replace with actual gateway
                    gatewayMerchantId: process.env.NEXT_PUBLIC_GPAY_MERCHANT_ID || "",
                },
            },
        },
    ],
};

/**
 * Check if Google Pay is available.
 */
export async function isGooglePayAvailable(): Promise<boolean> {
    if (typeof window === "undefined" || !window.google?.payments) {
        return false;
    }

    try {
        const client = new window.google.payments.api.PaymentsClient({
            environment: "TEST",
        });
        const result = await client.isReadyToPay(GPAY_CONFIG);
        return result.result;
    } catch {
        return false;
    }
}

/**
 * Request payment via Google Pay.
 * 
 * @param amount - Amount to charge
 * @param currency - Currency code (default: BRL)
 * @returns Payment data with token
 */
export async function requestPayment(
    amount: number,
    currency = "BRL"
): Promise<GooglePayPaymentData> {
    if (typeof window === "undefined" || !window.google?.payments) {
        throw new Error("Google Pay not available");
    }

    const client = new window.google.payments.api.PaymentsClient({
        environment: "TEST",
    });

    const isReady = await client.isReadyToPay(GPAY_CONFIG);
    if (!isReady.result) {
        throw new Error("Google Pay not available on this device");
    }

    const paymentData = await client.loadPaymentData({
        ...GPAY_CONFIG,
        transactionInfo: {
            totalPriceStatus: "FINAL",
            totalPrice: amount.toFixed(2),
            currencyCode: currency,
        },
        merchantInfo: {
            merchantId: process.env.NEXT_PUBLIC_GPAY_MERCHANT_ID || "",
            merchantName: process.env.NEXT_PUBLIC_GPAY_MERCHANT_NAME || "Manifold",
        },
    });

    return paymentData;
}

/**
 * Create a Google Pay button element.
 */
export function createGPayButton(onClick: () => void): HTMLElement | null {
    if (typeof window === "undefined" || !window.google?.payments) {
        return null;
    }

    const client = new window.google.payments.api.PaymentsClient({
        environment: "TEST",
    });

    return client.createButton({ onClick });
}
