export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

export interface RelayPayload {
  type: 'IFRAME_CONSOLE_RELAY';
  level: ConsoleLevel;
  args: unknown[];
  timestamp: number;
  frameUrl?: string;
  sessionId?: string;
}

export interface IframeRelayOptions {
  targetOrigin?: string;
  sessionId?: string;
  captureGlobalErrors?: boolean;
  levels?: ConsoleLevel[];
}

export interface ParentAttachOptions {
  allowedOrigins?: '*' | string[];
  iframe?: HTMLIFrameElement;
  forwardToConsole?: boolean;
  // Called for each incoming relay payload
  onEvent?: (event: RelayPayload & { origin: string }) => void;
}

