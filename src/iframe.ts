import { serializeForPostMessage } from './serialize';
import type { ConsoleLevel, IframeRelayOptions, RelayPayload } from './types';

const DEFAULT_LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug', 'trace'];

export type IframeTeardown = () => void;

export function relayConsoleToParent(options: IframeRelayOptions = {}): IframeTeardown {
  if (typeof window === 'undefined') return () => {};

  const { targetOrigin = '*', sessionId, captureGlobalErrors = true, levels = DEFAULT_LEVELS } = options;

  const originalConsole: Partial<Record<ConsoleLevel, (...args: unknown[]) => void>> = {};
  const wrappedLevels = new Set<ConsoleLevel>(levels);

  const post = (level: ConsoleLevel, args: unknown[]) => {
    const payload: RelayPayload = {
      type: 'IFRAME_CONSOLE_RELAY',
      level,
      args: args.map((a) => serializeForPostMessage(a)),
      timestamp: Date.now(),
      frameUrl: safeLocationHref(),
      sessionId,
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.parent as any)?.postMessage(payload, targetOrigin);
    } catch {
      // swallow
    }
  };

  // Wrap console methods
  for (const level of wrappedLevels) {
    const orig = (console as any)[level] as (...args: unknown[]) => void;
    if (!orig) continue;
    originalConsole[level] = orig;
    (console as any)[level] = (...args: unknown[]) => {
      try { orig.apply(console, args); } catch {}
      post(level, args);
    };
  }

  const errorListeners: Array<() => void> = [];
  if (captureGlobalErrors) {
    const onError = (ev: ErrorEvent) => {
      const info = ev?.error instanceof Error ? ev.error : new Error(ev?.message || 'Script error');
      post('error', [info]);
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev?.reason instanceof Error ? ev.reason : new Error(String(ev?.reason));
      post('error', [reason]);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as any);
    errorListeners.push(() => window.removeEventListener('error', onError));
    errorListeners.push(() => window.removeEventListener('unhandledrejection', onRejection as any));
  }

  // Teardown function to restore console and listeners
  const teardown = () => {
    for (const level of wrappedLevels) {
      const orig = originalConsole[level];
      if (orig) (console as any)[level] = orig;
    }
    for (const off of errorListeners) off();
  };

  return teardown;
}

function safeLocationHref(): string | undefined {
  try { return window.location?.href; } catch { return undefined; }
}

