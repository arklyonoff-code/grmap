# 가락맵(GRmap) — 폴더 인사이트 + Cursor AI 프롬프트

> 작성일: 2026-05-12
> 근거: 저장소 `/Users/lee/projects/GRmap` 전체 스캔 + 사용자 제공 현장 사진 6장
> 목적: (1) 현재 코드/방향에서 발견된 패턴·모순·우선순위 정리, (2) "지게차 1인칭 가상공간" 비전을 위한 Cursor 분담 프롬프트 제공

---

## 1. 폴더에서 발견한 것 (패턴 · 모순 · 사고 변화)

### 1.1 한 줄 요약
"가락시장 정보 공유 앱"이라는 **데이터 레이어**는 잘 만들어져 있지만, 사용자가 원하는 **"실제 공간을 닮은 지게차 운전 가상공간"** 비전과 현재 3D 맵 구현은 방향이 다릅니다.

### 1.2 반복되는 주제 (recurring themes)
1. **익명·로그인 없음** — 게시판, 대기시간 신고, 미션 모두 deviceId 기반. 진입 장벽을 최대한 낮추려는 의도가 일관됨.
2. **새벽 시간대 특화** — store-metadata.md, mission.ts 모두 새벽 2~8시 작업 패턴을 가정.
3. **모노레포 + 공통 패키지** — `@grmap/shared`로 web / mobile / admin이 zone·타입·hyperMap 좌표를 공유. 좋은 구조.
4. **Firestore 비용 최소화** — 게시판은 Firestore 직접, 지도/대기시간은 아직 MOCK. 비용 의식적인 단계적 마이그레이션.
5. **모바일이 먼저, 웹이 따라옴** — 거의 모든 기능이 mobile에서 출발해 web으로 동기화됨.

### 1.3 사고의 변화 (git log로 본 evolution)
| 시점 | 방향 |
|---|---|
| 초기 | Leaflet 실제 지도 + 피드 |
| 중반 | "Hyper Corridor" 추상 3D 복도 (Three.js) |
| 후반 | 보드/파스텔 톤으로 정리 → 날씨 경고 → 지하 위험구역 |
| 현재(uncommitted) | 오프라인 캐시 배너, dangerZones 모바일 동기화 |

→ **추상 복도** 방향으로 한 번 크게 선회했고, 그 안에서 안전(위험구역·날씨) 레이어를 얹는 흐름.

### 1.4 모순 / 갭 (사용자 비전 vs 현재 구현)
| 사용자 의도 (오늘 메시지 + 현장 사진) | 현재 코드 |
|---|---|
| 지게차 운전원이 **실제 공간과 비슷한 가상 공간**을 이동 | 파스텔 보드 위에 핀만 6개 떠 있는 추상 복도 |
| 1인칭/3인칭 운전 시점 | 고정 카메라 (`camera.position(0,7.5,14)`) |
| 충돌·물리(쌓인 박스·벽·천장 제한높이) | 충돌 없음, 모든 게 평면 메쉬 |
| "사고다발구역", 제한속도 10, **제한높이 3.2M/4M** | `dangerZones`에는 지하 램프 2개만, 높이/속도 개념 자체가 없음 |
| 형광등·콘크리트·노랑검정 위험 도색의 인더스트리얼 톤 | `#e8e6e1` 크림 + 파스텔 보드, 현실과 정반대 분위기 |
| 도크 번호(5, 15, 17), 중앙청과/가락청과 같은 **실제 건물 단위** | zone 6개 (채소1/2, 과일, 수산, 건어물, 일반) — 너무 거시적 |

이게 가장 큰 모순이고, **이번 라운드의 핵심 결정**은 이걸 어떻게 좁힐 것인가입니다.

### 1.5 실행 항목으로 떠오른 것들 (코드 상태 기준)
- [ ] uncommitted 변경(11개 파일) 커밋/정리 — 모바일 dangerZones / OfflineCacheBanner / hyperMap 분리
- [ ] zone·대기시간이 아직 **MOCK** — `web/app/page.tsx`, `web/app/feed/page.tsx`, `web/app/report/new/page.tsx` 모두 `MOCK_FEED/MOCK_ZONES` 사용
- [ ] Firestore에 `zones`/`waitReports` 컬렉션 규칙·인덱스 없음 (`posts`/`comments`만)
- [ ] AdMob 실제 ID, GoogleService 파일, 개인정보처리방침 URL 미설정 (store-metadata.md에 명시됨)
- [ ] `dangerZones`의 lat/lng가 **GPS 측정 전 임시값** (주석에 명시)
- [ ] 사진에 보이는 "사고다발구역", 제한높이/속도 표지판은 데이터 모델에 아직 없음

