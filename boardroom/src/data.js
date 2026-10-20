// ---------------------------------------------------------------------------
// Default company, roster, sample agendas and the demo script.
// ---------------------------------------------------------------------------

const DEFAULT_COMPANY = {
  name: "한빛 AI 스튜디오",
  desc: "AI 영상 제작 스튜디오. 유튜브 쇼츠, 광고, 뮤직비디오용 영상을 AI로 만든다. 큰 회사처럼 팀장을 두었지만, 실제로 일하는 사람은 CEO 1명뿐인 1인 스튜디오다.",
};
// Earlier builds shipped this description; saved rosters that still carry it get the new one.
const OLD_COMPANY_DESC = "직원 120명 규모의 AI 영상 제작사. 광고, 뮤직비디오, 숏폼 시리즈를 AI 생성 파이프라인으로 만든다. 연 매출 약 90억 원(가정).";

// The real resources every head must plan within. hf is a Higgsfield snapshot (refreshed live on claude.ai).
const DEFAULT_REALITY = {
  team: "CEO 1명(나)이 기획, 생성, 편집, 업로드를 모두 직접 한다. 직원과 외주는 없다.",
  hours: "",
  budget: "",
  creditWon: "",
  tools: "힉스필드 Plus 요금제(영상, 이미지, 음성 생성), Claude",
  hf: {
    plan: "plus",
    credits: 86.35,
    at: "2026-10-20T09:40:00Z",
    costs: [
      { name: "Seedance 2.5 (영상)", avg: 28, min: 21, max: 80, n: 9 },
      { name: "GPT Image 2.5 Flare (이미지)", avg: 2.75, min: 2.75, max: 2.75, n: 2 },
      { name: "Eleven v4 (음성)", avg: 0.6, min: 0.46, max: 0.69, n: 19 },
    ],
    topup: "100크레딧 단위로 충전한 적 있음",
  },
};

// Standing orders. weekday: 0 = 일요일 ... 6 = 토요일 (KST).
const DEFAULT_TASKS = [
  {
    id: "t-ai-trend", headId: "h-research", title: "AI 동향 브리핑", repeat: "weekly", weekday: 1,
    instruction: "지난 한 주 동안 AI 영상, 이미지, 음성 생성 쪽에서 새로 나온 모델, 기능, 가격 변화를 정리해 주세요. 1인 AI 영상 제작자에게 실제로 영향이 있는 것만 고르고, 바로 써 볼 만한 것을 추천해 주세요.",
    refs: "",
  },
  {
    id: "t-prompting", headId: "h-prod", title: "프롬프팅 기술 리포트", repeat: "weekly", weekday: 3,
    instruction: "AI 영상 생성 프롬프트 쓰는 법이 어떻게 발전하고 있는지 정리해 주세요. 힉스필드에서 쓰는 모델(Seedance 등) 기준으로, 크레딧을 덜 쓰고 결과를 좋게 만드는 요령과 바로 써 볼 예시 프롬프트를 넣어 주세요.",
    refs: "",
  },
  {
    id: "t-trend", headId: "h-pr", title: "요즘 트렌드 분석", repeat: "weekly", weekday: 5,
    instruction: "유튜브 쇼츠, 틱톡, 인스타그램 릴스에서 요즘 뜨는 영상 형식, 밈, 음악, 소재를 정리해 주세요. 그중 AI 영상으로 따라 만들기 쉬운 것을 고르고 예상 크레딧을 붙여 주세요.",
    refs: "",
  },
];

