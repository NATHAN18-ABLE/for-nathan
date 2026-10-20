// ---------------------------------------------------------------------------
// Default company, roster, sample agendas and the demo script.
// ---------------------------------------------------------------------------

const DEFAULT_COMPANY = {
  name: "원준 커리어 본부",
  desc: "원준 님의 취업을 돕는 가상 팀. 팀원들은 원준 님 한 명을 위해 조언하고, 초안을 만들고, 냉정하게 평가한다. 실제로 일하고 지원하는 사람은 원준 님 1명이다.",
};
// Roster generations. Saved rosters from an older generation are rebuilt (looks kept by id).
const TEAM_VERSION = "career-v1";
// Earlier builds shipped this description; saved rosters that still carry it get the new one.
const OLD_COMPANY_DESC = "직원 120명 규모의 AI 영상 제작사. 광고, 뮤직비디오, 숏폼 시리즈를 AI 생성 파이프라인으로 만든다. 연 매출 약 90억 원(가정).";

// The real resources every head must plan within. hf is a Higgsfield snapshot (refreshed live on claude.ai).
const DEFAULT_REALITY = {
  team: "원준 님 1명이 직접 실행한다. 팀원들은 조언과 초안만 만든다. 직원과 외주는 없다.",
  hours: "",
  budget: "",
  creditWon: "",
  tools: "힉스필드 Plus 요금제(영상, 이미지, 음성 생성), 프리미어 프로, 캡컷, 블렌더, Claude, Claude Code, ChatGPT, Codex",
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
    id: "t-brief", headId: "h-sec", title: "오늘의 이슈 브리핑", repeat: "daily", weekday: 1,
    instruction: "사회, 경제, AI 이슈를 각각 2~3개씩 쉬운 말로 정리해 줘. 그중 원준 님 취업(미디어, 방송, 광고, AI 영상)과 이어지는 건 따로 짚어 줘. 오늘과 어제 뉴스 중심, 출처 필수.",
    refs: "",
  },
  {
    id: "t-industry", headId: "h-research", title: "주간 업계 리포트", repeat: "weekly", weekday: 1,
    instruction: "지난 한 주의 AI, AI 영상, 미디어·방송·광고 업계 소식과 채용 흐름을 정리해 주세요. 원준 님의 영상 작업과 지원에 실제로 어떻게 쓸 수 있는지 꼭 붙여 주세요.",
    refs: "",
  },
  {
    id: "t-portfolio", headId: "h-portfolio", title: "주간 포트폴리오 점검", repeat: "weekly", weekday: 5,
    instruction: "원준 님 프로필을 기준으로 희망 직무별로 넘치는 것, 부족한 것, 다음 주에 더 해야 할 활동을 정리해 주세요. 실제 채용 공고에서 요구하는 역량과 비교해 주세요.",
    refs: "",
  },
  {
    id: "t-sns", headId: "h-research", title: "SNS 화제 정리 (믿을 만한 것만)", repeat: "weekly", weekday: 3,
    instruction: "지난 1주일 동안 스레드, X, 인스타그램에서 AI 영상, 광고, 방송 업계 사람들이 많이 이야기한 것 중 믿을 만한 것만 골라 주세요. 공식 계정 발표나 언론 보도로 확인된 것만 넣고, 누가 올렸는지 꼭 밝혀 주세요. 소문과 홍보 글은 빼 주세요.",
    refs: "",
  },
];

