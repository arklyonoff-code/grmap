#!/usr/bin/env bash
# GRmap — iOS 시뮬레이터 스크린샷 캡처 (수동 네비게이션 후 실행)
# 사용법:
#   1) 시뮬레이터에서 앱 실행 후 아래 순서로 화면을 맞춘 뒤 각 단계에서 스크립트를 실행하거나,
#   2) 아래 echo 구간 사이에서 앱을 조작한 다음 해당 라인의 스크린샷 명령만 실행하세요.

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="${ROOT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}/screenshots"
mkdir -p "$OUT_DIR"

SIMULATOR_ID=$(xcrun simctl list devices booted 2>/dev/null | grep -oE '[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}' | head -1)

if [[ -z "${SIMULATOR_ID}" ]]; then
  echo "❌ 부팅된 iOS 시뮬레이터가 없습니다. Xcode에서 시뮬레이터를 실행한 뒤 다시 시도하세요."
  exit 1
fi

echo "📱 시뮬레이터 UUID: ${SIMULATOR_ID}"
echo "📁 저장 경로: ${OUT_DIR}"

capture() {
  local name="$1"
  local path="${OUT_DIR}/${name}_${TIMESTAMP}.png"
  xcrun simctl io "$SIMULATOR_ID" screenshot "$path"
  echo "📸 저장됨: $path"
}

echo ""
echo "━━ 1/5 메인 지도 (구역 마커 보이게) 화면으로 이동 후 Enter ━━"
read -r _
capture "01_map"

echo ""
echo "━━ 2/5 구역 탭 → 상세 Bottom Sheet 열린 상태로 만든 뒤 Enter ━━"
read -r _
capture "02_zone_sheet"

echo ""
echo "━━ 3/5 오늘 미션 탭 ━━"
read -r _
capture "03_mission"

echo ""
echo "━━ 4/5 게시판 목록 탭 ━━"
read -r _
capture "04_board"

echo ""
echo "━━ 5/5 대기시간 입력 모달 열린 상태 (지도에서 공유하기 등) ━━"
read -r _
capture "05_wait_modal"

echo ""
echo "✅ 완료. 파일은 ${OUT_DIR} 에 있습니다."
