/**
 * SEED ELEMENTS — Port ecos definitions.js into Turso elements table
 *
 * Run: npx tsx src/lib/manifold/seed-elements.ts
 *
 * This populates the periodic table with all component definitions,
 * their physics defaults, variants, render hints, and aliases.
 * Idempotent — uses INSERT OR REPLACE.
 */

import { createClient } from "@libsql/client";

// Load env from .env.local (Node.js --env-file or manual)
// Run with: npx tsx --env-file=.env.local src/lib/manifold/seed-elements.ts

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// ─── ELEMENT SEED DATA ──────────────────────────────────────────────────────
// Ported from ecos manifold/matter/definitions.js + isotope assignments
// Physics values use the same format as UIPhysics (0-1 floats for Φ tensor)

interface ElementSeed {
    prime: number;
    name: string;
    layer: "atomic" | "molecular" | "organism";
    defaultPhysics: Record<string, unknown>;
    variants: Record<string, Record<string, unknown>>;
    renderHint: string;
    aliases: string[];
    description: string;
}

const ELEMENTS: ElementSeed[] = [
    // ═══════════════════════════════════════════════════════════════════════
    // ATOMIC LAYER — Base elements, indivisible UI particles
    // ═══════════════════════════════════════════════════════════════════════

    {
        prime: 379,
        name: "Container",
        layer: "atomic",
        defaultPhysics: { mass: 0.3, charge: 0.3, pressure: 1.0 },
        variants: {
            row: { buoyancy: -0.5 },
            column: { buoyancy: 0.5 },
            padded: { charge: 0.5 },
            spaced: { charge: 0.8 },
            centered: { pressure: 0.5 },
        },
        renderHint: "container",
        aliases: ["Box", "Wrapper", "Div", "Section", "Group"],
        description: "Transparent flex container. The void that holds other elements.",
    },
    {
        prime: 383,
        name: "Text",
        layer: "atomic",
        defaultPhysics: { mass: 0.3 },
        variants: {
            heading: { mass: 0.8 },
            label: { mass: 0.2 },
            caption: { mass: 0.1 },
            code: { mass: 0.4 },
            error: { mass: 0.4, temperature: 0.8 },
            success: { mass: 0.4, temperature: 0.6 },
        },
        renderHint: "text",
        aliases: ["Label", "Heading", "Title", "Paragraph", "Caption", "H1", "H2", "P"],
        description: "Text content. Mass controls size and weight. Gas density — lightweight semantic.",
    },
    {
        prime: 389,
        name: "Button",
        layer: "atomic",
        defaultPhysics: { mass: 0.8, temperature: 0.3 },
        variants: {
            primary: { mass: 1.0, temperature: 0.6 },
            secondary: { mass: 0.6, temperature: 0.3 },
            ghost: { mass: 0.3, temperature: 0.3 },
            danger: { mass: 1.0, temperature: 0.8 },
            success: { mass: 1.0, temperature: 0.6 },
            disabled: { mass: 0.5, temperature: 0.1, friction: 1.0 },
        },
        renderHint: "action",
        aliases: ["Btn", "CTA", "Action", "Submit"],
        description: "Clickable action trigger. Solid density, variable temperature by intent.",
    },
    {
        prime: 401,
        name: "Input",
        layer: "atomic",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            focus: { temperature: 0.6 },
            error: { temperature: 0.8 },
            disabled: { mass: 0.5, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["TextField", "TextInput", "Field"],
        description: "Text input field. Solid density, responds to focus with temperature change.",
    },
    {
        prime: 409,
        name: "Badge",
        layer: "atomic",
        defaultPhysics: { mass: 0.5, temperature: 0.3 },
        variants: {
            info: { temperature: 0.6 },
            success: { temperature: 0.6 },
            warning: { temperature: 0.7 },
            danger: { temperature: 0.8 },
            premium: { temperature: 0.95 },
        },
        renderHint: "text",
        aliases: ["Tag", "Chip", "Label", "Status"],
        description: "Small status indicator. Solid density, temperature signals severity.",
    },
    {
        prime: 419,
        name: "Image",
        layer: "atomic",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            thumbnail: { mass: 0.5 },
            hero: { mass: 1.5 },
        },
        renderHint: "media",
        aliases: ["Photo", "Picture", "Img", "Thumbnail"],
        description: "Visual media element. Mass controls visual weight and shadow.",
    },
    {
        prime: 461,
        name: "Avatar",
        layer: "atomic",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            small: { mass: 0.5 },
            large: { mass: 1.0 },
            online: { temperature: 0.6 },
            busy: { temperature: 0.8 },
        },
        renderHint: "media",
        aliases: ["ProfilePic", "UserImage", "Portrait"],
        description: "User profile image. Circular, temperature indicates status.",
    },
    {
        prime: 463,
        name: "Link",
        layer: "atomic",
        defaultPhysics: { mass: 0.3, temperature: 0.3 },
        variants: {
            active: { mass: 0.4, temperature: 0.6 },
            danger: { mass: 0.4, temperature: 0.8 },
        },
        renderHint: "action",
        aliases: ["Anchor", "Url", "Hyperlink"],
        description: "Navigational link. Gas density — lightweight, clickable.",
    },
    {
        prime: 467,
        name: "Pill",
        layer: "atomic",
        defaultPhysics: { mass: 0.5, temperature: 0.3, friction: 0.1 },
        variants: {
            active: { mass: 0.6, temperature: 0.6 },
            danger: { mass: 0.5, temperature: 0.8 },
        },
        renderHint: "text",
        aliases: ["RoundedBadge", "Capsule"],
        description: "Rounded status capsule. Low friction = very rounded.",
    },
    {
        prime: 479,
        name: "Spacer",
        layer: "atomic",
        defaultPhysics: { mass: 0.1, pressure: 1.0 },
        variants: {
            grow: { pressure: 1.0 },
            fixed: { pressure: 0 },
        },
        renderHint: "container",
        aliases: ["Gap", "Separator"],
        description: "Invisible flex spacer. Void density, pressure controls space consumption.",
    },
    {
        prime: 487,
        name: "Divider",
        layer: "atomic",
        defaultPhysics: { mass: 0.1, temperature: 0.3 },
        variants: {},
        renderHint: "container",
        aliases: ["HR", "Line", "Rule", "Separator"],
        description: "Horizontal rule. Minimal mass, creates visual separation.",
    },
    {
        prime: 491,
        name: "Icon",
        layer: "atomic",
        defaultPhysics: { mass: 0.3, temperature: 0.3 },
        variants: {},
        renderHint: "text",
        aliases: ["Symbol", "Glyph"],
        description: "Symbolic icon. Rendered as text shape, not image.",
    },
    {
        prime: 509,
        name: "Checkbox",
        layer: "atomic",
        defaultPhysics: { mass: 0.5, temperature: 0.3 },
        variants: {
            checked: { temperature: 0.6 },
            disabled: { mass: 0.3, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["Check", "Tick"],
        description: "Boolean toggle input. Temperature signals state.",
    },
    {
        prime: 521,
        name: "Radio",
        layer: "atomic",
        defaultPhysics: { mass: 0.5, temperature: 0.3 },
        variants: {
            selected: { temperature: 0.6 },
            disabled: { mass: 0.3, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["RadioButton", "Option"],
        description: "Single-select radio input. One of many.",
    },
    {
        prime: 607,
        name: "Switch",
        layer: "atomic",
        defaultPhysics: { mass: 0.6, temperature: 0.3 },
        variants: {
            on: { temperature: 0.6 },
            disabled: { mass: 0.4, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["Toggle", "Flip"],
        description: "On/off toggle switch. Temperature changes with state.",
    },
    {
        prime: 613,
        name: "Slider",
        layer: "atomic",
        defaultPhysics: { mass: 0.7, temperature: 0.6 },
        variants: {
            disabled: { mass: 0.5, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["Range", "Dial"],
        description: "Range slider input. Warm temperature — interactive control.",
    },
    {
        prime: 617,
        name: "Spinner",
        layer: "atomic",
        defaultPhysics: { mass: 0.3, temperature: 0.6, friction: 0.3 },
        variants: {
            fast: { friction: 0.1 },
            slow: { friction: 0.8 },
        },
        renderHint: "temporal",
        aliases: ["Loader", "Loading", "Progress"],
        description: "Loading indicator. Friction controls animation speed.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MOLECULAR LAYER — Compound elements, atoms bonded together
    // ═══════════════════════════════════════════════════════════════════════

    {
        prime: 397,
        name: "Card",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            elevated: { mass: 1.2, temperature: 0.3 },
            floating: { mass: -0.3, temperature: 0.6 },
            glass: { mass: 0.5, temperature: 0.3 },
            outlined: { mass: 0.5, temperature: 0.3 },
            danger: { mass: 0.7, temperature: 0.8 },
            success: { mass: 0.7, temperature: 0.6 },
            highlight: { mass: 1.0, temperature: 0.95 },
        },
        renderHint: "container",
        aliases: ["Panel", "Box", "Surface", "Tile"],
        description: "Content container with elevation. Mass creates shadow depth.",
    },
    {
        prime: 421,
        name: "Navbar",
        layer: "molecular",
        defaultPhysics: { mass: 1.0, temperature: 0.3 },
        variants: {
            glass: { mass: 0.7, temperature: 0.3 },
            solid: { mass: 1.2, temperature: 0.3 },
        },
        renderHint: "layout",
        aliases: ["Header", "TopBar", "AppBar", "Navigation"],
        description: "Top navigation bar. Dense, anchored at top. High mass = grounded.",
    },
    {
        prime: 431,
        name: "Sidebar",
        layer: "molecular",
        defaultPhysics: { mass: 1.2, temperature: 0.3 },
        variants: {
            collapsed: { mass: 0.7, pressure: 0 },
            floating: { mass: -0.2, temperature: 0.3 },
        },
        renderHint: "layout",
        aliases: ["Drawer", "SidePanel", "Navigation", "Tree"],
        description: "Side navigation panel. Dense, weighty. Collapsed variant shrinks.",
    },
    {
        prime: 433,
        name: "Modal",
        layer: "molecular",
        defaultPhysics: { mass: 1.5, temperature: 0.3 },
        variants: {
            alert: { temperature: 0.8 },
            confirm: { temperature: 0.6 },
        },
        renderHint: "container",
        aliases: ["Dialog", "Popup", "Overlay", "Sheet"],
        description: "Attention-grabbing overlay. Very high mass = deep shadow, high z-index.",
    },
    {
        prime: 439,
        name: "Table",
        layer: "molecular",
        defaultPhysics: { mass: 1.0, temperature: 0.3, charge: 0.3 },
        variants: {
            compact: { charge: 0.1 },
            spacious: { charge: 0.6 },
        },
        renderHint: "data",
        aliases: ["DataTable", "Grid", "Report", "Spreadsheet"],
        description: "Tabular data display. Charge controls cell spacing.",
    },
    {
        prime: 443,
        name: "List",
        layer: "molecular",
        defaultPhysics: { mass: 0.6, temperature: 0.3 },
        variants: {
            compact: { charge: 0.1 },
            spaced: { charge: 0.4 },
        },
        renderHint: "container",
        aliases: ["ItemList", "Feed", "Collection"],
        description: "Vertical item list. Liquid density — content flows.",
    },
    {
        prime: 449,
        name: "Toast",
        layer: "molecular",
        defaultPhysics: { mass: -0.3, temperature: 0.3 },
        variants: {
            info: { temperature: 0.6 },
            success: { temperature: 0.6 },
            warning: { temperature: 0.7 },
            error: { temperature: 0.8 },
        },
        renderHint: "container",
        aliases: ["Notification", "Alert", "Snackbar", "Banner"],
        description: "Floating notification. Negative mass = glow effect, floats above content.",
    },
    {
        prime: 457,
        name: "Progress",
        layer: "molecular",
        defaultPhysics: { mass: 0.5, temperature: 0.6 },
        variants: {
            success: { temperature: 0.6 },
            warning: { temperature: 0.7 },
            danger: { temperature: 0.8 },
        },
        renderHint: "data",
        aliases: ["ProgressBar", "LoadingBar", "Meter"],
        description: "Progress indicator bar. Liquid density, warm temperature = active.",
    },
    {
        prime: 499,
        name: "Form",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3, charge: 0.4, buoyancy: 0.5 },
        variants: {
            compact: { charge: 0.2 },
            spacious: { charge: 0.6 },
        },
        renderHint: "container",
        aliases: ["FormGroup", "FieldSet", "InputGroup"],
        description: "Form container. Flex column (buoyancy), charge controls field spacing.",
    },
    {
        prime: 503,
        name: "Select",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            open: { temperature: 0.6 },
            disabled: { mass: 0.5, temperature: 0.1 },
        },
        renderHint: "input",
        aliases: ["Dropdown", "Picker", "ComboBox", "Menu"],
        description: "Selection dropdown. Opens to reveal options.",
    },
    {
        prime: 523,
        name: "Tabs",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {},
        renderHint: "layout",
        aliases: ["TabGroup", "TabBar", "Segmented"],
        description: "Tab navigation group. Switches between content panes.",
    },
    {
        prime: 541,
        name: "Accordion",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {},
        renderHint: "container",
        aliases: ["Collapsible", "Expandable", "Details"],
        description: "Expandable/collapsible content section.",
    },
    {
        prime: 547,
        name: "Carousel",
        layer: "molecular",
        defaultPhysics: { mass: 0.8, temperature: 0.3 },
        variants: {},
        renderHint: "container",
        aliases: ["Slider", "Swiper", "Gallery"],
        description: "Horizontal scrolling content carousel.",
    },
    {
        prime: 619,
        name: "Chart",
        layer: "molecular",
        defaultPhysics: { mass: 0.8, temperature: 0.6 },
        variants: {
            trending_up: { mass: 1.0, temperature: 0.7 },
            trending_down: { mass: 0.6, temperature: 0.3 },
            critical: { mass: 1.0, temperature: 0.8 },
        },
        renderHint: "data",
        aliases: ["Graph", "BarChart", "LineChart", "Visualization"],
        description: "Data visualization chart. Dense, warm — conveys analytical weight.",
    },
    {
        prime: 631,
        name: "Stat",
        layer: "molecular",
        defaultPhysics: { mass: 0.8, temperature: 0.6 },
        variants: {
            positive: { mass: 1.0, temperature: 0.7 },
            negative: { mass: 0.8, temperature: 0.8 },
            neutral: { mass: 0.6, temperature: 0.3 },
        },
        renderHint: "data",
        aliases: ["Metric", "KPI", "Number", "Counter"],
        description: "Statistical metric display. Dense, temperature signals trend.",
    },
    {
        prime: 641,
        name: "Trend",
        layer: "molecular",
        defaultPhysics: { mass: 0.8, temperature: 0.6 },
        variants: {
            rising: { mass: 1.0, temperature: 0.7 },
            falling: { mass: 0.7, temperature: 0.8 },
            stable: { mass: 0.7, temperature: 0.3 },
        },
        renderHint: "data",
        aliases: ["LineChart", "Sparkline", "History", "Wave"],
        description: "Trend line visualization. Temperature indicates direction.",
    },
    {
        prime: 643,
        name: "Node",
        layer: "molecular",
        defaultPhysics: { mass: 0.7, temperature: 0.3 },
        variants: {
            selected: { mass: 1.2, temperature: 0.8 },
            hover: { mass: 0.9, temperature: 0.6 },
            inactive: { mass: 0.4, temperature: 0.1 },
        },
        renderHint: "container",
        aliases: ["GraphNode", "Vertex", "Point"],
        description: "Graph node element. Used in mind maps and knowledge graphs.",
    },
    {
        prime: 647,
        name: "Clock",
        layer: "molecular",
        defaultPhysics: { mass: 0.8, temperature: 0.6 },
        variants: {
            timezone: { mass: 1.0, temperature: 0.7 },
            live: { mass: 0.8, temperature: 0.95 },
        },
        renderHint: "temporal",
        aliases: ["Time", "Watch", "Timer"],
        description: "Time display. Dense, warm — always updating.",
    },
    {
        prime: 653,
        name: "Day",
        layer: "molecular",
        defaultPhysics: { mass: 0.3, temperature: 0.3 },
        variants: {
            today: { mass: 0.5, temperature: 0.7 },
            past: { mass: 0.2, temperature: 0.1 },
            busy: { mass: 0.6, temperature: 0.8 },
        },
        renderHint: "temporal",
        aliases: ["DayCell", "DateCell"],
        description: "Single day in a calendar. Gas density, temperature signals activity.",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANISM LAYER — Complex compositions, full features
    // ═══════════════════════════════════════════════════════════════════════

    {
        prime: 659,
        name: "Week",
        layer: "organism",
        defaultPhysics: { mass: 0.5, temperature: 0.6 },
        variants: {
            peak: { mass: 0.8, temperature: 0.7 },
            low: { mass: 0.3, temperature: 0.3 },
        },
        renderHint: "temporal",
        aliases: ["WeekView", "WeekRow"],
        description: "Week view in calendar. Liquid density, warm flow.",
    },
    {
        prime: 661,
        name: "Month",
        layer: "organism",
        defaultPhysics: { mass: 0.8, temperature: 0.3 },
        variants: {
            current: { temperature: 0.6 },
            archive: { mass: 0.4, temperature: 0.1 },
        },
        renderHint: "temporal",
        aliases: ["MonthView", "MonthGrid"],
        description: "Month view in calendar. Solid, cold — structured time.",
    },
    {
        prime: 673,
        name: "Year",
        layer: "organism",
        defaultPhysics: { mass: 1.2, temperature: 0.6 },
        variants: {
            current: { temperature: 0.7 },
            complete: { mass: 1.0, temperature: 0.95 },
        },
        renderHint: "temporal",
        aliases: ["YearView", "AnnualView"],
        description: "Year overview. Dense, warm — high-level temporal context.",
    },
    {
        prime: 677,
        name: "Calendar",
        layer: "organism",
        defaultPhysics: { mass: 0.8, temperature: 0.3, charge: 0.5 },
        variants: {
            dense: { mass: 1.2, temperature: 0.7, charge: 0.2 },
            sparse: { mass: 0.5, temperature: 0.3, charge: 0.8 },
        },
        renderHint: "temporal",
        aliases: ["FullCalendar", "Schedule", "Planner", "DatePicker"],
        description: "Full calendar organism. Charge controls cell spacing.",
    },
    {
        prime: 683,
        name: "Kanban",
        layer: "organism",
        defaultPhysics: { mass: 0.8, temperature: 0.6, buoyancy: -0.5 },
        variants: {
            compact: { mass: 0.5, temperature: 0.3 },
            expanded: { mass: 1.0, temperature: 0.7 },
        },
        renderHint: "data",
        aliases: ["Board", "TaskBoard", "ProjectBoard", "Pipeline"],
        description: "Kanban task board. Horizontal lanes (negative buoyancy), warm active state.",
    },
];

// ─── SEED FUNCTION ──────────────────────────────────────────────────────────

async function seed() {
    console.log("Seeding periodic table...\n");

    // Create table if not exists
    await db.execute(`
        CREATE TABLE IF NOT EXISTS elements (
            prime INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            layer TEXT NOT NULL CHECK(layer IN ('atomic', 'molecular', 'organism')),
            default_physics TEXT NOT NULL,
            variants TEXT DEFAULT '{}',
            render_hint TEXT DEFAULT 'container' CHECK(render_hint IN (
                'container', 'text', 'action', 'input', 'data', 'layout', 'temporal', 'media'
            )),
            aliases TEXT DEFAULT '[]',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS prefabs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            topology TEXT NOT NULL,
            default_physics TEXT DEFAULT '{}',
            description TEXT,
            usage_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed elements
    for (const el of ELEMENTS) {
        await db.execute({
            sql: `INSERT OR REPLACE INTO elements (prime, name, layer, default_physics, variants, render_hint, aliases, description)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                el.prime,
                el.name,
                el.layer,
                JSON.stringify(el.defaultPhysics),
                JSON.stringify(el.variants),
                el.renderHint,
                JSON.stringify(el.aliases),
                el.description,
            ],
        });
        console.log(`  ${el.layer.padEnd(10)} ${el.prime.toString().padStart(3)} → ${el.name}`);
    }

    // Summary
    const atomic = ELEMENTS.filter((e) => e.layer === "atomic").length;
    const molecular = ELEMENTS.filter((e) => e.layer === "molecular").length;
    const organism = ELEMENTS.filter((e) => e.layer === "organism").length;

    console.log(`\n  Seeded ${ELEMENTS.length} elements:`);
    console.log(`    Atomic:    ${atomic}`);
    console.log(`    Molecular: ${molecular}`);
    console.log(`    Organism:  ${organism}`);
    console.log(`\n  Periodic table ready.`);
}

seed().catch(console.error);
