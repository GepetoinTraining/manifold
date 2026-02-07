/**
 * MANIFOLD ENGINE v2.2
 * Parse .mf → Resolve classes → Actualize through Φ → Render
 *
 * v2.2 Features:
 * - Auto-detects indent width (1, 2, or 4 spaces) and normalizes
 * - Validates classes against known set, emits warnings
 * - Parses grid layout instructions (c:1,3 r:1,2)
 * - Macro fields (semicolons in content)
 * - Texture markers (~)
 * - Directives (@spectrum, @lang, @live, @auth, @define)
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// ── LOOKUP TABLES ──

export const DENSITY: Record<number, string> = {
  1: "void", 2: "gas", 3: "liquid", 4: "solid", 5: "dense",
};
export const TEMPERATURE: Record<number, string> = {
  1: "void", 2: "cold", 3: "warm", 4: "hot", 5: "critical", 6: "fusion",
};
export const MASS: Record<number, number> = {
  1: -0.5, 2: -0.3, 3: -0.2, 4: 0, 5: 0.1, 6: 0.2, 7: 0.3,
  8: 0.4, 9: 0.5, 10: 0.6, 11: 0.7, 12: 0.8, 13: 0.9, 14: 1.0,
  15: 1.2, 16: 1.3, 17: 1.5, 18: 2.0,
};
export const CHARGE: Record<number, number> = {
  1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5,
  6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.0,
};
export const ROLE: Record<number, string | null> = {
  0: null, 1: "hero", 2: "nav", 3: "card", 4: "grid", 5: "form",
  6: "section", 7: "footer", 8: "modal", 9: "list", 10: "sidebar",
};
export const ACTION: Record<number, string | null> = {
  0: null, 1: "navigate", 2: "addToCart", 3: "removeCart",
  4: "increment", 5: "decrement", 6: "submit", 7: "toggle",
  8: "open", 9: "close",
};

// ── TYPES ──

export interface ResolvedClass {
  d: number;
  t: number;
  m: number;
  c: number;
  role: number;
  action: number;
  spectrum?: string;
}

export interface GridLayout {
  cols?: number[];
  rows?: number[];
}

export interface MfVariable {
  name: string;
  type: '@' | '@@' | '@=';
  slotIndex: number;
  prefix?: string;
  suffix?: string;
}

export interface MfNode {
  classPath: string;
  text: string | null;
  texture: boolean;
  fields: string[] | null;
  layout: GridLayout | null;
  variables: MfVariable[] | null;
  action: number | null;
  actionTarget: string | null;
  children: MfNode[];
}

export interface ParseWarning {
  type: "unknown_class" | "unknown_directive";
  value: string;
  classPath?: string;
  line: number;
  message: string;
}

export interface ParseResult {
  directives: Record<string, string>;
  tree: MfNode[];
  views: Record<string, MfNode[]>;
  warnings: ParseWarning[];
  indentUnit: number;
  slots: Record<string, number>;
}

export interface RenderContext {
  childIndex: number;
  siblingCount: number;
  parentRole: string | null;
  layout?: GridLayout | null;
}

export interface SpectrumColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textBright: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText?: string;
  accent: string;
  shadow: string;
  shadowDeep: string;
  glow: string;
}

// ── KNOWN CLASSES (for validation) ──

const KNOWN_CLASSES = new Set([
  "button", "text", "link", "input", "image", "icon",
  "divider", "spacer", "pill", "alert", "progress",
  "nav", "hero", "card", "grid", "form", "section",
  "footer", "modal", "list", "sidebar",
  "checkbox", "select",
]);

const KNOWN_DIRECTIVES = new Set([
  "spectrum", "lang", "live", "auth", "define", "title", "view",
]);

// ── CLASS DEFINITIONS ──

export const CLASSES: Record<string, Partial<ResolvedClass>> = {
  // ── Base Elements ──
  button: { d: 4, t: 2, m: 12, c: 5, role: 0, action: 0 },
  text: { d: 1, t: 2, m: 9, c: 3, role: 0, action: 0 },
  link: { d: 1, t: 3, m: 9, c: 3, role: 0, action: 1 },
  input: { d: 3, t: 2, m: 9, c: 5, role: 0, action: 0 },
  image: { d: 4, t: 2, m: 14, c: 2, role: 0, action: 0 },
  icon: { d: 1, t: 2, m: 10, c: 2, role: 0, action: 0 },
  divider: { d: 1, t: 2, m: 1, c: 1, role: 0, action: 0 },
  spacer: { d: 1, t: 1, m: 1, c: 1, role: 0, action: 0 },
  pill: { d: 3, t: 2, m: 7, c: 4, role: 0, action: 0 },
  checkbox: { d: 3, t: 2, m: 9, c: 5, role: 0, action: 7 },
  select: { d: 3, t: 2, m: 9, c: 5, role: 0, action: 0 },
  progress: { d: 3, t: 3, m: 9, c: 3, role: 0, action: 0 },
  alert: { d: 4, t: 4, m: 12, c: 6, role: 0, action: 0 },
  // ── Role Composites ──
  nav: { d: 4, t: 2, m: 14, c: 5, role: 2, action: 0 },
  hero: { d: 1, t: 3, m: 14, c: 8, role: 1, action: 0 },
  card: { d: 4, t: 2, m: 12, c: 6, role: 3, action: 0 },
  grid: { d: 1, t: 2, m: 9, c: 5, role: 4, action: 0 },
  form: { d: 3, t: 2, m: 12, c: 6, role: 5, action: 0 },
  section: { d: 1, t: 2, m: 14, c: 7, role: 6, action: 0 },
  footer: { d: 2, t: 2, m: 9, c: 5, role: 7, action: 0 },
  modal: { d: 5, t: 3, m: 14, c: 8, role: 8, action: 0 },
  list: { d: 1, t: 2, m: 9, c: 4, role: 9, action: 0 },
  sidebar: { d: 4, t: 2, m: 14, c: 5, role: 10, action: 0 },
  // ── Button Variants ──
  "button.primary": { t: 3, m: 14, c: 7 },
  "button.secondary": { t: 2, m: 10, d: 3 },
  "button.ghost": { d: 1, t: 2, m: 7, c: 3 },
  "button.cta": { t: 4, m: 14, c: 8 },
  "button.danger": { t: 5, m: 14, c: 7 },
  // ── Text Variants ──
  "text.title": { m: 17, c: 5 },
  "text.subtitle": { m: 15, c: 4 },
  "text.sub": { m: 11, t: 2 },
  "text.body": { m: 10 },
  "text.bold": { m: 12 },
  "text.muted": { m: 9, t: 1 },
  "text.icon": { m: 15 },
  "text.small": { m: 7 },
  "text.brand": { m: 15, t: 3 },
  "text.label": { m: 8, t: 2 },
  "text.mono": { m: 9, t: 2 },
  // ── Link Variants ──
  "link.nav": { m: 9, c: 4 },
  "link.footer": { m: 7, t: 1 },
  "link.inline": { m: 9, t: 3 },
  // ── Card Variants ──
  "card.flat": { d: 3, m: 10 },
  "card.glass": { d: 3, t: 2, c: 5 },
  "card.elevated": { d: 5, m: 14 },
  // ── Input Variants ──
  "input.large": { m: 14, c: 7 },
  "input.small": { m: 7, c: 3 },
  "input.search": { m: 10, d: 3 },
  // ── Alert Variants ──
  "alert.success": { t: 3 },
  "alert.error": { t: 5 },
  "alert.warning": { t: 4 },
  "alert.info": { t: 2 },
  // ── Spectrum Overrides (wildcard) ──
  "*.eco": { spectrum: "eco" },
  "*.void": { spectrum: "void" },
  "*.brass": { spectrum: "brass" },
};

// ── SPECTRUM DEFINITIONS ──

export const SPECTRUMS: Record<string, SpectrumColors> = {
  eco: {
    bg: "#F7F5F0",
    surface: "#ffffff",
    surfaceAlt: "#f0ece4",
    border: "rgba(94, 62, 44, 0.12)",
    text: "#2D2D2D",
    textMuted: "#6b6560",
    textBright: "#5E3E2C",
    primary: "#009933",
    primaryText: "#ffffff",
    secondary: "#E6007E",
    secondaryText: "#ffffff",
    accent: "#9BC53D",
    shadow: "rgba(94, 62, 44, 0.08)",
    shadowDeep: "rgba(94, 62, 44, 0.16)",
    glow: "rgba(0, 153, 51, 0.15)",
  },
  void: {
    bg: "#0f0e0c",
    surface: "rgba(200,190,170,0.06)",
    surfaceAlt: "rgba(200,190,170,0.03)",
    border: "rgba(200,190,170,0.12)",
    text: "#a09888",
    textMuted: "#706860",
    textBright: "#d4c8b8",
    primary: "#c9a227",
    primaryText: "#0f0e0c",
    secondary: "#d4842a",
    secondaryText: "#0f0e0c",
    accent: "#c9a227",
    shadow: "rgba(0,0,0,0.2)",
    shadowDeep: "rgba(0,0,0,0.4)",
    glow: "rgba(200,160,60,0.2)",
  },
  brass: {
    bg: "#1a1714",
    surface: "rgba(200,180,140,0.08)",
    surfaceAlt: "rgba(200,180,140,0.04)",
    border: "rgba(200,180,140,0.15)",
    text: "#b8a888",
    textMuted: "#887860",
    textBright: "#e8d8b8",
    primary: "#d4a828",
    primaryText: "#1a1714",
    secondary: "#c87830",
    secondaryText: "#1a1714",
    accent: "#d4a828",
    shadow: "rgba(0,0,0,0.25)",
    shadowDeep: "rgba(0,0,0,0.45)",
    glow: "rgba(212,168,40,0.2)",
  },
};

// ── CLASS RESOLVER ──

export function resolve(classPath: string): ResolvedClass {
  const parts = classPath.toLowerCase().replace(/\[.*\]/, "").split(".");
  const base = parts[0];
  const resolved = { ...(CLASSES[base] || CLASSES.text) } as ResolvedClass;

  for (let i = 1; i < parts.length; i++) {
    const partial = parts.slice(0, i + 1).join(".");
    const wildcard = `*.${parts[i]}`;

    if (CLASSES[wildcard]) {
      Object.assign(resolved, CLASSES[wildcard]);
    }
    if (CLASSES[partial]) {
      Object.assign(resolved, CLASSES[partial]);
    }
  }

  return resolved;
}

// ── CLASS SUGGESTION ──

function suggestClass(unknown: string): string {
  const map: Record<string, string> = {
    container: "section or grid",
    header: "nav",
    heading: "text.title or text.subtitle",
    title: "text.title",
    subtitle: "text.subtitle",
    body: "text.body",
    label: "text.label",
    wrapper: "section",
    layout: "grid",
    page: "section",
    main: "section",
    content: "section",
    panel: "card",
    box: "card",
    row: "nav (horizontal) or grid|c:1,1 (equal columns)",
    column: "grid child (use grid|c:ratios)",
    flex: "grid",
    stack: "section (vertical) or list",
    group: "section",
    block: "section",
    badge: "pill",
    tag: "pill",
    chip: "pill",
    inline: "text",
    span: "text",
    div: "section",
    view: "section",
    screen: "section",
    area: "section",
  };
  return map[unknown] || [...KNOWN_CLASSES].join(", ");
}

// ── PARSER v3 ──

export function parse(source: string): ParseResult {
  const lines = source.split("\n");
  const root: {
    children: MfNode[];
    directives: Record<string, string>;
    _views: Record<string, MfNode[]>;
    _currentView: string | null;
  } = {
    children: [],
    directives: {},
    _views: {},
    _currentView: null,
  };
  const stack: { node: { children: MfNode[] }; indent: number }[] = [
    { node: root, indent: -1 },
  ];
  const warnings: ParseWarning[] = [];

  // ── Auto-detect indent unit from first indented line ──
  let indentUnit = 1;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#") || line.trim().startsWith("@")) continue;
    const spaces = line.search(/\S/);
    if (spaces > 0) {
      indentUnit = spaces;
      break;
    }
  }

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Skip blanks
    if (!line.trim()) continue;

    // Skip comments
    if (line.trim().startsWith("#")) continue;

    // Parse directives
    if (line.trim().startsWith("@")) {
      const match = line.trim().match(/^@(\w+)\s+(.+)$/);
      if (match) {
        const directive = match[1];
        if (directive === "view") {
          // @view starts a new subtree
          root._currentView = match[2].trim();
          root._views[root._currentView] = [];
          stack.length = 1;
          continue;
        }
        if (!KNOWN_DIRECTIVES.has(directive)) {
          warnings.push({
            type: "unknown_directive",
            value: directive,
            line: lineNum + 1,
            message: `Unknown directive @${directive} — known: ${[...KNOWN_DIRECTIVES].join(", ")}`,
          });
        }
        root.directives[match[1]] = match[2];
      }
      continue;
    }

    // ── Normalize indent ──
    const rawIndent = line.search(/\S/);
    const indent = Math.round(rawIndent / indentUnit);

    const content = line.trim();
    const pipeIdx = content.indexOf("|");

    const classPathRaw = pipeIdx >= 0 ? content.slice(0, pipeIdx).trim() : content.trim();
    const text = pipeIdx >= 0 ? content.slice(pipeIdx + 1) : "";

    // ── Parse bracket overrides (including action) ──
    let parsedAction: number | null = null;
    let classPath = classPathRaw;
    const bracketMatch = classPathRaw.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      classPath = classPathRaw.replace(/\[.*\]/, "");
      const overrides = bracketMatch[1].split(",");
      for (const ov of overrides) {
        const [k, v] = ov.trim().split(":");
        if (k === "action" && v) {
          parsedAction = parseInt(v, 10);
        }
      }
    }

    // ── Validate base class ──
    const baseName = classPath.split(".")[0].toLowerCase();
    if (baseName && !KNOWN_CLASSES.has(baseName)) {
      warnings.push({
        type: "unknown_class",
        value: baseName,
        classPath,
        line: lineNum + 1,
        message: `Unknown class "${baseName}" — falling back to text. Did you mean: ${suggestClass(baseName)}?`,
      });
    }

    // ── Parse content ──
    const isTexture = text.trim() === "~";
    const rawText = text.trim();

    // Grid layout instructions: c:1,3 or r:1,2,1 or c:1,3;r:1,2
    let layout: GridLayout | null = null;
    if (rawText && /^[cr]:/.test(rawText)) {
      layout = {};
      const parts = rawText.split(";");
      for (const part of parts) {
        const kv = part.trim().split(":");
        if (kv.length === 2 && (kv[0] === "c" || kv[0] === "r") && kv[1]) {
          layout[kv[0] === "c" ? "cols" : "rows"] = kv[1].split(",").map(Number);
        }
      }
    }

    // ── Parse @variables (positional: @=owner, @@=user, @==computed) ──
    // V3.1: bare @, @@, @= (no name required). V3.0 compat: @name still works.
    let variables: MfVariable[] | null = null;
    let actionTarget: string | null = null;
    const textForVars = isTexture ? null : layout ? null : rawText;

    // Detect if content has semicolons (macro fields) AND @ slots
    const hasSemicolon = textForVars ? textForVars.includes(";") : false;
    const hasSlot = textForVars ? /(?:@=|@@|@)/.test(textForVars) : false;

    // Macro fields — split on semicolons first
    const fields =
      !isTexture && !layout && hasSemicolon
        ? text.split(";").map((f) => f.trim())
        : null;

    // Parse @variables from the full text (or from individual fields)
    if (textForVars && hasSlot) {
      variables = [];
      // V3.1 regex: bare @, @@, @= with OPTIONAL trailing word chars
      const varRegex = /(@=|@@|@)([\w.]*)/g;
      let m;
      while ((m = varRegex.exec(textForVars)) !== null) {
        const sigil = m[1] as '@' | '@@' | '@=';
        const varName = m[2] || ''; // empty for bare positional slots
        const prefix = textForVars.slice(0, m.index).trim() || undefined;
        const suffix = textForVars.slice(m.index + m[0].length).trim() || undefined;
        variables.push({ name: varName, type: sigil, slotIndex: -1, prefix, suffix });
      }
      if (variables.length > 0 && parsedAction !== null) {
        actionTarget = variables[0].name;
      }
      if (variables.length === 0) variables = null;
    }

    const node: MfNode = {
      classPath: classPathRaw,
      text: isTexture ? null : layout ? null : fields ? null : variables ? null : text,
      texture: isTexture,
      fields,
      layout,
      variables,
      action: parsedAction,
      actionTarget,
      children: [],
    };

    // Find parent by indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    // Route to current view or main tree
    if (root._currentView && root._views[root._currentView]) {
      if (stack.length === 1) {
        root._views[root._currentView].push(node);
      } else {
        stack[stack.length - 1].node.children.push(node);
      }
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, indent });
  }

  // ── Build views map ──
  const views: Record<string, MfNode[]> = { main: root.children };
  for (const [name, tree] of Object.entries(root._views)) {
    views[name] = tree;
  }

  // ── Count positional @ slots per view & assign slotIndex ──
  function assignSlots(nodes: MfNode[], counters: { owner: number; user: number; computed: number }) {
    for (const node of nodes) {
      if (node.variables) {
        for (const v of node.variables) {
          if (v.type === '@') { v.slotIndex = counters.owner++; }
          else if (v.type === '@@') { v.slotIndex = counters.user++; }
          else if (v.type === '@=') { v.slotIndex = counters.computed++; }
        }
      }
      if (node.children) assignSlots(node.children, counters);
    }
  }

  const slots: Record<string, number> = {};
  for (const [name, viewTree] of Object.entries(views)) {
    const counters = { owner: 0, user: 0, computed: 0 };
    assignSlots(viewTree, counters);
    slots[name] = counters.owner + counters.user + counters.computed;
  }

  return {
    directives: root.directives,
    tree: root.children,
    views,
    warnings,
    indentUnit,
    slots,
  };
}

// ── Φ ACTUALIZATION ──

function r(base: number, inv = false): number {
  return Math.round(base * (inv ? PHI_INV : PHI));
}

export function phi(
  resolved: ResolvedClass,
  spectrumName: string,
  context?: RenderContext | null
): React.CSSProperties {
  const d = DENSITY[resolved.d] || "liquid";
  const t = TEMPERATURE[resolved.t] || "cold";
  const mass = MASS[resolved.m] || 0.5;
  const charge = CHARGE[resolved.c] || 0.5;
  const role = ROLE[resolved.role] || null;
  const S =
    SPECTRUMS[spectrumName || resolved.spectrum || "void"] || SPECTRUMS.void;

  const css: Record<string, string | number> = {
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    color: S.text,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  // ═══ LAYER 1: QUANTUM ═══
  const radMap: Record<string, number> = {
    void: 0, gas: 4, liquid: 8, solid: 10, dense: 14,
  };

  if (d === "void") {
    css.background = "transparent";
  } else if (d === "gas") {
    css.background = S.surfaceAlt;
  } else if (d === "liquid") {
    css.background = S.surface;
    css.backdropFilter = "blur(12px)";
  } else if (d === "solid") {
    css.background = S.surface;
    css.border = `1px solid ${S.border}`;
  } else {
    css.background = S.bg;
    css.border = `1px solid ${S.border}`;
  }
  css.borderRadius = `${radMap[d]}px`;

  if (mass > 0.5 && (d === "solid" || d === "dense")) {
    const sd = Math.floor(mass * 12);
    css.boxShadow = `0 ${sd}px ${sd * 3}px ${S.shadow}`;
  }
  if (mass < 0) {
    const glow = Math.abs(mass) * 30;
    css.boxShadow = `0 0 ${glow}px ${S.glow}`;
    css.transform = `translateY(${mass * 10}px)`;
  }

  const sp = Math.round(6 + charge * 22 * PHI_INV);
  css.padding = `${sp}px`;
  css.gap = `${Math.round(sp * PHI_INV)}px`;

  // ═══ LAYER 2: ELECTROMAGNETIC ═══

  if (role === "hero") {
    Object.assign(css, {
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      width: "100%",
      minHeight: "50vh",
      padding: `${r(64)}px ${r(32)}px`,
      gap: `${r(16)}px`,
      background: S.surfaceAlt,
    });
  }
  if (role === "nav") {
    Object.assign(css, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: `${r(14, true)}px ${r(28, true)}px`,
      borderBottom: `1px solid ${S.border}`,
      background: S.bg,
    });
  }
  if (role === "card") {
    Object.assign(css, {
      borderRadius: `${r(10, true)}px`,
      overflow: "hidden",
      border: `1px solid ${S.border}`,
      background: S.surface,
      padding: `${r(20)}px`,
      gap: `${r(8)}px`,
    });
  }
  if (role === "grid") {
    // Grid layout — check for explicit column/row ratios from context.layout
    const layout = context?.layout;

    if (layout?.cols) {
      // Explicit column ratios: c:1,3 → grid-template-columns: 1fr 3fr
      const cols = layout.cols.map((w) => `${w}fr`).join(" ");
      Object.assign(css, {
        display: "grid",
        gridTemplateColumns: cols,
        gap: `${r(16)}px`,
        width: "100%",
        padding: "0",
      });
    } else if (layout?.rows && !layout?.cols) {
      // Explicit row ratios only: r:1,2,1 → grid-template-rows: 1fr 2fr 1fr
      const rows = layout.rows.map((w) => `${w}fr`).join(" ");
      Object.assign(css, {
        display: "grid",
        gridTemplateRows: rows,
        gridAutoFlow: "row",
        gap: `${r(16)}px`,
        width: "100%",
        height: "100%",
        padding: "0",
      });
    } else {
      // Auto-fit equal columns (original behavior)
      Object.assign(css, {
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${r(220, true)}px, 1fr))`,
        gap: `${r(16)}px`,
        width: "100%",
        padding: `0 ${r(28, true)}px`,
      });
    }

    // If both cols AND rows specified: c:1,3;r:1,2
    if (layout?.cols && layout?.rows) {
      const rows = layout.rows.map((w) => `${w}fr`).join(" ");
      css.gridTemplateRows = rows;
      css.height = "100%";
    }
  }
  if (role === "section") {
    Object.assign(css, {
      width: "100%",
      alignItems: "center",
      padding: `${r(40)}px ${r(28, true)}px`,
      gap: `${r(14)}px`,
    });
  }
  if (role === "footer") {
    Object.assign(css, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: "auto",
      padding: `${r(18)}px ${r(28, true)}px`,
      borderTop: `1px solid ${S.border}`,
    });
  }
  if (role === "form") {
    Object.assign(css, {
      maxWidth: `${r(400)}px`,
      gap: `${r(10)}px`,
    });
  }
  if (role === "modal") {
    Object.assign(css, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 1000,
      maxWidth: "90vw",
      maxHeight: "90vh",
    });
  }
  if (role === "list") {
    Object.assign(css, { width: "100%", gap: 0 });
  }
  if (role === "sidebar") {
    Object.assign(css, {
      flexDirection: "column",
      width: `${r(250, true)}px`,
      height: "100vh",
      position: "sticky",
      top: 0,
    });
  }

  // ═══ LAYER 3: CRYSTALLINE ═══

  if (context) {
    const { childIndex: ci, siblingCount: sc, parentRole: pr } = context;

    if (pr === "hero" && ci === 0) {
      Object.assign(css, {
        fontSize: `${(2.2 * PHI_INV + 1.2).toFixed(2)}rem`,
        fontWeight: 700,
        color: S.textBright,
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
        maxWidth: "680px",
      });
    }
    if (pr === "hero" && ci === 1 && sc > 2) {
      Object.assign(css, {
        fontSize: "1.1rem",
        color: S.textMuted,
        maxWidth: "520px",
        lineHeight: 1.6,
      });
    }
    if (pr === "nav") {
      css.flexDirection = "row";
      if (ci === 0) {
        Object.assign(css, {
          fontWeight: 700,
          fontSize: "1.05rem",
          color: S.textBright,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        });
      }
      if (ci > 0) {
        Object.assign(css, {
          fontSize: "0.9rem",
          cursor: "pointer",
          color: S.textMuted,
          transition: "color 0.2s ease",
        });
      }
    }
    if (pr === "card") {
      if (ci === 0 && sc >= 3)
        Object.assign(css, {
          fontSize: "1.8rem",
          lineHeight: 1,
          color: S.primary,
        });
      if (ci === 1 && sc >= 3)
        Object.assign(css, {
          fontWeight: 600,
          fontSize: "1.05rem",
          color: S.textBright,
        });
      if (ci === sc - 1 && sc >= 3)
        Object.assign(css, {
          fontSize: "0.9rem",
          color: S.textMuted,
          lineHeight: 1.55,
        });
    }
    if (pr === "footer") {
      css.fontSize = "0.85rem";
      css.color = S.textMuted;
      if (ci === sc - 1) {
        css.cursor = "pointer";
        css.color = S.primary;
      }
    }
    if (pr === "list" && ci > 0) {
      css.borderTop = `1px solid ${S.border}`;
      css.paddingTop = `${r(10, true)}px`;
    }
  }

  return css as React.CSSProperties;
}

// ── BUTTON CSS ──

export function buttonCSS(
  resolved: ResolvedClass,
  S: SpectrumColors
): React.CSSProperties {
  const t = TEMPERATURE[resolved.t] || "cold";
  const mass = MASS[resolved.m] || 0.5;
  const d = DENSITY[resolved.d] || "solid";
  const isWarm = t === "warm" || t === "hot";
  const isPrimary = isWarm && mass >= 1.0;
  const isGhost = d === "void";

  const css: Record<string, string | number> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    border: "none",
    borderRadius: `${r(6)}px`,
    padding: `${r(12, true)}px ${r(28, true)}px`,
    transition: "all 0.25s ease",
    letterSpacing: "0.01em",
  };

  if (isPrimary) {
    css.background = S.primary;
    css.color = S.primaryText;
    css.boxShadow = `0 4px 16px ${S.glow}`;
  } else if (isGhost) {
    css.background = "transparent";
    css.color = S.textMuted;
    css.border = `1px solid ${S.border}`;
  } else {
    css.background = S.surfaceAlt;
    css.color = S.textBright;
    css.border = `1px solid ${S.border}`;
  }

  return css as React.CSSProperties;
}

// ── INPUT CSS ──

export function inputCSS(S: SpectrumColors): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: `${r(10, true)}px ${r(14, true)}px`,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: "0.95rem",
    background: S.surface,
    border: `1px solid ${S.border}`,
    borderRadius: `${r(6, true)}px`,
    color: S.text,
    outline: "none",
    transition: "border-color 0.2s ease",
  };
}

// ── TEXTURE GENERATOR ──

export function generateTexture(
  context?: RenderContext | null
): string {
  if (!context) return "";
  if (context.parentRole === "hero")
    return "Descubra o que nos torna diferentes.";
  if (context.parentRole === "card")
    return "Uma abordagem centrada no que importa.";
  if (context.parentRole === "footer")
    return "© 2026 · Todos os direitos reservados.";
  if (context.parentRole === "section")
    return "Saiba mais sobre o que fazemos.";
  return "";
}

// ── SAMPLE TOPOLOGIES (v2.2 compliant) ──

export const SAMPLE_ECO = `@spectrum eco
@lang pt-BR

nav.eco|
 text.brand.eco|eco escola
 link.nav|Método
 link.nav|Sobre
 button.ghost.eco|Entrar
hero.eco|
 text.title|Seu futuro começa aqui
 text.sub|~
 button.primary.eco|Matricule-se
section.eco|
 text.subtitle.eco|O que nos move
 grid.eco|
  card.eco|◈;Individualidade;~
  card.eco|◇;Adaptação;~
  card.eco|◆;Comprometimento;~
  card.eco|◊;Inovação;~
  card.eco|❖;Transformação;~
section.eco|
 text.subtitle.eco|Pronto para transformar?
 text.sub.eco|~
 button.cta.eco|Agende uma visita
footer.eco|
 text.muted|© 2026 eco escola · Joinville, SC
 link.footer.eco|Como funciona?`;

export const SAMPLE_VOID = `@spectrum void

nav.void|
 text.brand.void|MANIFOLD
 link.nav|Docs
 link.nav|Spec
 button.ghost.void|Enter
hero.void|
 text.title|Topology → Φ → Experience
 text.sub|A 60-byte QR code that renders a complete branded web application in 150 languages.
 button.primary.void|Build
section.void|
 text.subtitle.void|The 6D Space
 grid.void|
  card.void|◈;Density;Background, border, opacity
  card.void|◇;Temperature;Color accent, warmth
  card.void|◆;Mass;Shadow depth, visual weight
  card.void|◊;Charge;Padding, gap, spacing
section.void|
 text.subtitle.void|Key Metrics
 grid.void|
  card.void|📊;Revenue;R$ 142,000
  card.void|👥;Users;3,847
  card.void|📈;Growth;+12.4%
footer.void|
 text.muted|© 2026 Manifold · Node Zero
 link.footer.void|How it works`;

export const SAMPLE_BRASS = `@spectrum brass
@lang pt-BR

nav.brass|
 text.brand.brass|Forno & Massa
 link.nav|Cardápio
 button.ghost.brass|Reservar
hero.brass|
 text.title|Pizza artesanal
 text.sub|~
 button.primary.brass|Ver cardápio
section.brass|
 text.subtitle.brass|Pizzas
 grid.brass|
  card.brass|🍕;Margherita;R$ 42 · Mozzarella, manjericão
  card.brass|🔥;Diavola;R$ 48 · Salame picante, pimentões
  card.brass|🍄;Funghi;R$ 52 · Cogumelos, trufa, parmesão
footer.brass|
 text.muted|© 2026 Forno & Massa
 link.footer.brass|Instagram`;

export const SAMPLE_SIDEBAR = `@spectrum eco

grid.eco|c:1,3
 sidebar.eco|
  text.brand.eco|Kitchen App
  text.subtitle.eco|Recipes
  list.eco|
   link.nav.eco|Grandma's Marinara
   link.nav.eco|Quick Pancakes
   link.nav.eco|Chicken Stir-fry
   button.ghost.eco|+ Add Recipe
 section.eco|
  text.title.eco|Grandma's Marinara
  grid.eco|
   card.eco|🍅;Ingredients;2 cups crushed tomatoes, garlic, olive oil
   card.eco|🔪;Prep;Mince garlic, chop basil, heat olive oil
   card.eco|🔥;Cook;Sauté garlic 30sec, add tomatoes, simmer 20min`;
export const SAMPLE_FUNCTIONAL = `@spectrum brass
@live wss://mf.run/ws/a/forno-massa

grid.brass|c:1,3
 sidebar.brass|
  text.brand.brass|Forno & Massa
  text.bold.brass|Seu Pedido
  list.brass|
   text.brass|🍕 @@ × R$ @ = R$ @=
   text.brass|🔥 @@ × R$ @ = R$ @=
   text.brass|🍄 @@ × R$ @ = R$ @=
  divider.brass|
  text.bold.brass|Total: R$ @=
  button.primary.brass[action:6]|Finalizar
 section.brass|
  text.title.brass|Cardápio
  grid.brass|
   card.brass|🍕;Margherita;R$ @
    button.ghost.brass[action:4]|+
    button.ghost.brass[action:5]|−
   card.brass|🔥;Diavola;R$ @
    button.ghost.brass[action:4]|+
    button.ghost.brass[action:5]|−
   card.brass|🍄;Funghi;R$ @
    button.ghost.brass[action:4]|+
    button.ghost.brass[action:5]|−

@view admin
section.brass|
 text.title.brass|Preços
 form.brass|
  text.label.brass|Margherita
  input.brass|@
  text.label.brass|Diavola
  input.brass|@
  text.label.brass|Funghi
  input.brass|@
  button.primary.brass[action:6]|Salvar
`;

// ── SERIALIZER ──

export function serialize(
  tree: MfNode[],
  directives?: Record<string, string>
): string {
  const lines: string[] = [];

  if (directives) {
    for (const [key, value] of Object.entries(directives)) {
      lines.push(`@${key} ${value}`);
    }
    if (Object.keys(directives).length > 0) lines.push("");
  }

  function serializeNode(node: MfNode, indent: number) {
    const pad = " ".repeat(indent);
    let content = "";

    if (node.texture) {
      content = "~";
    } else if (node.layout) {
      const parts: string[] = [];
      if (node.layout.cols) parts.push(`c:${node.layout.cols.join(",")}`);
      if (node.layout.rows) parts.push(`r:${node.layout.rows.join(",")}`);
      content = parts.join(";");
    } else if (node.variables) {
      content = node.variables.map(v => {
        let s = "";
        if (v.prefix) s += v.prefix + " ";
        s += `${v.type}${v.name}`;
        if (v.suffix) s += " " + v.suffix;
        return s;
      }).join(" ");
    } else if (node.fields) {
      content = node.fields.join(";");
    } else if (node.text) {
      content = node.text;
    }

    lines.push(`${pad}${node.classPath}|${content}`);

    if (node.children) {
      for (const child of node.children) {
        serializeNode(child, indent + 1);
      }
    }
  }

  for (const node of tree) {
    serializeNode(node, 0);
  }

  return lines.join("\n");
}

export { PHI, PHI_INV };
