/**
 * MANIFOLD BINARY ENCODER / DECODER
 * .mf source ↔ Uint8Array
 *
 * Binary format (from SPEC.md):
 *   [1]   schema ID
 *   [1]   flags (bit 0: has @live, bit 1: has @auth)
 *   [1]   spectrum ID (0=none, 1=eco, 2=void, 3=brass)
 *   [1]   class dictionary size
 *   [N]   class dictionary entries (length-prefixed UTF-8)
 *   [N]   nodes, each:
 *           [1] indent level
 *           [1] class index (into local dictionary)
 *           [1] content type: 0x00=none, 0x01=words, 0x02=texture, 0x03=fields
 *           [N] payload (depends on content type)
 *           [1] 0xFF node terminator
 *   [1]   0xFE end-of-topology marker
 */

import { parse, type MfNode, type ParseResult } from "./engine";
import { type Dictionary } from "./dictionary";

// ── CONSTANTS ──

const CONTENT_NONE = 0x00;
const CONTENT_WORDS = 0x01;
const CONTENT_TEXTURE = 0x02;
const CONTENT_FIELDS = 0x03;
const NODE_END = 0xFF;
const TOPO_END = 0xFE;
const UNKNOWN_WORD = 0x00; // 0x00 0x00 = escape for inline word

const SPECTRUM_MAP: Record<string, number> = { eco: 1, void: 2, brass: 3 };
const SPECTRUM_REVERSE: Record<number, string> = { 1: "eco", 2: "void", 3: "brass" };

// ── ENCODER ──

export function encode(source: string, dictionary: Dictionary): Uint8Array {
  const { directives, tree } = parse(source);
  const bytes: number[] = [];

  // Build local class dictionary from this topology
  const localClassIndex = new Map<string, number>();
  let nextId = 0;

  function indexClasses(nodes: MfNode[]) {
    for (const node of nodes) {
      const cp = node.classPath.toLowerCase();
      if (!localClassIndex.has(cp)) {
        localClassIndex.set(cp, nextId++);
      }
      if (node.children) indexClasses(node.children);
    }
  }
  indexClasses(tree);

  // Header
  bytes.push(dictionary.schemaId);
  bytes.push(
    (directives.live ? 0x01 : 0x00) |
    (directives.auth ? 0x02 : 0x00)
  );
  bytes.push(SPECTRUM_MAP[directives.spectrum] || 0);

  // Class dictionary
  bytes.push(localClassIndex.size);
  for (const [cp] of localClassIndex) {
    const cpBytes = new TextEncoder().encode(cp);
    bytes.push(cpBytes.length);
    for (const b of cpBytes) bytes.push(b);
  }

  // Encode nodes
  function encodeNode(node: MfNode, indent: number) {
    bytes.push(indent);
    bytes.push(localClassIndex.get(node.classPath.toLowerCase()) ?? 0);

    if (node.texture) {
      bytes.push(CONTENT_TEXTURE);
    } else if (node.fields) {
      bytes.push(CONTENT_FIELDS);
      bytes.push(node.fields.length);
      for (const field of node.fields) {
        encodeText(field.trim());
      }
    } else if (node.text && node.text.trim()) {
      bytes.push(CONTENT_WORDS);
      encodeText(node.text.trim());
    } else {
      bytes.push(CONTENT_NONE);
    }

    bytes.push(NODE_END);

    if (node.children) {
      for (const child of node.children) {
        encodeNode(child, indent + 1);
      }
    }
  }

  function encodeText(text: string) {
    const words = text.split(/\s+/);
    bytes.push(words.length);
    for (const word of words) {
      const idx = dictionary.wordIndex(word);
      if (idx !== null && idx <= 0xFFFF) {
        // Known word: 2-byte big-endian index
        bytes.push((idx >> 8) & 0xFF);
        bytes.push(idx & 0xFF);
      } else {
        // Unknown word: 0x00 0x00 + length-prefixed UTF-8
        bytes.push(UNKNOWN_WORD);
        bytes.push(UNKNOWN_WORD);
        const wb = new TextEncoder().encode(word);
        bytes.push(wb.length);
        for (const b of wb) bytes.push(b);
      }
    }
  }

  for (const node of tree) {
    encodeNode(node, 0);
  }

  bytes.push(TOPO_END);
  return new Uint8Array(bytes);
}

