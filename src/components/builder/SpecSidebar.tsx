"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SPEC SIDEBAR — Collapsible left panel showing extracted app specs
// Claude populates this as the interview progresses
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import {
  Box,
  Text,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Button,
  ScrollArea,
  Transition,
  UnstyledButton,
} from "@mantine/core";

export interface Tag {
  id: string;
  label: string;
  value: string;
  phase: string;
  editable?: boolean;
}

interface SpecSidebarProps {
  tags: Tag[];
  collapsed: boolean;
  onToggle: () => void;
  onTagUpdate?: (id: string, newValue: string) => void;
  onTagDelete?: (id: string) => void;
  onTagAdd?: (label: string, value: string) => void;
}

export function SpecSidebar({
  tags,
  collapsed,
  onToggle,
  onTagUpdate,
  onTagDelete,
  onTagAdd,
}: SpecSidebarProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = useCallback(() => {
    if (newLabel.trim() && newValue.trim() && onTagAdd) {
      onTagAdd(newLabel.trim(), newValue.trim());
      setNewLabel("");
      setNewValue("");
      setShowAddForm(false);
    }
  }, [newLabel, newValue, onTagAdd]);

  // Group tags by phase
  const grouped = tags.reduce(
    (acc, tag) => {
      if (!acc[tag.phase]) acc[tag.phase] = [];
      acc[tag.phase].push(tag);
      return acc;
    },
    {} as Record<string, Tag[]>
  );

  return (
    <Box
      style={{
        width: collapsed ? 36 : "100%",
        minWidth: collapsed ? 36 : undefined,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--mantine-color-dark-5)",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Toggle button */}
      <Group
        justify={collapsed ? "center" : "space-between"}
        px={collapsed ? 0 : "sm"}
        py={6}
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-5)",
          flexShrink: 0,
          minHeight: 34,
        }}
      >
        {!collapsed && (
          <Text
            ff="monospace"
            size="xs"
            c="ice.5"
            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            specs
          </Text>
        )}
        <ActionIcon
          variant="subtle"
          color="frost"
          size="xs"
          onClick={onToggle}
          title={collapsed ? "Expand specs" : "Collapse specs"}
        >
          <Text size="xs" ff="monospace">
            {collapsed ? "▸" : "◂"}
          </Text>
        </ActionIcon>
      </Group>

      {/* Content (hidden when collapsed) */}
      {!collapsed && (
        <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
          <Stack gap="md" p="sm">
            {Object.keys(grouped).length === 0 && (
              <Box py="xl" style={{ textAlign: "center" }}>
                <Text c="dimmed" size="xs" ff="monospace">
                  specs will appear here
                </Text>
                <Text c="dimmed" size="xs" ff="monospace" mt={4}>
                  as you describe your app
                </Text>
              </Box>
            )}

            {Object.entries(grouped).map(([phase, phaseTags]) => (
              <Box key={phase}>
                <Text
                  ff="monospace"
                  size="10px"
                  c="frost.4"
                  mb={6}
                  style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  {phase}
                </Text>
                <Stack gap={4}>
                  {phaseTags.map((tag) => (
                    <TagItem
                      key={tag.id}
                      tag={tag}
                      onUpdate={onTagUpdate}
                      onDelete={onTagDelete}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      )}

      {/* Add tag button (at bottom) */}
      {!collapsed && (
        <Box
          px="sm"
          pb="sm"
          pt={4}
          style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}
        >
          {showAddForm ? (
            <Stack gap={6}>
              <TextInput
                value={newLabel}
                onChange={(e) => setNewLabel(e.currentTarget.value)}
                placeholder="Label"
                size="xs"
                styles={{
                  input: {
                    background: "var(--mantine-color-dark-8)",
                    border: "1px solid var(--mantine-color-dark-5)",
                    fontSize: "11px",
                  },
                }}
              />
              <TextInput
                value={newValue}
                onChange={(e) => setNewValue(e.currentTarget.value)}
                placeholder="Value"
                size="xs"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                styles={{
                  input: {
                    background: "var(--mantine-color-dark-8)",
                    border: "1px solid var(--mantine-color-dark-5)",
                    fontSize: "11px",
                  },
                }}
              />
              <Group gap={4}>
                <Button size="xs" color="ice" flex={1} onClick={handleAdd}>
                  Add
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="frost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          ) : (
            <UnstyledButton
              onClick={() => setShowAddForm(true)}
              w="100%"
              py={6}
              style={{
                textAlign: "center",
                border: "1px dashed var(--mantine-color-dark-4)",
                borderRadius: "var(--mantine-radius-sm)",
              }}
            >
              <Text ff="monospace" size="xs" c="dimmed">
                + add spec
              </Text>
            </UnstyledButton>
          )}
        </Box>
      )}
    </Box>
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
    <Group
      gap={6}
      wrap="nowrap"
      py={4}
      px={8}
      style={{
        background: "var(--mantine-color-dark-7)",
        borderRadius: "var(--mantine-radius-sm)",
        border: "1px solid var(--mantine-color-dark-5)",
      }}
    >
      <Text
        ff="monospace"
        size="10px"
        c="ice.5"
        style={{ minWidth: 50, flexShrink: 0 }}
      >
        {tag.label}
      </Text>

      {editing ? (
        <TextInput
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          size="xs"
          flex={1}
          styles={{
            input: {
              background: "var(--mantine-color-dark-8)",
              border: "1px solid var(--mantine-color-dark-4)",
              fontSize: "11px",
              height: 22,
              minHeight: 22,
              padding: "0 6px",
            },
          }}
        />
      ) : (
        <Text
          size="xs"
          c="frost.2"
          flex={1}
          style={{
            cursor: tag.editable !== false ? "pointer" : "default",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={() => tag.editable !== false && setEditing(true)}
        >
          {tag.value}
        </Text>
      )}

      {onDelete && (
        <ActionIcon
          variant="subtle"
          color="frost"
          size="xs"
          onClick={() => onDelete(tag.id)}
          style={{ opacity: 0.5 }}
        >
          <Text size="xs">×</Text>
        </ActionIcon>
      )}
    </Group>
  );
}
