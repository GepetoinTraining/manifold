// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD WORLD — Logged-in home (v1.12)
// Shows user's apps and shared apps
// ═══════════════════════════════════════════════════════════════════════════

import type {
    World,
    TopologyDefinition,
    Atom,
    Bridge,
    ManifestParams
} from "@/lib/world/types";

// ─── TOPOLOGY (Navigation Plane) ─────────────────────────────────────────────

export const Topology: TopologyDefinition = {
    type: "TabShell",
    data: {
        header: {
            brand: "MANIFOLD",
            slots: {
                actions: [
                    { label: "+ New App", action: "create_app", prime: 1225919 },
                ],
            },
        },
        tabs: [
            { key: "my_apps", label: "My Apps", icon: "📱" },
            { key: "shared", label: "Shared With Me", icon: "🤝" },
            { key: "templates", label: "Templates", icon: "📋" },
        ],
    },
    actions: {
        create_app: {
            emit: { url: "/api/app", method: "POST", payload: { title: "Untitled", topology: "{}" } },
            then: "navigate_to_new",
        },
        open_app: {
            type: 227, // navigate
        },
        delete_app: {
            emit: { url: "/api/app/{appId}", method: "DELETE" },
            then: "refresh",
        },
    },
};

// ─── MANIFEST (Workspace Plane) ──────────────────────────────────────────────

export const Manifest = async (bridge: Bridge, params: ManifestParams): Promise<Atom[]> => {
    const userId = params.user?.id;
    const tab = params.view || "my_apps";

    interface AppRecord {
        id: string;
        name: string;
        topology: string;
        created_at: string;
        updated_at: string;
    }

    let myApps: AppRecord[] = [];
    let sharedApps: AppRecord[] = [];

    if (userId) {
        try {
            // Fetch user's apps
            myApps = await bridge.query<AppRecord[]>("App", "findMany", {
                where: { ownerId: userId },
                orderBy: { updatedAt: "desc" },
            });
        } catch {
            // Bridge not available
        }
    }

    // Return based on active tab
    if (tab === "my_apps") {
        return [{
            id: "app_grid",
            type: "AppGrid",
            data: {
                title: "My Apps",
                apps: myApps.map((app) => ({
                    id: app.id,
                    title: app.name || "Untitled",
                    icon: "📱",
                    status: "draft",
                    lastUsedAt: app.updated_at,
                    action: "open_app",
                })),
                emptyMessage: "No apps yet. Create your first one!",
            },
            physics: {
                mass: 1.0,
                density: "liquid",
            },
        }];
    }

    if (tab === "shared") {
        return [{
            id: "shared_grid",
            type: "AppGrid",
            data: {
                title: "Shared With Me",
                apps: sharedApps.map((app) => ({
                    id: app.id,
                    title: app.name || "Untitled",
                    icon: "🤝",
                    status: "shared",
                    lastUsedAt: app.updated_at,
                    action: "open_app",
                })),
                emptyMessage: "No apps have been shared with you yet.",
            },
            physics: {
                mass: 1.0,
                density: "liquid",
            },
        }];
    }

    if (tab === "templates") {
        return [{
            id: "template_grid",
            type: "AppGrid",
            data: {
                title: "Templates",
                apps: [
                    { id: "tpl_mindmap", title: "Mind Map", icon: "🧠", status: "template", action: "use_template" },
                    { id: "tpl_kanban", title: "Kanban Board", icon: "📋", status: "template", action: "use_template" },
                    { id: "tpl_chat", title: "Chat App", icon: "💬", status: "template", action: "use_template" },
                    { id: "tpl_dashboard", title: "Dashboard", icon: "📊", status: "template", action: "use_template" },
                ],
                emptyMessage: "",
            },
            physics: {
                mass: 1.0,
                density: "liquid",
            },
        }];
    }

    return [];
};

// ─── WORLD EXPORT ────────────────────────────────────────────────────────────

const DashboardWorld: World = {
    Topology,
    Manifest,
};

export default DashboardWorld;
