# iframe-console-relay

iframe의 `console.*` 메시지를 부모 창으로 `postMessage`를 통해 전달하는 경량 라이브러리입니다.

iframe 내부에서 `console` 메서드를 래핑하여 구조화된 로그 이벤트를 부모로 전송하고, 부모는 이를 수신해 자신의 콘솔에 출력하거나 콜백으로 처리할 수 있습니다.

## 설치

```
npm install iframe-console-relay
```

## 사용법

### iframe(송신자)에서

```ts
import { relayConsoleToParent } from 'iframe-console-relay/iframe';

// iframe 내부의 console.* 호출을 부모로 전달 시작
const teardown = relayConsoleToParent({
  targetOrigin: 'https://your-parent-app.example.com',
  sessionId: 'optional-session-id',
  captureGlobalErrors: true,
});

console.log('Hello from iframe', { foo: 123 });

// 나중에 중지(원래 console 복원)
// teardown();
```

주의사항:
- 보안상 실제 서비스에서는 `targetOrigin`을 부모 페이지의 정확한 Origin으로 설정하세요. 로컬 개발 환경이 아니라면 `'*'` 사용을 지양하세요.
- `captureGlobalErrors`가 `true`(기본값)일 때, 전역 `error` 및 `unhandledrejection`도 함께 전달됩니다.

### 부모 창(수신자)에서

```ts
import { attachIframeConsoleRelay } from 'iframe-console-relay/parent';

// 선택: 특정 iframe과 origin으로 필터링
const iframeEl = document.getElementById('child') as HTMLIFrameElement | null;

const detach = attachIframeConsoleRelay({
  allowedOrigins: ['https://child-app.example.com'],
  iframe: iframeEl ?? undefined,
  forwardToConsole: true,
  onEvent: (e) => {
    // 사용자 정의 처리
    // e.level, e.args, e.timestamp, e.frameUrl, e.origin
  },
});

// 나중에 리스너 제거
// detach();
```

### UMD/CDN 사용

CDN을 통해 UMD 번들을 `<script>` 태그로 바로 사용할 수 있습니다. 전역(Global) 객체는 다음과 같습니다.
- `IframeConsoleRelay` (index): `{ relayConsoleToParent, attachIframeConsoleRelay }`
- `IframeConsoleRelayIframe` (iframe 전용): `{ relayConsoleToParent }`
- `IframeConsoleRelayParent` (parent 전용): `{ attachIframeConsoleRelay }`

예시(index 번들):

```html
<script src="https://unpkg.com/iframe-console-relay/dist/index.umd.min.js"></script>
<script>
  // iframe 컨텍스트에서
  const stop = IframeConsoleRelay.relayConsoleToParent({ targetOrigin: 'https://parent.example.com' });

  // 부모 컨텍스트에서
  const detach = IframeConsoleRelay.attachIframeConsoleRelay({ allowedOrigins: ['https://child.example.com'] });
  console.log('ready');
</script>
```

## API

### `relayConsoleToParent(options?: IframeRelayOptions): () => void`
- `targetOrigin?: string` — 부모 페이지의 Origin. 기본값 `'*'`.
- `sessionId?: string` — 이벤트에 포함될 임의의 식별자.
- `captureGlobalErrors?: boolean` — 전역 에러/미처리 거부도 전달. 기본값 `true`.
- `levels?: ('log'|'info'|'warn'|'error'|'debug'|'trace')[]` — 래핑할 console 레벨 지정.

호출 시 teardown 함수를 반환하며, 이를 호출하면 원래 console 메서드를 복원하고 리스너를 제거합니다.

### `attachIframeConsoleRelay(options?: ParentAttachOptions): () => void`
- `allowedOrigins?: '*' | string[]` — 수신 허용 Origin 목록. 기본값 `'*'`.
- `iframe?: HTMLIFrameElement` — 지정 시 해당 iframe에서 온 메시지만 수신.
- `forwardToConsole?: boolean` — 부모 콘솔로도 출력할지 여부. 기본값 `true`.
- `onEvent?: (event) => void` — 각 이벤트마다 호출되는 콜백.

호출 시 detach 함수를 반환하며, 이를 호출하면 window `message` 리스너가 제거됩니다.

## 메시지 포맷

iframe이 부모로 보내는 페이로드 형태는 다음과 같습니다.

```ts
type RelayPayload = {
  type: 'IFRAME_CONSOLE_RELAY';
  level: 'log'|'info'|'warn'|'error'|'debug'|'trace';
  args: unknown[];            // 안전 직렬화된 인자 목록
  timestamp: number;
  frameUrl?: string;
  sessionId?: string;
}
```

인자들은 최대한 안전하게 직렬화됩니다. Error 객체, 함수, 순환 참조, DOM 노드 등이 있어도 예외가 발생하지 않도록 처리합니다.

## 보안

- 프로덕션에서는 iframe 측 `targetOrigin`과 부모 측 `allowedOrigins`를 반드시 정확히 설정하세요.
- 부모는 `origin`과(선택적으로) 특정 `iframe`의 `source`를 통해 메시지를 필터링합니다.

## 라이선스

MIT (배포 전 원하시는 라이선스로 수정 가능)

