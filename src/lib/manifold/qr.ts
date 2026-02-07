/**
 * MANIFOLD QR
 * Generate QR codes from .mf source.
 *
 * Pipeline: .mf source → binary encode → gzip → QR image
 */

import QRCode from "qrcode";
import { encode } from "./binary";
import { compress } from "./compress";
import { createDictionary } from "./dictionary";
import { SPECTRUMS, type SpectrumColors } from "./engine";

export interface QRResult {
  dataUrl: string;
  rawBytes: number;
  compressedBytes: number;
  compressionRatio: string;
  qrVersion: number;
  sourceBytes: number;
}

export interface QROptions {
  spectrum?: string;
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Generate a QR code data URL from .mf source
 */
export async function generateQR(
  source: string,
  options: QROptions = {}
): Promise<QRResult> {
  const {
    spectrum = "void",
    width = 512,
    margin = 2,
    errorCorrectionLevel = "L", // Low for max data capacity
  } = options;

  const dictionary = createDictionary();
  const sourceBytes = new Blob([source]).size;

  // Encode to binary
  const binary = encode(source, dictionary);
  const rawBytes = binary.length;

  // Compress
  const compressed = await compress(binary);
  const compressedBytes = compressed.length;

  // Pick colors from spectrum
  const S = SPECTRUMS[spectrum] || SPECTRUMS.void;
  const dark = spectrum === "eco" ? "#2D2D2D" : S.primary;
  const light = spectrum === "eco" ? S.bg : S.bg;

  // Generate QR code as data URL
  // QR codes in byte mode: use the compressed binary directly
  const segments = [{ data: compressed, mode: "byte" as const }];

  const dataUrl = await QRCode.toDataURL(segments, {
    errorCorrectionLevel,
    width,
    margin,
    color: {
      dark,
      light,
    },
  });

  // Estimate QR version based on byte count
  // Version 1 = 17 bytes (L), Version 2 = 32, Version 3 = 53, Version 4 = 78
  const capacityTable = [
    17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
    321, 367, 425, 458, 520, 586, 644, 718, 792, 858,
  ];
  let qrVersion = 1;
  for (let i = 0; i < capacityTable.length; i++) {
    if (compressedBytes <= capacityTable[i]) {
      qrVersion = i + 1;
      break;
    }
  }

  return {
    dataUrl,
    rawBytes,
    compressedBytes,
    compressionRatio: `${((1 - compressedBytes / sourceBytes) * 100).toFixed(1)}%`,
    qrVersion,
    sourceBytes,
  };
}

/**
 * Generate a QR code as a downloadable PNG blob
 */
export async function generateQRBlob(
  source: string,
  options: QROptions = {}
): Promise<{ blob: Blob; result: QRResult }> {
  const result = await generateQR(source, options);

  // Convert data URL to blob
  const response = await fetch(result.dataUrl);
  const blob = await response.blob();

  return { blob, result };
}
