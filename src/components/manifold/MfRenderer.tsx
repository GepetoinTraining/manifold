"use client";

import React, { forwardRef } from "react";
import {
  parse,
  resolve,
  phi,
  buttonCSS,
  inputCSS,
  generateTexture,
  SPECTRUMS,
  ROLE,
  type MfNode,
  type MfVariable,
  type RenderContext,
  type ResolvedClass,
  type SpectrumColors,
} from "@/lib/manifold/engine";

// ── @VARIABLE RESOLUTION (POSITIONAL) ──

// Resolve a single slot value
function resolveSlot(
  v: MfVariable,
  ownerData: unknown[] | null,
  userData: unknown[] | null,
  allVars?: MfVariable[],
): unknown {
  if (v.type === "@" && ownerData) {
    return v.slotIndex >= 0 ? ownerData[v.slotIndex] : undefined;
  } else if (v.type === "@@" && userData) {
    return v.slotIndex >= 0 ? userData[v.slotIndex] : undefined;
  } else if (v.type === "@=" && allVars) {
    // Compute: find nearest preceding @ and @@ → multiply
    const idx = allVars.indexOf(v);
    let ownerVal: number | null = null;
    let userVal: number | null = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (allVars[i].type === "@" && ownerVal === null && ownerData) {
        ownerVal = Number(ownerData[allVars[i].slotIndex]) || 0;
      }
      if (allVars[i].type === "@@" && userVal === null && userData) {
        userVal = Number(userData[allVars[i].slotIndex]) || 0;
      }
      if (ownerVal !== null && userVal !== null) break;
    }
    if (ownerVal !== null && userVal !== null) return ownerVal * userVal;
    return undefined;
  }
  return undefined;
}

function resolveVariableText(
  variables: MfVariable[],
  ownerData: unknown[] | null,
  userData: unknown[] | null,
): string {
  return variables
    .map((v) => {
      const parts: string[] = [];
      if (v.prefix) parts.push(v.prefix);

      const value = resolveSlot(v, ownerData, userData, variables);

      if (value !== undefined && value !== null) {
        parts.push(String(value));
      } else {
        parts.push("…");
      }

      if (v.suffix) parts.push(v.suffix);
      return parts.join(" ");
    })
    .join(" ");
}

// Resolve @/@@ in a single macro field string using the node's variables
function resolveFieldText(
  fieldText: string,
  fieldIndex: number,
  variables: MfVariable[] | null,
  ownerData: unknown[] | null,
  userData: unknown[] | null,
): string {
  if (!variables || !fieldText.includes("@")) return fieldText;
  // Replace each bare slot sigil with the resolved value
  let varCursor = 0;
  return fieldText.replace(/(@=|@@|@)[\w.]*/g, () => {
    // Find the matching variable by order of appearance across all fields
    // Count how many slots appear before this field
    while (varCursor < variables.length) {
      const v = variables[varCursor];
      varCursor++;
      const val = resolveSlot(v, ownerData, userData, variables);
      return val !== undefined && val !== null ? String(val) : "…";
    }
    return "…";
  });
}

// ── ACTION LABELS ──

const ACTION_NAMES: Record<number, string> = {
  0: "none",
  1: "navigate",
  2: "addToCart",
  3: "removeCart",
  4: "increment",
  5: "decrement",
  6: "submit",
  7: "toggle",
  8: "open",
  9: "close",
};

// ── DEV MODE OVERLAY ──

function DevOverlay({
  resolved,
  role,
  action,
  slotInfo,
}: {
  resolved: ResolvedClass;
  role: string | null;
  action: number | null;
  slotInfo?: string | null;
}) {
  const coords = `d:${resolved.d} t:${resolved.t} m:${resolved.m} c:${resolved.c}`;
  const extra = [
    role ? `role:${role}` : null,
    action !== null ? `action:${ACTION_NAMES[action] || action}` : null,
    slotInfo ? slotInfo : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        background: "rgba(0,0,0,0.75)",
        color: "#0f0",
        fontSize: "9px",
        fontFamily: "monospace",
        padding: "2px 4px",
        borderRadius: "0 0 0 4px",
        zIndex: 9999,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {coords}
      {extra ? ` ${extra}` : ""}
    </div>
  );
}

// ── NODE RENDERER ──

