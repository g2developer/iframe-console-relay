# iframe-console-relay

[한국어 README 보기](./README.ko.md)

Relay `console.*` messages from an iframe to the parent window using `postMessage`.

Works entirely in the browser. The iframe wraps its `console` methods and posts structured log events to the parent, which can consume them and optionally forward to the parent's console.

## Install

```
npm install iframe-console-relay
```

## Usage

### In the iframe (sender)

```ts
import { relayConsoleToParent } from 'iframe-console-relay/iframe';

// Start relaying console.* calls from inside the iframe
const teardown = relayConsoleToParent({
  targetOrigin: 'https://your-parent-app.example.com',
  sessionId: 'optional-session-id',
  captureGlobalErrors: true,
});

console.log('Hello from iframe', { foo: 123 });

// Later, to stop relaying and restore original console
// teardown();
```

Notes:
- `targetOrigin` should be the exact origin of the parent page for security. Use `'*'` only for local development.
- When `captureGlobalErrors` is `true` (default), `error` and `unhandledrejection` are also relayed.

### In the parent window (receiver)

```ts
import { attachIframeConsoleRelay } from 'iframe-console-relay/parent';

// Optional: filter to a specific iframe and origin(s)
const iframeEl = document.getElementById('child') as HTMLIFrameElement | null;

const detach = attachIframeConsoleRelay({
  allowedOrigins: ['https://child-app.example.com'],
  iframe: iframeEl ?? undefined,
  forwardToConsole: true,
  onEvent: (e) => {
    // Custom handling
    // e.level, e.args, e.timestamp, e.frameUrl, e.origin
  },
});

// Later, to stop listening
// detach();
```

### UMD/CDN usage

You can use the UMD bundle(s) directly from a CDN via `<script>` tags. The globals are:
- `IframeConsoleRelay` (index): `{ relayConsoleToParent, attachIframeConsoleRelay }`
- `IframeConsoleRelayIframe` (iframe-only): `{ relayConsoleToParent }`
- `IframeConsoleRelayParent` (parent-only): `{ attachIframeConsoleRelay }`

Example (index bundle):

```html
<script src="https://unpkg.com/iframe-console-relay/dist/index.umd.min.js"></script>
<script>
  // In iframe context
  const stop = IframeConsoleRelay.relayConsoleToParent({ targetOrigin: 'https://parent.example.com' });

  // In parent context
  const detach = IframeConsoleRelay.attachIframeConsoleRelay({ allowedOrigins: ['https://child.example.com'] });
  console.log('ready');
</script>
```

## API

### `relayConsoleToParent(options?: IframeRelayOptions): () => void`
- `targetOrigin?: string` — Parent origin; defaults to `'*'`.
- `sessionId?: string` — Arbitrary identifier included in events.
- `captureGlobalErrors?: boolean` — Also relay window errors; default `true`.
- `levels?: ('log'|'info'|'warn'|'error'|'debug'|'trace')[]` — Which console levels to wrap.

Returns a teardown function that restores original console methods and removes listeners.

### `attachIframeConsoleRelay(options?: ParentAttachOptions): () => void`
- `allowedOrigins?: '*' | string[]` — Validate message origin(s); default `'*'`.
- `iframe?: HTMLIFrameElement` — If provided, only accept messages from that iframe.
- `forwardToConsole?: boolean` — Also log to parent's console; default `true`.
- `onEvent?: (event) => void` — Callback for each relay payload.

Returns a detach function that removes the window `message` listener.

## Message format

The iframe posts a payload with shape:

```ts
type RelayPayload = {
  type: 'IFRAME_CONSOLE_RELAY';
  level: 'log'|'info'|'warn'|'error'|'debug'|'trace';
  args: unknown[];            // safely-serialized values
  timestamp: number;
  frameUrl?: string;
  sessionId?: string;
}
```

Arguments are serialized in a safe, best-effort way (errors, functions, circular objects, and DOM nodes are handled without throwing).

## Security

- Always set `targetOrigin` on the iframe side and `allowedOrigins` on the parent side in production.
- Messages are filtered by `origin` and (optionally) iframe `source` on the parent side.

## License

MIT
