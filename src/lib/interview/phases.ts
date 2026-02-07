// ═══════════════════════════════════════════════════════════════════════════
// INTERVIEW PHASES — v2.0: .mf-native structured extraction
// ═══════════════════════════════════════════════════════════════════════════

export type InterviewPhase =
  | "identity"
  | "audience"
  | "vibes"
  | "structure"
  | "refine";

export interface PhaseDefinition {
  id: InterviewPhase;
  name: string;
  description: string;
  questions: string[];
  extracts: string[];
  isPostGeneration?: boolean;
}

export const PHASES: PhaseDefinition[] = [
  {
    id: "identity",
    name: "Identity",
    description: "What are we building?",
    questions: [
      "What are you building? Give me the elevator pitch.",
      "Do you have a name for it?",
    ],
    extracts: ["appName", "appType", "purpose", "domain"],
  },
  {
    id: "audience",
    name: "Audience",
    description: "Who will use it?",
    questions: [
      "Who are the people who will use this?",
      "Are there different roles? Customers, admin, staff?",
    ],
    extracts: ["roles", "audience", "hierarchy"],
  },
  {
    id: "vibes",
    name: "Vibes",
    description: "How should it feel?",
    questions: [
      "How should it feel? Warm and cozy? Cool and professional? Playful?",
    ],
    extracts: ["spectrum", "temperature", "density", "mood"],
  },
  {
    id: "structure",
    name: "Structure",
    description: "How is it organized?",
    questions: [
      "What are the main screens or sections?",
      "What actions can users take?",
    ],
    extracts: ["layout", "sections", "actions", "navigation"],
  },
  {
    id: "refine",
    name: "Refine",
    description: "Polish the topology",
    questions: [],
    isPostGeneration: true,
    extracts: ["adjustments"],
  },
];

export function getPhase(id: InterviewPhase): PhaseDefinition {
  return PHASES.find((p) => p.id === id) || PHASES[0];
}

export function getNextPhase(current: InterviewPhase): InterviewPhase | null {
  const idx = PHASES.findIndex((p) => p.id === current);
  if (idx === -1 || idx >= PHASES.length - 1) return null;
  return PHASES[idx + 1].id;
}
