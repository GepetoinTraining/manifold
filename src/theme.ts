"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

// Ice-blue palette: off-white to deep blue
const ice: MantineColorsTuple = [
  "#f0f4f8", // 0 - lightest ice
  "#e1e8ef", // 1
  "#c3d1df", // 2
  "#a4b9cf", // 3
  "#86a2bf", // 4
  "#6889ab", // 5
  "#4a6f96", // 6 - primary
  "#3b5a7a", // 7
  "#2c455e", // 8
  "#1d3042", // 9 - darkest
];

const frost: MantineColorsTuple = [
  "#f8fafc", // 0 - snow white
  "#f1f5f9", // 1
  "#e2e8f0", // 2
  "#cbd5e1", // 3
  "#94a3b8", // 4
  "#64748b", // 5
  "#475569", // 6
  "#334155", // 7
  "#1e293b", // 8
  "#0f172a", // 9
];

export const theme = createTheme({
  primaryColor: "ice",
  colors: {
    ice,
    frost,
    dark: [
      "#C1C2C5", // 0 - text
      "#A6A7AB", // 1
      "#909296", // 2
      "#5c5f66", // 3
      "#373A40", // 4
      "#2C2E33", // 5
      "#25262b", // 6 - card bg
      "#1A1B1E", // 7 - body bg
      "#141517", // 8
      "#101113", // 9
    ],
  },
  fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'DM Mono', 'Geist Mono', monospace",
  headings: {
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    fontWeight: "300",
  },
  defaultRadius: "md",
  other: {
    // Manifold-specific tokens
    manifold: {
      gold: "#c9a227",
      bg: "#0f0e0c",
      surface: "rgba(200,190,170,0.06)",
      border: "rgba(200,190,170,0.12)",
      textBright: "#d4c8b8",
      textMuted: "#706860",
    },
  },
});
