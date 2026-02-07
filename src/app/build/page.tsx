"use client";

// ═══════════════════════════════════════════════════════════════════════════
// BUILD PAGE — Claude-powered interview → .mf topology builder
//
// Layout: [ Specs Sidebar | Chat ] (40%)  +  [ Preview ] (60%)
//         sidebar = 40% of the 40% (16% total), collapsible
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Group,
  Stack,
  Text,
  Button,
  Badge,
  ScrollArea,
  Modal,
  Image,
  Loader,
  Textarea,
  Paper,
  SegmentedControl,
  Tabs,
  ActionIcon,
  Tooltip,
  TextInput,
  CopyButton,
} from "@mantine/core";
import Link from "next/link";
import MfRenderer from "@/components/manifold/MfRenderer";
import { Chat, type Message } from "@/components/builder/Chat";
import { SpecSidebar, type Tag } from "@/components/builder/SpecSidebar";
import {
  parse,
  SAMPLE_ECO,
  SAMPLE_VOID,
  SAMPLE_BRASS,
  SAMPLE_FUNCTIONAL,
  type MfNode,
} from "@/lib/manifold/engine";
import { generateQR, type QRResult } from "@/lib/manifold/qr";
import type { InterviewPhase } from "@/lib/interview/phases";

// ─── SAMPLES ────────────────────────────────────────────────────────────────

const SAMPLES: Record<string, string> = {
  eco: SAMPLE_ECO,
  void: SAMPLE_VOID,
  brass: SAMPLE_BRASS,
  functional: SAMPLE_FUNCTIONAL,
};

// ─── BUILD PAGE ─────────────────────────────────────────────────────────────

