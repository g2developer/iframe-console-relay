import { relayConsoleToParent as _relayConsoleToParent } from './iframe';
import { attachIframeConsoleRelay as _attachIframeConsoleRelay } from './parent';
import { getGlobalRelayState } from './global';
export type { ConsoleLevel, IframeRelayOptions, ParentAttachOptions, RelayPayload } from './types';

export type IframeTeardown = () => void;
export type Detach = () => void;

export function relayConsoleToParent(options?: import('./types').IframeRelayOptions): IframeTeardown {
  const state = getGlobalRelayState();
  if (state.iframeTeardown) {
    try { state.iframeTeardown(); } catch {}
  }
  const teardown = _relayConsoleToParent(options);
  state.iframeTeardown = teardown;
  state.userInitialized = true;
  return () => {
    try { teardown(); } finally {
      if (getGlobalRelayState().iframeTeardown === teardown) {
        getGlobalRelayState().iframeTeardown = undefined;
      }
    }
  };
}

export function attachIframeConsoleRelay(options?: import('./types').ParentAttachOptions): Detach {
  const state = getGlobalRelayState();
  if (state.parentDetach) {
    try { state.parentDetach(); } catch {}
  }
  const detach = _attachIframeConsoleRelay(options);
  state.parentDetach = detach;
  state.userInitialized = true;
  return () => {
    try { detach(); } finally {
      if (getGlobalRelayState().parentDetach === detach) {
        getGlobalRelayState().parentDetach = undefined;
      }
    }
  };
}

// Auto-initialize after current tick if user didn't call explicit init.
if (typeof window !== 'undefined') {
  // Use setTimeout(0) to allow immediate user init in a following script tag.
  setTimeout(() => {
    const state = getGlobalRelayState();
    if (state.userInitialized) return;
    try {
      const isIframe = window.parent && window.parent !== window;
      if (isIframe) {
        state.iframeTeardown = _relayConsoleToParent({ targetOrigin: '*', captureGlobalErrors: true });
        // Single warning to encourage explicit, secure config
        try { console.warn('[iframe-console-relay] Auto-enabled in iframe with default targetOrigin "*". For production, call relayConsoleToParent({ targetOrigin }) to restrict.'); } catch {}
      } else {
        state.parentDetach = _attachIframeConsoleRelay({ allowedOrigins: '*', forwardToConsole: true });
        try { console.warn('[iframe-console-relay] Auto-enabled in parent with default allowedOrigins "*". For production, call attachIframeConsoleRelay({ allowedOrigins }) to restrict.'); } catch {}
      }
    } catch {
      // ignore
    }
  }, 0);
}
