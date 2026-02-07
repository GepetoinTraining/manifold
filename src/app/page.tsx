"use client";

import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Box,
  Divider,
} from "@mantine/core";
import Link from "next/link";

export default function HomePage() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "var(--mantine-color-dark-7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div className="grain" />

      <Container size="xs" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <Stack align="center" gap="xs">
          {/* Symbol */}
          <Text
            ff="monospace"
            size="xs"
            c="dimmed"
            style={{ letterSpacing: "8px" }}
          >
            ∎
          </Text>

          {/* Title */}
          <Title
            order={1}
            fw={300}
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              letterSpacing: "4px",
              color: "var(--mantine-color-ice-2)",
            }}
          >
            MANIFOLD
          </Title>

          {/* Tagline */}
          <Text c="dimmed" size="sm" lh={1.7}>
            Topology → Φ → Experience
          </Text>

          <Text
            ff="monospace"
            size="xs"
            c="var(--mantine-color-frost-4)"
            mb="xl"
          >
            .mf → physics → interface
          </Text>

          {/* CTAs */}
          <Stack gap="sm" w="100%" maw={360}>
            <Button
              component={Link}
              href="/scan"
              variant="light"
              color="ice"
              size="lg"
              radius="md"
              fullWidth
              leftSection={<span style={{ fontSize: 20 }}>⊞</span>}
              styles={{
                root: {
                  border: "1px solid var(--mantine-color-ice-8)",
                  background: "rgba(74, 111, 150, 0.08)",
                },
              }}
            >
              Scan / Decode
            </Button>

            <Button
              component={Link}
              href="/build"
              variant="subtle"
              color="frost"
              size="lg"
              radius="md"
              fullWidth
              leftSection={<span style={{ fontSize: 20 }}>◇</span>}
              styles={{
                root: {
                  border: "1px solid var(--mantine-color-dark-4)",
                },
              }}
            >
              Build / Encode
            </Button>
          </Stack>

          {/* Stats */}
          <Text
            ff="monospace"
            size="xs"
            c="var(--mantine-color-frost-5)"
            mt="xl"
            lh={2}
          >
            50+ classes · 6 physics axes · 594K states
            <br />
            60 bytes topology · ∞ applications
          </Text>

          {/* Footer */}
          <Divider
            w="100%"
            color="var(--mantine-color-dark-5)"
            mt="xl"
          />
          <Text
            ff="monospace"
            size="xs"
            c="var(--mantine-color-frost-5)"
          >
            © 2026 Manifold · Node Zero
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
