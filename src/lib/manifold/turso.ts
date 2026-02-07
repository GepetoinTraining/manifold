/**
 * MANIFOLD V3.1 — TURSO CLIENT
 *
 * Architecture: One row = one app. QR code = connection string.
 * The topology is the view. The schema defines capabilities.
 * Owner data is global (positional array). User data is personal (positional array).
 *
 * V3.1 shift: named JSON objects → positional arrays
 *   @ slots  → owner_data[index]
 *   @@ slots → user_data[index]
 *   @= slots → computed locally
 *
 * Two tables, two write paths:
 *   apps      ← owner writes (topology, prices, availability)
 *   user_apps ← user writes (cart, favorites, quantities)
 */

// ── SCHEMA ──

export const SCHEMA = `
-- The app itself: topology + all views
CREATE TABLE IF NOT EXISTS apps (
  app_id        TEXT PRIMARY KEY,
  topology      TEXT NOT NULL,
  owner_data    JSON NOT NULL DEFAULT '[]',
  defaults      JSON NOT NULL DEFAULT '[]',
  spectrum      TEXT DEFAULT 'eco',
  owner_id      TEXT NOT NULL,
  world         TEXT,
  version       INTEGER DEFAULT 1,
  created_at    INTEGER DEFAULT (unixepoch()),
  updated_at    INTEGER DEFAULT (unixepoch())
);

-- Per-user data for each app
CREATE TABLE IF NOT EXISTS user_apps (
  user_id       TEXT NOT NULL,
  app_id        TEXT NOT NULL,
  user_data     JSON NOT NULL DEFAULT '[]',
  cached_version INTEGER DEFAULT 0,
  offline_queue JSON DEFAULT '[]',
  first_scan    INTEGER DEFAULT (unixepoch()),
  last_sync     INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, app_id)
);

-- Action log
CREATE TABLE IF NOT EXISTS actions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  app_id        TEXT NOT NULL,
  action_type   INTEGER NOT NULL,
  slot_index    INTEGER NOT NULL,
  old_value     JSON,
  new_value     JSON,
  created_at    INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_user_apps_user ON user_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_app ON user_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_actions_app ON actions(app_id, created_at);
`;

// ── TYPES ──

export interface AppSchemaField {
    type: "string" | "number" | "boolean" | "array" | "object";
    default: unknown;
    role: "owner" | "user" | "computed";
    label?: string;
    items?: string;
    formula?: string;
    min?: number;
    max?: number;
}

export type AppSchema = Record<string, AppSchemaField>;

export interface ActionContext {
    userId: string;
    appId: string;
    schema: AppSchema;
}

export interface ActionResult {
    type: "mutation" | "navigate" | "scroll" | "open" | "close";
    slot?: number;
    action?: string;
    target?: string;
    value?: unknown;
    appId?: string;
    fields?: string[];
}

export interface ScanResult {
    appId: string;
    ownerData: unknown[];
    userData: unknown[];
    version: number;
    ctx: ActionContext;
}

// ── DB INTERFACE ──

export interface TursoClient {
    execute(params: { sql: string; args?: unknown[] }): Promise<{
        rows: Record<string, unknown>[];
    }>;
}

// ── ACTION ENGINE ──

type ActionHandler = (
    db: TursoClient,
    ctx: ActionContext,
    slotIndex: number,
    payload?: unknown,
) => Promise<ActionResult | null> | ActionResult | null;

