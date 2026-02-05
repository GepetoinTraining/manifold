// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS — Dispatcher for button emissions
// ═══════════════════════════════════════════════════════════════════════════

import type { ActionDefinition } from "@/lib/world/types";

// ─── ACTION PRIMES ───────────────────────────────────────────────────────────

export const ACTION_PRIMES = {
    navigate: 227,
    submit: 251,
    modal: 263,
    mutation: 269,
} as const;

export const API_PRIMES = {
    get: 307,
    post: 313,
    put: 317,
    delete: 331,
} as const;

// ─── ACTION EXECUTOR ─────────────────────────────────────────────────────────

export interface ActionContext {
    appId?: string;
    state?: unknown;
    navigate?: (url: string) => void;
    openModal?: (modalId: string) => void;
    refresh?: () => void;
}

export async function executeAction(
    action: ActionDefinition,
    context: ActionContext
): Promise<unknown> {
    // 1. Handle emit (API call)
    if (action.emit) {
        const url = interpolateUrl(action.emit.url, context);
        const payload = resolvePayload(action.emit.payload, context);

        const response = await fetch(url, {
            method: action.emit.method,
            headers: { "Content-Type": "application/json" },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Action failed: ${response.statusText}`);
        }

        const result = await response.json().catch(() => ({}));

        // 2. Handle follow-up action
        if (action.then) {
            if (typeof action.then === "number") {
                // Prime-based action type
                if (action.then === ACTION_PRIMES.navigate && result.id) {
                    context.navigate?.(`/?q=${result.id}`);
                }
            } else if (typeof action.then === "string") {
                // Named follow-up action
                if (action.then === "navigate_to_new" && result.id) {
                    context.navigate?.(`/?q=${result.id}`);
                } else if (action.then === "refresh") {
                    context.refresh?.();
                }
            }
        }

        return result;
    }

    // 3. Handle modal action
    if (action.type === ACTION_PRIMES.modal) {
        context.openModal?.("share");
        return null;
    }

    return null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function interpolateUrl(url: string, context: ActionContext): string {
    return url
        .replace("{appId}", context.appId || "")
        .replace("{id}", context.appId || "");
}

function resolvePayload(
    payload: string | object | undefined,
    context: ActionContext
): unknown {
    if (!payload) return undefined;

    if (typeof payload === "string") {
        if (payload === "$state") {
            return context.state;
        }
        return payload;
    }

    return payload;
}

// ─── ACTION REGISTRY ─────────────────────────────────────────────────────────

export function createActionHandler(
    actions: Record<string, ActionDefinition>,
    context: ActionContext
) {
    return async (actionKey: string) => {
        const action = actions[actionKey];
        if (!action) {
            console.warn(`Unknown action: ${actionKey}`);
            return;
        }

        try {
            await executeAction(action, context);
        } catch (error) {
            console.error(`Action ${actionKey} failed:`, error);
        }
    };
}