// look: skin 0-4, hair 0-6 (color), style 0-4, suit 0-6, acc 0-3 (none, glasses, headset, tie)
const DEFAULT_HEADS = [
  {
    id: "h-plan", name: "한서진", title: "기획팀장", short: "기획",
    role: "콘셉트, 타깃, 포맷, 러닝타임, 회차 구성을 설계한다. 아이디어를 실행 가능한 기획안 숫자로 바꾼다.",
    persona: "차별점이 없는 기획은 기획이 아니라고 믿는다. 레퍼런스와 다른 점을 한 문장으로 말하지 못하면 반대한다.",
    harsh: 4, auditor: false,
    look: { skin: 0, hair: 0, style: 2, suit: 1, acc: 0 },
  },
  {
    id: "h-research", name: "박재윤", title: "리서치팀장", short: "리서치",
    role: "시장 규모, 경쟁작, 플랫폼 트렌드, 시청 데이터를 근거로 판단한다.",
    persona: "출처 없는 숫자를 가장 싫어한다. 확인되지 않은 수치에는 반드시 추정이라고 붙이고, 확인 방법을 제시한다.",
    harsh: 4, auditor: false,
    look: { skin: 1, hair: 1, style: 1, suit: 0, acc: 1 },
  },
  {
    id: "h-judge", name: "최유나", title: "판단팀장", short: "판단",
    role: "기술, 예산, 일정, 법률과 저작권 측면에서 실제로 실행 가능한지 심사한다.",
    persona: "가능과 불가능을 분명하게 가른다. 애매하면 어떤 조건에서 가능한지 조건을 붙인다.",
    harsh: 5, auditor: false,
    look: { skin: 0, hair: 6, style: 3, suit: 4, acc: 0 },
  },
  {
    id: "h-prod", name: "강민석", title: "제작팀장", short: "제작",
    role: "AI 영상 파이프라인 운영. 툴, 인력, 편당 제작 시간, 생성 비용, 품질 관리를 책임진다.",
    persona: "현장에서 안 굴러가는 계획을 수없이 봤다. 일정과 비용을 항상 실제 작업 시간으로 환산해서 말한다.",
    harsh: 4, auditor: false,
    look: { skin: 2, hair: 0, style: 0, suit: 2, acc: 2 },
  },
  {
    id: "h-pr", name: "이수아", title: "홍보팀장", short: "홍보",
    role: "채널 전략, 메시지, 예상 도달과 전환, 광고비, 위기 대응을 맡는다.",
    persona: "사람들이 공유할 이유가 있는지를 먼저 본다. 낙관적인 편이지만 숫자로 검증받을 각오가 되어 있다.",
    harsh: 3, auditor: false,
    look: { skin: 0, hair: 3, style: 2, suit: 3, acc: 0 },
  },
  {
    id: "h-audit", name: "오정우", title: "감사팀장", short: "감사",
    role: "회의 전체를 감사한다. 기획과 실행이 실제로 잘 될지 판정하고, 성공 확률, 승인 조건, 중단 기준을 낸다.",
    persona: "회의실의 낙관 편향을 잡아내는 사람이다. 누구 편도 아니며, 근거가 약한 주장은 직급과 상관없이 지적한다.",
    harsh: 5, auditor: true,
    look: { skin: 1, hair: 4, style: 4, suit: 5, acc: 3 },
  },
];

const SAMPLE_AGENDAS = [
  "AI로 만든 1분짜리 숏드라마 시리즈를 매주 3편씩 유튜브 쇼츠와 틱톡에 올려 6개월 안에 구독자 10만을 만든다.",
  "중소 브랜드 대상으로 '광고 영상 48시간 완성' 구독 상품을 월 290만 원에 출시한다.",
  "고인이 된 가수의 목소리와 얼굴을 AI로 복원해 추모 뮤직비디오를 만들고 음원 수익을 유족과 나눈다.",
];

