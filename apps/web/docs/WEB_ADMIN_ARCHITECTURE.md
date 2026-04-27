# GRmap Web + Admin 구조

## URL 구조

- Public
  - `/` 지도 홈 (핀 상태 요약 + CTA)
  - `/feed` 제보 피드
  - `/report/new` 제보 등록
  - `/zones/[zoneId]` 구역 상세
- Admin
  - `/admin/login` 관리자 로그인
  - `/admin` 대시보드
  - `/admin/users` 유저 관리
  - `/admin/reports` 제보 관리
  - `/admin/stats` 통계

## 화면 와이어프레임 구성

- 대시보드: KPI 카드 3개 + 차트 영역 1개
- 유저 관리: UID, 상태, 마지막 활동, 제보 건수 리스트
- 제보 관리: 구역/상태/시간 기반 큐 리스트
- 통계: 일별 제보량, 구역별 혼잡 비율 패널

## API 접근권한 매트릭스

| 경로 | guest | user | admin |
|---|---|---|---|
| `/zones` read | O | O | O |
| `/zones` write | X | X | O |
| `/wait_reports` read | O | O | O |
| `/wait_reports` write | X | O | O |
| `/users/{uid}` read/write | 본인만 | 본인만 | 전체 |
| `/admin_stats` read/write | X | X | O |
| `/admin_actions` read/write | X | X | O |

## 현재 구현된 보호 방식

- `proxy.ts`: `/admin/*` 접근 시 `grmap_admin` 쿠키 검사
- `app/admin/layout.tsx`: 서버 컴포넌트에서 쿠키 재검증 후 미인증 시 `/admin/login` 리다이렉트
- 로그인 API: `POST /api/admin/login`
  - 임시 코드 일치 시 쿠키 발급
  - 운영 전환 시 Firebase Admin Claims 기반으로 교체
