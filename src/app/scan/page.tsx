"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Container,
  Stack,
  Text,
  Title,
  Textarea,
  Button,
  Group,
  Paper,
  SegmentedControl,
  ScrollArea,
  Badge,
} from "@mantine/core";
import Link from "next/link";
import dynamic from "next/dynamic";
import MfRenderer from "@/components/manifold/MfRenderer";
import { decode } from "@/lib/manifold/binary";
import { smartDecompress } from "@/lib/manifold/compress";
import { createDictionary } from "@/lib/manifold/dictionary";
import { serialize, parse } from "@/lib/manifold/engine";

// Dynamic import for QR scanner (needs browser APIs)
const QrScanner = dynamic(
  () => import("@/components/manifold/QrScanner"),
  { ssr: false }
);

type ScanMode = "input" | "camera" | "render";
type InputMode = "paste" | "scan";

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>("input");
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [mfSource, setMfSource] = useState("");
  const [decodeStats, setDecodeStats] = useState<{
    compressedBytes: number;
    rawBytes: number;
    nodes: number;
    spectrum: string;
  } | null>(null);
  const [decodeError, setDecodeError] = useState("");

  const handleRenderFromPaste = () => {
    if (mfSource.trim()) {
      setDecodeStats(null);
      setMode("render");
    }
  };

  const handleQrScan = useCallback(async (data: Uint8Array) => {
    try {
      setDecodeError("");
      const compressedBytes = data.length;

      // Decompress (auto-detects gzip)
      const raw = await smartDecompress(data);
      const rawBytes = raw.length;

      // Decode binary → tree
      const dictionary = createDictionary();
      const result = decode(raw, dictionary);

      // Serialize tree back to .mf source for rendering
      const source = serialize(result.tree, result.directives);
      setMfSource(source);

      // Count nodes
      let nodeCount = 0;
      function count(nodes: typeof result.tree) {
        for (const n of nodes) {
          nodeCount++;
          if (n.children) count(n.children);
        }
      }
      count(result.tree);

      setDecodeStats({
        compressedBytes,
        rawBytes,
        nodes: nodeCount,
        spectrum: result.directives.spectrum || "unknown",
      });

      setMode("render");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Decode failed";
      setDecodeError(msg);
    }
  }, []);

  const handleBack = () => {
    setMode("input");
    setDecodeError("");
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "var(--mantine-color-dark-7)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-4)",
          flexShrink: 0,
        }}
      >
        <Group gap="md">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Text fw={500} size="md" c="ice.4" style={{ cursor: "pointer" }}>
              ⊞ Manifold
            </Text>
          </Link>
          <Text ff="monospace" size="xs" c="dimmed">
            decoder
          </Text>
        </Group>
        <Group gap="sm">
          {mode === "render" && decodeStats && (
            <>
              <Badge variant="dot" color="green" size="sm">
                {decodeStats.compressedBytes}b → {decodeStats.nodes} nodes
              </Badge>
              <Badge variant="light" color="ice" size="sm">
                @{decodeStats.spectrum}
              </Badge>
            </>
          )}
          {mode === "render" && (
            <Button
              variant="subtle"
              color="frost"
              size="xs"
              onClick={handleBack}
            >
              ← Back
            </Button>
          )}
        </Group>
      </Group>

      {mode === "input" ? (
        <Container size="sm" py="xl" style={{ flex: 1 }}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Text size="xl" c="ice.3">
                ⊞
              </Text>
              <Title order={3} fw={300} c="ice.2">
                Decode Topology
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Scan a QR code or paste .mf source to render through Φ.
              </Text>
            </Stack>

            {/* Mode switcher */}
            <Group justify="center">
              <SegmentedControl
                value={inputMode}
                onChange={(v) => setInputMode(v as InputMode)}
                size="sm"
                data={[
                  { label: "Paste .mf", value: "paste" },
                  { label: "Scan QR", value: "scan" },
                ]}
                styles={{
                  root: { background: "var(--mantine-color-dark-6)" },
                }}
              />
            </Group>

            {inputMode === "paste" ? (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: "var(--mantine-color-dark-6)",
                  border: "1px solid var(--mantine-color-dark-4)",
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text ff="monospace" size="xs" c="ice.5" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      .mf source
                    </Text>
                    <Text ff="monospace" size="xs" c="dimmed">
                      {new Blob([mfSource]).size} bytes
                    </Text>
                  </Group>
                  <Textarea
                    value={mfSource}
                    onChange={(e) => setMfSource(e.currentTarget.value)}
                    placeholder={`@spectrum eco\n\nnav.eco|\n text.brand.eco|My App\nhero.eco|\n text.title|Hello World\n button.primary.eco|Get Started`}
                    minRows={12}
                    maxRows={20}
                    autosize
                    styles={{
                      input: {
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "12.5px",
                        lineHeight: 1.7,
                        background: "var(--mantine-color-dark-8)",
                        border: "1px solid var(--mantine-color-dark-5)",
                        color: "var(--mantine-color-ice-3)",
                        tabSize: 2,
                      },
                    }}
                  />
                  <Button
                    color="ice"
                    fullWidth
                    size="md"
                    onClick={handleRenderFromPaste}
                    disabled={!mfSource.trim()}
                  >
                    Render through Φ
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: "var(--mantine-color-dark-6)",
                  border: "1px solid var(--mantine-color-dark-4)",
                  minHeight: 350,
                }}
              >
                <Stack gap="sm">
                  <Text ff="monospace" size="xs" c="ice.5" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    camera scanner
                  </Text>

                  <Box
                    style={{
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid var(--mantine-color-dark-5)",
                    }}
                  >
                    <QrScanner
                      onScan={handleQrScan}
                      onError={(err) => setDecodeError(err)}
                    />
                  </Box>

                  {decodeError && (
                    <Text c="red.4" size="sm" ta="center">
                      {decodeError}
                    </Text>
                  )}

                  <Text ff="monospace" size="xs" c="dimmed" ta="center">
                    Point camera at a Manifold QR code
                  </Text>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      ) : (
        <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Decode stats bar */}
          {decodeStats && (
            <Paper
              px="md"
              py={6}
              radius={0}
              style={{
                background: "var(--mantine-color-dark-8)",
                borderBottom: "1px solid var(--mantine-color-dark-5)",
                flexShrink: 0,
              }}
            >
              <Group gap="lg" justify="center">
                <Text ff="monospace" size="xs" c="dimmed">
                  compressed: <Text component="span" c="ice.3" inherit>{decodeStats.compressedBytes}b</Text>
                </Text>
                <Text ff="monospace" size="xs" c="dimmed">
                  raw binary: <Text component="span" c="ice.3" inherit>{decodeStats.rawBytes}b</Text>
                </Text>
                <Text ff="monospace" size="xs" c="dimmed">
                  nodes: <Text component="span" c="ice.3" inherit>{decodeStats.nodes}</Text>
                </Text>
                <Text ff="monospace" size="xs" c="dimmed">
                  spectrum: <Text component="span" c="ice.3" inherit>{decodeStats.spectrum}</Text>
                </Text>
              </Group>
            </Paper>
          )}
          <ScrollArea style={{ flex: 1 }}>
            <MfRenderer source={mfSource} />
          </ScrollArea>
        </Box>
      )}
    </Box>
  );
}
