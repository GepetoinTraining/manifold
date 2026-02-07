"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CHAT — Claude interview interface for .mf topology building
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Group,
  Stack,
  ActionIcon,
  ScrollArea,
  Paper,
  Loader,
  Badge,
} from "@mantine/core";
import type { InterviewPhase } from "@/lib/interview/phases";
import { PHASES, getPhase } from "@/lib/interview/phases";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages: Message[];
  currentPhase: InterviewPhase;
  loading: boolean;
  onSendMessage: (message: string) => void;
  onPhaseChange: (phase: InterviewPhase) => void;
}

export function Chat({
  messages,
  currentPhase,
  loading,
  onSendMessage,
  onPhaseChange,
}: ChatProps) {
  const [input, setInput] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const phase = getPhase(currentPhase);

  // Auto-scroll on new messages
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
  }, [input, loading, onSendMessage]);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid var(--mantine-color-dark-5)",
      }}
    >
      {/* Phase indicator bar */}
      <Group
        gap={6}
        px="sm"
        py={6}
        wrap="nowrap"
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-5)",
          flexShrink: 0,
          overflowX: "auto",
        }}
      >
        {PHASES.filter((p) => !p.isPostGeneration).map((p, i) => (
          <Badge
            key={p.id}
            variant={p.id === currentPhase ? "light" : "dot"}
            color={p.id === currentPhase ? "ice" : "frost"}
            size="sm"
            style={{ cursor: "pointer", flexShrink: 0 }}
            onClick={() => onPhaseChange(p.id)}
          >
            {i + 1}. {p.name}
          </Badge>
        ))}
      </Group>

      {/* Phase description */}
      <Box
        px="sm"
        py={6}
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-6)",
          flexShrink: 0,
        }}
      >
        <Text size="sm" fw={500} c="ice.3">
          {phase.name}
        </Text>
        <Text size="xs" c="dimmed" mt={1}>
          {phase.description}
        </Text>
      </Box>

      {/* Messages */}
      <ScrollArea
        style={{ flex: 1 }}
        type="auto"
        viewportRef={viewport}
        offsetScrollbars
      >
        <Stack gap="sm" p="sm">
          {messages.length === 0 && (
            <Stack align="center" justify="center" py={60} gap="xs">
              <Text size="28px" style={{ opacity: 0.2 }}>
                ⊞
              </Text>
              <Text c="dimmed" size="sm" ta="center">
                Let&apos;s build something.
              </Text>
              <Text c="dimmed" size="xs" ff="monospace" ta="center">
                Describe your app and I&apos;ll create the topology.
              </Text>
            </Stack>
          )}

          {messages.map((msg, i) => (
            <Paper
              key={i}
              p="sm"
              radius="md"
              style={{
                background:
                  msg.role === "user"
                    ? "rgba(74, 111, 150, 0.08)"
                    : "var(--mantine-color-dark-7)",
                border: `1px solid ${
                  msg.role === "user"
                    ? "rgba(74, 111, 150, 0.2)"
                    : "var(--mantine-color-dark-5)"
                }`,
                alignSelf:
                  msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
              }}
            >
              <Text
                ff="monospace"
                size="10px"
                c={msg.role === "user" ? "ice.5" : "frost.4"}
                mb={4}
                style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {msg.role === "user" ? "you" : "manifold"}
              </Text>
              <Text
                size="sm"
                c="frost.1"
                style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}
              >
                {msg.content}
              </Text>
            </Paper>
          ))}

          {loading && (
            <Group gap="xs" py="xs" px="sm">
              <Loader color="ice" size="xs" type="dots" />
              <Text ff="monospace" size="xs" c="ice.5">
                thinking...
              </Text>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      {/* Input */}
      <Box
        px="sm"
        py="xs"
        style={{
          borderTop: "1px solid var(--mantine-color-dark-5)",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
          background: "var(--mantine-color-dark-7)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your app..."
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--mantine-color-dark-8)",
              border: "1px solid var(--mantine-color-dark-4)",
              borderRadius: "var(--mantine-radius-md)",
              color: "var(--mantine-color-frost-1)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              outline: "none",
              minWidth: 0,
            }}
          />
          <ActionIcon
            variant="filled"
            color="ice"
            size="lg"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Text size="md" fw={700}>
              →
            </Text>
          </ActionIcon>
        </div>
      </Box>
    </Box>
  );
}