---

## 2. 우선순위 — 지게차 가상공간 비전을 향해

### 2.1 결정해야 할 갈림길 (먼저 답해야 진행 가능)
1. **범위**: 가락시장 전체? 아니면 **한 동(예: 중앙청과 1층)** 먼저?
   → 추천: **한 동 + 한 통로**부터. 사진의 "중앙청과" 첫 사진 한 장이면 MVP 가능.
2. **시점**: 지게차 1인칭? 3인칭(뒤에서 따라가는 카메라)? 탑뷰 + 줌인?
   → 추천: **3인칭(어깨너머) → 1인칭 토글**. 1인칭만 두면 멀미·길찾기 어려움.
3. **조작**: PC(WASD/방향키)만? 모바일 가상 스틱? 둘 다?
   → 추천: 웹은 키보드 우선, 모바일은 **터치 가상 스틱**(react-native-game-engine 없이 직접).
4. **목적**: 단순 시뮬레이션? 길찾기 학습? 위험구역 안전교육?
   → 추천: **안전교육 + 도크 길찾기**. 현재 데이터 레이어와 가장 잘 맞물림.

### 2.2 단계별 우선순위 (4단계 로드맵)

**Phase 1 — 현실 공간의 정직한 미니어처 (2~3주)**
1. 한 동(중앙청과 가정) **실제 치수** 평면도 확보 → 길이/폭/높이를 미터 단위로 코드 상수화
2. `hyperMapEngine.ts`를 `realisticSceneEngine.ts`로 분기(또는 대체)
3. 바닥: 콘크리트 텍스처 + 노란 차선
4. 벽·기둥·낮은 천장(제한높이 표지판 위치 그대로) 박스 지오메트리
5. 도크 번호 사이니지(평면 텍스처로 충분)
6. 색감 톤 전환: 파스텔 크림 → **차가운 형광등 화이트 + 노란 안전선**

**Phase 2 — 지게차 + 1인칭 운전 (2주)**
1. 지게차 모델: 우선 박스+포크 형태로 충분 (현장 사진의 토요타 비율 참고: 길이 2.3m, 폭 1.1m, 운전석 높이 1.4m)
2. 카메라: 운전석 어깨 위치(z=-0.3, y=1.5)에서 정면 응시
3. 조작: WASD + 마우스 룩, 모바일은 좌측 스틱(이동) + 우측 스틱(시선)
4. 충돌: AABB 또는 단순 원형 충돌(벽·박스 스택)
5. 속도 제한: 사진의 "제한속도 10km/h"를 코드로(`MAX_SPEED_MS = 2.78`)

**Phase 3 — 안전 데이터 레이어 (1주)**
1. `dangerZones` 타입을 확장:
   ```ts
   type SafetySign =
     | { kind: 'height_limit'; meters: number }
     | { kind: 'speed_limit'; kmh: number }
     | { kind: 'accident_prone' }
     | { kind: 'ramp'; floorLevel: number };
   ```
2. 천장 높이 3.2M / 4M 구간 진입 시 경고
3. "사고다발구역"은 노랑 바닥 데칼 + 다가가면 화면 가장자리 노란 깜빡임
4. 날씨 위험(`isWeatherDangerous`) → 램프 구간 빨간 펄스 (이미 있음, 위치만 실제 좌표로)

**Phase 4 — 기존 데이터와 연결 (1주)**
1. 도크에 다가가면 그 zone의 **실시간 대기시간** 풍선
2. 가까이 가서 버튼 → "대기시간 공유" 모달
3. 미션 스탬프 트리거(현장 체크인) — 가상 공간에서도 지점 통과 시 자동 적립
4. 다른 사용자 보고가 많은 위치에 핫스팟 표시

