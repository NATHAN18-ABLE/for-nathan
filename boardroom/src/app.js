// ---------------------------------------------------------------------------
// 작전 회의실: scene, meeting engine, AI bridge, roster editor, minutes.
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const clone = (v) => JSON.parse(JSON.stringify(v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const S = {
  company: clone(DEFAULT_COMPANY),
  heads: clone(DEFAULT_HEADS),
  reality: clone(DEFAULT_REALITY),
  mcp: null,
  tasks: [],
  reports: [],
  openReport: null,
  editTask: null,
  writing: new Set(),
  tier: "default",
  autoplay: true,
  paused: false,
  mode: "checking", // checking | claude | api | demo
  apiKey: "",
  sample: null,
  db: null,
  uid: null,
  downloads: null,
  m: null, // the running meeting
  speaker: null,
  thinking: new Set(),
  picked: null,
  flash: 0,
  editId: null,
  minutes: [],
  openMinute: null,
};

const ABORT = { abort: true };
const STANCES = ["찬성", "조건부", "반대"];
const HARSH = [
  "",
  "부드럽게 말하되, 판단 자체는 정확하게.",
  "정중하지만 분명하게. 문제는 문제라고 말한다.",
  "직설적으로. 완충 표현은 최소화한다.",
  "냉정하게. 칭찬 없이 결론과 근거부터 말한다.",
  "가장 냉혹하게. 위로나 완충 표현 없이 결론부터 말하고, 약한 근거는 바로 찌른다.",
];
const HARSH_LABEL = ["", "온화", "정중", "직설", "냉정", "냉혹"];
const TIER_MODEL = { quick: "claude-haiku-5-5", default: "claude-sonnet-5-5", complex: "claude-opus-5-5" };
// Anthropic API list prices, USD per million tokens (input / output). Thinking is billed as output.
const TIER_PRICE = { quick: [0.1, 0.5], default: [2, 10], complex: [4, 20] };
const TIER_EFFORT = { quick: "low", default: "medium", complex: "high" };
const WON_PER_USD = 1400;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DECISION = { approve: "승인", hold: "보류", reject: "기각" };
const CEO = { id: "ceo", name: "CEO", title: "최종 결정권자", look: CEO_LOOK };
const EXT_AUDITOR = { id: "ext-audit", name: "외부 감사관", title: "감사", short: "감사", role: "회의 전체를 감사하고 성공 확률과 조건을 낸다.", persona: "누구 편도 아니다. 근거가 약한 주장을 지적한다.", harsh: 5, auditor: true, look: EXT_AUDIT_LOOK };

// ---------------------------------------------------------------------------
// Storage: the viewer's private db on claude.ai, localStorage elsewhere.
// ---------------------------------------------------------------------------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const Store = {
  rosterRef() { return S.db.doc(`data/users/${S.uid}/roster`); },
  minutesCol() { return S.db.collection(`data/users/${S.uid}/minutes/list`); },
  async loadRoster() {
    if (S.db) {
      try {
        const snap = await this.rosterRef().get();
        if (snap.exists) return snap.data();
      } catch {}
      return null;
    }
    return LS.get("boardroom.roster", null);
  },
  async saveRoster() {
    const body = { company: S.company, heads: S.heads, reality: S.reality, tier: S.tier, updatedAt: new Date().toISOString() };
    if (S.db) {
      try { await this.rosterRef().set(clone(body)); return true; } catch { return false; }
    }
    return LS.set("boardroom.roster", body);
  },
  async listMinutes() {
    if (S.db) {
      try {
        const q = await this.minutesCol().orderBy("at", "desc").limit(60).get();
        return q.docs.map((d) => ({ ...d.data(), id: d.id }));
      } catch { return []; }
    }
    return LS.get("boardroom.minutes", []);
  },
  async addMinute(rec) {
    if (S.db) {
      try { await this.minutesCol().doc(rec.id).set(clone(rec)); return true; } catch { return false; }
    }
    const all = LS.get("boardroom.minutes", []);
    all.unshift(rec);
    return LS.set("boardroom.minutes", all.slice(0, 60));
  },
  async deleteMinute(id) {
    if (S.db) {
      try { await this.minutesCol().doc(id).delete(); return true; } catch { return false; }
    }
    return LS.set("boardroom.minutes", LS.get("boardroom.minutes", []).filter((m) => m.id !== id));
  },
};

let saveTimer = 0;
function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const ok = await Store.saveRoster();
    $("staffNote").textContent = ok ? "저장했습니다." : "저장하지 못했습니다. 이 화면을 닫으면 변경 사항이 사라집니다.";
    $("staffNote").className = ok ? "note" : "note err";
  }, 600);
}

