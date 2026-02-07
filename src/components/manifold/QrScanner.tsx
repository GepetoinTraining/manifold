"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Text, Stack, Button, Loader } from "@mantine/core";

interface QrScannerProps {
  onScan: (data: Uint8Array) => void;
  onError?: (error: string) => void;
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scannerId = "manifold-qr-scanner";

      // Ensure the element exists
      if (!document.getElementById(scannerId)) {
        const el = document.createElement("div");
        el.id = scannerId;
        containerRef.current.appendChild(el);
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      setStatus("scanning");

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Try to interpret as binary data
          // QR binary mode returns raw bytes; text mode returns string
          try {
            // If it's a data URL or base64, decode it
            if (decodedText.startsWith("data:")) {
              const base64 = decodedText.split(",")[1];
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              onScan(bytes);
            } else {
              // Try to decode as latin1 (raw bytes encoded as string)
              const bytes = new Uint8Array(decodedText.length);
              for (let i = 0; i < decodedText.length; i++) {
                bytes[i] = decodedText.charCodeAt(i);
              }
              onScan(bytes);
            }
          } catch {
            // If binary decode fails, pass as text bytes
            const bytes = new TextEncoder().encode(decodedText);
            onScan(bytes);
          }

          // Stop scanning after successful read
          scanner.stop().catch(() => {});
          setStatus("ready");
        },
        () => {
          // Scan failure (no QR found in frame) — silent, keep scanning
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access failed";
      setErrorMsg(msg);
      setStatus("error");
      onError?.(msg);
    }
  }, [onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <Box ref={containerRef}>
      {status === "loading" && (
        <Stack align="center" py="xl" gap="md">
          <Loader color="ice" size="md" />
          <Text size="sm" c="dimmed">Requesting camera access...</Text>
        </Stack>
      )}
      {status === "error" && (
        <Stack align="center" py="xl" gap="md">
          <Text c="red.4" size="sm">{errorMsg}</Text>
          <Button variant="light" color="ice" size="sm" onClick={startScanner}>
            Retry
          </Button>
        </Stack>
      )}
      {status === "ready" && (
        <Stack align="center" py="md" gap="md">
          <Text size="sm" c="green.4">QR code detected!</Text>
          <Button variant="light" color="ice" size="sm" onClick={startScanner}>
            Scan another
          </Button>
        </Stack>
      )}
    </Box>
  );
}
