// ═══════════════════════════════════════════════════════════════════════════
// WORLD TYPES — Two-Plane Architecture (v1.12)
// Navigation (WHERE) + Workspace (WHAT)
// ═══════════════════════════════════════════════════════════════════════════

// ─── TOPOLOGY (Navigation Plane) ─────────────────────────────────────────────

export type ShellType = 'SchoolShell' | 'TabShell' | 'Immersive' | 'SplitPane';

export interface PanelConfig {
    ratio: number;           // 0-1, responsive
    resizable: boolean;      // show drag handle
    minRatio?: number;       // minimum when resizing
    maxRatio?: number;       // maximum when resizing
}

export interface SidebarConfig extends PanelConfig {
    title: string;
    position: 'left' | 'right';
    links: NavLink[];
    slots?: {
        list?: string;         // data key for dynamic list
        actions?: ActionSlot[];
    };
}

export interface HeaderConfig {
    brand: string;
    links?: NavLink[];
    slots?: {
        views?: boolean;       // show view switcher
        actions?: ActionSlot[];
    };
}

export interface TabConfig {
    key: string;
    label: string;
    icon?: string;
}

export interface NavLink {
    label: string;
    href?: string;
    action?: string;         // action key
    icon?: string;
    active?: boolean;
}

export interface ActionSlot {
    label: string;
    action: string;          // key into actions map
    prime?: number;          // button styling
}

export interface ViewDefinition {
    key: string;
    label: string;
    workspace: WorkspaceType;
    icon?: string;
}

export interface ActionDefinition {
    type?: number;           // action type prime
    emit?: {
        target?: number;       // api.post=313, api.put=317
        url: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        payload?: string | object;
    };
    then?: number | string;  // follow-up action (navigate prime or action key)
}

export interface TopologyDefinition {
    type: ShellType;
    data: {
        sidebar?: SidebarConfig;
        header?: HeaderConfig;
        tabs?: TabConfig[];
        user?: unknown;
    };
    views?: ViewDefinition[];
    actions?: Record<string, ActionDefinition>;
    children?: Atom[];
}

// ─── WORKSPACE (Content Plane) ───────────────────────────────────────────────

export type WorkspaceType = 'Canvas3D' | 'Canvas2D' | 'Grid' | 'Document' | 'Stream';

export interface WorkspacePhysics {
    mass?: number;
    density?: 'void' | 'gas' | 'liquid' | 'solid' | 'dense';
    temperature?: number;
    height?: string;
    flexGrow?: number;
    gap?: number;
}

export interface Atom {
    id?: string;
    type: string;            // component type
    data: unknown;           // component-specific data
    physics?: WorkspacePhysics;
    children?: Atom[];
    buttons?: ActionSlot[];  // workspace-level actions
}

// ─── WORLD FILE ──────────────────────────────────────────────────────────────

export interface Bridge {
    query: <T = unknown>(
        model: string,
        operation: string,
        args: Record<string, unknown>
    ) => Promise<T>;
}

export interface ManifestParams {
    user?: { id: string; name?: string };
    id?: string;             // resource ID
    view?: string;           // active view key
    [key: string]: unknown;  // additional params
}

export interface World {
    Topology: TopologyDefinition;
    Manifest: (bridge: Bridge, params: ManifestParams) => Promise<Atom[]>;
}

// ─── PREFAB PATTERNS ─────────────────────────────────────────────────────────

export type PrefabPattern =
    | 'sidebar_workspace'    // Sidebar + Workspace
    | 'tabs_workspace'       // Tabs + Workspace
    | 'immersive'            // Full bleed
    | 'split_pane';          // Primary + Secondary

export const PREFAB_SHELLS: Record<PrefabPattern, ShellType> = {
    sidebar_workspace: 'SchoolShell',
    tabs_workspace: 'TabShell',
    immersive: 'Immersive',
    split_pane: 'SplitPane',
};

export const PREFAB_DEFAULTS: Record<PrefabPattern, Partial<TopologyDefinition['data']>> = {
    sidebar_workspace: {
        sidebar: {
            title: 'Navigation',
            position: 'left',
            ratio: 0.25,
            resizable: true,
            links: [],
        },
        header: {
            brand: 'App',
        },
    },
    tabs_workspace: {
        tabs: [],
        header: { brand: 'Dashboard' },
    },
    immersive: {
        header: { brand: '' },
    },
    split_pane: {
        sidebar: {
            title: 'Primary',
            position: 'left',
            ratio: 0.618,
            resizable: true,
            links: [],
        },
    },
};

// ─── ENTITY SCHEMAS ──────────────────────────────────────────────────────────

export type EntitySchema = 'MindMap' | 'Kanban' | 'Chat' | 'Document' | 'Dashboard';

export interface EntityDefinition {
    workspace: WorkspaceType;
    entities: Record<string, Record<string, string>>;
    behaviors: Record<string, string>;
}

export const ENTITY_SCHEMAS: Record<EntitySchema, EntityDefinition> = {
    MindMap: {
        workspace: 'Canvas3D',
        entities: {
            node: { x: 'number', y: 'number', z: 'number', label: 'string', shape: 'string', color: 'string' },
            connection: { from: 'string', to: 'string', type: 'string' },
        },
        behaviors: {
            'drag node': 'update position',
            'click empty': 'create node',
            'drag node→node': 'create connection',
        },
    },
    Kanban: {
        workspace: 'Grid',
        entities: {
            card: { lane: 'string', position: 'number', title: 'string', labels: 'string[]' },
            lane: { title: 'string', limit: 'number' },
        },
        behaviors: {
            'drag card': 'move between lanes',
            'click +': 'create card',
        },
    },
    Chat: {
        workspace: 'Stream',
        entities: {
            message: { role: 'string', content: 'string', timestamp: 'string' },
        },
        behaviors: {
            submit: 'send message',
            scroll: 'load history',
        },
    },
    Document: {
        workspace: 'Document',
        entities: {
            block: { type: 'string', content: 'string' },
        },
        behaviors: {
            type: 'update block',
            enter: 'new block',
        },
    },
    Dashboard: {
        workspace: 'Grid',
        entities: {
            metric: { label: 'string', value: 'number', unit: 'string' },
            chart: { type: 'string', data: 'array' },
        },
        behaviors: {
            click: 'drill down',
        },
    },
};
