import type { ParentAttachOptions, RelayPayload, ConsoleLevel } from './types';

export type Detach = () => void;

export function attachIframeConsoleRelay(options: ParentAttachOptions = {}): Detach {
  if (typeof window === 'undefined') return () => {};

  const { allowedOrigins = '*', iframe, forwardToConsole = true, onEvent } = options;

  const handler = (event: MessageEvent) => {
    const data = event.data as RelayPayload | undefined;
    if (!data || data.type !== 'IFRAME_CONSOLE_RELAY') return;

    if (!originAllowed(allowedOrigins, event.origin)) return;
    if (iframe && event.source !== iframe.contentWindow) return;

    if (onEvent) {
      try { onEvent({ ...data, origin: event.origin }); } catch {}
    }

    if (forwardToConsole) {
      const level = data.level || 'log';
      const prefix = `[iframe ${event.origin}]`;
      dispatchToConsole(level, [prefix, ...data.args]);
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

function originAllowed(allowed: '*' | string[], origin: string): boolean {
  if (allowed === '*') return true;
  return allowed.includes(origin);
}

function dispatchToConsole(level: ConsoleLevel, args: unknown[]) {
  const fn = (console as any)[level] as (...a: unknown[]) => void;
  if (typeof fn === 'function') {
    try { fn.apply(console, args as any); } catch {}
  } else {
    try { console.log.apply(console, args as any); } catch {}
  }
}