// look: skin 0-4, hair 0-6 (color), style 0-4, suit 0-6, acc 0-3 (none, glasses, headset, tie)
const DEFAULT_HEADS = [
  {
    id: "h-plan", name: "한서진", title: "기획팀장", short: "기획",
    role: "원준 님의 취업 전략을 짠다. 어떤 직무와 회사에 어떤 순서로 지원할지, 포트폴리오와 지원서를 어떻게 남들과 다르게 만들지 아이디어를 낸다.",
    persona: "아이디어는 많이 내지만, 아이디어마다 오늘 할 첫 단계와 마감일을 붙인다. 남들 다 하는 방법이면 그렇다고 솔직하게 말한다.",
    harsh: 4, auditor: false,
    look: { skin: 0, hair: 0, style: 2, suit: 1, acc: 0 },
  },
  {
    id: "h-portfolio", name: "정다온", title: "포트폴리오팀장", short: "포폴",
    role: "원준 님이 한 활동을 기록하고 정리한다. 희망 직무별로 무엇이 넘치고 무엇이 부족한지 판단해서, 더 해야 할 활동과 빼도 되는 활동을 제안한다.",
    persona: "기록이 없는 활동은 없는 활동으로 본다. 기간, 인원, 조회수, 성과 같은 숫자가 없으면 반드시 되묻는다.",
    harsh: 4, auditor: false,
    look: { skin: 1, hair: 5, style: 3, suit: 2, acc: 1 },
  },
  {
    id: "h-prod", name: "강민석", title: "실행팀장", short: "실행",
    role: "영상 제작, PPT, 포트폴리오 사이트, 이력서 디자인 같은 실제 작업 방법을 단계별로 알려 준다. 툴, 순서, 걸리는 시간, 힉스필드 크레딧까지 구체적으로 말한다.",
    persona: "말보다 결과물. 언제나 오늘 바로 시작할 수 있는 첫 단계를 준다. 툴마다 장단점을 알고 상황에 맞는 툴을 고른다.",
    harsh: 3, auditor: false,
    look: { skin: 2, hair: 0, style: 0, suit: 2, acc: 2 },
  },
  {
    id: "h-judge", name: "최유나", title: "분석팀장", short: "분석",
    role: "실제 기업 인사팀과 현업 면접관 입장에서 원준 님의 활동, 자기소개서, 포트폴리오, 원준 님 자체를 평가한다. 뽑을지 말지, 무엇이 부족한지, 어떤 문장이 별로인지 말한다.",
    persona: "서류 300장 중 몇 장을 고르는 인사 담당자처럼 본다. 칭찬보다 탈락 사유를 먼저 말한다. 방송사, 광고 회사, AI 스타트업의 눈높이를 구분한다.",
    harsh: 5, auditor: false,
    look: { skin: 0, hair: 6, style: 3, suit: 4, acc: 0 },
  },
  {
    id: "h-research", name: "박재윤", title: "서치팀장", short: "서치",
    role: "AI, AI 영상, 미디어, 방송, 광고 업계 소식과 채용 흐름을 찾아 정리하고, 원준 님의 작업과 지원에 어떻게 쓸 수 있는지 알려 준다.",
    persona: "출처 없는 소식은 전하지 않는다. 확인되지 않은 것은 확인 필요라고 쓴다.",
    harsh: 4, auditor: false,
    look: { skin: 1, hair: 1, style: 1, suit: 0, acc: 1 },
  },
  {
    id: "h-pr", name: "이수아", title: "검수팀장", short: "검수",
    role: "실행팀, 분석팀 등이 함께 만든 결과물을 최종 검수한다. 오탈자와 문장, 사실 확인부터 '이걸 본 기업이 원준 님을 뽑을까'까지 판단한다.",
    persona: "결론은 통과 아니면 반려. 반려할 때는 고칠 곳을 줄 단위로 짚는다.",
    harsh: 5, auditor: false,
    look: { skin: 0, hair: 3, style: 2, suit: 3, acc: 0 },
  },
  {
    id: "h-audit", name: "오정우", title: "감사팀장", short: "감사",
    role: "팀 전체가 잘 굴러가는지 감사한다. 팀원들 말이 서로 모순되거나, 틀린 정보가 돌고 있거나, 원준 님의 프로필과 다른 내용이 쓰이면 잡아낸다. 회의에서는 마지막에 감사 판정을 낸다.",
    persona: "누구 편도 아니다. 근거가 약한 주장은 직급과 상관없이 지적한다. 같은 실수가 반복되면 구조를 고치라고 말한다.",
    harsh: 5, auditor: true,
    look: { skin: 1, hair: 4, style: 4, suit: 5, acc: 3 },
  },
  {
    id: "h-sec", name: "서윤", title: "비서", short: "비서", secretary: true,
    role: "원준 님 옆에서 매일 사회, 경제, AI 이슈를 전하고, 원준 님에 대해 질문해서 프로필을 채우고, 부탁을 들어준다. 다른 팀이 할 일이면 그 팀에 넘기자고 제안한다.",
    persona: "편하게 반말로 말하는 친구 같은 비서. 하지만 정보는 정확하게, 날짜와 출처를 챙긴다.",
    harsh: 2, auditor: false,
    look: { skin: 0, hair: 2, style: 2, suit: 6, acc: 0 },
  },
];

