/**
 * MANIFOLD WORKER CLIENT
 *
 * TypeScript wrapper for the manifold.worker.js Web Worker.
 * Provides typed API for loading topologies and receiving render instructions.
 */

// ── TYPES ──

export interface DOMInstruction {
    id: number;
    tag: string;
    style: Record<string, string | number>;
    text: string | null;
    children: DOMInstruction[];
    classPath: string;
}

export interface DOMPatch {
    address: number;
    op: "update" | "insert" | "delete";
    instruction?: DOMInstruction;
}

export interface RenderResult {
    nodes: DOMInstruction[];
    stats?: {
        parseTime: number;
        nodeCount: number;
        spectrum: string;
    };
}

export interface ManifoldWorkerAPI {
    load: (source: string) => void;
    onRender: (callback: (result: RenderResult) => void) => void;
    onError: (callback: (message: string) => void) => void;
    terminate: () => void;
}

// ── FACTORY ──

export function createManifoldWorker(): ManifoldWorkerAPI | null {
    if (typeof window === "undefined") return null;

    try {
        const worker = new Worker("/manifold.worker.js");

        let renderCallback: ((result: RenderResult) => void) | null = null;
        let errorCallback: ((message: string) => void) | null = null;

        worker.onmessage = (e) => {
            const { type } = e.data;

            switch (type) {
                case "render":
                    if (renderCallback) {
                        renderCallback({
                            nodes: e.data.nodes,
                            stats: e.data.stats,
                        });
                    }
                    break;
                case "ready":
                    console.info("[ManifoldWorker] Ready:", e.data.stats);
                    break;
                case "error":
                    if (errorCallback) {
                        errorCallback(e.data.message);
                    } else {
                        console.error("[ManifoldWorker]", e.data.message);
                    }
                    break;
            }
        };

        worker.onerror = (err) => {
            if (errorCallback) {
                errorCallback(err.message);
            }
        };

        return {
            load: (source: string) => {
                worker.postMessage({ type: "load", payload: source });
            },
            onRender: (callback) => {
                renderCallback = callback;
            },
            onError: (callback) => {
                errorCallback = callback;
            },
            terminate: () => {
                worker.terminate();
            },
        };
    } catch (err) {
        console.error("[ManifoldWorker] Failed to create worker:", err);
        return null;
    }
}
