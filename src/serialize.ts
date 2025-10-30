// Minimal, safe-ish serialization for postMessage payloads.
// Avoids throwing on cycles, functions, DOM nodes, and Error objects.

type Seen = WeakSet<object>;

export function serializeForPostMessage(input: unknown, seen?: Seen): unknown {
  if (input == null) return input; // null or undefined

  const t = typeof input;
  if (t === 'string' || t === 'number' || t === 'boolean') return input;
  if (t === 'bigint') return `${input.toString()}n`;
  if (t === 'symbol') return String(input);
  if (t === 'function') return `[Function ${(input as Function).name || 'anonymous'}]`;

  // Handle Error
  if (input instanceof Error) {
    return {
      __type: 'Error',
      name: input.name,
      message: input.message,
      stack: input.stack,
    };
  }

  // DOM Node/Element (best-effort detection without DOM types)
  try {
    const anyInput = input as any;
    if (anyInput && typeof anyInput === 'object' && 'nodeType' in anyInput && 'nodeName' in anyInput) {
      const nodeName = (anyInput.nodeName || 'Node');
      return `[${nodeName}]`;
    }
  } catch {}

  // Arrays
  if (Array.isArray(input)) {
    return input.map((v) => serializeForPostMessage(v, seen ?? new WeakSet()));
  }

  // Objects
  if (t === 'object') {
    const obj = input as Record<string | number | symbol, unknown>;
    if (!seen) seen = new WeakSet();
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      try {
        out[key] = serializeForPostMessage((obj as any)[key], seen);
      } catch {
        out[key] = '[Unserializable]';
      }
    }
    return out;
  }

  // Fallback
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return String(input);
  }
}