// ── DECODER ──

export function decode(bytes: Uint8Array, dictionary: Dictionary): ParseResult {
  let pos = 0;

  function readByte(): number {
    if (pos >= bytes.length) throw new Error("Unexpected end of binary data");
    return bytes[pos++];
  }

  function readBytes(n: number): Uint8Array {
    if (pos + n > bytes.length) throw new Error("Unexpected end of binary data");
    const slice = bytes.slice(pos, pos + n);
    pos += n;
    return slice;
  }

  // Header
  const schemaId = readByte();
  const flags = readByte();
  const spectrumId = readByte();

  const directives: Record<string, string> = {};
  if (spectrumId && SPECTRUM_REVERSE[spectrumId]) {
    directives.spectrum = SPECTRUM_REVERSE[spectrumId];
  }

  // Class dictionary
  const classCount = readByte();
  const localClasses: string[] = [];
  for (let i = 0; i < classCount; i++) {
    const len = readByte();
    const cpBytes = readBytes(len);
    localClasses.push(new TextDecoder().decode(cpBytes));
  }

  // Decode nodes
  const tree: MfNode[] = [];
  const stack: { node: { children: MfNode[] }; indent: number }[] = [
    { node: { children: tree } as { children: MfNode[] }, indent: -1 },
  ];

  while (pos < bytes.length) {
    const byte = readByte();
    if (byte === TOPO_END) break;

    const indent = byte;
    const classIdx = readByte();
    const contentType = readByte();

    const classPath = localClasses[classIdx] || "text";

    let text: string | null = null;
    let texture = false;
    let fields: string[] | null = null;

    if (contentType === CONTENT_TEXTURE) {
      texture = true;
    } else if (contentType === CONTENT_FIELDS) {
      const fieldCount = readByte();
      fields = [];
      for (let f = 0; f < fieldCount; f++) {
        fields.push(decodeText());
      }
    } else if (contentType === CONTENT_WORDS) {
      text = decodeText();
    }
    // CONTENT_NONE: text stays null

    // Read until NODE_END
    while (pos < bytes.length && bytes[pos] !== NODE_END) {
      pos++; // skip any unexpected bytes
    }
    if (pos < bytes.length) pos++; // consume NODE_END

    const node: MfNode = {
      classPath,
      text,
      texture,
      fields,
      layout: null,
      variables: null,
      action: null,
      actionTarget: null,
      children: [],
    };

    // Find parent by indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, indent });
  }

  return { directives, tree, views: { main: tree }, warnings: [], indentUnit: 1, slots: {} };

  // ── Text decoder helper ──
  function decodeText(): string {
    const wordCount = readByte();
    const words: string[] = [];

    for (let w = 0; w < wordCount; w++) {
      const hi = readByte();
      const lo = readByte();

      if (hi === UNKNOWN_WORD && lo === UNKNOWN_WORD) {
        // Inline word: length-prefixed UTF-8
        const len = readByte();
        const wordBytes = readBytes(len);
        words.push(new TextDecoder().decode(wordBytes));
      } else {
        // Known word: 2-byte big-endian index
        const idx = (hi << 8) | lo;
        const word = dictionary.wordAt(idx);
        words.push(word ?? `[?${idx}]`);
      }
    }

    return words.join(" ");
  }
}

// ── SIZE ESTIMATION ──

export function estimateSize(source: string, dictionary: Dictionary): {
  raw: number;
  nodes: number;
  bytesPerNode: number;
} {
  const binary = encode(source, dictionary);
  const { tree } = parse(source);
  const nodes = countNodes(tree);
  return {
    raw: binary.length,
    nodes,
    bytesPerNode: nodes > 0 ? binary.length / nodes : 0,
  };
}

function countNodes(nodes: MfNode[]): number {
  let count = 0;
  for (const n of nodes) {
    count++;
    if (n.children) count += countNodes(n.children);
  }
  return count;
}
