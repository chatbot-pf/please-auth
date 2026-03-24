# @please-auth/firestore

[better-auth](https://www.better-auth.com/)용 [Cloud Firestore](https://firebase.google.com/docs/firestore) 어댑터입니다.

## 설치

```bash
bun add @please-auth/firestore
# peer dependencies
bun add better-auth firebase-admin
```

## 사용법

```ts
import { firestoreAdapter } from '@please-auth/firestore'
import { betterAuth } from 'better-auth'
import { getFirestore } from 'firebase-admin/firestore'

const auth = betterAuth({
  database: firestoreAdapter({ db: getFirestore() }),
})
```

### `initFirestore` 헬퍼

서버리스 환경에서 안전하게 Firestore 인스턴스를 초기화/재사용합니다.

```ts
import { firestoreAdapter, initFirestore } from '@please-auth/firestore'

const db = initFirestore({ projectId: 'my-project' })

const auth = betterAuth({
  database: firestoreAdapter({ db }),
})
```

## 설정 옵션

```ts
firestoreAdapter({
  // (필수) Firestore 인스턴스
  db: getFirestore(),

  // 필드 네이밍 전략: "default" (camelCase) | "snake_case"
  namingStrategy: 'default',

  // 컬렉션 이름 커스텀
  collections: {
    users: 'users',
    sessions: 'sessions',
    accounts: 'accounts',
    verifications: 'verifications',
  },

  // 디버그 로깅
  debugLogs: false,
})
```

### `namingStrategy`

| 전략 | 예시 |
|------|------|
| `"default"` | `userId`, `emailVerified`, `createdAt` |
| `"snake_case"` | `user_id`, `email_verified`, `created_at` |

## 기능

- better-auth `CustomAdapter` 인터페이스 완전 구현
- 문서 ID 기반 조회 시 **fast path** (`.doc(id).get()` 직접 호출)
- `updateMany`/`deleteMany`에 **WriteBatch** 사용 (500개 단위 청크)
- `not_in` 10개 이하 시 Firestore 네이티브 `not-in` 쿼리
- `starts_with`는 범위 쿼리 (`>=` / `<`) 트릭 사용
- `contains`/`ends_with`는 클라이언트 사이드 필터링
- OR 커넥터: 그룹별 개별 쿼리 실행 후 병합
- Firestore `Timestamp` → JS `Date` 자동 변환
- `db.runTransaction()` 기반 트랜잭션 지원

## Firestore 인덱스

better-auth의 verification token 조회에 복합 인덱스가 필요할 수 있습니다:

```
Collection: verifications
Fields: identifier ASC, createdAt DESC
```

Firebase Console 또는 `firestore.indexes.json`으로 배포하세요.

## 라이선스

MIT
