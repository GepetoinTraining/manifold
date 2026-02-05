"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PRECIPITATE — Walks topology tree and renders PhysicsNodes
// ═══════════════════════════════════════════════════════════════════════════

import { type CSSProperties } from "react";
import { PhysicsNode } from "./PhysicsNode";
import type { TopologyNode, TopologyNodeV2, TopologyNodeV1 } from "@/lib/manifold/topology";
import { isNodeV2, nodeToV2 } from "@/lib/manifold/topology";
import { canvasStyles } from "@/lib/manifold/phi";

interface PrecipitateProps {
    nodes: TopologyNode[];
    selectedNodeId?: string | null;
    onSelectNode?: (nodeId: string) => void;
    pageId?: string;
}

export function Precipitate({
    nodes,
    selectedNodeId,
    onSelectNode,
    pageId = "page",
}: PrecipitateProps) {
    // Render a single node recursively
    const renderNode = (
        node: TopologyNode,
        depth: number,
        index: number,
        parentId: string
    ) => {
        // Convert to v2 if needed
        const v2Node: TopologyNodeV2 = isNodeV2(node)
            ? node
            : nodeToV2(node as TopologyNodeV1, parentId, index);

        const isSelected = selectedNodeId === v2Node.id;

        return (
            <PhysicsNode
                key={v2Node.id}
                node={v2Node}
                depth={depth}
                index={index}
                selected={isSelected}
                onSelect={onSelectNode}
            >
                {v2Node.children.length > 0 && (
                    <>
                        {v2Node.children.map((child, i) =>
                            renderNode(child, depth + 1, i, v2Node.id)
                        )}
                    </>
                )}
            </PhysicsNode>
        );
    };

    return (
        <div style={canvasStyles()}>
            {nodes.map((node, i) => renderNode(node, 0, i, pageId))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS — The precipitation container
// ═══════════════════════════════════════════════════════════════════════════

interface CanvasProps {
    children: React.ReactNode;
    style?: CSSProperties;
}

export function Canvas({ children, style }: CanvasProps) {
    return (
        <div
            style={{
                ...canvasStyles(),
                ...style,
            }}
        >
            {children}
        </div>
    );
}
