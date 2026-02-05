// ═══════════════════════════════════════════════════════════════════════════
// MINDMAP WORLD — Reference implementation (v1.12)
// Demonstrates two-plane architecture: Topology + Manifest
// ═══════════════════════════════════════════════════════════════════════════

import type {
    World,
    TopologyDefinition,
    Atom,
    Bridge,
    ManifestParams
} from "@/lib/world/types";

// ─── TOPOLOGY (Navigation Plane) ─────────────────────────────────────────────
// Static structure. Defines WHERE users can go.

export const Topology: TopologyDefinition = {
    type: "SchoolShell",
    data: {
        sidebar: {
            title: "MY MAPS",
            position: "left",
            ratio: 0.25,
            resizable: true,
            links: [
                { label: "Dashboard", href: "/?q=dashboard", icon: "⚡" },
                { label: "Mind Maps", href: "/?q=mindmap", icon: "🧠", active: true },
                { label: "Settings", href: "/?q=settings", icon: "⚙️" },
            ],
            slots: {
                list: "savedMaps",
                actions: [
                    { label: "+ New Map", action: "create_map", prime: 968309 },
                ],
            },
        },
        header: {
            brand: "CEREBRAL INTERFACE",
            slots: {
                views: true,
                actions: [
                    { label: "Share", action: "share_app", prime: 968309 },
                    { label: "Save", action: "save_app", prime: 1225919 },
                ],
            },
        },
    },
    views: [
        { key: "graph", label: "Graph", workspace: "Canvas3D", icon: "🕸️" },
        { key: "outline", label: "Outline", workspace: "Document", icon: "📝" },
        { key: "history", label: "History", workspace: "Stream", icon: "⏳" },
    ],
    actions: {
        create_map: {
            emit: { url: "/api/maps", method: "POST" },
            then: "navigate_to_new",
        },
        save_app: {
            emit: { url: "/api/apps/{appId}", method: "PUT", payload: "$state" },
        },
        share_app: {
            type: 263, // modal
        },
    },
};

// ─── MANIFEST (Workspace Plane) ──────────────────────────────────────────────
// Dynamic content. Fetched per request. Defines WHAT user works with.

export const Manifest = async (bridge: Bridge, params: ManifestParams): Promise<Atom[]> => {
    const userId = params.user?.id;
    const mapId = params.id;
    const view = params.view || "graph";

    // A. FETCH: Saved maps for sidebar
    let savedMaps: Array<{ id: string; title: string }> = [];
    if (userId) {
        try {
            const maps = await bridge.query<Array<{ id: string; title: string }>>(
                "MindMap",
                "findMany",
                {
                    where: { userId },
                    orderBy: { updatedAt: "desc" },
                }
            );
            savedMaps = maps.map((m) => ({ id: m.id, title: m.title }));
        } catch {
            // Bridge not available, use empty list
        }
    }

    // B. FETCH: Active map data
    interface MapNode {
        x: number;
        y: number;
        z?: number;
        label: string;
        shape: string;
        mass?: number;
        color?: string;
    }

    interface MapConnection {
        from: string;
        to: string;
        type?: string;
    }

    let activeMap = {
        id: "",
        title: "Untitled Map",
        activeColor: "#f59e0b",
        nodes: [{ x: 0, y: 0, z: 0, label: "Central Idea", shape: "circle", mass: 1.5, color: "#0ea5e9" }] as MapNode[],
        connections: [] as MapConnection[],
    };

    if (mapId) {
        try {
            const loaded = await bridge.query<typeof activeMap>(
                "MindMap",
                "findUnique",
                { where: { id: mapId } }
            );
            if (loaded) {
                activeMap = {
                    id: loaded.id,
                    title: loaded.title,
                    activeColor: "#f59e0b",
                    nodes: loaded.nodes,
                    connections: loaded.connections,
                };
            }
        } catch {
            // Use default map
        }
    }

    // C. RETURN: Workspace atom based on view
    const workspaceAtoms: Record<string, Atom> = {
        graph: {
            id: "mindmap_canvas",
            type: "MindMapCanvas",
            data: {
                activeMap,
                savedMaps,
            },
            physics: {
                mass: 1.0,
                density: "void",
                height: "100%",
            },
            buttons: [
                { label: "Add Node", action: "add_node" },
                { label: "Undo", action: "undo" },
            ],
        },
        outline: {
            id: "mindmap_outline",
            type: "MindMapOutline",
            data: {
                activeMap,
                savedMaps,
            },
            physics: {
                mass: 1.0,
                density: "liquid",
            },
        },
        history: {
            id: "mindmap_history",
            type: "MindMapHistory",
            data: {
                mapId: activeMap.id,
                entries: [], // Would fetch from bridge
            },
            physics: {
                mass: 1.0,
                density: "liquid",
            },
        },
    };

    return [workspaceAtoms[view] || workspaceAtoms.graph];
};

// ─── WORLD EXPORT ────────────────────────────────────────────────────────────

const MindMapWorld: World = {
    Topology,
    Manifest,
};

export default MindMapWorld;