// ---------------------------------------------------------------------------
// AI bridge: claude.ai sample, local API key, or nothing (demo script).
// ---------------------------------------------------------------------------
function parseLooseJSON(text) {
  const t = String(text || "").trim();
  try { return JSON.parse(t); } catch {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = t.search(/[[{]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  throw { code: "invalid_json", message: "no json" };
}

function newMeter() {
  return { calls: 0, input: 0, output: 0, tier: S.tier, mode: S.mode };
}
function meterCost(mt) {
  if (!mt || mt.mode !== "api") return null;
  const [pi, po] = TIER_PRICE[mt.tier] || TIER_PRICE.default;
  return (mt.input * pi + mt.output * po) / 1e6;
}
function meterLine(mt) {
  if (!mt || !mt.calls) return "";
  if (mt.mode === "claude") return `Claude 호출 ${mt.calls}번. claude.ai 요금제 사용량에서 차감되고 따로 돈이 나가지 않습니다.`;
  if (mt.mode !== "api") return "";
  const usd = meterCost(mt);
  return `API 호출 ${mt.calls}번, 입력 ${mt.input.toLocaleString()} · 출력 ${mt.output.toLocaleString()} 토큰, 약 $${usd.toFixed(3)} (약 ${Math.round(usd * WON_PER_USD).toLocaleString()}원)`;
}

const AI = {
  async json(prompt, signal, meter) {
    if (S.mode === "claude" && S.sample) {
      const r = await S.sample.json(prompt, { signal, modelTier: S.tier, cache: false });
      if (meter) meter.calls++;
      return r;
    }
    if (S.mode === "api" && S.apiKey) {
      let res;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": S.apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          // Thinking shares max_tokens with the answer, so leave plenty of room or long answers get cut off.
          body: JSON.stringify({
            model: TIER_MODEL[S.tier] || TIER_MODEL.default,
            max_tokens: 16000,
            output_config: { effort: TIER_EFFORT[S.tier] || "medium" },
            messages: [{ role: "user", content: prompt }],
          }),
        });
      } catch (e) {
        if (signal?.aborted) throw { code: "cancelled" };
        throw { code: "network", message: String(e) };
      }
      if (!res.ok) {
        const code = res.status === 401 || res.status === 403 ? "bad_key" : res.status === 429 ? "rate_limited" : res.status === 404 ? "bad_model" : "upstream_error";
        throw { code, message: await res.text().catch(() => "") };
      }
      const j = await res.json();
      if (meter && j.usage) {
        meter.calls++;
        meter.input += j.usage.input_tokens || 0;
        meter.output += j.usage.output_tokens || 0;
      }
      if (j.stop_reason === "refusal") throw { code: "refused" };
      const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      return parseLooseJSON(text);
    }
    throw { code: "no_ai" };
  },
};

function errCopy(e) {
  switch (e && e.code) {
    case "not_granted": return "Claude 사용이 허용되지 않았습니다. 데모 대본으로 보거나, 내 컴퓨터에서 API 키로 실행하세요.";
    case "sampling_disabled": return "이 계정에서는 Claude를 쓸 수 없습니다. 데모 대본으로 보거나 API 키로 실행하세요.";
    case "rate_limited": return "Claude 사용량 한도에 걸렸습니다. 잠시 뒤에 다시 시작하세요.";
    case "session_expired": return "claude.ai 로그인이 만료되었습니다. 다시 로그인한 뒤 시작하세요.";
    case "bad_key": return "API 키가 올바르지 않습니다. 인사 관리의 AI 연결에서 키를 확인하세요.";
    case "bad_model": return "선택한 모델을 쓸 수 없습니다. 생각 깊이를 바꿔 보세요.";
    case "network": return "Anthropic API에 연결하지 못했습니다. 인터넷 연결을 확인하세요.";
    case "invalid_json": return "답변 형식이 깨져서 이 발언은 건너뜁니다.";
    case "refused": return "Claude가 이 안건에 답하지 않았습니다. 안건 표현을 바꿔 보세요.";
    default: return "연결이 끊겼습니다. 잠시 뒤에 다시 시도하세요.";
  }
}
const FATAL = new Set(["not_granted", "sampling_disabled", "rate_limited", "session_expired", "bad_key", "bad_model", "network", "no_ai", "not_declared", "capability_disabled"]);

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const RULES = `[말하는 방식]
- 쉬운 말로 한다. 중학생도 바로 알아듣게 쓴다. 전문용어와 영어 약어는 피하고, 꼭 써야 하면 괄호 안에 쉬운 말로 풀어 준다.
- 문장은 짧게. 한 문장에 한 가지 내용만.
- 회의 말투의 존댓말. 이모지, 마크다운, 목록 기호 금지.

[판단 규칙]
- 아첨 금지. CEO의 아이디어라도 칭찬으로 시작하지 않는다. "좋은 아이디어입니다" 같은 말은 쓰지 않는다.
- 판단마다 근거를 대고 숫자를 최소 1개 쓴다(크레딧, 시간, 확률, 개수). 확인되지 않은 숫자에는 "(추정)"을 붙인다.
- 일반론과 교과서적인 조언은 금지. 이 안건에만 해당하는 구체적인 내용만 말한다.
- 문제가 있으면 돌려 말하지 않는다. 실행이 불가능하면 불가능하다고 말한다.
- 모르는 것은 모른다고 하고, 무엇을 확인해야 하는지 말한다.

[현실 기준: 반드시 지킨다]
- 이 회사는 큰 회사처럼 팀장을 둔 역할극이다. 실제로 일하는 사람은 아래 [실제 자원]에 적힌 사람뿐이고, 팀장인 너희는 조언만 한다.
- 사람을 뽑거나, 외주를 주거나, 사무실과 장비를 사는 계획은 세우지 않는다. 수백만 원, 수천만 원 단위 예산은 꺼내지 않는다.
- 비용은 먼저 힉스필드 크레딧으로 계산한다. [실제 자원]의 실제 단가를 쓰고, 지금 잔액과 비교해서 모자라면 몇 크레딧이 모자라는지 말한다.
- 원화는 크레딧 1개 가격이 주어졌을 때만 환산한다. 한 달 예산이 정해져 있지 않으면 지금 잔액과 100크레딧 충전 1번 안에서 계획한다.
- 시간은 CEO 1명이 직접 쓰는 시간으로 계산한다.`;

function fmtCredits(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function realityBlock() {
  const r = S.reality || DEFAULT_REALITY;
  const hf = r.hf || {};
  const L = ["[실제 자원: 모든 숫자는 이 안에서]"];
  L.push(`- 실제로 일하는 사람: ${r.team || "CEO 1명"}`);
  L.push(`- 주당 작업 시간: ${r.hours ? r.hours + "시간" : "정해지지 않음 (물어보기 전에는 주 10시간으로 가정하고, 가정이라고 말한다)"}`);
  L.push(`- 한 달 예산: ${r.budget ? r.budget + "원" : "정해지지 않음 (지금 잔액 + 100크레딧 충전 1번 안에서 계획)"}`);
  L.push(`- 쓰는 도구: ${r.tools || "힉스필드, Claude"}`);
  if (hf.credits != null) L.push(`- 힉스필드: ${String(hf.plan || "").toUpperCase() || "?"} 요금제, 잔액 ${fmtCredits(hf.credits)}크레딧 (${hf.at ? fmtDate(hf.at) : "날짜 모름"} 기준)`);
  for (const c of hf.costs || []) L.push(`- 실제 단가: ${c.name} 1번에 평균 ${fmtCredits(c.avg)}크레딧 (최소 ${fmtCredits(c.min)}, 최대 ${fmtCredits(c.max)}, 최근 ${c.n}번)`);
  if (hf.topup) L.push(`- 충전: ${hf.topup}`);
  if (r.creditWon) L.push(`- 크레딧 1개 = ${r.creditWon}원`);
  return L.join("\n");
}
function companyLine() {
  return `[회사] ${S.company.name}: ${S.company.desc}\n\n${realityBlock()}`;
}
function headLine(h) {
  return `${h.title} ${h.name} (id: ${h.id}) | 담당: ${h.role} | 관점: ${h.persona} | 말투: ${HARSH[h.harsh] || HARSH[4]}`;
}
function transcript(m) {
  return m.log.map((l) => `- ${l}`).join("\n") || "- (아직 발언 없음)";
}

function briefPrompt(m, h) {
  return `${companyLine()}

너는 이 회사의 ${h.title} ${h.name}이다. 지금은 CEO가 주재하는 작전 회의 1라운드, 브리핑이다.
너의 담당: ${h.role}
너의 관점: ${h.persona}
말투: ${HARSH[h.harsh] || HARSH[4]}
다른 팀장들의 의견은 아직 모른다. 분위기에 맞추지 말고 너의 전문 분야에서 독립적으로 판단하라.

${RULES}

[안건]
${m.agenda}
${m.ceo.length ? `\n[CEO가 회의 중에 한 말]\n${m.ceo.map((c) => "- " + c).join("\n")}\n` : ""}
JSON 객체 하나로만 답하라:
{"stance":"찬성" 또는 "조건부" 또는 "반대","score":0~100 정수(이 안건이 지금 계획 그대로 성공할 가능성),"say":"2~4문장, 220자 이내의 발언","number":"핵심 숫자 한 줄, 40자 이내","risk":"가장 큰 약점 한 줄, 40자 이내"}`;
}

function clashPrompt(m, n) {
  const heads = m.speakers.map(headLine).join("\n");
  const briefs = m.speakers
    .filter((h) => m.briefs[h.id])
    .map((h) => {
      const b = m.briefs[h.id];
      return `[${h.id}] ${h.title} ${h.name} | ${b.stance} ${b.score}점 | ${b.say} (핵심 숫자: ${b.number} / 약점: ${b.risk})`;
    })
    .join("\n");
  return `${companyLine()}

작전 회의 2라운드, 교전이다. 팀장들이 서로의 브리핑에서 가장 약한 주장을 공격하고, 공격받은 팀장이 방어한다.

[참석 팀장]
${heads}

[안건]
${m.agenda}

[1라운드 브리핑]
${briefs}

[지금까지 회의 기록]
${transcript(m)}

[교전 규칙]
- 교전은 정확히 ${n}건. 한 팀장이 공격자로 나서는 것은 최대 2번.
- 공격자는 자기 전문 분야를 근거로, 상대 발언의 구체적인 문장이나 숫자를 짚는다.
- 찬성 의견과 낙관적인 숫자를 우선 공격한다. 모두가 찬성했다면 모두가 놓친 맹점을 찾는다.
- 방어는 정직해야 한다. 구멍이 진짜면 인정하고 수정안을 낸다. 억지 방어 금지.
- 각 팀장의 말투 설정을 지킨다.
${RULES}

JSON 배열 하나로만 답하라. attacker와 target에는 위의 id를 그대로 쓴다:
[{"attacker":"id","target":"id","attack":"150자 이내","defense":"150자 이내","damage":5~30 정수(드러난 문제의 심각도),"verdict":"공격 유효" 또는 "반반" 또는 "방어 성공"}]`;
}

function auditPrompt(m, a) {
  return `${companyLine()}

너는 이 회사의 ${a.title} ${a.name}이다. 작전 회의의 마지막 순서인 감사 판정을 내린다.
너의 담당: ${a.role}
너의 관점: ${a.persona}
말투: ${HARSH[a.harsh] || HARSH[5]}
너는 어느 팀장 편도 아니다. 회의에서 나온 낙관 편향, 근거 없는 숫자, 방어하지 못한 약점을 기준으로 판정하라.
지금 회의 분위기로 본 생존율은 ${m.hp}%다. 이 숫자에 끌려가지 말고 독립적으로 판단하라.

${RULES}

[안건]
${m.agenda}

[회의 기록]
${transcript(m)}

JSON 객체 하나로만 답하라:
{"say":"판정 발언 2~4문장, 240자 이내","probability":0~100 정수(지금 계획대로 실행했을 때 성공 확률),"verdict":"승인 권고" 또는 "조건부 승인" 또는 "보류 권고" 또는 "기각 권고","conditions":["승인하려면 반드시 바뀌어야 할 것, 최대 3개, 각 60자 이내"],"killCriteria":["이 숫자가 나오면 중단한다는 기준, 최대 2개, 각 50자 이내"],"biases":"이 회의에서 보인 편향 한 줄, 50자 이내"}`;
}

function replyPrompt(m, text, target) {
  const heads = m.speakers.concat(m.auditor && m.auditor !== EXT_AUDITOR ? [m.auditor] : []);
  return `${companyLine()}

작전 회의 중에 CEO가 끼어들어 발언했다. ${target ? `CEO가 ${target.title} ${target.name}(id: ${target.id})을 지목했다. 그 팀장이 답한다.` : "이 발언과 가장 관련 있는 팀장 한 명이 답한다."}
CEO 의견에 동의할 의무는 없다. CEO가 틀렸으면 근거를 들어 반박하라. 맞으면 무엇이 바뀌는지 구체적으로 말하라.

[참석 팀장]
${heads.map(headLine).join("\n")}

[안건]
${m.agenda}

[지금까지 회의 기록]
${transcript(m)}

[CEO 발언]
${text}

${RULES}

JSON 객체 하나로만 답하라. speaker에는 위의 id를 그대로 쓴다:
{"speaker":"id","say":"2~3문장, 200자 이내","stance":"찬성" 또는 "조건부" 또는 "반대"}`;
}

// ---------------------------------------------------------------------------
// Validation of model output
// ---------------------------------------------------------------------------
const str = (v, n) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, n);
function normStance(s) {
  const t = str(s, 10);
  if (t.includes("반대")) return "반대";
  if (t.includes("조건")) return "조건부";
  if (t.includes("찬성")) return "찬성";
  return "조건부";
}
function findHead(list, key) {
  const k = str(key, 40);
  return list.find((h) => h.id === k) || list.find((h) => k && (k.includes(h.name) || k.includes(h.title)));
}
function cleanBrief(r) {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const say = str(r.say, 320);
  if (!say) throw { code: "invalid_json" };
  return { stance: normStance(r.stance), score: clamp(Math.round(Number(r.score) || 50), 0, 100), say, number: str(r.number, 60), risk: str(r.risk, 60) };
}
function cleanClashes(r, speakers, n) {
  const arr = Array.isArray(r) ? r : Array.isArray(r?.clashes) ? r.clashes : [];
  const out = [];
  for (const c of arr) {
    const a = findHead(speakers, c.attacker), t = findHead(speakers, c.target);
    if (!a || !t || a === t) continue;
    const attack = str(c.attack, 220), defense = str(c.defense, 220);
    if (!attack) continue;
    const v = str(c.verdict, 10);
    const verdict = v.includes("방어") ? "방어 성공" : v.includes("반") ? "반반" : "공격 유효";
    out.push({ a, t, attack, defense, damage: clamp(Math.round(Number(c.damage) || 10), 5, 30), verdict });
    if (out.length >= n) break;
  }
  return out;
}
function cleanAudit(r) {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const v = str(r.verdict, 10);
  const verdict = v.includes("기각") ? "기각 권고" : v.includes("보류") ? "보류 권고" : v.includes("조건") ? "조건부 승인" : v.includes("승인") ? "승인 권고" : "보류 권고";
  return {
    say: str(r.say, 340) || "판정 발언을 받지 못했습니다.",
    probability: clamp(Math.round(Number(r.probability) || 0), 0, 100),
    verdict,
    conditions: (Array.isArray(r.conditions) ? r.conditions : []).map((x) => str(x, 90)).filter(Boolean).slice(0, 3),
    killCriteria: (Array.isArray(r.killCriteria) ? r.killCriteria : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 2),
    biases: str(r.biases, 80),
  };
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const scene = $("scene");
const sg = scene.getContext("2d");
const buf = document.createElement("canvas");
buf.width = W; buf.height = H;
const g = buf.getContext("2d");
let room = null;
let tick = 0;
const seatState = new Map(); // id -> {lift, blinkAt}

function activeHeads() {
  return S.m ? S.m.heads : S.heads;
}

function layoutSeats() {
  const heads = activeHeads();
  const auditor = heads.find((h) => h.auditor) || null;
  const others = heads.filter((h) => h !== auditor);
  const top = others.filter((_, i) => i % 2 === 0);
  const bot = others.filter((_, i) => i % 2 === 1);
  const seats = [];
  const spread = (row, y, facing) => {
    const n = row.length;
    const span = TABLE.w - 40;
    row.forEach((h, i) => {
      const cx = Math.round(TABLE.x + 20 + (n === 1 ? span / 2 : (span * i) / (n - 1)));
      seats.push({ h, x: cx - 8, y, facing, row: facing === "front" ? "top" : "bot" });
    });
  };
  spread(top, 74, "front");
  spread(bot, 138, "back");
  seats.push({ h: CEO, x: 64, y: 100, facing: "front", row: "ceo" });
  if (auditor) seats.push({ h: auditor, x: 304, y: 100, facing: "front", row: "aud" });
  return seats;
}
let SEATS = [];
function relayout() {
  SEATS = layoutSeats();
}

function seatFor(id) {
  return SEATS.find((s) => s.h.id === id);
}

function stanceOf(id) {
  return S.m && S.m.briefs[id] ? S.m.briefs[id].stance : null;
}

function drawScreen() {
  const phaseLabel = {
    idle: "대기", brief: "1R 브리핑", clash: "2R 교전", audit: "감사 판정", decide: "CEO 결재", done: "결재 완료",
  }[S.m ? S.m.phase : "idle"];
  g.save();
  g.beginPath();
  g.rect(138, 8, 108, 42);
  g.clip();
  rect(g, 138, 8, 108, 42, S.flash > 0 ? "#2a0f1a" : "#0b2830");
  g.font = "12px Galmuri11";
  g.textBaseline = "top";
  g.fillStyle = S.m && S.m.phase === "done" ? deciColor(S.m.decision?.k) : "#3fd6c4";
  g.fillText(phaseLabel, 143, 11);
  const sp = S.speaker && (seatFor(S.speaker) || {}).h;
  const line2 = sp ? `${sp.title} ${sp.name}` : S.m ? S.m.agenda : "안건 미정";
  g.fillStyle = "#a3e9df";
  g.fillText(fit(line2, 100), 143, 25);
  const hpTxt = S.m && S.m.hp != null ? `생존율 ${S.m.hp}%` : clock();
  g.fillStyle = "#6fb5ad";
  g.fillText(hpTxt, 143, 37);
  g.fillStyle = "rgba(0,0,0,0.18)";
  for (let y = 9; y < 50; y += 2) g.fillRect(138, y, 108, 1);
  g.restore();
}
function deciColor(k) {
  return k === "approve" ? "#3fd6c4" : k === "hold" ? "#ffb547" : "#ff5468";
}
function clock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fit(text, maxW) {
  let t = text;
  if (g.measureText(t).width <= maxW) return t;
  while (t.length > 1 && g.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function drawPlate(x, y, text, color) {
  g.font = "8px Galmuri7";
  g.textBaseline = "top";
  const w = Math.ceil(g.measureText(text).width) + 6;
  const px = Math.round(x - w / 2);
  rect(g, px, y, w, 11, "#060a18");
  rect(g, px + 1, y + 1, w - 2, 9, color);
  g.fillStyle = "#eef1ff";
  g.fillText(text, px + 3, y + 1);
}

function personOpts(s) {
  let st = seatState.get(s.h.id);
  if (!st) { st = { lift: 0, blinkAt: tick + 40 + ((Math.random() * 120) | 0) }; seatState.set(s.h.id, st); }
  const speaking = S.speaker === s.h.id;
  const target = speaking ? 5 : 0;
  st.lift = reduceMotion.matches ? target : st.lift + (target - st.lift) * 0.25;
  let blink = false;
  if (tick >= st.blinkAt) {
    blink = true;
    if (tick >= st.blinkAt + 3) st.blinkAt = tick + 60 + ((Math.random() * 140) | 0);
  }
  const typing = speaking && Dialogue.typing;
  return {
    lift: Math.round(st.lift),
    o: { facing: s.facing, blink: reduceMotion.matches ? false : blink, talk: typing && (tick >> 2) % 2 === 0, frown: speaking && S.m?.phase === "clash" },
  };
}

function drawPerson2(s) {
  const { lift, o } = personOpts(s);
  drawPerson(g, s.x, s.y - lift, s.h.look, o);
}

function draw() {
  if (!room) return;
  g.imageSmoothingEnabled = false;
  g.drawImage(room, 0, 0);
  drawScreen();

  // table light on the floor
  g.fillStyle = "rgba(63, 214, 196, 0.08)";
  g.beginPath();
  g.ellipse(TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h / 2 + 6, TABLE.w / 2 + 34, TABLE.h / 2 + 30, 0, 0, Math.PI * 2);
  g.fill();

  // spotlight on the speaker
  const sp = S.speaker && seatFor(S.speaker);
  if (sp) {
    const cx = sp.x + 8;
    g.fillStyle = sp.h.id === "ceo" ? "rgba(255, 196, 110, 0.10)" : "rgba(220, 230, 255, 0.09)";
    g.beginPath();
    g.moveTo(cx - 5, 0);
    g.lineTo(cx + 5, 0);
    g.lineTo(cx + 20, sp.y + 30);
    g.lineTo(cx - 20, sp.y + 30);
    g.closePath();
    g.fill();
  }

  const flash = S.flash > 0 && (S.flash >> 2) % 2 === 0;
  const top = SEATS.filter((s) => s.row === "top");
  const bot = SEATS.filter((s) => s.row === "bot");
  const ends = SEATS.filter((s) => s.row === "ceo" || s.row === "aud");

  for (const s of top) drawChairBack(g, s.x + 8, s.y + 7, "#2a3366");
  for (const s of top) drawPerson2(s);
  drawTable(g, flash);
  for (const s of top) drawPlate(s.x + 8, TABLE.y + 1, s.h.short || s.h.title.slice(0, 3), "#1c2b66");

  for (const s of ends) {
    const ceo = s.row === "ceo";
    drawChairBack(g, s.x + 8, s.y + 6, ceo ? "#7a4a12" : "#3b2c5c");
    if (ceo) rect(g, s.x, s.y + 6, 16, 1, "#ffb547");
    drawPerson2(s);
    drawPlate(s.x + 8, s.y + 26, ceo ? "CEO" : s.h.short || "감사", ceo ? "#8a5410" : "#3b2c5c");
  }

  for (const s of bot) {
    drawPerson2(s);
    drawChairBack(g, s.x + 8, s.y + 15, "#2a3366");
    drawPlate(s.x + 8, s.y + 31, s.h.short || s.h.title.slice(0, 3), "#1c2b66");
  }

  // overlays: stance marks, thinking bubbles, cursors
  for (const s of SEATS) {
    const st = seatState.get(s.h.id);
    const lift = st ? Math.round(st.lift) : 0;
    const headTop = s.y - lift - (s.h.look.style === 3 ? 2 : 0);
    if (S.thinking.has(s.h.id)) drawBubble(g, s.x + 10, headTop - 11, tick);
    else if (!S.m && S.reports.some((r) => !r.read && r.headId === s.h.id)) drawEnvelope(g, s.x + 8, headTop - 10, reduceMotion.matches ? 0 : tick);
    else if (S.speaker !== s.h.id) {
      const stc = stanceOf(s.h.id);
      if (stc) drawStance(g, s.x + 8, headTop - 10, stc);
    }
    if (S.picked === s.h.id) drawCursor(g, s.x, headTop, 16, 22, 0, "#3fd6c4");
  }
  if (sp) {
    const st = seatState.get(sp.h.id);
    const lift = st ? Math.round(st.lift) : 0;
    drawCursor(g, sp.x, sp.y - lift, 16, 22, tick, "#ffb547");
    if (!S.thinking.has(sp.h.id)) drawArrow(g, sp.x + 8, sp.y - lift - 11, reduceMotion.matches ? 0 : tick, "#ffb547");
  }

  sg.imageSmoothingEnabled = false;
  sg.drawImage(buf, 0, 0, scene.width, scene.height);
}

let lastFrame = 0;
let rafId = 0;
function loop(ts) {
  rafId = requestAnimationFrame(loop);
  if (ts - lastFrame < 33) return; // ~30 fps is plenty for pixel art
  lastFrame = ts;
  tick++;
  if (S.flash > 0) S.flash--;
  draw();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else rafId = requestAnimationFrame(loop);
});

function fitCanvas() {
  const r = scene.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.ceil((r.width * dpr) / W));
  if (scene.width !== W * k) {
    scene.width = W * k;
    scene.height = H * k;
  }
  draw();
}
new ResizeObserver(fitCanvas).observe(scene);

scene.addEventListener("click", (e) => {
  const r = scene.getBoundingClientRect();
  const lx = ((e.clientX - r.left) / r.width) * W;
  const ly = ((e.clientY - r.top) / r.height) * H;
  const hit = SEATS.find((s) => s.h.id !== "ceo" && lx >= s.x - 2 && lx <= s.x + 18 && ly >= s.y - 4 && ly <= s.y + 26);
  const mail = hit && !S.m && S.reports.find((r) => !r.read && r.headId === hit.h.id);
  if (mail) { showView("work"); openReport(mail.id); return; }
  if (hit) pick(hit.h.id === S.picked ? null : hit.h.id);
  else Dialogue.advance();
});

function pick(id) {
  S.picked = id;
  const h = id && activeHeads().find((x) => x.id === id);
  $("targetTag").hidden = !h;
  if (h) $("targetName").textContent = `${h.title} ${h.name}`;
  renderUnits();
  if (h && S.m && !$("inMeeting").hidden) $("ceoMsg").focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Dialogue window
// ---------------------------------------------------------------------------
const Dialogue = {
  typing: false,
  full: "",
  shown: 0,
  skip: null,
  waiter: null,
  portraitTimer: 0,

  setWho(h, extra) {
    $("who").innerHTML = "";
    const name = document.createTextNode(h.id === "ceo" ? "CEO" : `${h.name} ${h.title}`);
    $("who").append(name);
    if (extra) {
      const sp = document.createElement("span");
      sp.textContent = extra;
      $("who").append(sp);
    }
    $("dlg").dataset.ceo = h.id === "ceo" ? "1" : "0";
    drawPortrait($("portrait"), h.look, { bg: h.id === "ceo" ? "#3a2810" : "#151e44" });
  },

  setMeta(items) {
    const box = $("meta");
    box.innerHTML = "";
    for (const it of items || []) {
      if (!it) continue;
      if (it.chip) {
        const c = document.createElement("span");
        c.className = "chip";
        c.dataset.s = it.chip;
        c.textContent = it.label || it.chip;
        box.append(c);
      } else {
        const s = document.createElement("span");
        s.textContent = it.k + " ";
        const b = document.createElement("b");
        b.textContent = it.v;
        s.append(b);
        box.append(s);
      }
    }
  },

  thinking(h, label) {
    this.setWho(h);
    $("say").textContent = label;
    $("say").classList.add("muted");
    $("skel").hidden = false;
    this.setMeta([]);
    $("dlg").classList.remove("done");
  },

  // Type the line, then wait for the reader (or the auto timer).
  async say(h, text, meta) {
    S.speaker = h.id;
    renderUnits();
    this.setWho(h);
    $("skel").hidden = true;
    $("say").classList.remove("muted");
    this.setMeta(meta);
    await this.type(text);
    await this.wait(text.length);
  },

  type(text) {
    this.full = text;
    this.shown = 0;
    $("dlg").classList.remove("done");
    const el = $("say");
    if (reduceMotion.matches) {
      el.textContent = text;
      return Promise.resolve();
    }
    this.typing = true;
    clearInterval(this.portraitTimer);
    const h = (seatFor(S.speaker) || {}).h;
    let mouth = false;
    if (h) this.portraitTimer = setInterval(() => { mouth = !mouth; drawPortrait($("portrait"), h.look, { talk: mouth, bg: h.id === "ceo" ? "#3a2810" : "#151e44" }); }, 130);
    return new Promise((resolve) => {
      let last = performance.now();
      const cps = 42;
      const step = (now) => {
        if (!this.typing) return;
        const add = Math.max(1, Math.floor(((now - last) / 1000) * cps));
        if (now - last >= 1000 / cps) {
          this.shown = Math.min(text.length, this.shown + add);
          last = now;
          el.textContent = text.slice(0, this.shown);
        }
        if (this.shown >= text.length) return finish();
        requestAnimationFrame(step);
      };
      const finish = () => {
        this.typing = false;
        this.skip = null;
        el.textContent = text;
        clearInterval(this.portraitTimer);
        if (h) drawPortrait($("portrait"), h.look, { bg: h.id === "ceo" ? "#3a2810" : "#151e44" });
        resolve();
      };
      this.skip = finish;
      requestAnimationFrame(step);
    });
  },

  wait(len) {
    $("dlg").classList.add("done");
    return new Promise((resolve) => {
      this.waiter = { resolve, len, timer: 0 };
      this.arm();
    });
  },

  arm() {
    const w = this.waiter;
    if (!w) return;
    clearTimeout(w.timer);
    if (S.autoplay && !S.paused) w.timer = setTimeout(() => this.release(), 1500 + w.len * 40);
  },

  release() {
    const w = this.waiter;
    if (!w) return;
    clearTimeout(w.timer);
    this.waiter = null;
    $("dlg").classList.remove("done");
    w.resolve();
  },

  advance() {
    if (this.typing && this.skip) this.skip();
    else this.release();
  },

  cancel() {
    this.typing = false;
    clearInterval(this.portraitTimer);
    if (this.waiter) { clearTimeout(this.waiter.timer); this.waiter = null; }
    $("dlg").classList.remove("done");
  },

  plain(h, text, meta) {
    this.cancel();
    S.speaker = null;
    this.setWho(h);
    $("skel").hidden = true;
    $("say").classList.remove("muted");
    $("say").textContent = text;
    this.setMeta(meta);
  },
};

$("dlg").addEventListener("click", () => Dialogue.advance());
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, button, [contenteditable]")) return;
  if ($("view-room").hidden) return;
  if (e.key === " " || e.key === "Enter") {
    if (!S.m) return;
    e.preventDefault();
    Dialogue.advance();
  }
});

// ---------------------------------------------------------------------------
// HP bar, banner, cut-in, stamp
// ---------------------------------------------------------------------------
function setHP(v, kind) {
  const hp = $("hp");
  if (v == null) {
    $("hpNum").textContent = "--";
    $("hpFill").style.transform = "scaleX(0)";
    $("hpGhost").style.transform = "scaleX(0)";
    hp.dataset.tier = "hi";
    return;
  }
  const prev = S.m && S.m.hpShown != null ? S.m.hpShown : 0;
  if (S.m) S.m.hpShown = v;
  $("hpNum").textContent = v + "%";
  $("hpFill").style.transform = `scaleX(${v / 100})`;
  $("hpGhost").style.transform = `scaleX(${v / 100})`;
  hp.dataset.tier = v >= 60 ? "hi" : v >= 35 ? "mid" : "low";
  if (kind === "hit" && v < prev) {
    hp.classList.remove("hit");
    void hp.offsetWidth;
    hp.classList.add("hit");
    S.flash = 12;
  }
}

function popDamage(n, heal) {
  const d = document.createElement("div");
  d.className = "dmg" + (heal ? " heal" : "");
  d.textContent = heal ? `+${n}` : `-${n}`;
  $("stage").append(d);
  setTimeout(() => d.remove(), 1200);
}

function banner(k, t) {
  const b = $("banner");
  $("bannerK").textContent = k;
  $("bannerT").textContent = t;
  b.classList.remove("go");
  void b.offsetWidth;
  b.classList.add("go");
  return sleep(1500);
}

async function cutIn(a, t) {
  const c = $("cutin");
  drawPortrait($("cutA"), a.look, { bg: "#5e1522", frown: true });
  drawPortrait($("cutB"), t.look, { bg: "#0e1640" });
  $("cutAName").textContent = `${a.name} ${a.title}`;
  $("cutBName").textContent = `${t.name} ${t.title}`;
  c.hidden = false;
  c.classList.remove("leave");
  c.classList.add("enter");
  void c.offsetWidth;
  c.classList.remove("enter");
  await sleep(1300);
  c.classList.add("leave");
  await sleep(200);
  c.hidden = true;
}

function showDoc(m) {
  $("docAgenda").textContent = m.agenda;
  const a = m.audit;
  $("docSig").textContent = a ? `감사 권고: ${a.verdict} · 생존율 ${m.hp}%` : `생존율 ${m.hp}%`;
  $("seal").textContent = "";
  $("seal").hidden = true;
  $("stampLayer").hidden = false;
  const doc = $("doc");
  doc.classList.add("enter");
  void doc.offsetWidth;
  doc.classList.remove("enter");
}

function slamSeal(k) {
  const s = $("seal");
  s.dataset.k = k;
  s.textContent = DECISION[k];
  s.hidden = false;
  s.classList.remove("slam");
  void s.offsetWidth;
  s.classList.add("slam");
}

// ---------------------------------------------------------------------------
// The meeting
// ---------------------------------------------------------------------------
function guard(p) {
  const m = S.m;
  return Promise.race([p, m.abortP]);
}
function alive(m) {
  if (!S.m || S.m !== m || m.aborted) throw ABORT;
}

function newMeeting(agenda) {
  const heads = clone(S.heads);
  const auditor = heads.find((h) => h.auditor) || EXT_AUDITOR;
  let abortFn;
  const abortP = new Promise((_, rej) => (abortFn = rej));
  abortP.catch(() => {});
  return {
    id: "m-" + Date.now().toString(36),
    at: new Date().toISOString(),
    agenda,
    heads,
    speakers: heads.filter((h) => !h.auditor),
    auditor,
    phase: "brief",
    briefs: {},
    clashes: [],
    audit: null,
    ceo: [],
    replies: [],
    log: [],
    queue: [],
    hp: null,
    hpShown: null,
    decision: null,
    meter: newMeter(),
    demo: S.mode !== "claude" && S.mode !== "api",
    ctl: new AbortController(),
    aborted: false,
    abortP,
    abort() { this.aborted = true; this.ctl.abort(); abortFn(ABORT); },
  };
}

async function runMeeting(m) {
  try {
    relayout();
    setHP(null);
    renderUnits();
    $("railAgenda").textContent = m.agenda;
    $("railAgenda").classList.remove("muted");

    // ----- real credit balance first, so every head plans against today's numbers
    if (S.mcp && !m.demo) await Promise.race([refreshHF(true), sleep(4000)]);
    alive(m);

    // ----- 1R briefing: every head answers blind, in parallel
    m.phase = "brief";
    await guard(banner("1라운드", "브리핑"));
    alive(m);
    const speakers = m.speakers;
    const jobs = speakers.map((h, i) => {
      if (m.demo) {
        const d = DEMO.briefs[i];
        return sleep(900 + i * 300).then(() => (d ? { ...d } : null));
      }
      return AI.json(briefPrompt(m, h), m.ctl.signal, m.meter).then(cleanBrief);
    });
    jobs.forEach((p) => p.catch(() => {}));

    let fatal = null;
    for (let i = 0; i < speakers.length; i++) {
      const h = speakers[i];
      alive(m);
      S.thinking.add(h.id);
      S.speaker = h.id;
      renderUnits();
      Dialogue.thinking(h, `${h.name} ${h.title}이 판단을 정리하고 있습니다.`);
      let r = null;
      try {
        r = await guard(jobs[i]);
      } catch (e) {
        if (e === ABORT) throw e;
        if (FATAL.has(e && e.code)) { fatal = e; S.thinking.delete(h.id); break; }
        r = null;
      }
      S.thinking.delete(h.id);
      alive(m);
      if (!r) {
        m.briefs[h.id] = { stance: "결석", score: null, say: "", number: "", risk: "" };
        renderUnits();
        await guard(Dialogue.say(h, m.demo ? "데모 대본에는 이 팀장의 발언이 없습니다." : "답변을 받지 못해 이번 브리핑은 건너뜁니다.", [{ chip: "결석" }]));
        continue;
      }
      m.briefs[h.id] = r;
      m.log.push(`[1R ${h.title} ${h.name} | ${r.stance} ${r.score}점] ${r.say} (핵심 숫자: ${r.number} / 약점: ${r.risk})`);
      const scores = Object.values(m.briefs).map((b) => b.score).filter((s) => s != null);
      m.hp = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      setHP(m.hp);
      renderUnits();
      await guard(Dialogue.say(h, r.say, [{ chip: r.stance, label: `${r.stance} ${r.score}` }, r.number && { k: "핵심 숫자", v: r.number }, r.risk && { k: "약점", v: r.risk }]));
      await drainCEO(m);
    }
    if (fatal) return stopWithError(m, fatal);
    const briefed = speakers.filter((h) => m.briefs[h.id] && m.briefs[h.id].score != null);
    if (!briefed.length) return stopWithError(m, { code: "upstream_error" });

    // ----- 2R clash
    if (briefed.length >= 2) {
      m.phase = "clash";
      await guard(banner("2라운드", "교전"));
      alive(m);
      const n = clamp(briefed.length - 1, 2, 4);
      let clashes = [];
      if (m.demo) {
        clashes = DEMO.clashes
          .map((c) => ({ ...c, a: speakers[c.a], t: speakers[c.t] }))
          .filter((c) => c.a && c.t && m.briefs[c.a.id]?.score != null && m.briefs[c.t.id]?.score != null);
      } else {
        S.speaker = null;
        briefed.forEach((h) => S.thinking.add(h.id));
        Dialogue.thinking(m.auditor, "팀장들이 서로의 약점을 찾고 있습니다.");
        try {
          clashes = cleanClashes(await guard(AI.json(clashPrompt(m, n), m.ctl.signal, m.meter)), briefed, n);
        } catch (e) {
          if (e === ABORT) throw e;
          if (FATAL.has(e && e.code)) { S.thinking.clear(); return stopWithError(m, e); }
          clashes = [];
        }
        S.thinking.clear();
      }
      alive(m);
      if (!clashes.length) {
        await guard(Dialogue.say(m.auditor, "교전 결과를 받지 못했습니다. 바로 감사 판정으로 넘어갑니다.", []));
      }
      for (const c of clashes) {
        alive(m);
        S.speaker = c.a.id;
        Dialogue.plain(c.a, "", [{ k: "공격 대상", v: `${c.t.title} ${c.t.name}` }]);
        S.speaker = c.a.id;
        await guard(cutIn(c.a, c.t));
        alive(m);
        await guard(Dialogue.say(c.a, c.attack, [{ k: "공격 대상", v: `${c.t.title} ${c.t.name}` }]));
        if (c.defense) await guard(Dialogue.say(c.t, c.defense, [{ k: "방어", v: c.verdict }]));
        const eff = c.verdict === "공격 유효" ? c.damage : c.verdict === "반반" ? Math.round(c.damage / 2) : -3;
        m.hp = clamp(m.hp - eff, 0, 100);
        if (eff > 0) popDamage(eff, false);
        else popDamage(-eff, true);
        setHP(m.hp, eff > 0 ? "hit" : "heal");
        m.clashes.push({ a: c.a.id, aName: `${c.a.title} ${c.a.name}`, t: c.t.id, tName: `${c.t.title} ${c.t.name}`, attack: c.attack, defense: c.defense, damage: c.damage, verdict: c.verdict, eff });
        m.log.push(`[2R 교전 ${c.a.title} ${c.a.name} → ${c.t.title} ${c.t.name}] 공격: ${c.attack} / 방어: ${c.defense} / 판정: ${c.verdict}`);
        await sleep(500);
        await drainCEO(m);
      }
    }

    // ----- audit
    m.phase = "audit";
    await guard(banner("감사", "판정"));
    alive(m);
    const a = m.auditor;
    let audit = null;
    if (m.demo) {
      audit = clone(DEMO.audit);
    } else {
      S.thinking.add(a.id);
      S.speaker = a.id;
      Dialogue.thinking(a, `${a.name} ${a.title}이 회의 전체를 검토하고 있습니다.`);
      try {
        audit = cleanAudit(await guard(AI.json(auditPrompt(m, a), m.ctl.signal, m.meter)));
      } catch (e) {
        if (e === ABORT) throw e;
        S.thinking.delete(a.id);
        if (FATAL.has(e && e.code)) return stopWithError(m, e);
        audit = null;
      }
      S.thinking.delete(a.id);
    }
    alive(m);
    if (audit) {
      m.audit = audit;
      m.log.push(`[감사 ${a.title} ${a.name}] ${audit.verdict}, 성공 확률 ${audit.probability}% : ${audit.say}`);
      await guard(Dialogue.say(a, audit.say, [{ k: "권고", v: audit.verdict }, { k: "성공 확률", v: audit.probability + "%" }, audit.biases && { k: "편향", v: audit.biases }]));
      const diff = audit.probability - m.hp;
      m.hp = audit.probability;
      if (diff) popDamage(Math.abs(diff), diff > 0);
      setHP(m.hp, diff < 0 ? "hit" : "heal");
      const lines = [];
      if (audit.conditions.length) lines.push("승인 조건", ...audit.conditions.map((c, i) => `${i + 1}. ${c}`));
      if (audit.killCriteria.length) lines.push("", "중단 기준", ...audit.killCriteria.map((c) => `· ${c}`));
      if (lines.length) await guard(Dialogue.say(a, lines.join("\n"), [{ k: "권고", v: audit.verdict }]));
    } else {
      await guard(Dialogue.say(a, "감사 판정을 받지 못했습니다. 지금까지의 생존율로 결재하십시오.", []));
    }
    await drainCEO(m);

    // ----- CEO decision
    m.phase = "decide";
    await guard(banner("CEO", "결재"));
    alive(m);
    S.speaker = "ceo";
    showDoc(m);
    showConsole("decide");
    Dialogue.plain(CEO, "승인, 보류, 기각 중 하나를 고르고 도장을 찍으세요. 결재하면 회의록에 남습니다.", m.audit ? [{ k: "감사 권고", v: m.audit.verdict }, { k: "생존율", v: m.hp + "%" }] : [{ k: "생존율", v: m.hp + "%" }]);
  } catch (e) {
    if (e !== ABORT) {
      console.error(e);
      stopWithError(m, e);
    }
  }
}

async function drainCEO(m) {
  while (m.queue.length) {
    alive(m);
    const msg = m.queue.shift();
    m.ceo.push(msg.text);
    m.log.push(`[CEO] ${msg.text}`);
    await guard(Dialogue.say(CEO, msg.text, msg.target ? [{ k: "지목", v: `${msg.target.title} ${msg.target.name}` }] : []));
    if (m.demo) {
      await guard(Dialogue.say(m.auditor, "데모 대본에는 CEO 발언에 대한 답이 없습니다. AI를 연결하면 담당 팀장이 직접 답하고, 틀린 말이면 반박합니다.", []));
      continue;
    }
    const pool = m.speakers.concat(m.auditor !== EXT_AUDITOR ? [m.auditor] : []);
    const waitOn = msg.target || null;
    if (waitOn) S.thinking.add(waitOn.id); else pool.forEach((h) => S.thinking.add(h.id));
    S.speaker = null;
    Dialogue.thinking(waitOn || m.auditor, waitOn ? `${waitOn.name} ${waitOn.title}이 답을 준비하고 있습니다.` : "누가 답할지 정하고 있습니다.");
    let r = null;
    try {
      r = await guard(AI.json(replyPrompt(m, msg.text, msg.target), m.ctl.signal, m.meter));
    } catch (e) {
      if (e === ABORT) throw e;
      r = null;
    }
    S.thinking.clear();
    alive(m);
    const h = r && (findHead(pool, r.speaker) || waitOn);
    const say = r && str(r.say, 300);
    if (!h || !say) {
      await guard(Dialogue.say(waitOn || m.auditor, "답변을 받지 못했습니다. 회의를 이어 갑니다.", []));
      continue;
    }
    const stance = normStance(r.stance);
    if (m.briefs[h.id] && m.briefs[h.id].score != null) m.briefs[h.id].stance = stance;
    m.replies.push({ ceo: msg.text, id: h.id, name: `${h.title} ${h.name}`, say, stance });
    m.log.push(`[CEO 발언에 대한 답 ${h.title} ${h.name} | ${stance}] ${say}`);
    renderUnits();
    await guard(Dialogue.say(h, say, [{ chip: stance }]));
  }
}

function stopWithError(m, e) {
  if (S.m !== m) return;
  endMeeting(false);
  Dialogue.plain(m.auditor, errCopy(e), []);
  $("preNote").textContent = "회의가 멈췄습니다. " + errCopy(e);
  $("preNote").className = "note grow err";
}

function showConsole(which) {
  $("preMeeting").hidden = which !== "pre";
  $("inMeeting").hidden = which !== "in";
  $("decideBox").hidden = which !== "decide";
  $("postMeeting").hidden = which !== "post";
}

function startMeeting() {
  if (S.m) return;
  let agenda = $("agenda").value.trim();
  const demo = S.mode !== "claude" && S.mode !== "api";
  if (demo) {
    if (agenda && agenda !== DEMO.agenda) {
      $("preNote").textContent = "AI가 연결되지 않아 예시 안건 1번의 데모 대본으로 진행합니다.";
      $("preNote").className = "note grow warn";
    }
    agenda = DEMO.agenda;
    $("agenda").value = agenda;
  }
  if (!agenda) {
    $("preNote").textContent = "안건을 한 문장 이상 적어 주세요.";
    $("preNote").className = "note grow err";
    $("agenda").focus();
    return;
  }
  if (!S.heads.some((h) => !h.auditor)) {
    $("preNote").textContent = "브리핑할 팀장이 없습니다. 인사 관리에서 팀장을 추가하세요.";
    $("preNote").className = "note grow err";
    return;
  }
  const m = newMeeting(agenda);
  S.m = m;
  S.paused = false;
  $("pauseBtn").setAttribute("aria-pressed", "false");
  $("pauseBtn").textContent = "일시정지";
  $("inNote").textContent = m.demo ? "데모 대본으로 진행 중입니다." : "";
  $("inNote").className = "note grow";
  showConsole("in");
  pick(null);
  runMeeting(m);
}

function endMeeting(keepScene) {
  const m = S.m;
  if (m && !m.aborted) m.abort();
  Dialogue.cancel();
  S.thinking.clear();
  if (!keepScene) {
    S.m = null;
    S.speaker = null;
    $("stampLayer").hidden = true;
    relayout();
    setHP(null);
    renderUnits();
    showConsole("pre");
  }
}

async function sign() {
  const m = S.m;
  if (!m || m.phase !== "decide" || !m.decision) return;
  $("signBtn").disabled = true;
  slamSeal(m.decision.k);
  m.decision.memo = $("decideMemo").value.trim();
  m.phase = "done";
  S.speaker = "ceo";
  const rec = toRecord(m);
  const ok = await Store.addMinute(rec);
  S.minutes.unshift(rec);
  renderMinutes();
  Dialogue.plain(CEO, `${DECISION[m.decision.k]}. ${m.decision.memo || "결재를 마쳤습니다."}`, [{ k: "생존율", v: m.hp + "%" }]);
  const cost = meterLine(m.meter);
  $("postNote").textContent = (ok ? "회의록에 저장했습니다." : "회의록을 저장하지 못했습니다. 이 화면을 닫기 전에 회의록 탭에서 내려받으세요.") + (cost ? " " + cost : "");
  $("postNote").className = ok ? "note grow" : "note grow err";
  showConsole("post");
}

function toRecord(m) {
  return {
    id: m.id,
    at: m.at,
    company: S.company.name,
    agenda: m.agenda,
    demo: m.demo,
    briefs: m.speakers.map((h) => ({ id: h.id, name: h.name, title: h.title, ...(m.briefs[h.id] || { stance: "결석" }) })),
    clashes: m.clashes,
    replies: m.replies,
    ceo: m.ceo,
    auditor: `${m.auditor.title} ${m.auditor.name}`,
    audit: m.audit,
    hp: m.hp,
    decision: m.decision,
    usage: m.meter && m.meter.calls ? { ...m.meter, usd: meterCost(m.meter) } : null,
  };
}

// ---------------------------------------------------------------------------
// Rail: 작전판
// ---------------------------------------------------------------------------
function unitRow(h, opts = {}) {
  const li = document.createElement("li");
  li.className = "unit";
  li.dataset.id = h.id;
  li.tabIndex = 0;
  li.setAttribute("role", "button");
  const cv = document.createElement("canvas");
  drawPortrait(cv, h.look);
  const mid = document.createElement("div");
  mid.style.minWidth = "0";
  const n = document.createElement("div");
  n.className = "n";
  n.textContent = h.name;
  const t = document.createElement("div");
  t.className = "t";
  t.textContent = h.title + (h.auditor ? " · 최종 판정" : "");
  mid.append(n, t);
  const sc = document.createElement("div");
  sc.className = "sc";
  if (opts.score !== undefined) {
    sc.textContent = opts.score == null ? "--" : String(opts.score);
    if (opts.stance) {
      const c = document.createElement("small");
      c.textContent = opts.stance;
      c.style.color = opts.stance === "찬성" ? "var(--teal)" : opts.stance === "조건부" ? "var(--amber)" : opts.stance === "반대" ? "var(--crimson)" : "var(--muted)";
      sc.append(c);
    }
  } else if (opts.right) {
    const c = document.createElement("small");
    c.textContent = opts.right;
    sc.append(c);
  }
  li.append(cv, mid, sc);
  return li;
}

function renderUnits() {
  const ul = $("units");
  ul.innerHTML = "";
  for (const h of activeHeads()) {
    const b = S.m && S.m.briefs[h.id];
    const li = unitRow(h, h.auditor ? { right: S.m?.audit ? `${S.m.audit.probability}%` : "관찰" } : { score: b ? b.score : null, stance: b ? b.stance : null });
    li.dataset.speaking = S.speaker === h.id ? "1" : "0";
    li.dataset.picked = S.picked === h.id ? "1" : "0";
    li.setAttribute("aria-label", `${h.title} ${h.name}${b ? `, ${b.stance} ${b.score ?? ""}` : ""}. 눌러서 지목`);
    li.addEventListener("click", () => pick(S.picked === h.id ? null : h.id));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(S.picked === h.id ? null : h.id); } });
    ul.append(li);
  }
}

