// ═══════════════════════════════════════════════════════════════════════════
// MASK — Role visibility masking for topology nodes
// ═══════════════════════════════════════════════════════════════════════════

import type { Topology, TopologyNode, TopologyNodeV2, RoleMask } from "@/lib/manifold/topology";
import { isNodeV2, nodeToV2 } from "@/lib/manifold/topology";
import type { UIPhysics } from "@/lib/manifold/phi";

/**
 * Apply a role mask to a topology, filtering out hidden nodes.
 * Returns a new topology with hidden nodes removed.
 */
export function applyMask(topology: Topology, roleName: string): Topology {
    const role = topology.roles?.find((r) => r.name === roleName);
    if (!role) return topology;

    const hiddenSet = new Set(role.hiddenNodes);

    const filterNode = (node: TopologyNode, parentId: string, index: number): TopologyNodeV2 | null => {
        let v2Node: TopologyNodeV2;

        if (isNodeV2(node)) {
            v2Node = node;
        } else {
            v2Node = nodeToV2(node, parentId, index);
        }

        // Check if this node is hidden
        if (hiddenSet.has(v2Node.id)) {
            return null;
        }

        // Filter children recursively
        const filteredChildren: TopologyNodeV2[] = [];
        v2Node.children.forEach((child, i) => {
            const filtered = filterNode(child, v2Node.id, i);
            if (filtered) filteredChildren.push(filtered);
        });

        return {
            ...v2Node,
            children: filteredChildren,
            // Apply role physics overrides if present
            physics: role.physicsOverrides
                ? { ...v2Node.physics, ...role.physicsOverrides }
                : v2Node.physics,
        };
    };

    // Build new pages with filtered nodes
    const newPages: typeof topology.pages = {};

    for (const [pageKey, page] of Object.entries(topology.pages)) {
        const filteredUi: TopologyNodeV2[] = [];
        page.ui.forEach((node, i) => {
            const filtered = filterNode(node, `page.${pageKey}`, i);
            if (filtered) filteredUi.push(filtered);
        });

        newPages[Number(pageKey)] = {
            ...page,
            ui: filteredUi,
        };
    }

    return {
        ...topology,
        pages: newPages,
    };
}

/**
 * Get the list of visible node IDs for a role.
 */
export function getVisibleNodes(topology: Topology, roleName: string): string[] {
    const role = topology.roles?.find((r) => r.name === roleName);
    const allNodes = extractAllNodeIds(topology);

    if (!role) return allNodes;

    const hiddenSet = new Set(role.hiddenNodes);
    return allNodes.filter((id) => !hiddenSet.has(id));
}

/**
 * Toggle node visibility for a role.
 */
export function toggleNodeVisibility(
    topology: Topology,
    roleName: string,
    nodeId: string
): Topology {
    const roles = [...(topology.roles || [])];
    let role = roles.find((r) => r.name === roleName);

    if (!role) {
        role = { name: roleName, hiddenNodes: [] };
        roles.push(role);
    }

    const hiddenSet = new Set(role.hiddenNodes);
    if (hiddenSet.has(nodeId)) {
        hiddenSet.delete(nodeId);
    } else {
        hiddenSet.add(nodeId);
    }

    role.hiddenNodes = [...hiddenSet];

    return {
        ...topology,
        roles,
    };
}

/**
 * Re-derive physics for remaining visible nodes after masking.
 * This redistributes pressure/buoyancy so the layout looks intentional.
 */
export function rebalancePhysics(
    nodes: TopologyNodeV2[],
    totalPressure: number = 1
): TopologyNodeV2[] {
    if (nodes.length === 0) return nodes;

    // Distribute pressure evenly among visible nodes
    const pressurePerNode = totalPressure / nodes.length;

    return nodes.map((node) => ({
        ...node,
        physics: {
            ...node.physics,
            pressure: pressurePerNode,
        },
        children: rebalancePhysics(node.children, pressurePerNode),
    }));
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractAllNodeIds(topology: Topology): string[] {
    const ids: string[] = [];

    const collect = (node: TopologyNode, parentId: string, index: number) => {
        if (isNodeV2(node)) {
            ids.push(node.id);
            node.children.forEach((child, i) => collect(child, node.id, i));
        } else {
            const id = `${parentId}.${index}`;
            ids.push(id);
            node[2].forEach((child, i) => collect(child, id, i));
        }
    };

    Object.entries(topology.pages).forEach(([pageKey, page]) => {
        page.ui.forEach((node, i) => collect(node, `page.${pageKey}`, i));
    });

    return ids;
}
