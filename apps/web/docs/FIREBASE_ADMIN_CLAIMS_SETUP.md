# Firebase Admin Claims 세팅 절차

운영에서는 임시 관리자 코드 대신 Firebase Custom Claims(`admin: true`)를 사용하세요.

## 1) firebase-admin 준비

```bash
npm install firebase-admin
```

서비스 계정 키를 안전한 경로에 두고 환경변수를 설정합니다.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/service-account.json"
```

## 2) 관리자 클레임 부여 스크립트 실행

아래 예시를 `scripts/set-admin-claim.mjs`로 저장 후 실행합니다.

```js
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({ credential: applicationDefault() });

const uid = process.argv[2];
if (!uid) {
  throw new Error("usage: node scripts/set-admin-claim.mjs <uid>");
}

await getAuth().setCustomUserClaims(uid, { admin: true });
console.log(`admin claim assigned: ${uid}`);
```

```bash
node scripts/set-admin-claim.mjs <firebase-uid>
```

## 3) 웹 로그인/검증 플로우 전환

- 클라이언트에서 Firebase Auth ID Token 발급
- 서버 Route Handler에서 토큰 검증
- `decodedToken.admin === true`일 때만 `/admin/*` 접근 허용

## 4) Realtime Database Rules 반영

```json
{
  "rules": {
    "zones": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true"
    },
    "wait_reports": {
      ".read": true,
      "$reportId": {
        ".write": "auth != null"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || auth.token.admin === true)",
        ".write": "auth != null && (auth.uid === $uid || auth.token.admin === true)"
      }
    },
    "admin_stats": {
      ".read": "auth != null && auth.token.admin === true",
      ".write": "auth != null && auth.token.admin === true"
    }
  }
}
```
