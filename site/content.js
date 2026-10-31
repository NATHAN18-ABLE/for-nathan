/* ==========================================================================
   content.js : 사이트의 모든 글, 숫자, 링크, 이미지 경로를 여기서만 고칩니다.

   쓰는 법
   - 따옴표 "  " 안의 글자만 바꾸면 됩니다. 쉼표와 괄호는 그대로 두세요.
   - ==글자==        → 금색
   - _글자_          → 기울임
   - _==글자==_      → 금색 + 기울임
   - 【 】 안의 글자 → 아직 비어 있는 자리 (화면에 점선으로 표시됩니다)
   - show: false     → 그 블록을 화면에서 숨깁니다. 준비되면 true 로 바꾸세요.
   - 링크가 "" (비어 있음)이면 버튼이 "준비 중"으로 보입니다.
   ========================================================================== */

const CONTENT = {

  /* 브라우저 탭 제목과 검색 결과 설명 */
  site: {
    title: "【이름】 | Media Director · AI Visual Artist",
    description: "AI를 언어로 삼는 미디어 감독. 기술은 수단이고, 이야기의 중심에는 언제나 사람이 있습니다."
  },

  /* 이름 (사이트 곳곳에 쓰입니다) */
  person: {
    nameKo: "【한글 이름】",
    nameEn: "【English Name】"
  },

  /* 연락처와 외부 링크 (비워 두면 "준비 중") */
  links: {
    email: "",          // 예: "hello@example.com"
    instagram: "",      // 예: "https://instagram.com/아이디"
    mofy: "",           // mofy 계정 주소
    youtube: "",        // 유튜브 채널 주소
    resume: ""          // 예: "assets/docs/resume.pdf"
  },

  /* 상단 메뉴. target 은 섹션 이름(id)이라 바꾸지 마세요. label 만 바꿔도 됩니다. */
  nav: [
    { label: "About",     target: "about" },
    { label: "Video",     target: "video" },
    { label: "Image",     target: "image" },
    { label: "Marketing", target: "marketing" },
    { label: "Projects",  target: "projects" },
    { label: "Essence",   target: "essence" },
    { label: "Method",    target: "method" },
    { label: "Why Me",    target: "why-me" },
    { label: "Contact",   target: "contact" }
  ],

  /* [1] HERO ------------------------------------------------------------- */
  hero: {
    label: "Media Director · AI Visual Artist",
    title: [
      "사람에 의한,",
      "사람을 위한,",
      "_==사람의 이야기.==_"
    ],
    subtitle: "AI를 언어로 삼는 미디어 감독",
    body: "기술은 수단입니다. 이야기의 중심에는 언제나 사람이 있습니다.",

    buttons: {
      whyMe: "왜 저인가요?",
      showreel: "쇼릴 보기"
    },

    /* 쇼릴: 준비되면 show: true 로. url 은 유튜브/비메오 주소 또는 "assets/video/showreel.mp4" */
    showreel: { show: false, url: "" },

    /* 히어로 스크롤 영상 (이미지 시퀀스)
       1) tools/extract-frames.bat 으로 영상을 프레임 이미지로 바꿉니다.
       2) 만들어진 장수를 count 에 적습니다. (0 이면 임시 먹 연기 화면이 나옵니다)
       mobile.count 를 0 으로 두면 휴대폰에서도 desktop 프레임을 씁니다. */
    sequence: {
      desktop: { path: "assets/hero/desktop/", count: 0, ext: "webp" },
      mobile:  { path: "assets/hero/mobile/",  count: 0, ext: "webp" },
      poster:  ""   // 예: "assets/hero/poster.webp" (움직임 줄이기 사용자에게 보이는 한 장)
    },

    /* 영상이 끝날 때 아래쪽에 뜨는 작은 설명 */
    caption: { show: true, text: "이 영상은 제가 【사용 툴】로 만들었습니다." }
  },

  /* 아직 만들지 않은 섹션들 (다음 단계에서 하나씩 채웁니다) */
  upcoming: [
    { id: "about",      title: "About" },
    { id: "video",      title: "AI 영상 제작" },
    { id: "image",      title: "AI 이미지 제작" },
    { id: "marketing",  title: "Marketing" },
    { id: "projects",   title: "AI 활용 프로젝트" },
    { id: "essence",    title: "The Essence" },
    { id: "toolkit",    title: "Toolkit" },
    { id: "method",     title: "The Method" },
    { id: "why-me",     title: "Why Me" },
    { id: "philosophy", title: "Philosophy" },
    { id: "finale",     title: "Finale" },
    { id: "contact",    title: "Contact" }
  ]
};