// ---------------------------------------------------------------------------
// Staff editor
// ---------------------------------------------------------------------------
function renderStaff() {
  const ul = $("staffList");
  ul.innerHTML = "";
  for (const h of S.heads) {
    const li = unitRow(h, { right: HARSH_LABEL[h.harsh] });
    li.dataset.picked = S.editId === h.id ? "1" : "0";
    li.setAttribute("aria-label", `${h.title} ${h.name} 편집`);
    const open = () => { S.editId = h.id; renderStaff(); };
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    ul.append(li);
  }
  $("addHead").disabled = S.heads.length >= 9;
  renderEditor();
}

function field(label, id, value, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const l = document.createElement("label");
  l.htmlFor = id;
  l.textContent = label;
  const input = document.createElement(opts.area ? "textarea" : "input");
  if (!opts.area) input.type = "text";
  input.id = id;
  input.value = value;
  input.maxLength = opts.max || 200;
  input.autocomplete = "off";
  if (opts.area) input.style.minHeight = "76px";
  wrap.append(l, input);
  return { wrap, input };
}

function swatchRow(label, colors, current, onPick) {
  const wrap = document.createElement("div");
  const l = document.createElement("label");
  l.textContent = label;
  const row = document.createElement("div");
  row.className = "swatches";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", label);
  colors.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sw";
    b.style.background = c;
    b.setAttribute("aria-pressed", String(i === current));
    b.setAttribute("aria-label", `${label} ${i + 1}`);
    b.addEventListener("click", () => onPick(i));
    row.append(b);
  });
  wrap.append(l, row);
  return wrap;
}

