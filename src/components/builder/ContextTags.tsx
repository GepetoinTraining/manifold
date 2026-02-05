"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT TAGS — Left column: extracted tags display/edit
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";

export interface Tag {
    id: string;
    label: string;
    value: string;
    phase: string;
    editable?: boolean;
}

interface ContextTagsProps {
    tags: Tag[];
    onTagUpdate?: (id: string, newValue: string) => void;
    onTagDelete?: (id: string) => void;
    onTagAdd?: (label: string, value: string) => void;
}

export function ContextTags({
    tags,
    onTagUpdate,
    onTagDelete,
    onTagAdd,
}: ContextTagsProps) {
    const [newTagLabel, setNewTagLabel] = useState("");
    const [newTagValue, setNewTagValue] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddTag = () => {
        if (newTagLabel.trim() && newTagValue.trim() && onTagAdd) {
            onTagAdd(newTagLabel.trim(), newTagValue.trim());
            setNewTagLabel("");
            setNewTagValue("");
            setShowAddForm(false);
        }
    };

    // Group tags by phase
    const tagsByPhase = tags.reduce(
        (acc, tag) => {
            if (!acc[tag.phase]) acc[tag.phase] = [];
            acc[tag.phase].push(tag);
            return acc;
        },
        {} as Record<string, Tag[]>
    );

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "16px",
                background: "rgba(200,190,170,0.02)",
                borderRight: "1px solid rgba(200,190,170,0.08)",
                overflow: "auto",
            }}
        >
            {/* Header */}
            <div
                style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(200,190,170,0.08)",
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        fontFamily: "'DM Mono', monospace",
                        color: "#c9a227",
                        marginBottom: "4px",
                    }}
                >
                    CONTEXT
                </div>
                <div style={{ fontSize: "12px", color: "#8a8070" }}>
                    Extracted from interview
                </div>
            </div>

            {/* Tags grouped by phase */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                {Object.entries(tagsByPhase).map(([phase, phaseTags]) => (
                    <div key={phase}>
                        <div
                            style={{
                                fontSize: "10px",
                                fontFamily: "'DM Mono', monospace",
                                color: "#8a8070",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                            }}
                        >
                            {phase}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {phaseTags.map((tag) => (
                                <TagItem
                                    key={tag.id}
                                    tag={tag}
                                    onUpdate={onTagUpdate}
                                    onDelete={onTagDelete}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add tag form */}
            {showAddForm ? (
                <div
                    style={{
                        marginTop: "auto",
                        padding: "12px",
                        background: "rgba(200,190,170,0.04)",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <input
                        value={newTagLabel}
                        onChange={(e) => setNewTagLabel(e.target.value)}
                        placeholder="Label"
                        style={{
                            padding: "8px",
                            background: "rgba(200,190,170,0.06)",
                            border: "1px solid rgba(200,190,170,0.12)",
                            borderRadius: "6px",
                            color: "#e8e0d0",
                            fontSize: "12px",
                            outline: "none",
                        }}
                    />
                    <input
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        placeholder="Value"
                        style={{
                            padding: "8px",
                            background: "rgba(200,190,170,0.06)",
                            border: "1px solid rgba(200,190,170,0.12)",
                            borderRadius: "6px",
                            color: "#e8e0d0",
                            fontSize: "12px",
                            outline: "none",
                        }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={handleAddTag}
                            style={{
                                flex: 1,
                                padding: "8px",
                                background: "#c9a227",
                                color: "#0f0e0c",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            style={{
                                padding: "8px 12px",
                                background: "transparent",
                                color: "#8a8070",
                                border: "1px solid rgba(200,190,170,0.12)",
                                borderRadius: "6px",
                                fontSize: "11px",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                        marginTop: "auto",
                        padding: "10px",
                        background: "transparent",
                        border: "1px dashed rgba(200,190,170,0.2)",
                        borderRadius: "8px",
                        color: "#8a8070",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                    }}
                >
                    + Add tag
                </button>
            )}
        </div>
    );
}

// ─── TAG ITEM ────────────────────────────────────────────────────────────────

function TagItem({
    tag,
    onUpdate,
    onDelete,
}: {
    tag: Tag;
    onUpdate?: (id: string, value: string) => void;
    onDelete?: (id: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(tag.value);

    const handleSave = () => {
        if (onUpdate) onUpdate(tag.id, value);
        setEditing(false);
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                background: "rgba(200,190,170,0.04)",
                borderRadius: "6px",
                border: "1px solid rgba(200,190,170,0.08)",
            }}
        >
            <div
                style={{
                    fontSize: "10px",
                    fontFamily: "'DM Mono', monospace",
                    color: "#c9a227",
                    minWidth: "60px",
                }}
            >
                {tag.label}
            </div>
            {editing ? (
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    autoFocus
                    style={{
                        flex: 1,
                        padding: "4px",
                        background: "rgba(200,190,170,0.06)",
                        border: "1px solid rgba(200,190,170,0.2)",
                        borderRadius: "4px",
                        color: "#e8e0d0",
                        fontSize: "12px",
                        outline: "none",
                    }}
                />
            ) : (
                <div
                    onClick={() => tag.editable !== false && setEditing(true)}
                    style={{
                        flex: 1,
                        fontSize: "12px",
                        color: "#e8e0d0",
                        cursor: tag.editable !== false ? "pointer" : "default",
                    }}
                >
                    {tag.value}
                </div>
            )}
            {onDelete && (
                <button
                    onClick={() => onDelete(tag.id)}
                    style={{
                        padding: "2px 6px",
                        background: "transparent",
                        border: "none",
                        color: "#8a8070",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: 0.6,
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
}
