#!/usr/bin/env bash
# 패치 버전 증가: 1.0.0 → 1.0.1
# iOS buildNumber, Android versionCode 는 정수로 +1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_JSON="${ROOT}/apps/mobile/app.json"

if [[ ! -f "$APP_JSON" ]]; then
  echo "❌ apps/mobile/app.json 을 찾을 수 없습니다."
  exit 1
fi

node - "$APP_JSON" <<'NODE'
const fs = require('fs');
const path = process.argv[1];
const j = JSON.parse(fs.readFileSync(path, 'utf8'));
const v = j.expo.version.split('.').map(Number);
if (v.length !== 3 || v.some(isNaN)) throw new Error('Invalid expo.version');
v[2] += 1;
j.expo.version = v.join('.');
j.expo.ios = j.expo.ios || {};
j.expo.android = j.expo.android || {};
const bn = parseInt(String(j.expo.ios.buildNumber || '0'), 10);
const vc = parseInt(String(j.expo.android.versionCode ?? '0'), 10);
j.expo.ios.buildNumber = String(isNaN(bn) ? 1 : bn + 1);
j.expo.android.versionCode = isNaN(vc) ? 1 : vc + 1;
fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
console.log(`Updated version=${j.expo.version} ios.buildNumber=${j.expo.ios.buildNumber} android.versionCode=${j.expo.android.versionCode}`);
NODE