### 2.3 의도적으로 **뒤로 미룰 것**
- 멀티플레이(다른 운전자 동시 표시) — 비용·복잡도 큼, MVP 후
- 정밀 차량 물리(휠 회전, 미끄러짐) — Phase 2에서는 박스 이동만으로 충분
- 외부 도로/대기 트럭(이미지 4·5) — 실내가 먼저
- BIM/실측 도면 — 평면도만 있으면 시작 가능

---

## 3. 최종 배포 전 체크리스트

### 3.1 보안 / 환경
- [ ] `.env`가 git에 다시 들어가지 않았는지 확인 (이미 한 번 제거 이력 있음)
- [ ] `web/.env.local`의 Firebase 키 — Cloudflare Pages 환경변수에 동일 입력
- [ ] `EXPO_PUBLIC_WEATHER_API_KEY` 만료/할당량 확인
- [ ] Firestore 규칙: 현재 `posts`/`comments`만 허용, `{document=**}`는 deny — 좋음. zone/waitReport 추가 시 동일 패턴 유지

### 3.2 데이터 / 좌표
- [ ] `DANGER_ZONES`의 lat/lng는 임시값 — **현장 GPS 측정** 필요 (주석에 이미 표시됨)
- [ ] `MOCK_ZONES`의 6개 zone 좌표도 가락시장 실제 위치와 일치 검증
- [ ] `GARAK_MAP_CENTER`(37.4929, 127.119) 기준점 정확성 확인 (Google Maps 비교)

### 3.3 빌드 / 배포
- [ ] `npm run build:web` 성공 — `web/out` 정적 산출물 확인
- [ ] Cloudflare Pages: 빌드 명령 `npm ci && npm run build:web`, 출력 `web/out` (wrangler.toml 주석 그대로)
- [ ] 모바일: `expo prebuild` 후 EAS Build로 스토어 빌드
- [ ] AdMob 실제 앱 ID, `GoogleService-Info.plist`, `google-services.json` 추가
- [ ] 개인정보처리방침 URL: `web/app/privacy/` 라우트 존재 — 도메인 확정 후 store-metadata.md 교체

### 3.4 콘텐츠 / 정책
- [ ] App Store/Play Store 메타데이터(store-metadata.md) 한 번 더 검수
- [ ] 게시판 신고/숨김 흐름이 superadmin 권한과 연결되는지(현재 admin_users 규칙만 있음) — 모더레이션 누락 위험
- [ ] 14세 이상 / 광고 포함 / 위치정보 사용 — 스토어 등급 답변 일관성

### 3.5 안전(가상공간) — Phase 1 이후 추가될 항목
- [ ] 멀미 방지 옵션(FOV 조정, 1인칭/3인칭 토글 기본값)
- [ ] 모바일 GPU 부하 측정 (저가 안드로이드 60fps 유지)
- [ ] 오프라인 캐시(uncommitted 작업 중인 OfflineCacheBanner) 동작 검증

---

## 4. 내가 할 일 vs. Cursor AI가 할 일

### 4.1 사람만 할 수 있는 일 (사용자 본인)
1. **현장 실측 / 사진 보강**
   - 한 동(중앙청과 가정)의 통로 폭, 길이, 천장 높이, 도크 간격 측정 (줄자/걸음수)
   - 도크 번호 표지판 위치, "사고다발구역" 배너 위치 사진
   - 평면도 스케치(손그림 OK) — 가능하면 격자 위에
2. **GPS 좌표 측정** — 각 동 입구, 위험 램프, 게이트의 실제 좌표
3. **지게차 사양 결정** — 시뮬레이션할 차종(토요타 8FB/두산 등) → 길이·폭·포크 길이
4. **범위/시점/조작 4갈림길 결정** (위 2.1)
5. **법무/개인정보** — 개인정보처리방침 도메인 확정, 스토어 응답
6. **AdMob 가입 + 실제 ID 발급** (Cursor가 못 함)
7. **콘텐츠 톤 검수** — "사고다발구역" 등 실명 사용해도 되는지, 시장공사와 마찰 없는지

