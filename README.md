# @please-auth

[![CI](https://github.com/chatbot-pf/please-auth/actions/workflows/ci.yml/badge.svg)](https://github.com/chatbot-pf/please-auth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chatbot-pf/please-auth/graph/badge.svg)](https://codecov.io/gh/chatbot-pf/please-auth)

[Better Auth](https://www.better-auth.com/) 플러그인 모음입니다.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@please-auth/waitlist`](./packages/waitlist#readme) | Invite 기반 대기자 명단(waitlist) 플러그인 | [![npm](https://img.shields.io/npm/v/@please-auth/waitlist)](https://www.npmjs.com/package/@please-auth/waitlist) |
| [`@please-auth/firestore`](./packages/firestore#readme) | Cloud Firestore 어댑터 | - |

## Quick Start

### Waitlist (Server)

```typescript
import { betterAuth } from "better-auth";
import { waitlist } from "@please-auth/waitlist";

export const auth = betterAuth({
  plugins: [
    waitlist({
      requireInviteCode: true,
      sendInviteEmail: async ({ email, inviteCode }) => {
        await sendEmail({ to: email, subject: "You're in!", body: inviteCode });
      },
    }),
  ],
});
```

### Waitlist (Client)

```typescript
import { createAuthClient } from "better-auth/client";
import { waitlistClient } from "@please-auth/waitlist/client";

const auth = createAuthClient({
  plugins: [waitlistClient()],
});

// 대기자 명단에 등록
await auth.waitlist.join({ email: "user@example.com" });

// 상태 확인
const { data } = await auth.waitlist.status({ token: "lookup-token" });
```

### Firestore Adapter

```typescript
import { betterAuth } from "better-auth";
import { firestoreAdapter } from "@please-auth/firestore";
import { getFirestore } from "firebase-admin/firestore";

const auth = betterAuth({
  database: firestoreAdapter({ db: getFirestore() }),
});
```

## Development

### 사전 요구사항

- [mise](https://mise.jdx.dev/) (도구 버전 관리)
- [Bun](https://bun.sh/) (packageManager로 사용)

### 설정

```bash
mise trust
mise install
bun install
```

### 개발

```bash
# 전체 빌드
bun run build

# 전체 타입 체크
bun run check-types

# 전체 테스트
bun run test

# 특정 패키지만
npx turbo run build --filter=@please-auth/firestore
```

### Git Hooks 설정

```bash
mise run setup
```

`mise run setup`은 의존성을 설치하고 `commit-msg` hook을 설정하여 [commitlint](https://commitlint.js.org/)가 자동으로 실행됩니다.

### 주요 명령어

```bash
# 테스트
bun run --filter '*' test

# 커버리지
bun run --filter '*' coverage

# 빌드
bun run --filter '*' build

# 타입 체크
bun run --filter '*' typecheck

# 린트
bun run --filter '*' lint
```

## License

MIT
