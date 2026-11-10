export type Lang = "en" | "ko";

export const COPY = {
  en: {
    nav: { test: "The test", districts: "12 Districts", meet: "Meet travelers", about: "About" },
    headline: "Find your Seoul.",
    sub: "Twelve quiet questions. One district that suits you, and a day to spend there.",
    afterTitle: "Every district answers a different traveler.",
    afterBody: "Start with one morning. We'll take it from there.",
    cardOf: (i: number, n: number) => `${i} of ${n}`,
    sceneNote: "Scenes on this page are AI-generated images of Seoul, made for this proposal.",
    proposal: "A concept proposal for a personalized Seoul travel site. Not an official Seoul Tourism Organization service.",
  },
  ko: {
    nav: { test: "테스트", districts: "12개 구", meet: "여행자 만나기", about: "소개" },
    headline: "나의 서울을 찾아서.",
    sub: "조용한 질문 열두 개. 나와 맞는 동네 하나, 그리고 그곳에서의 하루.",
    afterTitle: "구마다 어울리는 여행자가 다릅니다.",
    afterBody: "아침 하나를 고르는 것부터 시작해요.",
    cardOf: (i: number, n: number) => `${n}개 중 ${i}`,
    sceneNote: "이 페이지의 장면은 제안용으로 만든 AI 생성 서울 이미지입니다.",
    proposal: "개인 맞춤형 서울 여행 사이트 제안 프로젝트입니다. 서울관광재단의 공식 서비스가 아닙니다.",
  },
} as const;
