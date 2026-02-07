"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Stack,
  Text,
  Title,
  Group,
  Paper,
  Button,
  SimpleGrid,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import Link from "next/link";
import { SAMPLE_ECO, SAMPLE_VOID, SAMPLE_BRASS, parse } from "@/lib/manifold/engine";
import MfRenderer from "@/components/manifold/MfRenderer";

interface SavedTopology {
  id: string;
  name: string;
  source: string;
  spectrum: string;
  createdAt: string;
  nodeCount: number;
}

function countNodes(nodes: { children?: unknown[] }[]): number {
  let c = 0;
  for (const n of nodes) {
    c++;
    if (n.children) c += countNodes(n.children as { children?: unknown[] }[]);
  }
  return c;
}

// Demo topologies
const DEMO_TOPOLOGIES: SavedTopology[] = [
  {
    id: "eco-escola",
    name: "Eco Escola",
    source: SAMPLE_ECO,
    spectrum: "eco",
    createdAt: "2026-02-06",
    nodeCount: countNodes(parse(SAMPLE_ECO).tree),
  },
  {
    id: "manifold-docs",
    name: "Manifold Docs",
    source: SAMPLE_VOID,
    spectrum: "void",
    createdAt: "2026-02-07",
    nodeCount: countNodes(parse(SAMPLE_VOID).tree),
  },
  {
    id: "forno-massa",
    name: "Forno & Massa",
    source: SAMPLE_BRASS,
    spectrum: "brass",
    createdAt: "2026-02-07",
    nodeCount: countNodes(parse(SAMPLE_BRASS).tree),
  },
];

function SpectrumBadge({ spectrum }: { spectrum: string }) {
  const colorMap: Record<string, string> = {
    eco: "green",
    void: "yellow",
    brass: "orange",
  };
  return (
    <Badge variant="light" color={colorMap[spectrum] || "gray"} size="sm">
      {spectrum}
    </Badge>
  );
}

export default function DashboardPage() {
  const [topologies] = useState<SavedTopology[]>(DEMO_TOPOLOGIES);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewTopo = topologies.find((t) => t.id === previewId);

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "var(--mantine-color-dark-7)",
      }}
    >
      {/* Header */}
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-4)",
        }}
      >
        <Group gap="md">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Text fw={500} size="md" c="ice.4" style={{ cursor: "pointer" }}>
              ⊞ Manifold
            </Text>
          </Link>
          <Text ff="monospace" size="xs" c="dimmed">
            dashboard
          </Text>
        </Group>
        <Button
          component={Link}
          href="/build"
          variant="light"
          color="ice"
          size="xs"
        >
          + New Topology
        </Button>
      </Group>

      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={3} fw={300} c="ice.2">
              Your Topologies
            </Title>
            <Text c="dimmed" size="sm">
              {topologies.length} topologies saved
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {topologies.map((topo) => (
              <Paper
                key={topo.id}
                p="md"
                radius="md"
                style={{
                  background: "var(--mantine-color-dark-6)",
                  border:
                    previewId === topo.id
                      ? "1px solid var(--mantine-color-ice-6)"
                      : "1px solid var(--mantine-color-dark-4)",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                }}
                onClick={() =>
                  setPreviewId(previewId === topo.id ? null : topo.id)
                }
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={500} c="ice.2">
                      {topo.name}
                    </Text>
                    <SpectrumBadge spectrum={topo.spectrum} />
                  </Group>

                  {/* Mini preview */}
                  <Box
                    style={{
                      height: 120,
                      overflow: "hidden",
                      borderRadius: 6,
                      border: "1px solid var(--mantine-color-dark-5)",
                      position: "relative",
                    }}
                  >
                    <Box
                      style={{
                        transform: "scale(0.25)",
                        transformOrigin: "top left",
                        width: "400%",
                        height: "400%",
                        pointerEvents: "none",
                      }}
                    >
                      <MfRenderer source={topo.source} />
                    </Box>
                  </Box>

                  <Group justify="space-between">
                    <Text ff="monospace" size="xs" c="dimmed">
                      {topo.nodeCount} nodes · {new Blob([topo.source]).size}b
                    </Text>
                    <Text ff="monospace" size="xs" c="dimmed">
                      {topo.createdAt}
                    </Text>
                  </Group>

                  <Group gap="xs">
                    <Button
                      component={Link}
                      href="/build"
                      variant="light"
                      color="ice"
                      size="xs"
                      style={{ flex: 1 }}
                    >
                      Edit
                    </Button>
                    <Tooltip label="Copy .mf source">
                      <ActionIcon
                        variant="subtle"
                        color="frost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(topo.source);
                        }}
                      >
                        <span style={{ fontSize: 14 }}>⎘</span>
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>

          {/* Full preview */}
          {previewTopo && (
            <Paper
              p={0}
              radius="md"
              style={{
                border: "1px solid var(--mantine-color-ice-8)",
                overflow: "hidden",
              }}
            >
              <Group
                justify="space-between"
                px="sm"
                py={6}
                style={{
                  borderBottom: "1px solid var(--mantine-color-dark-5)",
                  background: "var(--mantine-color-dark-6)",
                }}
              >
                <Text ff="monospace" size="xs" c="ice.5" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  preview: {previewTopo.name}
                </Text>
                <Button
                  variant="subtle"
                  color="frost"
                  size="xs"
                  onClick={() => setPreviewId(null)}
                >
                  Close
                </Button>
              </Group>
              <Box style={{ minHeight: 400 }}>
                <MfRenderer source={previewTopo.source} />
              </Box>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
