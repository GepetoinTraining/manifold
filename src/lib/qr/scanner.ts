"use client";

// ═══════════════════════════════════════════════════════════════════════════
// QR SCANNER — html5-qrcode wrapper
// ═══════════════════════════════════════════════════════════════════════════

import { Html5Qrcode } from "html5-qrcode";
import { isValidTopology, type Topology } from "@/lib/manifold/topology";

let scannerInstance: Html5Qrcode | null = null;

/**
 * Start the QR scanner on a given element.
 * 
 * @param elementId - The DOM element ID to render the scanner in
 * @param onScan - Callback when a valid topology is scanned
 * @param onError - Optional error callback
 * @returns The scanner instance for cleanup
 */
export async function startScanner(
    elementId: string,
    onScan: (topology: Topology) => void,
    onError?: (err: string) => void
): Promise<Html5Qrcode> {
    // Stop any existing scanner
    if (scannerInstance) {
        try {
            await scannerInstance.stop();
        } catch {
            // Ignore stop errors
        }
    }

    scannerInstance = new Html5Qrcode(elementId);

    await scannerInstance.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
            try {
                const topo = JSON.parse(decodedText);
                if (isValidTopology(topo)) {
                    scannerInstance?.stop();
                    onScan(topo);
                }
            } catch {
                // Not valid JSON, keep scanning
            }
        },
        () => {
            // Ignore scan failures (normal during scanning)
        }
    ).catch((err) => {
        onError?.(err.toString());
    });

    return scannerInstance;
}

/**
 * Stop the QR scanner.
 */
export async function stopScanner(): Promise<void> {
    if (scannerInstance) {
        try {
            await scannerInstance.stop();
            scannerInstance = null;
        } catch {
            // Ignore stop errors
        }
    }
}

/**
 * Check if camera access is available.
 */
export async function checkCameraAccess(): Promise<boolean> {
    try {
        const devices = await Html5Qrcode.getCameras();
        return devices.length > 0;
    } catch {
        return false;
    }
}
