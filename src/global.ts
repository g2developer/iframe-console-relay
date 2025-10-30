export interface GlobalRelayState {
  iframeTeardown?: () => void;
  parentDetach?: () => void;
  userInitialized?: boolean;
}

export function getGlobalRelayState(): GlobalRelayState {
  if (typeof window === 'undefined') return {};
  const w = window as unknown as { __IFRAME_CONSOLE_RELAY__?: GlobalRelayState };
  if (!w.__IFRAME_CONSOLE_RELAY__) w.__IFRAME_CONSOLE_RELAY__ = {};
  return w.__IFRAME_CONSOLE_RELAY__;
}