// The demo script answers SAMPLE_AGENDAS[0] only. Lines are written for the default roster;
// with an edited roster they are spoken by heads in order.
const DEMO = {
  agenda: SAMPLE_AGENDAS[0],
  briefs: [
    { stance: "조건부", score: 58, say: "1분 숏드라마는 이미 너무 많아서 다른 점이 없으면 묻힙니다. 같은 주인공 3명이 계속 나오는 시리즈로 하고, 매회 끝에 반전을 하나 넣자고 제안합니다. 주 3편이면 6개월에 78편인데, 혼자 대본 78개를 쓰려면 일주일에 10시간 넘게 듭니다(추정).", number: "6개월 78편, 대본만 주 10시간+ (추정)", risk: "다른 채널과 다른 점이 아직 없음" },
    { stance: "반대", score: 34, say: "6개월에 구독자 10만은 근거가 없습니다. 새로 시작한 쇼츠 채널은 대부분 6개월 안에 1만 명도 못 넘깁니다(업계 체감, 추정). 구독자 수 대신 끝까지 본 비율처럼 우리가 바꿀 수 있는 숫자를 목표로 잡아야 합니다.", number: "새 채널 6개월 1만 명 미만이 다수 (추정)", risk: "목표 숫자에 근거가 없음" },
    { stance: "조건부", score: 52, say: "만드는 것 자체는 됩니다. 문제는 주인공 얼굴을 매회 똑같이 유지하는 겁니다. 지금 영상 모델은 얼굴이 조금씩 바뀌어서 편당 2~3번은 다시 뽑아야 합니다. 그만큼 크레딧이 더 듭니다.", number: "편당 다시 뽑기 2~3번 추가 (추정)", risk: "주인공 얼굴 유지, 크레딧 추가" },
    { stance: "조건부", score: 55, say: "1분짜리 1편에 5초 클립이 12개 필요하고, Seedance 2.5로 클립 하나에 21크레딧이 듭니다. 다시 뽑기까지 치면 1편에 300크레딧쯤입니다. 지금 잔액으로는 1편도 다 못 만들고, 주 3편이면 한 달에 3,600크레딧이 필요합니다.", number: "1편 약 300크레딧, 주 3편이면 월 3,600크레딧 (추정)", risk: "지금 잔액으로는 1편도 부족" },
    { stance: "찬성", score: 66, say: "쇼츠는 반응이 빨리 와서 시험해 보기 좋습니다. 매회 마지막 반전 장면을 다음 편 썸네일로 쓰면 이어서 보게 만들 수 있습니다. AI로 만든 걸 숨기지 말고, 만드는 과정을 따로 올리면 그것도 콘텐츠가 됩니다.", number: "광고비 0원으로 시작 (제안)", risk: "AI 영상이라 싫다는 댓글" },
  ],
  clashes: [
    { a: 1, t: 4, attack: "홍보팀장님, 반응이 빠른 건 맞지만 쇼츠는 본 사람이 구독까지 하는 비율이 제일 낮습니다. 이어 보기 장치가 구독으로 이어진다는 근거가 있습니까?", defense: "직접 확인한 숫자는 없습니다. 인정합니다. 4주 뒤 구독 전환율을 따로 보고, 0.5%가 안 되면 이 방법은 버리겠습니다.", damage: 14, verdict: "공격 유효" },
    { a: 2, t: 3, attack: "1편 300크레딧 안에 얼굴 맞추려고 다시 뽑는 횟수가 들어가 있습니까? 안 들어가 있으면 400크레딧이 넘습니다.", defense: "다시 뽑기는 1번만 넣었습니다. 맞습니다. 1편 400크레딧으로 고치겠습니다.", damage: 12, verdict: "공격 유효" },
    { a: 3, t: 0, attack: "매회 반전을 넣으면 대본이 어려워집니다. 대본이 밀리면 영상도 못 만듭니다. 대본을 몇 편 미리 써 두고 시작할 겁니까?", defense: "시작 전에 대본 6편을 먼저 써 두겠습니다. 주 1편이면 6주 여유가 생깁니다.", damage: 8, verdict: "방어 성공" },
  ],
  audit: {
    say: "이 회의는 목표 숫자를 먼저 정하고 근거를 나중에 붙였습니다. 구독자 10만은 아무도 지키지 못했습니다. 가장 큰 문제는 돈입니다. 주 3편이면 한 달에 3,600크레딧이 넘게 드는데, 지금 잔액과는 차이가 너무 큽니다.",
    probability: 24,
    verdict: "조건부 승인",
    conditions: ["주 3편이 아니라 주 1편으로 시작한다 (한 달 약 1,600크레딧)", "1분이 아니라 30초로 줄여 1편 비용을 절반으로 낮춘다", "목표를 '구독자 10만'에서 '12주 안에 끝까지 본 비율 50%'로 바꾼다"],
    killCriteria: ["4편을 올렸는데 평균 조회수가 500회 미만이면 멈춘다", "1편에 500크레딧이 넘게 들면 형식을 바꾼다"],
    biases: "홍보 쪽 기대가 숫자 없이 분위기를 띄웠습니다.",
  },
};
