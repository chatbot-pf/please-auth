# @please-auth/waitlist

[![npm](https://img.shields.io/npm/v/@please-auth/waitlist)](https://www.npmjs.com/package/@please-auth/waitlist)

[Better Auth](https://www.better-auth.com/)용 초대 기반 대기자 명단(waitlist) 플러그인입니다.

모든 회원가입 경로(email/password, OAuth, magic-link, OTP 등)를 요청 레벨과 데이터베이스 훅에서 가로채어, 승인되지 않은 사용자가 생성되지 않도록 합니다.

## 설치

```bash
bun add @please-auth/waitlist
# peer dependencies
bun add better-auth better-call
```

## 빠른 시작

### 서버

```typescript
import { betterAuth } from "better-auth";
import { waitlist } from "@please-auth/waitlist";

export const auth = betterAuth({
  plugins: [
    waitlist({
      requireInviteCode: true,
      sendInviteEmail: async ({ email, inviteCode, expiresAt }) => {
        await sendEmail({
          to: email,
          subject: "You're in!",
          body: `Your invite code: ${inviteCode}`,
        });
      },
    }),
  ],
});
```

### 클라이언트

```typescript
import { createAuthClient } from "better-auth/client";
import { waitlistClient } from "@please-auth/waitlist/client";

const auth = createAuthClient({
  plugins: [waitlistClient()],
});

// 대기자 명단에 등록
const { data } = await auth.waitlist.join({ email: "user@example.com" });

// 상태 확인 (lookupToken 사용)
const { data: status } = await auth.waitlist.status({
  query: { token: data.lookupToken },
});

// 초대 코드 검증
const { data: result } = await auth.waitlist.verifyInvite({
  inviteCode: "...",
});
```

## 설정 옵션

```typescript
waitlist({
  // 대기자 명단 활성화 여부 (기본값: true)
  enabled: true,

  // 회원가입 시 초대 코드 필수 여부 (기본값: false)
  // false면 승인 상태만 확인, true면 초대 코드도 필요
  requireInviteCode: false,

  // 초대 코드 만료 시간 (초, 기본값: 172800 = 48시간)
  inviteCodeExpiration: 172800,

  // 대기자 명단 최대 크기
  maxWaitlistSize: 10000,

  // 익명 로그인 시 대기자 명단 검사 건너뛰기 (기본값: false)
  skipAnonymous: false,

  // 등록 시 자동 승인. true 또는 조건부 함수 전달 가능
  autoApprove: false,
  // autoApprove: (email) => email.endsWith("@company.com"),

  // 관리자 권한이 있는 역할 목록 (기본값: ["admin"])
  adminRoles: ["admin"],

  // 가로챌 Better Auth 경로 (기본값: 모든 회원가입 경로)
  interceptPaths: [
    "/sign-up/email",
    "/callback/",
    "/oauth2/callback/",
    "/magic-link/verify",
    // ...
  ],

  // 콜백
  onJoinWaitlist: async (entry) => { /* ... */ },
  onApproved: async (entry) => { /* ... */ },
  onRejected: async (entry) => { /* ... */ },

  // 승인 시 초대 이메일 발송
  sendInviteEmail: async ({ email, inviteCode, expiresAt }) => {
    // 이메일 발송 로직 구현
  },

  // 테이블/필드명 커스텀
  schema: {
    waitlist: {
      modelName: "custom_waitlist",
      fields: { email: "user_email" },
    },
  },
});
```

## API 엔드포인트

### Public

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/waitlist/join` | 대기자 명단 등록 |
| `GET` | `/waitlist/status` | 상태 확인 (`?token=<lookupToken>`) |
| `POST` | `/waitlist/verify-invite` | 초대 코드 검증 |

### Admin (인증 + 역할 필요)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/waitlist/approve` | 항목 승인 |
| `POST` | `/waitlist/reject` | 항목 거절 |
| `POST` | `/waitlist/bulk-approve` | 일괄 승인 (이메일 목록 또는 개수 지정) |
| `GET` | `/waitlist/list` | 페이지네이션 목록 조회 |
| `GET` | `/waitlist/stats` | 통계 조회 |

## 데이터베이스 스키마

플러그인이 자동으로 `waitlist` 테이블을 생성합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 기본 키 |
| `email` | string | 이메일 (고유) |
| `status` | string | `pending` \| `approved` \| `rejected` \| `registered` |
| `lookupToken` | string | 상태 조회용 토큰 (고유) |
| `inviteCode` | string? | 초대 코드 (고유) |
| `inviteExpiresAt` | date? | 초대 코드 만료 시각 |
| `referredBy` | string? | 추천인 |
| `metadata` | string? | JSON 메타데이터 |
| `approvedAt` | date? | 승인 시각 |
| `rejectedAt` | date? | 거절 시각 |
| `registeredAt` | date? | 회원가입 완료 시각 |
| `createdAt` | date | 생성 시각 |
| `updatedAt` | date | 수정 시각 |

## 에러 코드

```typescript
import { WAITLIST_ERROR_CODES } from "@please-auth/waitlist";
```

| 코드 | 설명 |
|------|------|
| `EMAIL_ALREADY_IN_WAITLIST` | 이미 대기자 명단에 등록된 이메일 |
| `WAITLIST_ENTRY_NOT_FOUND` | 대기자 명단 항목 없음 |
| `NOT_APPROVED` | 승인되지 않은 사용자의 회원가입 시도 |
| `INVALID_INVITE_CODE` | 유효하지 않거나 만료된 초대 코드 |
| `INVITE_CODE_REQUIRED` | 초대 코드 누락 |
| `ALREADY_REGISTERED` | 이미 회원가입에 사용된 항목 |
| `WAITLIST_FULL` | 대기자 명단 정원 초과 |
| `UNAUTHORIZED_ADMIN_ACTION` | 관리자 권한 없음 |

## 동작 방식

1. **요청 가로채기** — 회원가입 경로(`/sign-up/email`, `/callback/`, `/magic-link/verify` 등)에 대한 요청을 미들웨어에서 가로채어, 승인된 대기자 명단 항목이 없으면 `403`을 반환합니다.
2. **데이터베이스 훅** — OAuth 콜백 등 요청 body에 이메일이 없는 경우를 대비해, `user.create` 데이터베이스 훅에서도 승인 여부를 확인합니다.
3. **회원가입 완료 추적** — 사용자 생성 후 대기자 명단 항목의 상태를 `registered`로 변경합니다.

## 라이선스

MIT
