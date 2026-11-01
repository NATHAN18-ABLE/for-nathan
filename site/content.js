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

  /* [1-2] 오프닝 트릭: 히어로 바로 다음, 대표작 한 편을 화면 가득
     쇼릴이 생기면 쇼릴로 바꿔도 됩니다. */
  opening: {
    show: true,
    title: "TOXIC",
    summary: "감정 없던 AI 암살자 Adrian Voss가 Nadia를 만나 '글리치'를 겪는 이야기.",
    meta: "네오누아르 AI 숏필름 · 약 25초",
    media: {
      poster: "",     // 예: "assets/works/toxic/poster.webp"  (16:9, 1920×1080)
      loop: "",       // 예: "assets/works/toxic/loop.mp4"     (소리 없는 미리보기, 3MB 이하 권장)
      fullUrl: ""     // 전체 영상: 유튜브/비메오 주소 또는 mp4 경로
    },
    buttons: { play: "전체 영상 보기", allWorks: "작품 모두 보기" }
  },

  /* [2] ABOUT ------------------------------------------------------------- */
  about: {
    photo: { src: "", alt: "【이름】의 사진" },   // 예: "assets/images/about/portrait.webp" (4:5, 1200×1500)
    roles: "Media Director · AI Visual Artist · Content Strategist",

    lead: "콘텐츠에는 온도가 있어야 합니다.",
    body: [
      "저는 AI 시대에 미디어를 설계하는 감독입니다. 첨단 도구를 능숙하게 다루되, 그 중심에는 언제나 사람의 이야기를 놓습니다.",
      "경영을 배운 크리에이터로서, 예쁜 영상이 아니라 팔리는 영상을 고민합니다.",
      "철학적으로 사고하고, 직관적으로 실행하며, 신뢰를 바탕으로 함께 움직이는 사람입니다."
    ],

    /* 지원 분야 (문구 후보 2: "AI 영상 제작 · 영상 제작 · 콘텐츠 크리에이터 포지션을 찾고 있습니다.") */
    seeking: {
      show: true,
      text: "찍고, 만들고, 퍼뜨립니다. 영상 제작부터 AI 영상, 콘텐츠 기획까지 함께할 자리를 찾고 있습니다.",
      roles: ["AI 영상 제작", "영상 제작·편집", "콘텐츠 크리에이터", "AI 활용 업무"],
      employment: { show: false, text: "【신입 / 인턴 등 근무 형태】" }
    },

    timeline: [
      { period: "현재",         text: "AI 영상 제작 — TOXIC, Just Leave, 단편 「17분 뒤」 제작 중" },
      { period: "2026.02–10",   text: "제10회 전국 대학생 가치투자대회(하나증권 후원) 홍보팀장" },
      { period: "2025.01–09",   text: "경제 콘텐츠 인스타그램 mofy 기획·운영 (게시물 272개)" },
      { period: "동아리",       text: "야구 동아리 KGB 마케팅팀 / 주식 동아리 I.LAB 홍보팀" },
      { period: "2027.02",      text: "경영학과 졸업 예정" },
      { period: "자격",         text: "토익스피킹 IH, 드론 자격증, 운전면허" }
    ],

    resume: { show: true, label: "이력서 PDF" }   // 파일 주소는 위 links.resume 에 적습니다
  },

  /* 아직 만들지 않은 섹션들 (다음 단계에서 하나씩 채웁니다) */
  upcoming: [
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
