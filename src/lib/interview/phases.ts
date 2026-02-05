// ═══════════════════════════════════════════════════════════════════════════
// INTERVIEW PHASES — Structured extraction of physics parameters
// ═══════════════════════════════════════════════════════════════════════════

export type InterviewPhase = "identity" | "audience" | "vibes" | "interaction" | "masking";

export interface PhaseDefinition {
    id: InterviewPhase;
    name: string;
    description: string;
    questions: string[];
    extracts: string[];
    hasSliders?: boolean;
    isPostGeneration?: boolean;
}

export const PHASES: PhaseDefinition[] = [
    {
        id: "identity",
        name: "Identity",
        description: "What are we building?",
        questions: [
            "Do you have a name for this? No problem if not, we can add it later!",
            "What's your app about?",
        ],
        extracts: ["appName", "appType", "componentVocabulary", "entityList"],
    },
    {
        id: "audience",
        name: "Audience & Roles",
        description: "Who will use it?",
        questions: [
            "Who are the people who are going to use it, and why?",
            "How does it solve their problem?",
            "Are there different roles? Like customers, staff, admin?",
        ],
        extracts: ["roleList", "density", "hierarchy", "audience"],
    },
    {
        id: "vibes",
        name: "Vibes",
        description: "How should it feel?",
        questions: [
            "How do you want it to feel? Warm and cozy? Cool and professional?",
        ],
        hasSliders: true,
        extracts: ["temperature", "luminosity", "friction", "massDistribution"],
    },
    {
        id: "interaction",
        name: "Interaction",
        description: "How do users interact?",
        questions: [
            "How do you want the user to interact with the app?",
            "Does the user decide something? Can they ask for something you haven't thought of?",
        ],
        extracts: ["actionPrimes", "inputPrimes", "freeAllocRatio"],
    },
    {
        id: "masking",
        name: "Role Masking",
        description: "Configure role views",
        questions: [],
        isPostGeneration: true,
        extracts: ["visibilityMasks"],
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

export function getPreviousPhase(current: InterviewPhase): InterviewPhase | null {
    const idx = PHASES.findIndex((p) => p.id === current);
    if (idx <= 0) return null;
    return PHASES[idx - 1].id;
}

export function isPreGeneration(phase: InterviewPhase): boolean {
    return !getPhase(phase).isPostGeneration;
}