export default function BuildPage() {
  // ── INTERVIEW STATE ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("identity");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── DEV MODE ────────────────────────────────────────────────────────────
  const [devMode, setDevMode] = useState(false);

  // ── USER SESSION (pin auth) ─────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [userPin, setUserPin] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [savedAppId, setSavedAppId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mf_session");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        setUserId(s.userId);
        setUserPin(s.pin);
      } catch { /* ignore */ }
    }
  }, []);

  // ── TOPOLOGY STATE ──────────────────────────────────────────────────────
  const [source, setSource] = useState(SAMPLE_ECO);
  const [previewTab, setPreviewTab] = useState<string | null>("preview");

  // ── QR STATE ────────────────────────────────────────────────────────────
  const [qrOpen, setQrOpen] = useState(false);
  const [qrResult, setQrResult] = useState<QRResult | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // ── VIEWER REF (for screenshots) ────────────────────────────────────────
  const viewerRef = useRef<HTMLDivElement>(null);

  // ── DERIVED ─────────────────────────────────────────────────────────────
  const parsed = useMemo(() => {
    try {
      return parse(source);
    } catch {
      return null;
    }
  }, [source]);

  const nodeCount = useMemo(() => {
    if (!parsed) return 0;
    function count(nodes: MfNode[]): number {
      let c = 0;
      for (const n of nodes) {
        c++;
        if (n.children) c += count(n.children);
      }
      return c;
    }
    return count(parsed.tree);
  }, [parsed]);

  const byteSize = useMemo(() => new Blob([source]).size, [source]);

  // ── INTERVIEW HANDLER ───────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            phase: currentPhase,
          }),
        });

        if (!response.ok) throw new Error("Interview API error");
        const data = await response.json();

        // Add assistant message
        if (data.message) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.message },
          ]);
        }

        // Extract tags → sidebar
        if (data.tags && Array.isArray(data.tags)) {
          const newTags: Tag[] = data.tags.map(
            (t: { label: string; value: string }, i: number) => ({
              id: `tag-${Date.now()}-${i}`,
              label: t.label,
              value: t.value,
              phase: currentPhase,
              editable: true,
            })
          );
          setTags((prev) => [...prev, ...newTags]);
        }

        // Topology generated → update source
        if (data.topology) {
          setSource(data.topology);
          setPreviewTab("preview");
        }

        // Phase advance
        if (data.nextPhase) {
          setCurrentPhase(data.nextPhase);
        }
      } catch (error) {
        console.error("Interview error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I had trouble processing that. Could you try again?",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, currentPhase]
  );

  // ── TAG HANDLERS ────────────────────────────────────────────────────────
  const handleTagUpdate = useCallback((id: string, newValue: string) => {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, value: newValue } : t))
    );
  }, []);

  const handleTagDelete = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTagAdd = useCallback(
    (label: string, value: string) => {
      setTags((prev) => [
        ...prev,
        {
          id: `tag-${Date.now()}`,
          label,
          value,
          phase: currentPhase,
          editable: true,
        },
      ]);
    },
    [currentPhase]
  );

  // ── QR HANDLERS ─────────────────────────────────────────────────────────
  const handleExportQR = useCallback(async () => {
    if (!parsed) return;
    setQrLoading(true);
    setQrOpen(true);
    try {
      const spectrum = parsed.directives.spectrum || "void";
      const result = await generateQR(source, { spectrum, width: 512 });
      setQrResult(result);
    } catch (err) {
      console.error("QR generation failed:", err);
    } finally {
      setQrLoading(false);
    }
  }, [source, parsed]);

  const handleDownloadQR = useCallback(() => {
    if (!qrResult) return;
    const a = document.createElement("a");
    a.href = qrResult.dataUrl;
    a.download = `manifold-${parsed?.directives.spectrum || "topology"}.png`;
    a.click();
  }, [qrResult, parsed]);

  // ── SCREENSHOT ──────────────────────────────────────────────────────────
  const handleScreenshot = useCallback(async () => {
    if (!viewerRef.current) return null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(viewerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      // Store on server for API Claude access
      try {
        await fetch("/api/screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
      } catch { /* silent */ }
      // Copy to clipboard as well
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch { /* clipboard may not be available */ }
      return dataUrl;
    } catch (err) {
      console.error("Screenshot failed:", err);
      return null;
    }
  }, []);

  // ── PIN AUTH ─────────────────────────────────────────────────────────────
  const handlePinSubmit = useCallback(async (mode: "login" | "register") => {
    setPinLoading(true);
    setPinError("");
    try {
      const body = mode === "login" ? { pin: pinInput } : {};
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "Auth failed");
        return;
      }
      setUserId(data.userId);
      setUserPin(data.pin);
      localStorage.setItem("mf_session", JSON.stringify({ userId: data.userId, pin: data.pin }));
      setPinModalOpen(false);
      setPinInput("");
    } catch {
      setPinError("Network error");
    } finally {
      setPinLoading(false);
    }
  }, [pinInput]);

  // ── SAVE APP ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!userId) {
      setPinModalOpen(true);
      return;
    }
    if (!parsed) return;

    setSaveLoading(true);
    try {
      if (savedAppId) {
        // Update existing
        const res = await fetch("/api/apps", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            appId: savedAppId,
            topology: source,
            spectrum: parsed.directives.spectrum || "eco",
          }),
        });
        const data = await res.json();
        if (res.ok) {
          console.log(`Updated app ${data.appId} → v${data.version}`);
        }
      } else {
        // Create new
        const res = await fetch("/api/apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            topology: source,
            spectrum: parsed.directives.spectrum || "eco",
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setSavedAppId(data.appId);
          console.log(`Saved new app ${data.appId}`);
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaveLoading(false);
    }
  }, [userId, savedAppId, source, parsed]);

  // ── RENDER ──────────────────────────────────────────────────────────────

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--mantine-color-dark-7)",
      }}
    >
      {/* ═══ HEADER ═══ */}
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
            builder
          </Text>
        </Group>
        <Group gap="sm">
          <Badge variant="dot" color="ice" size="sm">
            {nodeCount} nodes
          </Badge>
          <Badge variant="dot" color="frost" size="sm">
            {byteSize} bytes
          </Badge>
          {parsed?.directives.spectrum && (
            <Badge variant="light" color="ice" size="sm">
              @{parsed.directives.spectrum}
            </Badge>
          )}
          <Button
            variant="light"
            color="ice"
            size="xs"
            onClick={handleExportQR}
            disabled={!parsed}
          >
            Export QR
          </Button>
          <Button
            variant="subtle"
            color={devMode ? "green" : "dimmed"}
            size="xs"
            onClick={() => setDevMode((v) => !v)}
          >
            {devMode ? "⚙ Dev" : "⚙"}
          </Button>
          <Button
            variant="subtle"
            color="frost"
            size="xs"
            onClick={handleScreenshot}
          >
            📸
          </Button>
          <Button
            variant="filled"
            color="green"
            size="xs"
            onClick={handleSave}
            loading={saveLoading}
            disabled={!parsed}
          >
            {savedAppId ? "Update" : "Save"}
          </Button>
          {userId ? (
            <Tooltip label={`PIN: ${userPin}`}>
              <Badge variant="light" color="green" size="sm" style={{ cursor: "pointer" }}>
                ● {userId.slice(0, 8)}
              </Badge>
            </Tooltip>
          ) : (
            <Button
              variant="subtle"
              color="dimmed"
              size="xs"
              onClick={() => setPinModalOpen(true)}
            >
              🔑 Login
            </Button>
          )}
        </Group>
      </Group>

      {/* ═══ MAIN BODY: 40% chat panel + 60% preview ═══ */}
      <Box
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* ─── LEFT PANEL (40%): Spec Sidebar + Chat ─── */}
        <Box
          style={{
            width: "40%",
            flexShrink: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Spec Sidebar (40% of 40% = 16% total when expanded) */}
          <Box
            style={{
              width: sidebarCollapsed ? 36 : "40%",
              flexShrink: 0,
              transition: "width 0.2s ease",
              overflow: "hidden",
            }}
          >
            <SpecSidebar
              tags={tags}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((v) => !v)}
              onTagUpdate={handleTagUpdate}
              onTagDelete={handleTagDelete}
              onTagAdd={handleTagAdd}
            />
          </Box>

          {/* Chat (fills remaining space) */}
          <Box style={{ flex: 1, overflow: "hidden" }}>
            <Chat
              messages={messages}
              currentPhase={currentPhase}
              loading={loading}
              onSendMessage={handleSendMessage}
              onPhaseChange={setCurrentPhase}
            />
          </Box>
        </Box>

        {/* ─── RIGHT PANEL (60%): Preview + Source ─── */}
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderLeft: "1px solid var(--mantine-color-dark-4)",
          }}
        >
          {/* Preview header with tabs */}
          <Group
            justify="space-between"
            px="sm"
            py={6}
            style={{
              borderBottom: "1px solid var(--mantine-color-dark-5)",
              flexShrink: 0,
            }}
          >
            <SegmentedControl
              value={previewTab || "preview"}
              onChange={setPreviewTab}
              size="xs"
              data={[
                { label: "Φ Preview", value: "preview" },
                { label: ".mf Source", value: "source" },
              ]}
              styles={{
                root: { background: "var(--mantine-color-dark-6)" },
              }}
            />
            <Group gap="xs">
              {parsed?.directives.spectrum && (
                <Text ff="monospace" size="xs" c="ice.5">
                  @{parsed.directives.spectrum}
                </Text>
              )}
              <Text ff="monospace" size="xs" c="dimmed">
                {previewTab === "source" ? "editable" : "live render"}
              </Text>
            </Group>
          </Group>

          {/* Content area */}
          {previewTab === "source" ? (
            // ── SOURCE EDITOR ──
            <Box style={{ flex: 1, overflow: "hidden" }}>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.currentTarget.value)}
                autosize={false}
                styles={{
                  root: { height: "100%" },
                  wrapper: { height: "100%" },
                  input: {
                    height: "100%",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12.5px",
                    lineHeight: 1.7,
                    background: "var(--mantine-color-dark-8)",
                    border: "none",
                    borderRadius: 0,
                    color: "var(--mantine-color-ice-3)",
                    resize: "none",
                    padding: "14px",
                    tabSize: 2,
                  },
                }}
              />
            </Box>
          ) : (
            // ── Φ PREVIEW ──
            <ScrollArea style={{ flex: 1 }} type="auto">
              <Box style={{ minHeight: "100%" }}>
                {parsed ? (
                  <MfRenderer ref={viewerRef} source={source} devMode={devMode} />
                ) : (
                  <Stack align="center" justify="center" h="100%" p="xl">
                    <Text c="red.4" size="sm">
                      Parse error — check your .mf syntax
                    </Text>
                  </Stack>
                )}
              </Box>
            </ScrollArea>
          )}
        </Box>
      </Box>

      {/* ═══ QR MODAL ═══ */}
      <Modal
        opened={qrOpen}
        onClose={() => setQrOpen(false)}
        title={
          <Text
            ff="monospace"
            size="sm"
            c="ice.4"
            style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            QR Export
          </Text>
        }
        centered
        size="sm"
        styles={{
          content: { background: "var(--mantine-color-dark-7)" },
          header: {
            background: "var(--mantine-color-dark-7)",
            borderBottom: "1px solid var(--mantine-color-dark-5)",
          },
        }}
      >
        {qrLoading ? (
          <Stack align="center" py="xl" gap="md">
            <Loader color="ice" size="md" />
            <Text size="sm" c="dimmed">
              Encoding topology...
            </Text>
          </Stack>
        ) : qrResult ? (
          <Stack gap="md" py="sm">
            <Box style={{ display: "flex", justifyContent: "center" }}>
              <Image
                src={qrResult.dataUrl}
                alt="Manifold QR Code"
                w={280}
                h={280}
                radius="md"
                style={{ border: "1px solid var(--mantine-color-dark-4)" }}
              />
            </Box>
            <Paper
              p="sm"
              radius="sm"
              style={{
                background: "var(--mantine-color-dark-8)",
                border: "1px solid var(--mantine-color-dark-5)",
              }}
            >
              <Stack gap={4}>
                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    source
                  </Text>
                  <Text ff="monospace" size="xs" c="ice.3">
                    {qrResult.sourceBytes} bytes
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    binary (raw)
                  </Text>
                  <Text ff="monospace" size="xs" c="ice.3">
                    {qrResult.rawBytes} bytes
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    binary (gzip)
                  </Text>
                  <Text ff="monospace" size="xs" c="ice.3">
                    {qrResult.compressedBytes} bytes
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    compression
                  </Text>
                  <Text ff="monospace" size="xs" c="green.4">
                    {qrResult.compressionRatio}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    QR version
                  </Text>
                  <Text ff="monospace" size="xs" c="ice.3">
                    v{qrResult.qrVersion}
                  </Text>
                </Group>
              </Stack>
            </Paper>
            <Group grow>
              <Button variant="light" color="ice" onClick={handleDownloadQR}>
                Download PNG
              </Button>
              <Button
                variant="subtle"
                color="frost"
                onClick={() => navigator.clipboard.writeText(source)}
              >
                Copy .mf
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text c="red.4" size="sm" ta="center" py="xl">
            Generation failed
          </Text>
        )}
      </Modal>

      {/* ═══ PIN AUTH MODAL ═══ */}
      <Modal
        opened={pinModalOpen}
        onClose={() => { setPinModalOpen(false); setPinError(""); setPinInput(""); }}
        title={
          <Text
            ff="monospace"
            size="sm"
            c="green.4"
            style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            🔑 Auth
          </Text>
        }
        centered
        size="xs"
        styles={{
          content: { background: "var(--mantine-color-dark-7)" },
          header: {
            background: "var(--mantine-color-dark-7)",
            borderBottom: "1px solid var(--mantine-color-dark-5)",
          },
        }}
      >
        <Stack gap="md" py="sm">
          {userPin ? (
            <>
              <Text size="sm" c="dimmed">You&apos;re logged in.</Text>
              <Paper p="md" radius="sm" style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-5)" }}>
                <Stack gap="xs">
                  <Text ff="monospace" size="xs" c="dimmed">Your PIN (save this!)</Text>
                  <Group>
                    <Text ff="monospace" size="lg" fw={700} c="green.4">{userPin}</Text>
                    <CopyButton value={userPin}>
                      {({ copy, copied }) => (
                        <Button variant="subtle" size="xs" color={copied ? "green" : "dimmed"} onClick={copy}>
                          {copied ? "✓" : "Copy"}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>
                  <Text ff="monospace" size="xs" c="dimmed">ID: {userId?.slice(0, 8)}…</Text>
                </Stack>
              </Paper>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => {
                  setUserId(null);
                  setUserPin(null);
                  setSavedAppId(null);
                  localStorage.removeItem("mf_session");
                  setPinModalOpen(false);
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <TextInput
                label="Enter your PIN"
                placeholder="1234"
                value={pinInput}
                onChange={(e) => setPinInput(e.currentTarget.value)}
                error={pinError}
                maxLength={4}
                ff="monospace"
                styles={{ input: { background: "var(--mantine-color-dark-8)", textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.5em" } }}
                onKeyDown={(e) => { if (e.key === "Enter" && pinInput.length === 4) handlePinSubmit("login"); }}
              />
              <Group grow>
                <Button
                  variant="filled"
                  color="green"
                  onClick={() => handlePinSubmit("login")}
                  loading={pinLoading}
                  disabled={pinInput.length !== 4}
                >
                  Login
                </Button>
                <Button
                  variant="light"
                  color="ice"
                  onClick={() => handlePinSubmit("register")}
                  loading={pinLoading}
                >
                  New Account
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}
