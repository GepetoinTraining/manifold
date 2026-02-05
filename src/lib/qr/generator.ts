// ═══════════════════════════════════════════════════════════════════════════
// QR GENERATOR — Generate QR codes from topology JSON
// ═══════════════════════════════════════════════════════════════════════════

import QRCode from "qrcode";
import type { Topology } from "@/lib/manifold/topology";

/**
 * Generate a QR code as a data URL from a topology.
 * 
 * @param topology - The topology to encode
 * @returns Data URL of the QR code image
 */
export async function generateQRDataURL(topology: Topology): Promise<string> {
    const jsonString = JSON.stringify(topology);
    return QRCode.toDataURL(jsonString, {
        width: 512,
        margin: 2,
        color: {
            dark: "#c9a227",
            light: "#0f0e0c",
        },
    });
}

/**
 * Generate a QR code as a PNG buffer.
 * 
 * @param topology - The topology to encode
 * @returns PNG buffer of the QR code
 */
export async function generateQRBuffer(topology: Topology): Promise<Buffer> {
    const jsonString = JSON.stringify(topology);
    return QRCode.toBuffer(jsonString, {
        width: 512,
        margin: 2,
        color: {
            dark: "#c9a227",
            light: "#0f0e0c",
        },
    });
}

/**
 * Generate a QR code SVG string.
 */
export async function generateQRSVG(topology: Topology): Promise<string> {
    const jsonString = JSON.stringify(topology);
    return QRCode.toString(jsonString, {
        type: "svg",
        margin: 2,
        color: {
            dark: "#c9a227",
            light: "#0f0e0c",
        },
    });
}