const ACTION_HANDLERS: Record<number, ActionHandler | null> = {
    // 0: none — read only
    0: null,

    // 1: navigate — target is string (app_id or #section_id)
    1: (_db, _ctx, _slotIndex, payload) => {
        const target = payload as string || '';
        if (target.startsWith("#")) {
            return { type: "scroll", target: target.slice(1) };
        }
        return { type: "navigate", appId: target };
    },

    // 2: addToCart — append item to array at slot position
    2: async (db, ctx, slotIndex, payload) => {
        const item = (payload as Record<string, unknown>) || { slot: slotIndex, added_at: Date.now() };
        await db.execute({
            sql: `UPDATE user_apps 
            SET user_data = json_set(user_data, '$[' || ? || ']',
              json_group_array(json_each.value) FROM (
                SELECT json_each.value FROM json_each(json_extract(user_data, '$[' || ? || ']'))
                UNION ALL SELECT json(?)
              )),
              last_sync = unixepoch()
            WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, slotIndex, JSON.stringify(item), ctx.userId, ctx.appId],
        });
        return { type: "mutation", slot: slotIndex, action: "append", value: item };
    },

    // 3: removeCart — remove item from array at slot position
    3: async (db, ctx, slotIndex, payload) => {
        const targetId = payload as string || '';
        const row = await db.execute({
            sql: `SELECT json_extract(user_data, '$[' || ? || ']') as arr
            FROM user_apps WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, ctx.userId, ctx.appId],
        });
        const arr = JSON.parse((row.rows[0]?.arr as string) || "[]");
        const filtered = arr.filter((i: { id: string }) => i.id !== targetId);
        await db.execute({
            sql: `UPDATE user_apps 
            SET user_data = json_set(user_data, '$[' || ? || ']', json(?)),
                last_sync = unixepoch()
            WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, JSON.stringify(filtered), ctx.userId, ctx.appId],
        });
        return { type: "mutation", slot: slotIndex, action: "remove", target: targetId };
    },

    // 4: increment — increment number at slot position
    4: async (db, ctx, slotIndex) => {
        await db.execute({
            sql: `UPDATE user_apps 
            SET user_data = json_set(user_data, '$[' || ? || ']',
              COALESCE(json_extract(user_data, '$[' || ? || ']'), 0) + 1),
              last_sync = unixepoch()
            WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, slotIndex, ctx.userId, ctx.appId],
        });
        return { type: "mutation", slot: slotIndex, action: "increment" };
    },

    // 5: decrement — decrement number at slot position (min 0)
    5: async (db, ctx, slotIndex) => {
        await db.execute({
            sql: `UPDATE user_apps 
            SET user_data = json_set(user_data, '$[' || ? || ']',
              MAX(0, COALESCE(json_extract(user_data, '$[' || ? || ']'), 0) - 1)),
              last_sync = unixepoch()
            WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, slotIndex, ctx.userId, ctx.appId],
        });
        return { type: "mutation", slot: slotIndex, action: "decrement" };
    },

    // 6: submit — write form data to user_data slots
    6: async (db, ctx, slotIndex, formData) => {
        const data = (formData || {}) as Record<string, unknown>;
        const entries = Object.entries(data);
        if (entries.length === 0) return null;

        // Each key in formData is a slot index, value is the data
        const sets = entries.map(
            ([idx]) => `user_data = json_set(user_data, '$[${idx}]', json(?))`
        );
        const sql =
            `UPDATE user_apps SET ${sets.join(", ")}, last_sync = unixepoch() WHERE user_id = ? AND app_id = ?`;
        const args = [
            ...entries.map(([, v]) => JSON.stringify(v)),
            ctx.userId,
            ctx.appId,
        ];
        await db.execute({ sql, args });
        return {
            type: "mutation",
            slot: slotIndex,
            action: "submit",
            fields: entries.map(([k]) => k),
        };
    },

    // 7: toggle — flip boolean at slot position
    7: async (db, ctx, slotIndex) => {
        await db.execute({
            sql: `UPDATE user_apps 
            SET user_data = json_set(user_data, '$[' || ? || ']',
              NOT COALESCE(json_extract(user_data, '$[' || ? || ']'), 0)),
              last_sync = unixepoch()
            WHERE user_id = ? AND app_id = ?`,
            args: [slotIndex, slotIndex, ctx.userId, ctx.appId],
        });
        return { type: "mutation", slot: slotIndex, action: "toggle" };
    },

    // 8: open
    8: (_db, _ctx, _slotIndex, payload) => ({
        type: "open",
        target: payload as string || '',
    }),

    // 9: close
    9: (_db, _ctx, _slotIndex, payload) => ({
        type: "close",
        target: payload as string || '',
    }),
};

/**
 * Execute an action from the topology
 */
export async function executeAction(
    db: TursoClient,
    ctx: ActionContext,
    actionType: number,
    slotIndex: number,
    payload?: unknown,
): Promise<ActionResult | null> {
    const handler = ACTION_HANDLERS[actionType];
    if (!handler) return null;

    const result = await handler(db, ctx, slotIndex, payload);

    if (result?.type === "mutation") {
        await db.execute({
            sql: `INSERT INTO actions (user_id, app_id, action_type, slot_index, new_value)
            VALUES (?, ?, ?, ?, ?)`,
            args: [ctx.userId, ctx.appId, actionType, slotIndex, JSON.stringify(result.value || result)],
        });
    }

    return result;
}

// ── SCAN LIFECYCLE ──

/**
 * Phase 2: Fetch app data and create/load user data
 * Returns positional arrays: ownerData fills @ slots, userData fills @@ slots
 */
export async function onScanPhase2(
    db: TursoClient,
    appId: string,
    userId: string,
): Promise<ScanResult> {
    const app = await db.execute({
        sql: `SELECT schema, owner_data, defaults, version FROM apps WHERE app_id = ?`,
        args: [appId],
    });

    if (!app.rows.length) throw new Error("App not found");
    const appRow = app.rows[0];

    const existing = await db.execute({
        sql: `SELECT user_data, cached_version FROM user_apps WHERE user_id = ? AND app_id = ?`,
        args: [userId, appId],
    });

    let userData: unknown[];
    if (existing.rows.length) {
        userData = JSON.parse((existing.rows[0].user_data as string) || "[]");

        if ((existing.rows[0].cached_version as number) < (appRow.version as number)) {
            await db.execute({
                sql: `UPDATE user_apps 
              SET cached_version = ?, last_sync = unixepoch()
              WHERE user_id = ? AND app_id = ?`,
                args: [appRow.version, userId, appId],
            });
        }
    } else {
        userData = JSON.parse((appRow.defaults as string) || "[]");
        await db.execute({
            sql: `INSERT INTO user_apps (user_id, app_id, user_data, cached_version)
            VALUES (?, ?, ?, ?)`,
            args: [userId, appId, JSON.stringify(userData), appRow.version],
        });
    }

    const ownerData = JSON.parse((appRow.owner_data as string) || "[]") as unknown[];
    const schema = JSON.parse((appRow.schema as string) || "{}") as AppSchema;

    return {
        appId,
        ownerData,
        userData,
        version: appRow.version as number,
        ctx: { userId, appId, schema },
    };
}

/**
 * Sync offline queue when connection returns
 */
export async function syncOfflineQueue(
    db: TursoClient,
    userId: string,
    appId: string,
): Promise<{ synced: number } | null> {
    const row = await db.execute({
        sql: `SELECT offline_queue FROM user_apps 
          WHERE user_id = ? AND app_id = ?`,
        args: [userId, appId],
    });

    if (!row.rows.length) return null;

    const queue = JSON.parse((row.rows[0].offline_queue as string) || "[]") as {
        type: number;
        slotIndex: number;
        payload?: unknown;
    }[];
    if (!queue.length) return null;

    const app = await db.execute({
        sql: `SELECT schema FROM apps WHERE app_id = ?`,
        args: [appId],
    });
    const schema = JSON.parse((app.rows[0]?.schema as string) || "{}") as AppSchema;
    const ctx: ActionContext = { userId, appId, schema };

    for (const action of queue) {
        await executeAction(db, ctx, action.type, action.slotIndex, action.payload);
    }

    await db.execute({
        sql: `UPDATE user_apps SET offline_queue = '[]', last_sync = unixepoch()
          WHERE user_id = ? AND app_id = ?`,
        args: [userId, appId],
    });

    return { synced: queue.length };
}

// ── QR PAYLOAD ──

export function encodeQR(
    appId: string,
    edgeHint: string,
    ownerAuth: number,
    version: number,
): Uint8Array {
    const buf = new ArrayBuffer(22);
    const view = new DataView(buf);

    const idBytes = hexToBytes(appId.replace(/-/g, "").slice(0, 16));
    for (let i = 0; i < 8; i++) view.setUint8(i, idBytes[i] || 0);

    const edge = edgeHint.padEnd(4, "\0");
    for (let i = 0; i < 4; i++) view.setUint8(8 + i, edge.charCodeAt(i));

    view.setUint32(12, ownerAuth);
    view.setUint16(16, version);

    const dataBytes = new Uint8Array(buf, 0, 18);
    view.setUint32(18, crc32(dataBytes));

    return new Uint8Array(buf);
}

export function decodeQR(
    bytes: Uint8Array,
): { valid: true; appId: string; edgeHint: string; ownerAuth: number; version: number } | { valid: false; error: string } {
    const view = new DataView(bytes.buffer);

    const idBytes = new Uint8Array(bytes.slice(0, 8));
    const appId = bytesToHex(idBytes);

    const edgeHint = String.fromCharCode(
        view.getUint8(8), view.getUint8(9),
        view.getUint8(10), view.getUint8(11),
    ).replace(/\0/g, "");

    const ownerAuth = view.getUint32(12);
    const version = view.getUint16(16);
    const checksum = view.getUint32(18);

    const dataBytes = new Uint8Array(bytes.slice(0, 18));
    const expected = crc32(dataBytes);
    if (checksum !== expected) {
        return { valid: false, error: "Checksum mismatch" };
    }

    return { valid: true, appId, edgeHint, ownerAuth, version };
}

// ── HELPERS ──

function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// ── EXAMPLE SCHEMA ──

export const EXAMPLE_SCHEMA: AppSchema = {
    preco_margherita: { type: "number", default: 42, role: "owner", label: "Preço Margherita" },
    preco_diavola: { type: "number", default: 48, role: "owner", label: "Preço Diavola" },
    preco_funghi: { type: "number", default: 52, role: "owner", label: "Preço Funghi" },
    disponivel_funghi: { type: "boolean", default: true, role: "owner", label: "Funghi disponível" },
    carrinho: { type: "array", default: [], role: "user", label: "Carrinho", items: "object" },
    quantidade_margherita: { type: "number", default: 0, role: "user", min: 0, max: 10 },
    quantidade_diavola: { type: "number", default: 0, role: "user", min: 0, max: 10 },
    carrinho_count: { type: "number", default: 0, role: "computed", formula: "carrinho.length" },
    total_carrinho: {
        type: "number",
        default: 0,
        role: "computed",
        formula: "carrinho.reduce((s, i) => s + i.preco * (quantidade[i.id] || 1), 0)",
    },
    observacoes: { type: "string", default: "", role: "user", label: "Observações" },
    pedido_enviado: { type: "boolean", default: false, role: "user" },
};

// ── EXAMPLE DATA ARRAYS ──

/** Owner data: positional array matching @ slots in topology order */
export const EXAMPLE_OWNER_DATA: unknown[] = [42, 48, 52, true, "Especial: Trufa"];

/** Default user data: positional array matching @@ slots */
export const EXAMPLE_USER_DEFAULTS: unknown[] = [0, 0, 0, [], false, ""];
