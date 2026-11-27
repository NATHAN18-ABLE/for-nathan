# Seoul, Curated — 빌드된 사이트 v1.0

이 브랜치에는 2026년 11월 27일 최종 배포본(버전 2026.11.27-1803)을 빌드한 정적 파일만 들어 있습니다(소스는 `main` 브랜치의 `v1.0` 태그).

## 다시 올리는 방법

- **Netlify**: 이 폴더를 그대로 app.netlify.com의 "Deploy manually"에 끌어다 놓으면 됩니다.
- **다른 정적 호스팅**(Cloudflare Pages, GitHub Pages 등): 폴더 전체를 사이트 루트(`/`)에 올립니다. 하위 경로(`/repo-name/`)에 올리면 링크가 깨지니 루트로 올려야 합니다.
- **내 컴퓨터에서 보기**: 이 폴더에서 `npx serve .` 를 실행하고 http://localhost:3000 을 엽니다. (index.html 파일을 더블클릭하면 열리지 않습니다.)

메타버스 실시간 연결과 테스트 통계는 Supabase 프로젝트가 살아 있을 때만 동작합니다. 나머지 화면은 Supabase 없이도 열립니다.