### 4.2 Cursor AI가 할 수 있는 일
1. 새 Three.js 씬 엔진(`realisticSceneEngine.ts`) 구현 — 박스 지오메트리, 텍스처, 조명
2. 1인칭/3인칭 카메라 컨트롤러 + WASD/터치 입력
3. AABB 충돌 검출, 속도 클램프
4. 새 타입 정의(`SafetySign`), `dangerZones.ts` 확장
5. 도크 근접 감지 → 기존 `ZoneDetailSheet` 트리거 연결
6. 모바일 WebView sceneScript 동기화 (현재 패턴 유지)
7. 단위 테스트(좌표 변환, 충돌, 속도) — 없음, 새로 작성
8. Storybook/Playwright는 굳이 안 들어가도 됨(범위 폭주 방지)

---

## 5. Cursor AI에게 줄 프롬프트 (그대로 복붙용)

> 아래 블록을 그대로 Cursor에 붙여 넣으세요. Cursor가 이걸 보고 한 번에 Phase 1+2 일부를 진행합니다.

---

```
[프로젝트 컨텍스트]
- 모노레포: web (Next.js 16, app router, static export), apps/mobile (Expo + react-native-webview), apps/admin, packages/shared
- 3D: Three.js r128 (mobile은 WebView 안에서 CDN, web은 npm `three`)
- 공통 좌표 유틸: packages/shared/utils/hyperMap.ts (`projectLatLngToHyperMap`, `GARAK_MAP_CENTER`)
- 현재 3D는 "추상 보드 복도" 스타일. 이걸 **가락시장 한 동(중앙청과 1층 가정)의 사실적 미니어처 + 지게차 1인칭 운전**으로 바꾸려 한다.
- 핵심 사진 단서:
  · 좁은 통로 양 옆에 박스 팔레트 더미
  · 형광등 천장, 노출 HVAC 덕트, 콘크리트 바닥
  · "제한높이 3.2M", "제한높이 4M", "제한 ⑩ 속도", "사고다발구역" 노랑/검정 표지판
  · 토요타 지게차 행렬(꼬리물기), 도크 번호(5, 15, 17 등)
  · 색감: 차가운 흰 형광등 + 노랑 안전선 + 오렌지 지게차

[작업 범위 — 이번 PR로 끝낼 것만]
Phase 1-A: 사실적 씬 엔진 + Phase 2-A: 지게차 1인칭(웹부터)

1) 새 파일 web/components/Map/realisticSceneEngine.ts 작성
   - 단위: 1 unit = 1 meter
   - 통로 1개(길이 60m, 폭 6m, 천장 3.2m) 박스 지오메트리로 구성
   - 바닥: 콘크리트 회색(#5a5a58) + 노란 차선(폭 0.1m, 양옆에서 0.5m 안쪽)
   - 천장: 평면 + 형광등 라인 8개 (간단한 emissive 흰 직사각형)
   - 양옆: 폭 1.5m 높이 1.8m 박스 더미를 4m 간격으로 반복(팔레트 더미 표현)
   - 도크 번호 사이니지: CanvasTexture로 "1"~"15" 평면을 천장 아래 박스 더미 위에 배치
   - "사고다발구역" 노랑 데칼: 통로 중간 6m 구간 바닥 텍스처
   - 제한높이 3.2M 표지판: 통로 입구 위 (CanvasTexture 직사각형)
   - 조명: AmbientLight 0.4 + 형광등 위치마다 PointLight (저비용용으로 가까운 4개만 활성)
   - 안개 옅게(#cfcfcf, near 20, far 70)

2) web/components/Map/forkliftController.ts 작성
   - 키 입력: W/S 전후진(가속도 1.5 m/s², 최고 2.78 m/s = 10km/h), A/D 조향, Shift 부스트는 없음
   - 마우스 룩: pointerLock, 위아래 ±20°만
   - 차량: BoxGeometry(2.3 × 1.4 × 1.1)에 포크 2개(가는 박스), 색 오렌지(#e87a2a)
   - 카메라 모드 토글(키 V): 1인칭(차량 머리 위 y=1.5, z=-0.2) / 3인칭(뒤 4m, 위 2.5m)
   - 충돌: 벽/박스 더미를 AABB로 등록 → 이동 후 침투 시 복원
   - 속도 초과 시 화면 가장자리에 빨간 비네트(이미 가까이 가면 별도 함수로 노출)
   - 디스포저블한 dispose() 제공

3) web/components/Map/RealisticMap3D.tsx 작성
   - 기존 HyperMap3D와 동일 props: zones, selectedZoneId, onZoneTap, dangerZones, isWeatherDangerous
   - 내부에서 realisticSceneEngine + forkliftController를 결합
   - 도크 좌표는 임시로 통로 좌측 (x=-2.8, z=-3 -3 간격으로 6m마다) 배치
   - 도크 근접(2m 이내) 진입 시 onZoneTap(zone.id) 호출 (1초 쿨다운)
   - 1인칭/3인칭, "대기시간 공유" 단축키 R 안내를 우상단 작은 HUD로 표시

4) packages/shared/constants/dangerZones.ts 타입 확장
   - 기존 DangerZone에 다음 추가:
     ```ts
     export type SafetySign =
       | { kind: 'height_limit'; meters: number }
       | { kind: 'speed_limit'; kmh: number }
       | { kind: 'accident_prone' }
       | { kind: 'ramp'; floorLevel: number };
     export interface DangerZone {
       id: string; name: string; lat: number; lng: number;
       description: string;
       sign: SafetySign;             // 새 필드
       // 기존 type/floorLevel은 backward-compat 위해 옵셔널 유지
       type?: 'basement_ramp' | 'narrow_passage' | 'blind_spot';
       floorLevel?: number;
     }
     ```
   - 기존 두 항목은 sign: { kind: 'ramp', floorLevel: -1 | -2 }로 마이그레이션
   - 새 샘플 추가: height_limit 3.2m, speed_limit 10, accident_prone 각 1건

5) web/app/page.tsx
   - HyperMap3D 동적 import를 RealisticMap3D로 교체
   - 기존 props 그대로 전달, MOCK 데이터는 유지(이번 PR에서 Firestore는 건드리지 않음)

6) 테스트(가벼움)
   - packages/shared/utils/__tests__/hyperMap.test.ts 추가
     · GARAK_MAP_CENTER에서 (0,0) 나오는지
     · 위경도 변화에 대해 부호와 스케일 검증
   - 가능하면 web/components/Map/__tests__/forkliftController.test.ts: 충돌·속도 클램프 단위 테스트
   - 새 의존성 추가 금지. 기존 vitest/jest 셋업이 없으면 npx tsc --noEmit 로 타입만 확인

[금지/주의]
- 모바일(WebView sceneScript)은 이번 PR에서 건드리지 말 것. 별 PR에서 한다.
- Firestore 규칙/인덱스 변경 금지.
- Three.js 외 새 패키지 추가 금지 (cannon-es 등 물리엔진 No).
- localStorage 사용 금지(현 정책 동일).
- 코드 주석은 한국어 우선, 변수명/타입은 영문.
- 색상은 다음 팔레트만 사용:
    floor #5a5a58, lane #d9b300, ceiling #e6e6e4, fluorescent #ffffff
    pallet #b3825a, hazard yellow #f1c40f, accident-prone bg #ffe34d/black-stripe
    forklift #e87a2a, signage red #c0392b, sign frame #1c1c1c
- 모든 새 메쉬는 dispose 가능하도록 geometry/material 참조 관리.

[완료 조건]
1. npm run build:web 성공
2. http://localhost:3000 에서 1인칭/3인칭 토글로 통로를 끝까지 운전 가능, 벽/박스 더미에 막힘
3. 도크에 2m 이내 접근 시 ZoneDetailSheet 자동 오픈
4. 새 타입(SafetySign) 도입에도 기존 모바일/웹 빌드가 깨지지 않음 (타입 옵셔널 처리로)
5. PR 설명에 "사용자 비전: 지게차 1인칭 + 사실적 한 동" 정렬임을 명시
```

---

## 6. 다음 라운드 (Cursor 작업 후 사람이 할 일)

1. 로컬에서 통로 길이/폭이 어색하지 않은지 운전해보고 수치 미세조정
2. 실측한 도크 간격으로 `dangerZones`와 `MOCK_ZONES` 좌표 업데이트
3. 모바일 WebView 동기화용 후속 PR 지시 ("phase1-B mobile sync")
4. Firestore `zones` / `waitReports` 컬렉션 정의 + 규칙·인덱스 PR (mock 제거)
5. App Store/Play Store 빌드 — store-metadata.md의 미해결 항목 채우기

---

끝.