function segRow(label, names, current, onPick) {
  const wrap = document.createElement("div");
  const l = document.createElement("label");
  l.textContent = label;
  const row = document.createElement("div");
  row.className = "seg";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", label);
  names.forEach((n, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("aria-pressed", String(i === current));
    b.addEventListener("click", () => onPick(i));
    row.append(b);
  });
  wrap.append(l, row);
  return wrap;
}

function renderEditor() {
  const box = $("editor");
  box.innerHTML = "";
  const h = S.heads.find((x) => x.id === S.editId) || S.heads[0];
  if (!h) {
    box.innerHTML = '<div class="empty"><b>팀장이 없습니다</b>팀장 추가를 눌러 첫 팀장을 만드세요.</div>';
    return;
  }
  S.editId = h.id;
  const changed = (rerenderList) => {
    queueSave();
    if (!S.m) { relayout(); renderUnits(); }
    if (rerenderList) renderStaff();
    else {
      const li = $("staffList").querySelector(`[data-id="${h.id}"]`);
      if (li) li.replaceWith(Object.assign(unitRow(h, { right: HARSH_LABEL[h.harsh] }), {}));
      renderStaffBindings();
    }
  };

  const head = document.createElement("div");
  head.className = "head";
  const cv = document.createElement("canvas");
  drawPortrait(cv, h.look);
  const headR = document.createElement("div");
  headR.style.display = "grid";
  headR.style.gap = "8px";
  const ttl = document.createElement("h2");
  ttl.textContent = `${h.name} ${h.title}`;
  const sub = document.createElement("p");
  sub.className = "note";
  sub.textContent = S.m ? "진행 중인 회의에는 반영되지 않고, 다음 회의부터 적용됩니다." : "바꾼 내용은 바로 저장되고 회의실에 반영됩니다.";
  const rnd = document.createElement("button");
  rnd.type = "button";
  rnd.className = "btn small";
  rnd.textContent = "외모 무작위";
  rnd.style.justifySelf = "start";
  rnd.addEventListener("click", () => {
    h.look = { skin: (Math.random() * SKIN.length) | 0, hair: (Math.random() * HAIR.length) | 0, style: (Math.random() * STYLE_NAMES.length) | 0, suit: (Math.random() * SUIT.length) | 0, acc: (Math.random() * ACC_NAMES.length) | 0 };
    changed(true);
  });
  headR.append(ttl, sub, rnd);
  head.append(cv, headR);
  box.append(head);

  const g2 = document.createElement("div");
  g2.className = "grid2";
  const fName = field("이름", "ed-name", h.name, { max: 12 });
  const fTitle = field("직함", "ed-title", h.title, { max: 14 });
  fName.input.addEventListener("input", () => { h.name = fName.input.value.trim() || "이름 없음"; ttl.textContent = `${h.name} ${h.title}`; changed(false); });
  fTitle.input.addEventListener("input", () => { h.title = fTitle.input.value.trim() || "팀장"; ttl.textContent = `${h.name} ${h.title}`; changed(false); });
  g2.append(fName.wrap, fTitle.wrap);
  box.append(g2);

  const g3 = document.createElement("div");
  g3.className = "grid2";
  const fShort = field("자리 명패 (4자 이내)", "ed-short", h.short || "", { max: 4 });
  fShort.input.addEventListener("input", () => { h.short = fShort.input.value.trim(); changed(false); });
  const harshWrap = document.createElement("div");
  harshWrap.className = "field";
  const hl = document.createElement("label");
  hl.htmlFor = "ed-harsh";
  hl.innerHTML = "냉정함 ";
  const out = document.createElement("span");
  out.className = "harsh-out";
  out.textContent = `${h.harsh} · ${HARSH_LABEL[h.harsh]}`;
  hl.append(out);
  const range = document.createElement("input");
  range.type = "range";
  range.id = "ed-harsh";
  range.min = "1";
  range.max = "5";
  range.step = "1";
  range.value = String(h.harsh);
  range.addEventListener("input", () => { h.harsh = Number(range.value); out.textContent = `${h.harsh} · ${HARSH_LABEL[h.harsh]}`; changed(false); });
  harshWrap.append(hl, range);
  g3.append(fShort.wrap, harshWrap);
  box.append(g3);

  const fRole = field("담당 분야", "ed-role", h.role, { area: true, max: 300 });
  fRole.input.addEventListener("input", () => { h.role = fRole.input.value.trim(); changed(false); });
  const fPersona = field("성격과 판단 기준", "ed-persona", h.persona, { area: true, max: 300 });
  fPersona.input.addEventListener("input", () => { h.persona = fPersona.input.value.trim(); changed(false); });
  box.append(fRole.wrap, fPersona.wrap);

  const aud = document.createElement("label");
  aud.className = "toggle";
  const audIn = document.createElement("input");
  audIn.type = "checkbox";
  audIn.id = "ed-auditor";
  audIn.checked = !!h.auditor;
  audIn.addEventListener("change", () => {
    S.heads.forEach((x) => (x.auditor = false));
    h.auditor = audIn.checked;
    changed(true);
  });
  aud.append(audIn, document.createTextNode(" 최종 판정 담당 (브리핑과 교전은 지켜보고 마지막에 감사 판정을 냅니다. 한 명만)"));
  box.append(aud);

  const looks = document.createElement("div");
  looks.className = "looks";
  const setLook = (k) => (i) => { h.look[k] = i; changed(true); };
  looks.append(
    swatchRow("피부", SKIN, h.look.skin, setLook("skin")),
    swatchRow("머리색", HAIR, h.look.hair, setLook("hair")),
    segRow("머리 모양", STYLE_NAMES, h.look.style, setLook("style")),
    swatchRow("정장", SUIT, h.look.suit, setLook("suit")),
    segRow("소품", ACC_NAMES, h.look.acc, setLook("acc")),
  );
  box.append(looks);

  const del = document.createElement("div");
  del.className = "row-actions";
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn small";
  delBtn.textContent = "이 팀장 내보내기";
  delBtn.disabled = S.heads.length <= 2;
  let armed = 0;
  delBtn.addEventListener("click", () => {
    if (!armed) {
      delBtn.textContent = "정말 내보냅니다";
      delBtn.classList.add("danger");
      armed = setTimeout(() => { armed = 0; delBtn.textContent = "이 팀장 내보내기"; delBtn.classList.remove("danger"); }, 3000);
      return;
    }
    clearTimeout(armed);
    S.heads = S.heads.filter((x) => x !== h);
    S.editId = S.heads[0]?.id || null;
    changed(true);
  });
  const hint = document.createElement("p");
  hint.className = "note grow";
  hint.textContent = S.heads.length <= 2 ? "회의에는 팀장이 최소 2명 필요합니다." : "";
  del.append(delBtn, hint);
  box.append(del);
}

