import type { Question } from "./match.ts";

// Weights: choosing B adds, choosing A subtracts.
// time: H(-) Heritage / T(+) Trend, stage: A(-) Alley / O(+) Open,
// mood: C(-) Calm / B(+) Buzz, pace: L(-) Linger / F(+) Flow.
// Themes follow the team's draft questions; each one leans on one axis, with a lighter second.
export const QUESTIONS: Question[] = [
  {
    id: "first-view",
    prompt: {
      en: "Your first morning in Seoul. Which view do you want to see first?",
      ko: "서울에서의 첫 아침, 가장 먼저 보고 싶은 풍경은?",
    },
    a: { en: "Tiled roofs along a narrow hanok alley", ko: "좁은 한옥 골목 위로 이어지는 기와지붕" },
    b: { en: "The Han River, wide open, with mountains beyond", ko: "탁 트인 한강과 그 너머의 산 능선" },
    weights: { stage: 1 },
  },
  {
    id: "active-day",
    prompt: {
      en: "You feel like moving today. Which sounds better?",
      ko: "몸을 좀 움직이고 싶은 날, 더 끌리는 쪽은?",
    },
    a: { en: "Climb a rocky peak, then rest at a quiet temple", ko: "바위산에 올랐다가 조용한 산사에 들르기" },
    b: { en: "Wander the alleys and markets where locals live", ko: "현지 사람들이 사는 골목과 시장을 구석구석 걷기" },
    weights: { stage: -1, mood: 0.5 },
  },
  {
    id: "lunch",
    prompt: {
      en: "A local friend asks where you want to eat lunch.",
      ko: "현지 친구가 점심 메뉴를 골라 보라고 한다면?",
    },
    a: { en: "A traditional market, tasting a bit of everything", ko: "전통시장에서 이것저것 조금씩 맛보기" },
    b: { en: "The new place everyone is posting about", ko: "요즘 다들 사진을 올리는 새로 생긴 식당" },
    weights: { time: 1 },
    conditions: { food: { a: "adventurous", b: "easy" } },
  },
  {
    id: "two-doors",
    prompt: {
      en: "You find two shops in a small alley. Which one do you walk into?",
      ko: "작은 골목에서 가게 두 곳을 발견했어요. 어디로 들어갈까요?",
    },
    a: { en: "A small bookshop in a building fifty years old", ko: "50년 된 건물 안의 작은 책방" },
    b: { en: "A shop full of prints and goods by young designers", ko: "젊은 디자이너들의 엽서와 소품이 가득한 가게" },
    weights: { time: 1 },
    tiebreak: "time",
  },
  {
    id: "culture",
    prompt: {
      en: "You have a chance to experience Korean culture. Which would you choose?",
      ko: "한국 문화를 경험할 기회가 생겼어요. 어느 쪽이 좋을까요?",
    },
    a: { en: "Walk through palaces and hanok slowly, learning their history", ko: "궁궐과 한옥을 천천히 거닐며 역사 알아 가기" },
    b: { en: "Make your own pottery, then try K-beauty and fashion", ko: "도자기를 직접 빚고 K-뷰티와 패션까지 체험하기" },
    weights: { time: 1, pace: 0.5 },
  },
  {
    id: "getting-around",
    prompt: {
      en: "How do you like to get around a new city?",
      ko: "낯선 도시에서 나는 주로 어떻게 다닐까요?",
    },
    a: { en: "On foot, even if it takes longer", ko: "조금 오래 걸려도 걸어서 다니기" },
    b: { en: "By subway, to see more places", ko: "지하철을 타고 더 많은 곳 둘러보기" },
    weights: { pace: 1 },
    conditions: { move: { a: "walk", b: "metro" } },
  },
  {
    id: "weekend-afternoon",
    prompt: {
      en: "A slow weekend afternoon. Where do you spend it?",
      ko: "여유로운 주말 오후, 어디에서 보낼까요?",
    },
    a: { en: "A forest path, then a quiet café", ko: "숲길을 걷다가 조용한 카페에서 쉬기" },
    b: { en: "A lively university street full of people", ko: "사람들로 북적이는 대학가 거리 걷기" },
    weights: { mood: 1, stage: -0.5 },
  },
  {
    id: "night",
    prompt: {
      en: "Night falls on Seoul. How do you end the day?",
      ko: "서울에 밤이 찾아왔어요. 하루를 어떻게 마무리할까요?",
    },
    a: { en: "A quiet walk along the river under the bridge lights", ko: "다리 조명 아래 한강 변을 조용히 걷기" },
    b: { en: "Outdoor tables in an old alley, loud and full", ko: "오래된 골목의 노천 테이블에서 북적이는 저녁" },
    weights: { mood: 1, stage: -0.5 },
    tiebreak: "mood",
  },
  {
    id: "day-plan",
    prompt: {
      en: "Which kind of day suits you?",
      ko: "나에게 맞는 하루 일정은?",
    },
    a: { en: "Two or three places, with plenty of time at each", ko: "두세 곳만 골라 오래 머물기" },
    b: { en: "As many places as the day allows", ko: "하루에 갈 수 있는 만큼 최대한 많이" },
    weights: { pace: 1, mood: 0.5 },
    tiebreak: "pace",
  },
  {
    id: "hidden-seoul",
    prompt: {
      en: "Which side of Seoul that most visitors miss would you rather find?",
      ko: "관광객이 잘 모르는 서울을 발견한다면?",
    },
    a: { en: "Rocky mountains and quiet temples at the edge of the city", ko: "도시 외곽의 바위산과 고즈넉한 산사" },
    b: { en: "Old factories and ironworks turned into galleries and cafés", ko: "갤러리와 카페로 바뀐 오래된 공장과 철공소" },
    weights: { stage: -1, time: 0.5 },
    tiebreak: "stage",
  },
  {
    id: "crowds",
    prompt: {
      en: "In a big crowd, you usually feel…",
      ko: "사람이 많은 곳에 가면 나는?",
    },
    a: { en: "Tired. I look for a quiet corner", ko: "금방 지쳐서 조용한 곳을 찾는다" },
    b: { en: "Excited. The busier, the better", ko: "신이 난다. 북적일수록 좋다" },
    weights: { mood: 1 },
  },
  {
    id: "last-day",
    prompt: {
      en: "Your last day in Seoul. Which plan sounds best?",
      ko: "서울에서의 마지막 날, 더 만족스러울 것 같은 계획은?",
    },
    a: { en: "Go back to the neighborhood you liked most and take it slow", ko: "가장 좋았던 동네에 다시 가서 천천히 보내기" },
    b: { en: "Somewhere new, with shopping, food and shows in one place", ko: "쇼핑, 맛집, 공연을 한곳에서 즐기는 새로운 곳" },
    weights: { pace: 1, time: 0.5 },
  },
];
