// ═══════════════════════════════════════════════════════════════════════════
// MANIFOLD PRIME TABLE — The codon table. The shared function.
// Both encoder and decoder know this. Never transmitted.
// ═══════════════════════════════════════════════════════════════════════════

export const P = {
    // ── UI PHYSICS ──
    density: { 2: "void", 3: "gas", 5: "liquid", 7: "solid", 11: "dense" } as const,
    temperature: { 13: "void", 17: "cold", 19: "warm", 23: "hot", 29: "critical", 31: "fusion" } as const,
    mass: { 37: -0.5, 41: -0.3, 43: -0.2, 47: 0, 53: 0.1, 59: 0.2, 61: 0.3, 67: 0.4, 71: 0.5, 73: 0.6, 79: 0.7, 83: 0.8, 89: 0.9, 97: 1.0, 101: 1.2, 103: 1.3, 107: 1.5, 109: 2.0 } as const,
    charge: { 113: 0.1, 127: 0.2, 131: 0.4, 137: 0.5, 139: 0.6, 149: 0.8, 151: 5, 157: 10, 163: 15 } as const,
    friction: { 167: 0.2, 173: 0.3, 179: 0.5, 181: 0.8, 191: 1.5 } as const,
    pressure: { 193: 0, 197: 1.0, 199: 2.0 } as const,
    buoyancy: { 211: 0.0, 223: 1.0 } as const,

    // ── ACTIONS ── (primes 227+)
    action: {
        227: "navigate", 229: "addToCart", 233: "removeFromCart",
        239: "increment", 241: "decrement", 251: "submit",
        257: "toggle", 263: "open", 269: "close",
        271: "fetch", 277: "emit", 281: "pay",
        283: "share", 293: "copy", 307: "refresh",
    } as const,

    // ── EMIT TARGETS ── (primes 311+)
    emit: {
        311: "api.get", 313: "api.post", 317: "api.put",
        331: "ws.send", 337: "ws.listen",
        347: "pay.gpay", 349: "pay.crypto",
        353: "event.track", 359: "event.log",
        367: "store.local", 373: "store.session",
    } as const,

    // ── COMPONENT TYPES ── (primes 379+, extended 607+)
    component: {
        // Atomic (base elements)
        379: "Container", 383: "Text", 389: "Button",
        401: "Input", 409: "Badge", 419: "Image",
        461: "Avatar", 463: "Link", 467: "Pill",
        479: "Spacer", 487: "Divider", 491: "Icon",
        509: "Checkbox", 521: "Radio",
        607: "Switch", 613: "Slider", 617: "Spinner",

        // Molecular (compound elements)
        397: "Card", 421: "Navbar", 431: "Sidebar",
        433: "Modal", 439: "Table", 443: "List",
        449: "Toast", 457: "Progress", 499: "Form",
        503: "Select", 523: "Tabs", 541: "Accordion",
        547: "Carousel",
        619: "Chart", 631: "Stat", 641: "Trend",
        643: "Node", 647: "Clock", 653: "Day",

        // Organism (complex compositions)
        659: "Week", 661: "Month", 673: "Year",
        677: "Calendar", 683: "Kanban",
    } as const,

    // ── NAVIGATION ORDER ── (primes 557+)
    nav: {
        557: "landing", 563: "page2", 569: "page3",
        571: "page4", 577: "page5", 587: "modal1",
        593: "modal2", 599: "drawer", 601: "sheet",
    } as const,
} as const;

// Type definitions
export type Axis = keyof typeof P;
export type DensityValue = (typeof P.density)[keyof typeof P.density];
export type TemperatureValue = (typeof P.temperature)[keyof typeof P.temperature];
export type MassValue = (typeof P.mass)[keyof typeof P.mass];
export type ChargeValue = (typeof P.charge)[keyof typeof P.charge];
export type FrictionValue = (typeof P.friction)[keyof typeof P.friction];
export type PressureValue = (typeof P.pressure)[keyof typeof P.pressure];
export type BuoyancyValue = (typeof P.buoyancy)[keyof typeof P.buoyancy];
export type ActionValue = (typeof P.action)[keyof typeof P.action];
export type EmitValue = (typeof P.emit)[keyof typeof P.emit];
export type ComponentValue = (typeof P.component)[keyof typeof P.component];
export type NavValue = (typeof P.nav)[keyof typeof P.nav];

// ── Reverse lookups ──
export const ENCODE: Record<string, Record<string | number, number>> = {};
Object.entries(P).forEach(([axis, map]) => {
    ENCODE[axis] = {};
    Object.entries(map).forEach(([prime, val]) => {
        ENCODE[axis][val] = parseInt(prime);
    });
});

// ── All primes sorted for factoring ──
export const ALL_PRIMES: number[] = Object.values(P)
    .flatMap((m) => Object.keys(m).map(Number))
    .sort((a, b) => a - b);

// ── Prime to axis mapping ──
export const PRIME_AXIS: Record<number, Axis> = {};
Object.entries(P).forEach(([axis, map]) => {
    Object.keys(map).forEach((p) => {
        PRIME_AXIS[parseInt(p)] = axis as Axis;
    });
});

// Temperature colors for styling
export const TEMP_COLORS: Record<string, string> = {
    void: "#64748b",
    cold: "#6b8fa3",
    warm: "#c9a227",
    hot: "#d4842a",
    critical: "#c44a2f",
    fusion: "#9b6dd7",
};