function renderStaffBindings() {
  for (const li of $("staffList").children) {
    li.dataset.picked = li.dataset.id === S.editId ? "1" : "0";
    if (!li._bound) {
      li._bound = true;
      const id = li.dataset.id;
      li.addEventListener("click", () => { S.editId = id; renderStaff(); });
    }
  }
}

$("addHead").addEventListener("click", () => {
  if (S.heads.length >= 9) return;
  const id = "h-" + Date.now().toString(36);
  S.heads.push({
    id, name: "새 팀장", title: "전략팀장", short: "전략",
    role: "이 팀장이 맡는 분야를 적으세요. 예: 재무, 법무, 데이터, 고객 경험.",
    persona: "어떤 기준으로 판단하는 사람인지 적으세요. 예: 손익분기점을 넘지 못하는 계획은 반대한다.",
    harsh: 4, auditor: false,
    look: { skin: (Math.random() * SKIN.length) | 0, hair: (Math.random() * HAIR.length) | 0, style: (Math.random() * STYLE_NAMES.length) | 0, suit: (Math.random() * SUIT.length) | 0, acc: 0 },
  });
  S.editId = id;
  queueSave();
  if (!S.m) { relayout(); renderUnits(); }
  renderStaff();
  $("ed-name")?.select();
});

let resetArmed = 0;
$("resetRoster").addEventListener("click", () => {
  const b = $("resetRoster");
  if (!resetArmed) {
    b.textContent = "정말 되돌립니다";
    b.classList.add("danger");
    resetArmed = setTimeout(() => { resetArmed = 0; b.textContent = "기본 구성으로"; b.classList.remove("danger"); }, 3000);
    return;
  }
  clearTimeout(resetArmed);
  resetArmed = 0;
  b.textContent = "기본 구성으로";
  b.classList.remove("danger");
  S.heads = clone(DEFAULT_HEADS);
  S.company = clone(DEFAULT_COMPANY);
  S.editId = S.heads[0].id;
  syncCompany();
  queueSave();
  if (!S.m) { relayout(); renderUnits(); }
  renderStaff();
});

