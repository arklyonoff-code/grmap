# Cloudflare Pages 빠른 배포 설정

## Pages 프로젝트 설정값

- Root directory: `web`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Output directory: `.next`

## 필수 환경변수

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_CONSOLE_CODE`

## Cloudflare에 복붙용 (값 템플릿)

아래 블록을 기준으로 Cloudflare Pages의 Environment variables에 키/값을 입력하세요.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
ADMIN_CONSOLE_CODE=change-this-admin-code
```

같은 내용이 `web/.env.example`에도 들어 있습니다.

## Cloudflare 빌드 설정 복붙용

- Root directory: `web`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Output directory: `.next`

## 확인 포인트

1. `/admin/login` 로그인 후 `/admin` 접근 가능
2. `/report/new`에서 제출 시 `/wait_reports`에 데이터 생성
3. `/feed`에서 Firebase 데이터가 표시되는지 확인