// What the team knows about 원준. Every prompt carries it; the secretary fills gaps.
const PROFILE_FIELDS = [
  ["basics", "기본 정보"],
  ["goals", "목표 직무와 회사"],
  ["experience", "경력과 활동"],
  ["content", "만든 콘텐츠와 채널"],
  ["skills", "자격과 툴"],
  ["materials", "지원 자료 현황"],
  ["person", "나라는 사람"],
  ["constraints", "조건과 일정"],
  ["notes", "대화에서 알게 된 것"],
];
const DEFAULT_PROFILE = {
  name: "원준",
  basics: "2000년생. 경기대학교 소프트웨어경영학전공 4학년, 마지막 학기(12학점 수강 중). 졸업 예정 2027년 2월, 유예하면 2027년 8월. 서울, 경기, 인천에서 일하고 싶음.",
  goals: "희망 직무: AI 영상 크리에이터, AI 비주얼 크리에이터, 광고 영상 제작자, AI 관련 PM, 방송국 PD.\n희망 회사: 방송사, 인하우스, 외주 제작사, AI 미디어 회사, AI 스타트업.\n목표 시기: 2027년 초, 늦어도 2027년 여름 전 취업.",
  experience: "방송 아르바이트. 핸드볼, 골프장 등 스포츠 현장 아르바이트. 봉사활동 약 80시간(아름다운가게).\n교내 야구 중앙동아리: 선수, 회장, 미디어 팀장.\n주식 동아리: 미디어·홍보팀 팀장. 하나증권과 함께한 가치투자 대회 운영위원(미디어 홍보, 포스터 제작, 주문 발주).\n프로젝트: AI 영상 제작, 수업에서 AI 홈페이지 제작, AI로 데이터 분석, 개인 프로젝트.\n공모전: 네이버 AI 영상 공모전 출품(심사 중).",
  content: "AI 쇼츠, AI 공모전 영상, AI 광고 영상 제작. 3분 단편영화와 AI 광고·영상 추가 제작 예정.\n경제·라이프스타일 계정 운영(팔로워 약 2,000명). AI 영상 작업물 계정(제작 과정, 느낀 점, 교훈). 직접 찍은 사진 계정. 야구 동아리·주식 동아리 계정 운영.",
  skills: "자격: 운전면허 1종, 토익스피킹 IH.\n툴: 프리미어 프로, 캡컷, 힉스필드, 블렌더, Claude, Claude Code, ChatGPT, Codex. Seedance, Kling 등 영상 생성 도구의 장단점과 쓰임새를 파악하고 있음.",
  materials: "포트폴리오 제작 중. 이력서 제작 중. 자기소개서는 아직 확인 안 됨.",
  person: "깊게 탐구하고 실제로 실행하는 것을 좋아함. 관심사: 영화, 광고, 스포츠.\n하고 싶은 이야기: 사람이 사람에게 전하는 이야기를 AI라는 새로운 횃불로 따뜻하게 전하고 싶다.\n강점과 약점: 비서와 대화하며 채울 예정.",
  constraints: "취업 준비에 일주일에 약 4일 사용 가능. 마지막 학기 수강 중(12학점). 돈은 나중에 예산을 정할 수 있음.\n비서 이슈 브리핑: 매일 아침 9시. 비서는 편하게 말해도 됨.",
  notes: "",
};

const SAMPLE_AGENDAS = [
  "졸업 전까지 AI 광고 영상 3편과 3분 단편영화로 포트폴리오를 만들고, 2027년 상반기 공채에 지원한다.",
  "AI 영상 작업물 계정을 포트폴리오의 중심으로 삼고, 매주 1편씩 제작 과정을 올린다.",
  "방송국 PD 공채와 AI 스타트업 수시 채용 중 어디에 먼저 집중할지 정한다.",
];

