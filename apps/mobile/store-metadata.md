# GRmap — 스토어 메타데이터 (제출용 초안)

개인정보처리방침 URL은 웹 배포 후 예: `https://<your-domain>/privacy` 로 교체해 제출합니다.

---

## 앱 이름

GRmap — 가락시장 상하차 내비

## 짧은 설명 (80자)

가락시장 실시간 상하차 대기시간 · 시세 정보 · 커뮤니티

## 긴 설명 (4000자 이내)

가락시장에서 일하는 화물차 기사와 도매업자를 위한
실시간 정보 공유 플랫폼입니다.

[주요 기능]
📍 상하차 대기시간: 각 구역의 현재 대기 상황을 실시간으로 확인
💰 오늘의 시세: 품목별 당일 시세를 기사/업자들이 직접 공유
🗺️ 가락시장 지도: 채소동·과일동·수산동 등 구역별 현황 한눈에
📝 커뮤니티: 급구·급매 게시판으로 현장 정보 빠르게 공유
🎯 오늘 미션: 현장 체크인 + 정보 공유로 스탬프 적립

[특징]
- 가입 없이 바로 사용
- 익명 작성 가능
- 새벽 시간대 특화 (새벽 2~8시 주요 서비스)

## 키워드

가락시장, 상하차, 도매시장, 화물차, 대기시간, 시세, 물류

## 카테고리

- iOS: 내비게이션 → 유틸리티
- Android: 교통 → 내비게이션

---

## 네이티브 빌드 시 참고 (Expo)

- **AdMob**: `apps/mobile/app.json`의 `react-native-google-mobile-ads` 플러그인 옵션 `androidAppId` / `iosAppId`를 **실제 AdMob 앱 ID**로 교체하고, 배너 단위는 `EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID` 또는 `BannerAd.tsx`의 프로덕션 단위 ID로 설정합니다.
- **Firebase Analytics**: `@react-native-firebase/app`용 `GoogleService-Info.plist`(iOS)·`google-services.json`(Android)를 프로젝트에 추가하고 `expo prebuild` 후 EAS Build 등으로 스토어 빌드합니다.
- Expo Go에서는 네이티브 모듈이 동작하지 않을 수 있으며, 개발/스토어 검증은 **development build** 또는 **프로덕션 빌드**를 사용하세요.