function syncCompany() {
  $("coName").textContent = S.company.name;
  $("coNameIn").value = S.company.name;
  $("coDescIn").value = S.company.desc;
}
$("coNameIn").addEventListener("input", () => { S.company.name = $("coNameIn").value.trim() || "이름 없는 회사"; $("coName").textContent = S.company.name; queueSave(); });
$("coDescIn").addEventListener("input", () => { S.company.desc = $("coDescIn").value.trim(); queueSave(); });

// ---------------------------------------------------------------------------
// Minutes
// ---------------------------------------------------------------------------
function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function renderMinutes() {
  const ul = $("mlist");
  ul.innerHTML = "";
  $("minutesCount").textContent = S.minutes.length ? `${S.minutes.length}건` : "";
  if (!S.minutes.length) {
    ul.innerHTML = '<li class="empty"><b>아직 결재한 회의가 없습니다</b>회의실에서 회의를 마치고 도장을 찍으면 여기에 남습니다.</li>';
    $("mdetail").hidden = true;
    return;
  }
  for (const r of S.minutes) {
    const li = document.createElement("li");
    li.className = "unit mitem";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.dataset.picked = S.openMinute === r.id ? "1" : "0";
    const left = document.createElement("div");
    left.style.minWidth = "0";
    const ag = document.createElement("p");
    ag.className = "ag";
    ag.textContent = r.agenda;
    const dt = document.createElement("div");
    dt.className = "dt";
    dt.textContent = `${fmtDate(r.at)} · 생존율 ${r.hp ?? "--"}%${r.demo ? " · 데모 대본" : ""}`;
    left.append(ag, dt);
    const tag = document.createElement("span");
    tag.className = "verdict-tag";
    tag.dataset.k = r.decision?.k || "hold";
    tag.textContent = DECISION[r.decision?.k] || "미결";
    li.append(left, tag);
    const open = () => { S.openMinute = S.openMinute === r.id ? null : r.id; renderMinutes(); };
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    ul.append(li);
  }
  renderMinuteDetail();
}

