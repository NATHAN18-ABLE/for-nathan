#!/usr/bin/env bash
# 모션그래픽 렌더 환경 복구: ffmpeg + HyperFrames용 Chrome Headless Shell.
# 클라우드 세션 컨테이너는 매번 새로 뜨므로 렌더 전에 한 번 실행한다.
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  apt-get install -y -qq ffmpeg || { apt-get update -qq && apt-get install -y -qq ffmpeg; }
fi

npx -y hyperframes browser ensure
npx -y hyperframes doctor
