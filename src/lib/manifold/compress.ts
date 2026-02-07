/**
 * MANIFOLD COMPRESSION
 * Gzip layer on top of binary encoding.
 * Uses browser-native CompressionStream / DecompressionStream.
 *
 * Pipeline:
 *   .mf source → parse → binary encode → gzip → QR bytes
 *   QR bytes → gunzip → binary decode → tree → Φ → render
 */

export async function compress(data: Uint8Array): Promise<Uint8Array> {
  // Browser-native gzip
  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    const reader = cs.readable.getReader();

    writer.write(data as unknown as BufferSource);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  // Fallback: return uncompressed (server or old browser)
  console.warn("CompressionStream not available, returning uncompressed");
  return data;
}

export async function decompress(data: Uint8Array): Promise<Uint8Array> {
  // Browser-native gunzip
  if (typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(data as unknown as BufferSource);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  // Fallback: assume uncompressed
  console.warn("DecompressionStream not available, assuming uncompressed");
  return data;
}

/**
 * Detect if data is gzip-compressed (magic bytes 0x1F 0x8B)
 */
export function isGzipped(data: Uint8Array): boolean {
  return data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B;
}

/**
 * Smart decompress: auto-detect gzip vs raw
 */
export async function smartDecompress(data: Uint8Array): Promise<Uint8Array> {
  if (isGzipped(data)) {
    return decompress(data);
  }
  return data;
}