function renderMinuteDetail() {
  const box = $("mdetail");
  const r = S.minutes.find((x) => x.id === S.openMinute);
  if (!r) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = "";
  const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; box.append(el); return el; };
  add("h2", r.agenda);
  add("p", `${fmtDate(r.at)} · ${r.company} · 결재: ${DECISION[r.decision?.k] || "미결"}${r.decision?.memo ? ` (${r.decision.memo})` : ""}`, "muted");
  if (r.usage) add("p", "사용량: " + meterLine(r.usage), "muted");
  add("h3", "1라운드 브리핑");
  for (const b of r.briefs) {
    if (b.stance === "결석") { add("p", `${b.title} ${b.name}: 결석`); continue; }
    add("p", `${b.title} ${b.name} [${b.stance} ${b.score}] ${b.say}${b.number ? ` / 핵심 숫자: ${b.number}` : ""}${b.risk ? ` / 약점: ${b.risk}` : ""}`);
  }
  if (r.clashes?.length) {
    add("h3", "2라운드 교전");
    for (const c of r.clashes) add("p", `${c.aName} → ${c.tName} [${c.verdict}, ${c.eff > 0 ? "-" + c.eff : "+" + -c.eff}] 공격: ${c.attack} / 방어: ${c.defense}`);
  }
  if (r.replies?.length) {
    add("h3", "CEO 발언");
    for (const x of r.replies) add("p", `CEO: ${x.ceo} / ${x.name}: ${x.say}`);
  }
  if (r.audit) {
    add("h3", `감사 판정 (${r.auditor})`);
    add("p", `${r.audit.verdict}, 성공 확률 ${r.audit.probability}%. ${r.audit.say}`);
    if (r.audit.conditions?.length) { const ul = document.createElement("ul"); r.audit.conditions.forEach((c) => { const li = document.createElement("li"); li.textContent = "승인 조건: " + c; ul.append(li); }); r.audit.killCriteria?.forEach((c) => { const li = document.createElement("li"); li.textContent = "중단 기준: " + c; ul.append(li); }); box.append(ul); }
    if (r.audit.biases) add("p", "편향: " + r.audit.biases);
  }
  const row = document.createElement("div");
  row.className = "row-actions";
  const dl = document.createElement("button");
  dl.type = "button";
  dl.className = "btn small";
  dl.textContent = "마크다운으로 내려받기";
  const note = document.createElement("p");
  note.className = "note grow";
  dl.addEventListener("click", async () => {
    const md = toMarkdown(r);
    const name = `회의록-${r.at.slice(0, 10)}-${r.id}.md`;
    note.textContent = await saveFile(name, md) ? "" : "이 화면에서는 파일을 내려받을 수 없습니다. 아래 내용을 복사해 쓰세요.";
  });
  const cp = document.createElement("button");
  cp.type = "button";
  cp.className = "btn small";
  cp.textContent = "복사";
  cp.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(toMarkdown(r)); note.textContent = "복사했습니다."; }
    catch { note.textContent = "복사하지 못했습니다. 내용을 직접 선택해 복사하세요."; }
  });
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn small";
  del.textContent = "삭제";
  let armed = 0;
  del.addEventListener("click", async () => {
    if (!armed) { del.textContent = "정말 삭제"; del.classList.add("danger"); armed = setTimeout(() => { armed = 0; del.textContent = "삭제"; del.classList.remove("danger"); }, 3000); return; }
    clearTimeout(armed);
    await Store.deleteMinute(r.id);
    S.minutes = S.minutes.filter((x) => x.id !== r.id);
    S.openMinute = null;
    renderMinutes();
  });
  row.append(dl, cp, del, note);
  box.append(row);
}

function toMarkdown(r) {
  const L = [];
  L.push(`# 회의록: ${r.agenda}`, "", `- 일시: ${fmtDate(r.at)}`, `- 회사: ${r.company}`, `- 결재: ${DECISION[r.decision?.k] || "미결"}${r.decision?.memo ? ` (${r.decision.memo})` : ""}`, `- 최종 생존율: ${r.hp ?? "--"}%`);
  if (r.demo) L.push("- 데모 대본으로 진행한 회의");
  if (r.usage) L.push(`- 사용량: ${meterLine(r.usage)}`);
  L.push("", "## 1라운드 브리핑", "");
  for (const b of r.briefs) L.push(b.stance === "결석" ? `- **${b.title} ${b.name}**: 결석` : `- **${b.title} ${b.name}** (${b.stance}, ${b.score}): ${b.say} 핵심 숫자: ${b.number}. 약점: ${b.risk}.`);
  if (r.clashes?.length) {
    L.push("", "## 2라운드 교전", "");
    for (const c of r.clashes) L.push(`- **${c.aName} → ${c.tName}** (${c.verdict}): ${c.attack}`, `  - 방어: ${c.defense}`);
  }
  if (r.replies?.length) {
    L.push("", "## CEO 발언", "");
    for (const x of r.replies) L.push(`- CEO: ${x.ceo}`, `  - ${x.name}: ${x.say}`);
  }
  if (r.audit) {
    L.push("", `## 감사 판정 (${r.auditor})`, "", `${r.audit.verdict}, 성공 확률 ${r.audit.probability}%.`, "", r.audit.say, "");
    r.audit.conditions?.forEach((c) => L.push(`- 승인 조건: ${c}`));
    r.audit.killCriteria?.forEach((c) => L.push(`- 중단 기준: ${c}`));
    if (r.audit.biases) L.push(`- 편향: ${r.audit.biases}`);
  }
  return L.join("\n") + "\n";
}