// The demo script answers SAMPLE_AGENDAS[0] only. Lines are written for the default roster;
// with an edited roster they are spoken by heads in order.
const DEMO = {
  agenda: SAMPLE_AGENDAS[0],
  briefs: [
    { stance: "조건부", score: 55, say: "방향은 맞습니다. 다만 AI 광고 3편이 모두 비슷하면 1편으로 보입니다. 하나는 실제 브랜드를 가정한 광고, 하나는 공모전용, 하나는 스포츠 소재로 갈래를 나누자고 제안합니다. 마감은 1편당 3주로 잡겠습니다.", number: "3편 x 3주 = 9주 (추정)", risk: "3편이 비슷해 보일 위험" },
    { stance: "조건부", score: 50, say: "활동은 많은데 숫자가 없습니다. 야구 동아리 회장 때 몇 명을 이끌었는지, 계정 팔로워가 얼마나 늘었는지가 비어 있습니다. 새 영상을 만드는 것보다 이미 한 활동에 숫자를 붙이는 게 먼저입니다.", number: "기록할 활동 7개 중 숫자 있는 것 1개", risk: "성과 숫자가 없음" },
    { stance: "찬성", score: 62, say: "만들 수 있습니다. 30초 광고 1편에 Seedance 클립 6개, 다시 뽑기 포함 약 250크레딧이 듭니다. 지금 잔액으로는 1편도 부족하니 처음 1편은 이미지와 음성 위주로 만들어 크레딧을 아끼겠습니다.", number: "광고 1편 약 250크레딧 (추정)", risk: "크레딧 부족" },
    { stance: "반대", score: 38, say: "인사 담당자 입장에서 'AI로 영상 만들 줄 안다'는 이제 차별점이 아닙니다. 왜 이 회사에 원준 님이 필요한지 한 문장으로 보여 주는 작품이 없습니다. 방송사는 기획력, AI 스타트업은 속도와 도구 이해를 봅니다. 3편 모두 같은 회사에 낼 수는 없습니다.", number: "지원처별로 보여 줄 작품 1편씩 필요", risk: "지원처별 맞춤이 없음" },
    { stance: "조건부", score: 52, say: "최근 광고 업계는 AI 영상을 쓰되 사람이 만든 기획과 연출을 더 봅니다(추정, 확인 필요). 그래서 결과물만이 아니라 기획서와 제작 과정을 같이 보여 주는 게 유리합니다.", number: "제작 과정 공개 포트폴리오 (추세, 확인 필요)", risk: "업계 기준이 빨리 바뀜" },
    { stance: "조건부", score: 48, say: "지금 계획서에는 '횟불' 같은 오탈자가 있으면 바로 감점입니다. 그리고 완성 기준이 없습니다. 무엇이 되면 1편이 끝난 건지 정해야 검수할 수 있습니다.", number: "완성 기준 0개", risk: "끝났는지 판단할 기준이 없음" },
  ],
  clashes: [
    { a: 3, t: 2, attack: "실행팀장님, 250크레딧짜리 광고 1편이 서류에서 몇 초 보이는지 아십니까? 인사 담당자는 첫 5초만 봅니다. 비싼 장면은 맨 앞에 와야 합니다.", defense: "맞습니다. 첫 5초에 가장 공들인 장면을 넣고, 뒷부분은 이미지 위주로 줄이겠습니다.", damage: 12, verdict: "공격 유효" },
    { a: 1, t: 0, attack: "기획팀장님은 새 작품 3편을 말하는데, 이미 한 활동을 정리하는 시간은 계획에 없습니다. 둘 다 하면 주 4일로는 모자랍니다.", defense: "정리 작업을 첫 2주에 먼저 넣고, 새 작품은 2편으로 줄이겠습니다.", damage: 10, verdict: "공격 유효" },
    { a: 5, t: 3, attack: "분석팀장님 말대로 지원처별로 1편씩이면, 지원처를 먼저 정해야 합니다. 그 결정이 빠져 있습니다.", defense: "인정합니다. 다음 회의 안건으로 지원처 우선순위를 정하겠습니다.", damage: 6, verdict: "반반" },
  ],
  audit: {
    say: "이 계획은 만드는 데만 집중하고, 누구에게 보여 줄지는 비어 있습니다. 활동은 충분히 많습니다. 부족한 건 숫자와 지원처별 맞춤입니다. 크레딧도 지금 잔액으로는 광고 1편도 어렵습니다.",
    probability: 41,
    verdict: "조건부 승인",
    conditions: ["첫 2주는 새 작품 대신 기존 활동 7개에 숫자를 붙인다", "지원처를 방송사, 광고 회사, AI 스타트업 중 2곳으로 좁힌다", "작품마다 '완성 기준' 3줄을 먼저 쓴다"],
    killCriteria: ["4주 안에 작품 1편도 완성 기준을 통과하지 못하면 계획을 다시 짠다", "크레딧이 작품 1편당 300을 넘으면 이미지 위주로 바꾼다"],
    biases: "실행할 수 있다는 자신감이 누가 볼지에 대한 고민을 덮었습니다.",
  },
};