function RenderNode({
  node,
  spectrumName,
  context,
  ownerData,
  userData,
  onAction,
  devMode,
}: {
  node: MfNode;
  spectrumName: string;
  context?: RenderContext | null;
  ownerData?: unknown[] | null;
  userData?: unknown[] | null;
  onAction?: (actionType: number, slotIndex: number, payload?: unknown) => void;
  devMode?: boolean;
}) {
  const resolved = resolve(node.classPath);
  const spec = resolved.spectrum || spectrumName;
  const S = SPECTRUMS[spec] || SPECTRUMS.eco;
  const role = ROLE[resolved.role] || null;
  const baseType = node.classPath
    .replace(/\[.*\]/, "")
    .split(".")[0]
    .toLowerCase();

  // Get physics CSS — pass node.layout through context for grid rendering
  const phiContext: RenderContext | null = context
    ? { ...context, layout: node.layout }
    : node.layout
      ? { childIndex: 0, siblingCount: 1, parentRole: null, layout: node.layout }
      : null;

  let finalCss = phi(resolved, spec, phiContext);

  const isButton = baseType === "button";
  const isLink = baseType === "link";
  const isInput = baseType === "input";
  const isDivider = baseType === "divider";
  const isSpacer = baseType === "spacer";
  const isPill = baseType === "pill";

  if (isButton) {
    finalCss = { ...finalCss, ...buttonCSS(resolved, S) };
    if (context?.parentRole === "hero") {
      finalCss.marginTop = "13px";
    }
  }

  if (isInput) {
    finalCss = { ...finalCss, ...inputCSS(S) };
  }

  if (isDivider) {
    finalCss = {
      ...finalCss,
      height: "1px",
      background: S.border,
      width: "100%",
      padding: 0,
    };
  }

  if (isSpacer) {
    finalCss = { ...finalCss, minHeight: "20px" };
  }

  if (isPill) {
    finalCss = {
      ...finalCss,
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "999px",
      fontSize: "0.82rem",
      fontWeight: 500,
      background: S.surfaceAlt,
      border: `1px solid ${S.border}`,
    };
  }

  // Resolve display text — @variables (positional) or static text
  let displayText: string | null;
  if (node.variables) {
    displayText = resolveVariableText(node.variables, ownerData || null, userData || null);
  } else if (node.texture) {
    displayText = generateTexture(context);
  } else {
    displayText = node.text || null;
  }

  // Slot info for devMode overlay
  const slotInfo = node.variables
    ? node.variables.map((v) => `${v.type}[${v.slotIndex}]`).join(",")
    : null;

  // Build children context
  const childContext = (ci: number, sc: number): RenderContext => ({
    childIndex: ci,
    siblingCount: sc,
    parentRole: role,
  });

  // Action handler — uses slot index instead of named target
  const handleAction = () => {
    if (node.action !== null && onAction) {
      const slotIndex = node.variables?.[0]?.slotIndex ?? -1;
      onAction(node.action, slotIndex);
    }
  };

  // Handle macro fields (icon;title;description) — resolve @slots inside fields
  if (node.fields) {
    // Build a cursor to track which variable maps to which field slot
    let fieldVarCursor = 0;
    const resolvedFields = node.fields.map((field) => {
      if (!node.variables || !field.includes("@")) return field;
      return field.replace(/(@=|@@|@)[\w.]*/g, () => {
        if (fieldVarCursor < node.variables!.length) {
          const v = node.variables![fieldVarCursor];
          fieldVarCursor++;
          const val = resolveSlot(v, ownerData || null, userData || null, node.variables!);
          return val !== undefined && val !== null ? String(val) : "…";
        }
        return "…";
      });
    });

    return (
      <div style={{ ...finalCss, position: "relative" }}>
        {devMode && (
          <DevOverlay resolved={resolved} role={role} action={node.action} slotInfo={slotInfo} />
        )}
        {resolvedFields.map((field, fi) => (
          <RenderNode
            key={fi}
            node={{
              classPath: "text",
              text: field,
              texture: field === "~",
              fields: null,
              layout: null,
              variables: null,
              action: null,
              actionTarget: null,
              children: [],
            }}
            spectrumName={spec}
            context={childContext(fi, node.fields!.length)}
            ownerData={ownerData}
            userData={userData}
            onAction={onAction}
            devMode={devMode}
          />
        ))}
        {node.children?.map((child, i) => (
          <RenderNode
            key={`c${i}`}
            node={child}
            spectrumName={spec}
            context={childContext(i + resolvedFields.length, resolvedFields.length + (node.children?.length || 0))}
            ownerData={ownerData}
            userData={userData}
            onAction={onAction}
            devMode={devMode}
          />
        ))}
      </div>
    );
  }

  // Render children
  const children = node.children?.map((child, i) => (
    <RenderNode
      key={i}
      node={child}
      spectrumName={spec}
      context={childContext(i, node.children.length)}
      ownerData={ownerData}
      userData={userData}
      onAction={onAction}
      devMode={devMode}
    />
  ));

  const hasText = displayText && displayText.trim();
  const hasChildren = node.children && node.children.length > 0;

  if (isButton) {
    return (
      <button
        style={{ ...finalCss, position: "relative" }}
        onClick={handleAction}
      >
        {devMode && (
          <DevOverlay resolved={resolved} role={role} action={node.action} slotInfo={slotInfo} />
        )}
        {hasText ? displayText : null}
        {children}
      </button>
    );
  }

  if (isLink) {
    return (
      <a
        href="#"
        style={{
          ...finalCss,
          position: "relative",
          textDecoration: "none",
          cursor: "pointer",
          color:
            context?.parentRole === "nav" ? S.textMuted : S.primary,
          fontSize:
            context?.parentRole === "nav" ? "0.9rem" : "inherit",
          transition: "color 0.2s ease",
        }}
        onClick={(e) => {
          e.preventDefault();
          handleAction();
        }}
      >
        {devMode && (
          <DevOverlay resolved={resolved} role={role} action={node.action} slotInfo={slotInfo} />
        )}
        {displayText}
      </a>
    );
  }

  if (isInput) {
    return (
      <div style={{ position: "relative" }}>
        {devMode && (
          <DevOverlay resolved={resolved} role={role} action={node.action} slotInfo={slotInfo} />
        )}
        <input
          style={finalCss}
          placeholder={displayText || ""}
          defaultValue={
            node.variables?.[0]
              ? String(resolveSlot(node.variables[0], ownerData || null, userData || null) ?? "")
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div style={{ ...finalCss, position: "relative" }}>
      {devMode && (
        <DevOverlay resolved={resolved} role={role} action={node.action} slotInfo={slotInfo} />
      )}
      {hasText && <span>{displayText}</span>}
      {children}
    </div>
  );
}

// ── MAIN RENDERER ──

const MfRenderer = forwardRef<
  HTMLDivElement,
  {
    source: string;
    maxWidth?: string;
    ownerData?: unknown[] | null;
    userData?: unknown[] | null;
    activeView?: string;
    onAction?: (actionType: number, slotIndex: number, payload?: unknown) => void;
    devMode?: boolean;
  }
>(function MfRenderer(
  {
    source,
    maxWidth = "1200px",
    ownerData,
    userData,
    activeView,
    onAction,
    devMode = false,
  },
  ref,
) {
  const { directives, tree, views, warnings, slots } = parse(source);
  const rootSpectrum = directives.spectrum || "eco";
  const S = SPECTRUMS[rootSpectrum] || SPECTRUMS.eco;

  // Select which view to render
  const viewTree = activeView && views[activeView] ? views[activeView] : tree;

  // Log parse warnings + slot counts in dev
  if (typeof window !== "undefined") {
    if (warnings.length > 0) {
      for (const w of warnings) {
        console.warn(`[Manifold] ${w.message} (line ${w.line})`);
      }
    }
    if (devMode) {
      console.info(`[Manifold] views: ${Object.keys(views).join(", ")} | slots:`, slots);
    }
  }

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: "100%",
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
        }}
      >
        {viewTree.map((node, i) => (
          <RenderNode
            key={i}
            node={node}
            spectrumName={rootSpectrum}
            context={{
              childIndex: i,
              siblingCount: viewTree.length,
              parentRole: null,
            }}
            ownerData={ownerData}
            userData={userData}
            onAction={onAction}
            devMode={devMode}
          />
        ))}
      </div>
    </div>
  );
});

export default MfRenderer;