async function saveFile(name, text) {
  if (S.downloads) {
    try { await S.downloads.save({ filename: name, data: text }); return true; } catch { return false; }
  }
  if (window.claude) return false; // framed viewer without downloads
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// Tabs, console wiring, AI settings
// ---------------------------------------------------------------------------
function showView(v) {
  for (const k of ["room", "work", "staff", "minutes"]) {
    $("view-" + k).hidden = k !== v;
    $("tab-" + k).setAttribute("aria-selected", String(k === v));
  }
  if (v === "staff") { renderStaff(); renderReality(); }
  if (v === "work") renderWork();
  if (v === "minutes") renderMinutes();
  if (v === "room") fitCanvas();
}
$("tab-room").addEventListener("click", () => showView("room"));
$("tab-staff").addEventListener("click", () => showView("staff"));
$("tab-work").addEventListener("click", () => showView("work"));
$("tab-minutes").addEventListener("click", () => showView("minutes"));
$("linkPill").addEventListener("click", () => { showView("staff"); $("aiSettings").scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" }); });

$("startBtn").addEventListener("click", startMeeting);
$("agenda").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startMeeting(); });
for (const [i, a] of SAMPLE_AGENDAS.entries()) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = `예시 ${i + 1}. ${a.length > 34 ? a.slice(0, 34) + "…" : a}`;
  b.title = a;
  b.addEventListener("click", () => { $("agenda").value = a; $("preNote").textContent = ""; });
  $("samples").append(b);
}

function setAutoplay(v) {
  S.autoplay = v;
  $("autoplay").checked = v;
  $("autoplay2").checked = v;
  Dialogue.arm();
}
$("autoplay").addEventListener("change", (e) => setAutoplay(e.target.checked));
$("autoplay2").addEventListener("change", (e) => setAutoplay(e.target.checked));
$("nextBtn").addEventListener("click", () => Dialogue.advance());
$("pauseBtn").addEventListener("click", () => {
  S.paused = !S.paused;
  $("pauseBtn").setAttribute("aria-pressed", String(S.paused));
  $("pauseBtn").textContent = S.paused ? "계속" : "일시정지";
  Dialogue.arm();
});
let stopArmed = 0;
$("stopBtn").addEventListener("click", () => {
  const b = $("stopBtn");
  if (!stopArmed) {
    b.textContent = "정말 중단";
    b.classList.add("danger");
    stopArmed = setTimeout(() => { stopArmed = 0; b.textContent = "회의 중단"; b.classList.remove("danger"); }, 3000);
    return;
  }
  clearTimeout(stopArmed);
  stopArmed = 0;
  b.textContent = "회의 중단";
  b.classList.remove("danger");
  endMeeting(false);
  Dialogue.plain(CEO, "회의를 중단했습니다. 안건을 고쳐서 다시 시작할 수 있습니다.", []);
});

function sendCEO() {
  const m = S.m;
  const text = $("ceoMsg").value.trim();
  if (!m || !text) return;
  const target = S.picked ? m.heads.find((h) => h.id === S.picked) : null;
  m.queue.push({ text, target });
  $("ceoMsg").value = "";
  $("inNote").textContent = Dialogue.typing || S.thinking.size ? "지금 발언이 끝나면 CEO 발언이 들어갑니다." : "";
  $("inNote").className = "note grow";
  pick(null);
  if (Dialogue.waiter) Dialogue.release();
}
$("ceoSend").addEventListener("click", sendCEO);
$("ceoMsg").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); sendCEO(); } });
$("clearTarget").addEventListener("click", () => pick(null));

for (const b of $("decideBox").querySelectorAll(".stamps .btn")) {
  b.addEventListener("click", () => {
    const m = S.m;
    if (!m || m.phase !== "decide") return;
    m.decision = { k: b.dataset.k, label: DECISION[b.dataset.k] };
    for (const x of $("decideBox").querySelectorAll(".stamps .btn")) x.setAttribute("aria-pressed", String(x === b));
    $("signBtn").disabled = false;
    $("signBtn").textContent = `${DECISION[b.dataset.k]} 도장 찍기`;
  });
}
$("signBtn").addEventListener("click", sign);
$("newBtn").addEventListener("click", () => {
  endMeeting(false);
  for (const x of $("decideBox").querySelectorAll(".stamps .btn")) x.setAttribute("aria-pressed", "false");
  $("signBtn").disabled = true;
  $("signBtn").textContent = "도장 찍기";
  $("decideMemo").value = "";
  $("agenda").value = "";
  $("railAgenda").textContent = "안건을 적고 회의를 시작하세요.";
  $("railAgenda").classList.add("muted");
  greet();
  $("agenda").focus({ preventScroll: true });
});
$("toMinutesBtn").addEventListener("click", () => { S.openMinute = S.minutes[0]?.id || null; showView("minutes"); });

$("tierSel").addEventListener("change", () => { S.tier = $("tierSel").value; queueSave(); });
$("saveKey").addEventListener("click", () => {
  const k = $("apiKey").value.trim();
  if (!k) return;
  S.apiKey = k;
  LS.set("boardroom.apiKey", k);
  $("apiKey").value = "";
  if (S.mode !== "claude") setMode("api");
});
$("clearKey").addEventListener("click", () => {
  S.apiKey = "";
  LS.del("boardroom.apiKey");
  if (S.mode === "api") setMode("demo");
});

function setMode(mode) {
  S.mode = mode;
  const pill = $("linkPill");
  pill.dataset.mode = mode;
  $("linkLabel").textContent = { checking: "확인 중", claude: "Claude 연결됨", api: "API 키 연결됨", demo: "데모 대본" }[mode];
  const framed = !!window.claude;
  $("apiBox").hidden = framed;
  $("aiExplain").textContent =
    mode === "claude" ? "claude.ai에 로그인한 내 계정의 Claude가 팀장 역할을 합니다. 첫 회의에서 사용 허용을 한 번 묻습니다."
    : mode === "api" ? "입력한 API 키로 Anthropic API를 직접 부릅니다. 사용량은 그 키의 계정에 청구됩니다."
    : framed ? "이 화면에서는 Claude를 쓸 수 없어 데모 대본으로 진행합니다."
    : "AI가 연결되지 않았습니다. Claude API 키를 넣으면 팀장들이 실제로 판단합니다. 키가 없으면 데모 대본으로 진행합니다.";
  if (!S.m) greet();
}

function greet() {
  const sec = S.heads.find((h) => h.auditor) || S.heads[0];
  if (!sec) return;
  const msg =
    S.mode === "checking" ? "AI 연결을 확인하고 있습니다."
    : S.mode === "demo" ? "AI가 연결되지 않았습니다. 지금은 예시 안건 1번의 데모 대본으로 회의를 보여 드립니다. 회의 시작을 누르세요."
    : `안건을 주시면 ${S.heads.filter((h) => !h.auditor).length}명이 각자 따로 판단해서 브리핑하고, 서로의 약점을 공격한 뒤, 제가 감사 판정을 내립니다. 듣기 좋은 말은 하지 않겠습니다.`;
  const unread = typeof unreadFor === "function" ? unreadFor().length : 0;
  Dialogue.plain(sec, unread ? `${msg}\n\n새 보고가 ${unread}건 들어와 있습니다. 봉투가 뜬 팀장을 누르면 바로 열립니다.` : msg, []);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function applyRoster(r) {
  if (!r || !Array.isArray(r.heads) || !r.heads.length) return;
  S.heads = r.heads.map((h) => ({ ...h, look: { skin: 0, hair: 0, style: 0, suit: 0, acc: 0, ...(h.look || {}) }, harsh: clamp(Number(h.harsh) || 4, 1, 5) }));
  if (r.company && r.company.name) {
    const desc = r.company.desc === OLD_COMPANY_DESC ? DEFAULT_COMPANY.desc : r.company.desc || "";
    S.company = { name: r.company.name, desc };
  }
  if (r.reality && typeof r.reality === "object") S.reality = { ...clone(DEFAULT_REALITY), ...r.reality, hf: { ...DEFAULT_REALITY.hf, ...(r.reality.hf || {}) } };
  if (r.tier && TIER_MODEL[r.tier]) S.tier = r.tier;
  $("tierSel").value = S.tier;
}

async function boot() {
  syncCompany();
  setMode("checking");
  relayout();
  renderUnits();
  setHP(null);
  showConsole("pre");
  S.apiKey = LS.get("boardroom.apiKey", "") || "";

  const fontReady = document.fonts ? Promise.all(["12px Galmuri11", "8px Galmuri7", "16px \"Galmuri11 Bold\""].map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve();
  await fontReady;
  room = buildRoom();
  fitCanvas();
  rafId = requestAnimationFrame(loop);

  if (!window.claude || typeof window.claude.use !== "function") {
    applyRoster(LS.get("boardroom.roster", null));
    S.minutes = LS.get("boardroom.minutes", []);
    syncCompany();
    renderReality();
    relayout();
    renderUnits();
    setMode(S.apiKey ? "api" : "demo");
    await loadWork();
    if (!S.m) greet();
    return;
  }
  const [sample, db, user, downloads, mcp] = await Promise.all(["sample", "db", "user", "downloads", "mcp"].map((n) => window.claude.use(n).catch(() => null)));
  S.sample = sample;
  S.downloads = downloads;
  S.mcp = mcp;
  if (db && user) {
    try {
      const uid = await user.id();
      if (uid) { S.db = db; S.uid = uid; }
    } catch {}
  }
  const r = await Store.loadRoster();
  if (!S.m) applyRoster(r);
  S.minutes = await Store.listMinutes();
  syncCompany();
  renderReality();
  if (!S.m) { relayout(); renderUnits(); }
  setMode(sample ? "claude" : "demo");
  await loadWork();
  if (!S.m) greet();
}

