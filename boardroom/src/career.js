// ---------------------------------------------------------------------------
// Career tools: the 지원 현황 board, cover-letter review (첨삭), the mock
// interview staged at the meeting table, and turning a meeting's outcome into
// tasks. Stored per person under data/users/<uid>/{apps,reviews,interviews}.
// ---------------------------------------------------------------------------

const STAGES = ["추천", "관심", "작성 중", "제출", "면접", "합격", "불합격"];
const LIVE_STAGES = ["관심", "작성 중", "제출", "면접"];
const DONE_STAGES = ["합격", "불합격"];
const JOB_SOURCES = ["사람인", "링커리어", "잡코리아", "원티드", "캐치", "자소설닷컴", "회사 홈페이지", "지인·학교", "기타"];
const JOB_KINDS = ["신입 공채", "인턴", "수시 채용", "공모전", "기타"];
const DOC_KINDS = ["자기소개서", "포트폴리오 설명", "이력서 문장", "기타"];
const IV_PRESETS = ["방송사 PD 신입 공채", "광고 영상 제작사 PD", "AI 스타트업 AI 영상 크리에이터", "기업 인하우스 콘텐츠팀", "AI 서비스 PM 신입"];

// multi-line text from the model: keep line breaks, trim, cap
const txt = (v, n) => String(v == null ? "" : v).replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);

// ----- dates
function daysLeft(ymd) {
  if (!ymd) return Infinity;
  return Math.round((new Date(ymd + "T00:00:00Z") - new Date(kstDate() + "T00:00:00Z")) / 864e5);
}
function dLabel(ymd) {
  const d = daysLeft(ymd);
  if (d === Infinity) return "상시";
  if (d < 0) return "마감";
  return d === 0 ? "D-day" : `D-${d}`;
}
function liveApps() {
  return S.apps.filter((a) => LIVE_STAGES.includes(a.stage));
}
// The closest deadline still ahead among live applications.
function nextDeadline() {
  return liveApps().filter((a) => a.deadline && daysLeft(a.deadline) >= 0).sort((a, b) => a.deadline.localeCompare(b.deadline))[0] || null;
}
function appLabel(a) {
  return `${a.company} ${a.role}`.trim();
}
function appsBlock(n = 8) {
  const live = liveApps().sort((a, b) => String(a.deadline || "9").localeCompare(String(b.deadline || "9"))).slice(0, n);
  if (!live.length) return "";
  return "[지원 현황]\n" + live.map((a) => `- ${appLabel(a)} (${a.stage}, 마감 ${a.deadline ? `${a.deadline} ${dLabel(a.deadline)}` : "상시"})`).join("\n");
}

// ----- loading and live updates
async function loadCareer() {
  const [apps, reviews, interviews] = await Promise.all(["apps", "reviews", "interviews"].map((k) => WorkStore.list(k)));
  S.apps = apps || [];
  S.reviews = (reviews || []).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  S.interviews = (interviews || []).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  renderAppsBadge();
  if (S.db) {
    // the cloud reporter drops recommended postings in here
    WorkStore.col("apps").onSnapshot((snap) => {
      S.apps = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      renderAppsBadge();
      if (!$("view-apps").hidden) renderApps();
    }, () => {});
  }
}

function renderAppsBadge() {
  const picks = S.apps.filter((a) => a.stage === "추천").length;
  const urgent = liveApps().filter((a) => a.deadline && daysLeft(a.deadline) >= 0 && daysLeft(a.deadline) <= 3).length;
  const b = $("appsBadge");
  b.hidden = !(urgent || picks);
  b.textContent = urgent ? `D-${Math.max(0, Math.min(...liveApps().filter((a) => a.deadline && daysLeft(a.deadline) >= 0).map((a) => daysLeft(a.deadline))))}` : String(picks);
  b.title = urgent ? `마감 3일 안 ${urgent}건` : `서치팀 추천 ${picks}건`;
  $("pickBadge").hidden = !picks;
  $("pickBadge").textContent = String(picks);
}

// =========================================================================
// 지원 현황
// =========================================================================
let appsFilter = "live";
let editApp = null;

function fillSelect(sel, items, value) {
  sel.innerHTML = "";
  for (const it of items) {
    const [v, label] = Array.isArray(it) ? it : [it, it];
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    sel.append(o);
  }
  if (value != null) sel.value = value;
}
fillSelect($("apStage"), STAGES.filter((s) => s !== "추천"), "관심");
fillSelect($("apSource"), JOB_SOURCES, "사람인");
fillSelect($("apKind"), JOB_KINDS, "신입 공채");
fillSelect($("rvKind"), DOC_KINDS, "자기소개서");

function renderApps() {
  renderHunt();
  for (const b of $("appsFilter").querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.f === appsFilter));
  const pool = appsFilter === "pick" ? S.apps.filter((a) => a.stage === "추천") : appsFilter === "done" ? S.apps.filter((a) => DONE_STAGES.includes(a.stage)) : liveApps();
  const list = pool.slice().sort((a, b) => String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")) || appLabel(a).localeCompare(appLabel(b)));
  const live = liveApps().length;
  $("appsCount").textContent = live ? `진행 중 ${live}건` : "";
  const ul = $("appsList");
  ul.innerHTML = "";
  if (!list.length) {
    const empty = {
      live: ["진행 중인 지원이 없습니다", "공고 추가 칸에서 직접 넣거나, 서치팀 추천에서 관심 있는 공고를 옮겨 오세요."],
      pick: ["서치팀 추천이 아직 없습니다", "서치팀 공고 찾기에서 지금 찾기를 누르면 사람인, 링커리어 같은 곳에서 원준 님 조건에 맞는 공고를 찾아 여기에 넣습니다."],
      done: ["끝난 지원이 없습니다", "합격하거나 떨어진 공고는 여기에 모입니다. 떨어진 곳도 지우지 말고 남겨 두면 다음 지원 때 참고가 됩니다."],
    }[appsFilter];
    ul.innerHTML = `<li class="empty"><b>${empty[0]}</b>${empty[1]}</li>`;
    return;
  }
  for (const a of list) {
    const li = document.createElement("li");
    li.className = "app-row";
    li.dataset.picked = editApp === a.id ? "1" : "0";
    const d = daysLeft(a.deadline);
    const day = document.createElement("div");
    day.className = "dday";
    day.dataset.u = d < 0 ? "past" : d <= 3 ? "hot" : d <= 7 ? "warm" : "cool";
    day.textContent = DONE_STAGES.includes(a.stage) ? a.stage : dLabel(a.deadline);
    const mid = document.createElement("button");
    mid.type = "button";
    mid.className = "app-mid";
    const n = document.createElement("span");
    n.className = "n";
    n.textContent = a.company || "회사 미정";
    const r = document.createElement("span");
    r.className = "r";
    r.textContent = a.role || "";
    const t = document.createElement("span");
    t.className = "t";
    t.textContent = [a.kind, a.source, a.deadline ? `마감 ${a.deadline.slice(5).replace("-", "/")}` : ""].filter(Boolean).join(" · ");
    mid.append(n, r, t);
    if (a.stage === "추천" && a.fit) {
      const f = document.createElement("span");
      f.className = "t fit-line";
      f.textContent = a.fit;
      mid.append(f);
    }
    mid.addEventListener("click", () => openApp(a.id));
    const acts = document.createElement("div");
    acts.className = "task-acts";
    if (a.stage === "추천") {
      const keep = document.createElement("button");
      keep.type = "button";
      keep.className = "btn small primary";
      keep.textContent = "관심에 넣기";
      keep.addEventListener("click", () => setStage(a, "관심"));
      const drop = document.createElement("button");
      drop.type = "button";
      drop.className = "btn small";
      drop.textContent = "버리기";
      drop.addEventListener("click", () => dropApp(a));
      acts.append(keep, drop);
    } else {
      const sel = document.createElement("select");
      sel.className = "stage-sel";
      sel.setAttribute("aria-label", `${appLabel(a)} 진행 단계`);
      fillSelect(sel, STAGES.filter((s) => s !== "추천"), a.stage);
      sel.addEventListener("change", () => setStage(a, sel.value));
      acts.append(sel);
    }
    li.append(day, mid, acts);
    ul.append(li);
  }
}

async function setStage(a, stage) {
  a.stage = stage;
  a.updatedAt = new Date().toISOString();
  await WorkStore.put("apps", a);
  if (stage === "관심" && appsFilter === "pick") $("appsNote").textContent = `${appLabel(a)}을 진행 중으로 옮겼습니다.`;
  renderAppsBadge();
  renderApps();
  if (editApp === a.id) openApp(a.id);
}
async function dropApp(a) {
  await WorkStore.del("apps", a.id);
  S.apps = S.apps.filter((x) => x.id !== a.id);
  if (editApp === a.id) editApp = null;
  renderAppsBadge();
  renderApps();
  renderAppForm();
}

function openApp(id) {
  editApp = id;
  renderApps();
  renderAppForm();
  if (matchMedia("(max-width: 1080px)").matches) $("appForm").scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function renderAppForm() {
  const a = S.apps.find((x) => x.id === editApp);
  $("appFormTitle").textContent = a ? appLabel(a) || "공고 수정" : "공고 추가";
  $("apSave").textContent = a ? "저장" : "추가";
  $("apCancel").hidden = !a;
  $("apDel").hidden = !a;
  $("apJump").hidden = !a;
  $("apCompany").value = a ? a.company || "" : "";
  $("apRole").value = a ? a.role || "" : "";
  $("apDeadline").value = a ? a.deadline || "" : "";
  $("apStage").value = a && a.stage !== "추천" ? a.stage : "관심";
  $("apSource").value = a && JOB_SOURCES.includes(a.source) ? a.source : a ? "기타" : "사람인";
  $("apKind").value = a && JOB_KINDS.includes(a.kind) ? a.kind : "신입 공채";
  $("apUrl").value = a ? a.url || "" : "";
  $("apMemo").value = a ? a.memo || "" : "";
  $("apFit").hidden = !(a && a.fit);
  $("apFit").textContent = a && a.fit ? `서치팀 의견: ${a.fit}` : "";
  $("apMsg").textContent = "";
}

$("appsFilter").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-f]");
  if (!b) return;
  appsFilter = b.dataset.f;
  $("appsNote").textContent = "";
  renderApps();
});
$("apCancel").addEventListener("click", () => { editApp = null; renderApps(); renderAppForm(); $("apCompany").focus(); });
$("apSave").addEventListener("click", async () => {
  const company = $("apCompany").value.trim();
  const role = $("apRole").value.trim();
  if (!company && !role) {
    $("apMsg").textContent = "회사나 직무 중 하나는 적어 주세요.";
    $("apMsg").className = "note grow err";
    return;
  }
  const url = $("apUrl").value.trim();
  if (url && !/^https?:\/\//.test(url)) {
    $("apMsg").textContent = "공고 링크는 http로 시작하는 주소만 넣을 수 있습니다.";
    $("apMsg").className = "note grow err";
    return;
  }
  const prev = S.apps.find((x) => x.id === editApp);
  const a = {
    ...(prev || { id: "a-" + Date.now().toString(36), createdAt: new Date().toISOString(), by: "원준" }),
    company, role, url,
    deadline: $("apDeadline").value || "",
    stage: $("apStage").value,
    source: $("apSource").value,
    kind: $("apKind").value,
    memo: $("apMemo").value.trim(),
    updatedAt: new Date().toISOString(),
  };
  const ok = await WorkStore.put("apps", a);
  if (ok) S.apps = prev ? S.apps.map((x) => (x.id === a.id ? a : x)) : S.apps.concat(a);
  editApp = ok ? a.id : editApp;
  if (ok && appsFilter !== "live" && LIVE_STAGES.includes(a.stage)) appsFilter = "live";
  renderAppsBadge();
  renderApps();
  renderAppForm();
  $("apMsg").textContent = ok ? (prev ? "저장했습니다." : "추가했습니다. 비서가 마감 3일 전부터 알려 줍니다.") : "저장하지 못했습니다.";
  $("apMsg").className = ok ? "note grow" : "note grow err";
});
let delArmed = 0;
$("apDel").addEventListener("click", async () => {
  const a = S.apps.find((x) => x.id === editApp);
  if (!a) return;
  if (!delArmed) {
    $("apDel").textContent = "정말 삭제";
    $("apDel").classList.add("danger");
    delArmed = setTimeout(() => { delArmed = 0; $("apDel").textContent = "삭제"; $("apDel").classList.remove("danger"); }, 3000);
    return;
  }
  clearTimeout(delArmed);
  delArmed = 0;
  $("apDel").textContent = "삭제";
  $("apDel").classList.remove("danger");
  await dropApp(a);
});
$("apReview").addEventListener("click", () => {
  const a = S.apps.find((x) => x.id === editApp);
  if (!a) return;
  practiceMode = "review";
  showView("practice");
  $("rvApp").value = "app:" + a.id;
  syncTargetInputs();
  $("rvText").focus();
});
$("apInterview").addEventListener("click", () => {
  const a = S.apps.find((x) => x.id === editApp);
  if (!a) return;
  practiceMode = "interview";
  showView("practice");
  $("ivTarget").value = "app:" + a.id;
  syncTargetInputs();
});

// ----- 서치팀 standing order to look for postings
const HUNT_ID = "t-jobs";
function huntTask() {
  return S.tasks.find((t) => t.id === HUNT_ID) || null;
}
function renderHunt() {
  const t = huntTask();
  const on = t && t.active !== false;
  const r = S.heads.find((h) => h.id === "h-research") || S.heads.find((h) => !h.secretary && !h.auditor);
  $("huntInfo").textContent = `${r ? `${r.name} ${r.title}` : "서치팀"}이 사람인, 링커리어, 잡코리아, 원티드, 캐치, 자소설닷컴과 회사 채용 페이지에서 원준 님 조건(서울·경기·인천, 신입·인턴, 희망 직무)에 맞고 마감이 남은 공고를 찾아 서치팀 추천에 넣습니다. ${on ? "지금은 매주 월요일 아침에 찾습니다." : "지금은 꺼져 있습니다."}`;
  $("huntToggle").textContent = on ? "매주 찾기 끄기" : "매주 찾기 켜기";
  $("huntToggle").hidden = !S.db;
  $("huntNow").hidden = !S.db;
  if (!S.db) $("huntNote").textContent = "공고 찾기는 claude.ai 링크로 열었을 때만 됩니다.";
}
async function ensureHunt(active) {
  const r = S.heads.find((h) => h.id === "h-research") || S.heads.find((h) => !h.secretary && !h.auditor);
  let t = huntTask();
  if (!t) {
    t = { id: HUNT_ID, kind: "jobs", headId: r ? r.id : "h-research", title: "맞는 채용 공고 찾기", instruction: "원준 님 프로필에 맞는 신입·인턴 공고와 공모전을 찾아 지원 현황의 서치팀 추천에 넣어 주세요. 마감이 지난 공고, 서울·경기·인천 밖의 공고, 경력 3년 이상만 받는 공고는 빼 주세요.", refs: "", repeat: "weekly", weekday: 1, createdAt: new Date().toISOString(), lastPeriod: null, active };
  } else {
    t = { ...t, active };
  }
  const ok = await WorkStore.put("tasks", t);
  if (ok) S.tasks = S.tasks.some((x) => x.id === t.id) ? S.tasks.map((x) => (x.id === t.id ? t : x)) : S.tasks.concat(t);
  return ok ? t : null;
}
$("huntToggle").addEventListener("click", async () => {
  const t = huntTask();
  const on = !(t && t.active !== false);
  const saved = await ensureHunt(on);
  $("huntNote").textContent = saved ? (on ? "켰습니다. 매주 월요일 아침에 찾습니다." : "껐습니다.") : "저장하지 못했습니다.";
  $("huntNote").className = saved ? "note grow" : "note grow err";
  renderHunt();
  renderWorkBadge();
});
$("huntNow").addEventListener("click", async () => {
  $("huntNow").disabled = true;
  let t = huntTask();
  if (!t || t.active === false) t = await ensureHunt(true);
  if (!t) {
    $("huntNow").disabled = false;
    $("huntNote").textContent = "저장하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.";
    $("huntNote").className = "note grow err";
    return;
  }
  t.requestedAt = new Date().toISOString();
  await WorkStore.put("tasks", t);
  const code = await kickReporter();
  $("huntNow").disabled = false;
  const h = headById(t.headId);
  $("huntNote").textContent = code === "ok" ? `${h ? josa(`${h.name} ${h.title}`, "이", "가") : "서치팀이"} 공고를 찾기 시작했습니다. 5~10분 뒤 서치팀 추천에 들어옵니다.` : kickCopy(code, "").replace("업무로 등록했습니다. ", "요청을 남겼습니다. ");
  $("huntNote").className = code === "ok" ? "note grow" : "note grow err";
  renderWorkBadge();
});

// =========================================================================
// 연습: 첨삭
// =========================================================================
let practiceMode = "review";
let openReview = null;
let openInterview = null;

function analystHead() {
  return S.heads.find((h) => h.id === "h-judge") || S.heads.find((h) => !h.secretary && !h.auditor) || S.heads[0];
}
function editorHead() {
  return S.heads.find((h) => h.id === "h-pr") || S.heads.find((h) => h.auditor) || analystHead();
}

function targetOptions(presets) {
  const opts = [];
  for (const a of liveApps().concat(S.apps.filter((x) => x.stage === "추천"))) opts.push([`app:${a.id}`, `${appLabel(a)}${a.deadline ? ` (${dLabel(a.deadline)})` : ""}`]);
  for (const p of presets) opts.push([`preset:${p}`, p]);
  opts.push(["custom", "직접 입력"]);
  return opts;
}
function targetFrom(sel, custom) {
  const v = $(sel).value;
  if (v.startsWith("app:")) {
    const a = S.apps.find((x) => x.id === v.slice(4));
    return a ? { label: appLabel(a), app: a } : { label: "" };
  }
  if (v.startsWith("preset:")) return { label: v.slice(7) };
  return { label: $(custom).value.trim() };
}
function syncTargetInputs() {
  $("rvTargetWrap").hidden = $("rvApp").value !== "custom";
  $("ivCustomWrap").hidden = $("ivTarget").value !== "custom";
}
$("rvApp").addEventListener("change", syncTargetInputs);
$("ivTarget").addEventListener("change", syncTargetInputs);

function renderPractice() {
  for (const b of $("practiceSeg").querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.p === practiceMode));
  $("p-review").hidden = practiceMode !== "review";
  $("p-interview").hidden = practiceMode !== "interview";
  const rvKeep = $("rvApp").value;
  fillSelect($("rvApp"), [["none", "정하지 않음"], ...targetOptions([])]);
  if ([...$("rvApp").options].some((o) => o.value === rvKeep)) $("rvApp").value = rvKeep;
  const ivKeep = $("ivTarget").value;
  fillSelect($("ivTarget"), targetOptions(IV_PRESETS));
  if ([...$("ivTarget").options].some((o) => o.value === ivKeep)) $("ivTarget").value = ivKeep;
  const whoKeep = $("ivWho").value;
  fillSelect($("ivWho"), S.heads.filter((h) => !h.secretary).map((h) => [h.id, `${h.name} ${h.title}`]), whoKeep || analystHead()?.id);
  syncTargetInputs();
  const an = analystHead(), ed = editorHead();
  $("rvWho").textContent = `${an.name} ${josa(an.title, "이", "가")} 인사 담당자 눈으로 점수를 매기고, ${ed.name} ${josa(ed.title, "이", "가")} 문장을 고칩니다.`;
  rvCount();
  renderReviewHistory();
  renderReviewDetail();
  renderInterviewHistory();
  renderInterviewDetail();
}
$("practiceSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-p]");
  if (!b) return;
  practiceMode = b.dataset.p;
  renderPractice();
});

function rvCount() {
  const n = $("rvText").value.length;
  const nos = $("rvText").value.replace(/\s/g, "").length;
  $("rvCount").textContent = n ? `공백 포함 ${n.toLocaleString()}자 · 공백 제외 ${nos.toLocaleString()}자` : "";
}
$("rvText").addEventListener("input", rvCount);

function analysisPrompt(job) {
  const h = analystHead();
  return `${companyLine()}

${appsBlock()}

너는 ${h.title} ${h.name}이다. ${h.role}
너의 관점: ${h.persona}
말투: ${HARSH[h.harsh] || HARSH[5]}
지금 원준 님이 쓴 ${job.kind}를 실제 서류 심사처럼 평가한다. 지원하는 곳: ${job.target || "정하지 않음(원준 님 희망 직무 기준으로 본다)"}.
${job.question ? `문항: ${job.question}` : ""}

[평가 기준]
- 서류 심사관이 30초 안에 읽고 다음 단계로 넘길지 정하는 눈으로 본다.
- 이 회사와 직무에 맞는 경험이 숫자와 결과로 보이는지, 남들과 다른 점이 있는지, 문항에 답하고 있는지 본다.
- 프로필에 있는 사실과 다르거나 부풀린 내용은 반드시 짚는다.
- 점수는 100점 만점. 70점 미만은 서류 탈락으로 본다. 후하게 주지 않는다.

${RULES}

[원준 님이 쓴 글]
${job.text}

JSON 객체 하나로만 답하라:
{"score":0~100 정수,"verdict":"통과" 또는 "보류" 또는 "탈락","first":"심사관이 처음 30초 동안 받은 인상 한 문장","drops":["떨어지는 이유, 가장 큰 것부터 최대 3개, 각 80자 이내"],"keeps":["살릴 점 최대 2개, 각 60자 이내"],"fit":"이 회사·직무와 맞는 정도 한 문장"}`;
}

function proofPrompt(job, an) {
  const h = editorHead();
  return `${companyLine()}

너는 ${h.title} ${h.name}이다. ${h.role}
너의 관점: ${h.persona}
말투: ${HARSH[h.harsh] || HARSH[5]}
원준 님의 ${job.kind}를 최종 검수한다. 지원하는 곳: ${job.target || "정하지 않음"}.
${job.question ? `문항: ${job.question}` : ""}

[분석팀 평가]
${an.score}점, ${an.verdict}. 떨어지는 이유: ${an.drops.join(" / ")}

[할 일]
1. 오탈자, 맞춤법, 띄어쓰기, 어색한 문장, 같은 말 반복, 근거 없는 형용사를 고친다.
2. 분석팀이 말한 떨어지는 이유를 문장 단위로 해결한다. 단, 원준 님이 하지 않은 경험이나 숫자를 지어내지 않는다. 숫자가 필요하면 [숫자 확인: ...] 처럼 빈칸으로 남긴다.
3. 원문의 분량을 크게 바꾸지 않는다. 문항에 글자 수 제한이 있으면 지킨다.
4. edits의 before는 원문에 실제로 있는 문장을 한 글자도 바꾸지 않고 그대로 옮긴다.

${RULES}

[원준 님이 쓴 글]
${job.text}

JSON 객체 하나로만 답하라:
{"pass":"통과" 또는 "반려","summary":"검수 결과 한두 문장","edits":[{"before":"원문 그대로","after":"고친 문장","why":"고친 이유, 40자 이내"}] (가장 중요한 것부터 최대 8개),"revised":"모든 수정을 반영한 전체 글"}`;
}

function cleanAnalysis(r) {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const v = str(r.verdict, 6);
  return {
    score: clamp(Math.round(Number(r.score) || 0), 0, 100),
    verdict: v.includes("통과") ? "통과" : v.includes("탈락") ? "탈락" : "보류",
    first: str(r.first, 160),
    drops: (Array.isArray(r.drops) ? r.drops : []).map((x) => str(x, 120)).filter(Boolean).slice(0, 3),
    keeps: (Array.isArray(r.keeps) ? r.keeps : []).map((x) => str(x, 90)).filter(Boolean).slice(0, 2),
    fit: str(r.fit, 160),
  };
}
function cleanProof(r, text) {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const edits = (Array.isArray(r.edits) ? r.edits : [])
    .map((e) => ({ before: txt(e && e.before, 400), after: txt(e && e.after, 500), why: str(e && e.why, 80) }))
    .filter((e) => e.before && e.after && e.before !== e.after)
    .slice(0, 8);
  return {
    pass: str(r.pass, 4).includes("통과") ? "통과" : "반려",
    summary: str(r.summary, 240),
    edits: edits.map((e) => ({ ...e, found: text.includes(e.before) })),
    revised: txt(r.revised, 7000),
  };
}

let reviewBusy = false;
$("rvGo").addEventListener("click", async () => {
  if (reviewBusy) return;
  const text = txt($("rvText").value, 6000);
  const note = $("rvNote");
  if (S.mode !== "claude" && S.mode !== "api") {
    note.textContent = "AI가 연결되어야 첨삭할 수 있습니다. claude.ai 링크로 열거나 팀 관리에서 API 키를 넣어 주세요.";
    note.className = "note grow err";
    return;
  }
  if (text.length < 80) {
    note.textContent = "첨삭할 글을 80자 이상 붙여 넣어 주세요.";
    note.className = "note grow err";
    $("rvText").focus();
    return;
  }
  const appSel = $("rvApp").value;
  const t = appSel === "none" ? { label: "" } : targetFrom("rvApp", "rvTarget");
  const prev = S.reviews.find((x) => x.id === openReview && x.revised && txt(x.revised, 6000) === text);
  const job = { kind: $("rvKind").value, target: t.label, appId: t.app ? t.app.id : null, question: str($("rvQuestion").value, 300), text };
  reviewBusy = true;
  $("rvGo").disabled = true;
  const an = analystHead(), ed = editorHead();
  const meter = newMeter();
  try {
    S.thinking.add(an.id);
    note.className = "note grow";
    note.textContent = `${an.name} ${josa(an.title, "이", "가")} 서류 심사관 눈으로 읽는 중입니다.`;
    showSkeleton();
    const a = cleanAnalysis(await AI.json(analysisPrompt(job), undefined, meter));
    S.thinking.delete(an.id);
    S.thinking.add(ed.id);
    note.textContent = `${a.score}점. ${ed.name} ${josa(ed.title, "이", "가")} 문장을 고치는 중입니다.`;
    const p = cleanProof(await AI.json(proofPrompt(job, a), undefined, meter), text);
    const rv = {
      id: "v-" + Date.now().toString(36),
      at: new Date().toISOString(),
      ...job,
      parentId: prev ? prev.id : null,
      round: prev ? (prev.round || 1) + 1 : 1,
      analyst: `${an.name} ${an.title}`,
      editor: `${ed.name} ${ed.title}`,
      analysis: a,
      proof: p,
      revised: p.revised,
      usage: meter.calls ? { ...meter, usd: meterCost(meter) } : null,
    };
    const ok = await WorkStore.put("reviews", rv);
    S.reviews.unshift(rv);
    openReview = rv.id;
    note.textContent = ok ? "" : "결과를 저장하지 못했습니다. 이 화면을 닫기 전에 복사해 두세요.";
    note.className = ok ? "note grow" : "note grow err";
  } catch (e) {
    note.textContent = `첨삭을 받지 못했습니다. ${errCopy(e)}`;
    note.className = "note grow err";
  } finally {
    S.thinking.delete(an.id);
    S.thinking.delete(ed.id);
    reviewBusy = false;
    $("rvGo").disabled = false;
    renderReviewHistory();
    renderReviewDetail();
    if (openReview && matchMedia("(max-width: 1080px)").matches) $("rvDetail").scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
  }
});

function showSkeleton() {
  const box = $("rvDetail");
  box.innerHTML = '<div class="skel-block" aria-label="첨삭하는 중"><i></i><i></i><i></i><i></i></div>';
}

function renderReviewHistory() {
  const ul = $("rvHistory");
  ul.innerHTML = "";
  if (!S.reviews.length) {
    ul.innerHTML = '<li class="empty"><b>아직 첨삭 기록이 없습니다</b>글을 붙여 넣고 첨삭 받기를 누르세요. 고친 글로 다시 첨삭하면 점수가 어떻게 바뀌는지 여기 남습니다.</li>';
    return;
  }
  for (const r of S.reviews.slice(0, 30)) {
    const li = document.createElement("li");
    li.className = "unit mitem";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.dataset.picked = openReview === r.id ? "1" : "0";
    const left = document.createElement("div");
    left.style.minWidth = "0";
    const ag = document.createElement("p");
    ag.className = "ag";
    ag.textContent = `${r.target || r.kind}${r.round > 1 ? ` · ${r.round}번째 고친 글` : ""}`;
    const dt = document.createElement("div");
    dt.className = "dt";
    dt.textContent = `${r.kind} · ${fmtDate(r.at)}`;
    left.append(ag, dt);
    const sc = document.createElement("span");
    sc.className = "score-pill";
    sc.dataset.v = r.analysis.verdict;
    sc.textContent = `${r.analysis.score}점`;
    li.append(left, sc);
    const open = () => { openReview = openReview === r.id ? null : r.id; renderReviewHistory(); renderReviewDetail(); };
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    ul.append(li);
  }
}

function headPortrait(name) {
  const h = S.heads.find((x) => `${x.name} ${x.title}` === name);
  const cv = document.createElement("canvas");
  drawPortrait(cv, h ? h.look : EXT_AUDIT_LOOK);
  return cv;
}

function renderReviewDetail() {
  const box = $("rvDetail");
  if (reviewBusy && box.querySelector(".skel-block")) return;
  const r = S.reviews.find((x) => x.id === openReview);
  box.innerHTML = "";
  if (!r) {
    box.innerHTML = '<div class="empty"><b>첨삭 결과가 여기에 나옵니다</b>점수와 떨어지는 이유, 문장별 수정, 고친 전체 글을 차례로 보여 줍니다.</div>';
    return;
  }
  const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; box.append(el); return el; };
  const a = r.analysis, p = r.proof;
  const parent = r.parentId && S.reviews.find((x) => x.id === r.parentId);

  const head = document.createElement("div");
  head.className = "score-head";
  const big = document.createElement("div");
  big.className = "score-big";
  big.dataset.v = a.verdict;
  big.innerHTML = `<b>${a.score}</b><span>점</span>`;
  const hr = document.createElement("div");
  hr.style.minWidth = "0";
  const ttl = document.createElement("h2");
  ttl.textContent = r.target ? `${r.target} ${r.kind}` : r.kind;
  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = `서류 ${a.verdict}${parent ? ` · 지난번 ${parent.analysis.score}점에서 ${a.score - parent.analysis.score >= 0 ? "+" : ""}${a.score - parent.analysis.score}점` : ""} · ${fmtDate(r.at)}`;
  hr.append(ttl, meta);
  head.append(big, hr);
  box.append(head);
  if (r.question) add("p", `문항: ${r.question}`, "muted");

  const who = (name, label) => {
    const row = document.createElement("div");
    row.className = "who-row";
    row.append(headPortrait(name));
    const t = document.createElement("h3");
    t.textContent = `${name} · ${label}`;
    row.append(t);
    box.append(row);
  };
  who(r.analyst, "서류 심사");
  if (a.first) add("p", a.first, "lead");
  if (a.drops.length) {
    add("h3", "떨어지는 이유");
    const ol = document.createElement("ol");
    for (const x of a.drops) { const li = document.createElement("li"); li.textContent = x; ol.append(li); }
    box.append(ol);
  }
  if (a.keeps.length) {
    add("h3", "살릴 점");
    const ul = document.createElement("ul");
    for (const x of a.keeps) { const li = document.createElement("li"); li.textContent = x; ul.append(li); }
    box.append(ul);
  }
  if (a.fit) { add("h3", "직무와 맞는 정도"); add("p", a.fit); }

  who(r.editor, `검수 ${p.pass}`);
  if (p.summary) add("p", p.summary);
  if (p.edits.length) {
    const ol = document.createElement("ol");
    ol.className = "edits";
    for (const e of p.edits) {
      const li = document.createElement("li");
      const del = document.createElement("del");
      del.textContent = e.before;
      const ins = document.createElement("ins");
      ins.textContent = e.after;
      const why = document.createElement("span");
      why.className = "why";
      why.textContent = e.why + (e.found ? "" : " (원문에서 정확히 찾지 못한 문장)");
      li.append(del, ins, why);
      ol.append(li);
    }
    box.append(ol);
  }
  if (r.revised) {
    add("h3", "고친 글");
    const pre = add("p", r.revised, "revised");
    pre.tabIndex = 0;
    add("p", `공백 포함 ${r.revised.length.toLocaleString()}자 (원문 ${r.text.length.toLocaleString()}자)`, "muted");
  }
  if (r.usage) add("p", "사용량: " + meterLine(r.usage), "muted");

  const row = document.createElement("div");
  row.className = "row-actions";
  const note = document.createElement("p");
  note.className = "note grow";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "btn small primary";
  again.textContent = "고친 글로 다시 첨삭";
  again.disabled = !r.revised;
  again.addEventListener("click", () => {
    $("rvText").value = r.revised;
    $("rvKind").value = r.kind;
    $("rvQuestion").value = r.question || "";
    if (r.appId && [...$("rvApp").options].some((o) => o.value === "app:" + r.appId)) $("rvApp").value = "app:" + r.appId;
    else if (r.target) { $("rvApp").value = "custom"; $("rvTarget").value = r.target; }
    syncTargetInputs();
    rvCount();
    $("rvNote").textContent = "고친 글을 넣었습니다. 손볼 곳을 직접 고친 뒤 첨삭 받기를 누르세요.";
    $("rvNote").className = "note grow";
    $("rvText").focus();
    $("rvForm").scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
  const cp = document.createElement("button");
  cp.type = "button";
  cp.className = "btn small";
  cp.textContent = "고친 글 복사";
  cp.disabled = !r.revised;
  cp.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(r.revised); note.textContent = "복사했습니다."; }
    catch { note.textContent = "복사하지 못했습니다. 고친 글을 직접 선택해 복사하세요."; }
  });
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn small";
  del.textContent = "삭제";
  let armed = 0;
  del.addEventListener("click", async () => {
    if (!armed) { del.textContent = "정말 삭제"; del.classList.add("danger"); armed = setTimeout(() => { armed = 0; del.textContent = "삭제"; del.classList.remove("danger"); }, 3000); return; }
    clearTimeout(armed);
    await WorkStore.del("reviews", r.id);
    S.reviews = S.reviews.filter((x) => x.id !== r.id);
    openReview = null;
    renderReviewHistory();
    renderReviewDetail();
  });
  row.append(again, cp, del, note);
  box.append(row);
}

// =========================================================================
// 모의 면접: staged at the meeting table
// =========================================================================
function interviewer() {
  return S.heads.find((h) => h.id === $("ivWho").value) || analystHead();
}

function ivPrompt(iv, phase) {
  const h = headById(iv.headId) || analystHead();
  const hard = iv.mode === "hard";
  const log = iv.turns.map((t, i) => `Q${i + 1}. ${t.q}\nA${i + 1}. ${t.a || "(답 없음)"}${t.fb ? `\n(피드백 ${t.fb.score}/5)` : ""}`).join("\n\n");
  const head = `${companyLine()}

${appsBlock(4)}

너는 ${h.title} ${h.name}이다. 지금은 팀장이 아니라 "${iv.target}" 면접관 역할을 맡아 원준 님과 모의 면접을 한다.
너의 관점: ${h.persona}
면접 강도: ${hard ? "압박 면접. 답의 허점을 바로 파고드는 꼬리 질문, 불편한 질문을 한다. 하지만 인신공격은 하지 않는다." : "실전과 같은 보통 면접. 정중하지만 대충 넘어가지 않는다."}
질문은 모두 ${iv.count}개. 원준 님 프로필에 있는 실제 경험(동아리, 아르바이트, AI 영상 작업, 공모전)을 근거로 묻는다. 지원 동기, 직무 이해, 경험 검증, 상황 질문을 골고루 섞는다.
면접관 말투는 존댓말. 질문은 한 번에 하나, 2문장 이내.

${RULES}

[지금까지 면접]
${log || "(아직 질문 전)"}`;
  if (phase === "first") {
    return `${head}

첫 질문을 하라. 보통 짧은 자기소개나 지원 동기로 시작한다.
JSON 객체 하나로만 답하라: {"q":"첫 질문"}`;
  }
  if (phase === "turn") {
    const last = iv.turns[iv.turns.length - 1];
    const more = iv.turns.length < iv.count;
    return `${head}

방금 원준 님이 Q${iv.turns.length}에 답했다. 실제 면접관처럼 이 답을 평가하라.
- score: 1~5 (3이면 무난, 4는 다른 지원자보다 낫다, 5는 거의 없다).
- good: 잘한 점 한 문장. 없으면 빈 문자열.
- bad: 면접관이 아쉬워할 점 한 문장.
- better: 이렇게 답했으면 좋았을 방향 한두 문장. 모범 답안을 통째로 쓰지 말고 방향만.
${more ? `- next: 다음 질문. 방금 답이 약했으면 그 답을 파고드는 꼬리 질문을 해도 된다.` : `- next: 빈 문자열 (마지막 질문이었다).`}

[방금 질문] ${last.q}
[원준 님 답] ${last.a}

JSON 객체 하나로만 답하라: {"score":1~5,"good":"","bad":"","better":"","next":""}`;
  }
  return `${head}

면접이 끝났다. 면접관으로서 최종 평가를 내려라. 후하게 주지 않는다.
JSON 객체 하나로만 답하라:
{"total":0~100 정수,"verdict":"합격권" 또는 "경계" 또는 "탈락권","say":"면접관의 마지막 한마디 2문장","strengths":["강점 최대 2개, 각 60자 이내"],"weaknesses":["약점 최대 3개, 가장 큰 것부터, 각 70자 이내"],"homework":["다음 면접 전까지 할 연습 최대 3개, 각 60자 이내"]}`;
}

let ivBusy = false;

function renderIvLog() {
  const iv = S.iv;
  const ol = $("ivLog");
  ol.innerHTML = "";
  if (!iv) { ol.hidden = true; return; }
  const h = headById(iv.headId);
  const line = (cls, who, text) => {
    const li = document.createElement("li");
    li.className = cls;
    const b = document.createElement("b");
    b.textContent = who;
    const p = document.createElement("span");
    p.textContent = text;
    li.append(b, p);
    ol.append(li);
  };
  iv.turns.forEach((t, i) => {
    line("them", `Q${i + 1}`, t.q);
    if (t.a) line("me", "나", t.a);
    if (t.fb) line("fb", `${t.fb.score}/5`, [t.fb.good && `좋음: ${t.fb.good}`, t.fb.bad && `아쉬움: ${t.fb.bad}`, t.fb.better && `방향: ${t.fb.better}`].filter(Boolean).join("\n"));
  });
  ol.hidden = !iv.turns.length;
  ol.scrollTop = ol.scrollHeight;
  const asked = iv.turns.length;
  $("ivTitle").textContent = `모의 면접: ${iv.target}`;
  $("ivProgress").textContent = iv.done ? `끝 · ${iv.result ? iv.result.total + "점" : ""}` : `${h ? `면접관 ${h.name}` : ""} · 질문 ${Math.min(asked, iv.count)}/${iv.count}`;
  const waiting = !iv.done && iv.turns.length && !iv.turns[iv.turns.length - 1].a;
  $("ivAnswer").disabled = !waiting || ivBusy;
  $("ivSend").disabled = !waiting || ivBusy;
  $("ivAnswerRow").hidden = !!iv.done;
  $("ivEnd").hidden = !!iv.done;
  $("ivResult").hidden = !iv.done || !iv.result;
  $("ivLeave").hidden = !iv.done;
}

$("ivStart").addEventListener("click", async () => {
  const note = $("ivStartNote");
  if (S.m || S.iv) { note.textContent = "회의나 면접이 끝난 뒤에 시작할 수 있습니다."; note.className = "note grow err"; return; }
  if (S.mode !== "claude" && S.mode !== "api") {
    note.textContent = "AI가 연결되어야 모의 면접을 할 수 있습니다.";
    note.className = "note grow err";
    return;
  }
  const t = targetFrom("ivTarget", "ivCustom");
  if (!t.label) { note.textContent = "면접 볼 곳을 적어 주세요."; note.className = "note grow err"; $("ivCustom").focus(); return; }
  const h = interviewer();
  note.textContent = "";
  S.talkTo = null;
  S.iv = {
    id: "i-" + Date.now().toString(36),
    at: new Date().toISOString(),
    target: t.label,
    appId: t.app ? t.app.id : null,
    headId: h.id,
    interviewer: `${h.name} ${h.title}`,
    count: Number($("ivCount").value) || 5,
    mode: $("ivMode").value,
    turns: [],
    meter: newMeter(),
  };
  showView("room");
  showConsole("iv");
  $("ivNote").textContent = "";
  renderIvLog();
  renderUnits();
  Dialogue.plain(h, `${h.name} ${josa(h.title, "이", "가")} 면접 자리로 갑니다. 맞은편에 앉아 주세요.`, []);
  await Office.gatherInterview(h);
  if (!S.iv) return;
  await ivAsk("first");
});

async function ivAsk(phase) {
  const iv = S.iv;
  if (!iv || ivBusy) return;
  const h = headById(iv.headId) || analystHead();
  ivBusy = true;
  renderIvLog();
  S.thinking.add(h.id);
  Dialogue.thinking(h, phase === "end" ? "면접관이 점수를 정리하고 있습니다." : "면접관이 질문을 고르고 있습니다.");
  try {
    const r = await AI.json(ivPrompt(iv, phase), undefined, iv.meter);
    if (S.iv !== iv) return;
    S.thinking.delete(h.id);
    if (phase === "first") {
      const q = str(r && r.q, 300);
      if (!q) throw { code: "invalid_json" };
      iv.turns.push({ q, a: "", fb: null });
      ivBusy = false;
      renderIvLog();
      $("ivAnswer").focus({ preventScroll: true });
      await talkShow(h, q, [{ k: "질문", v: `1/${iv.count}` }]);
    } else if (phase === "turn") {
      const last = iv.turns[iv.turns.length - 1];
      last.fb = { score: clamp(Math.round(Number(r && r.score) || 3), 1, 5), good: str(r && r.good, 160), bad: str(r && r.bad, 160), better: str(r && r.better, 240) };
      const next = str(r && r.next, 300);
      const more = iv.turns.length < iv.count && next;
      if (more) iv.turns.push({ q: next, a: "", fb: null });
      ivBusy = false;
      renderIvLog();
      if (more) {
        $("ivAnswer").focus({ preventScroll: true });
        await talkShow(h, next, [{ chip: last.fb.score >= 4 ? "찬성" : last.fb.score <= 2 ? "반대" : "조건부", label: `방금 답 ${last.fb.score}/5` }, { k: "질문", v: `${iv.turns.length}/${iv.count}` }]);
      } else {
        await ivAsk("end");
      }
    } else {
      const v = str(r && r.verdict, 6);
      iv.result = {
        total: clamp(Math.round(Number(r && r.total) || 0), 0, 100),
        verdict: v.includes("합격") ? "합격권" : v.includes("탈락") ? "탈락권" : "경계",
        say: str(r && r.say, 300),
        strengths: (Array.isArray(r && r.strengths) ? r.strengths : []).map((x) => str(x, 90)).filter(Boolean).slice(0, 2),
        weaknesses: (Array.isArray(r && r.weaknesses) ? r.weaknesses : []).map((x) => str(x, 100)).filter(Boolean).slice(0, 3),
        homework: (Array.isArray(r && r.homework) ? r.homework : []).map((x) => str(x, 90)).filter(Boolean).slice(0, 3),
      };
      iv.done = true;
      ivBusy = false;
      await saveInterview(iv);
      renderIvLog();
      await talkShow(h, `${iv.result.say || "면접을 마치겠습니다."}\n${iv.result.total}점, ${iv.result.verdict}입니다.`, [{ chip: iv.result.verdict === "합격권" ? "찬성" : iv.result.verdict === "탈락권" ? "반대" : "조건부", label: iv.result.verdict }]);
    }
  } catch (e) {
    S.thinking.delete(h.id);
    if (S.iv !== iv) return;
    ivBusy = false;
    renderIvLog();
    $("ivNote").textContent = `면접관 답을 받지 못했습니다. ${errCopy(e)}`;
    $("ivNote").className = "note grow err";
    Dialogue.plain(h, "잠시 연결이 끊겼습니다. 답하기를 다시 누르거나 면접을 끝내 주세요.", []);
    if (phase === "turn") { const last = iv.turns[iv.turns.length - 1]; if (last && !last.fb) last.retry = true; $("ivSend").disabled = false; $("ivAnswer").disabled = false; }
  } finally {
    S.thinking.delete(h.id);
    ivBusy = false;
  }
}

async function ivSend() {
  const iv = S.iv;
  if (!iv || ivBusy || iv.done) return;
  const last = iv.turns[iv.turns.length - 1];
  if (!last) return;
  const a = txt($("ivAnswer").value, 2000);
  if (last.retry && last.a) { last.retry = false; $("ivNote").textContent = ""; await ivAsk("turn"); return; }
  if (a.length < 5) { $("ivNote").textContent = "답을 조금 더 적어 주세요."; $("ivNote").className = "note grow err"; return; }
  $("ivNote").textContent = "";
  last.a = a;
  $("ivAnswer").value = "";
  S.speaker = "ceo";
  renderIvLog();
  await ivAsk("turn");
}
$("ivSend").addEventListener("click", ivSend);
$("ivAnswer").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ivSend(); } });

$("ivEnd").addEventListener("click", async () => {
  const iv = S.iv;
  if (!iv || ivBusy) return;
  const answered = iv.turns.filter((t) => t.a && t.fb).length;
  if (answered >= 2) {
    iv.turns = iv.turns.filter((t) => t.a);
    iv.count = iv.turns.length;
    await ivAsk("end");
  } else {
    leaveInterview();
  }
});
$("ivLeave").addEventListener("click", leaveInterview);
$("ivResult").addEventListener("click", () => {
  const id = S.iv && S.iv.id;
  leaveInterview();
  practiceMode = "interview";
  openInterview = id;
  showView("practice");
});

function leaveInterview() {
  S.iv = null;
  S.speaker = null;
  S.thinking.clear();
  Dialogue.cancel();
  Office.dismiss();
  showConsole("talk");
  renderTalk();
  renderUnits();
  greet();
}

async function saveInterview(iv) {
  const rec = {
    id: iv.id, at: iv.at, target: iv.target, appId: iv.appId, interviewer: iv.interviewer, headId: iv.headId,
    mode: iv.mode, count: iv.count, turns: iv.turns.map(({ q, a, fb }) => ({ q, a, fb })), result: iv.result,
    usage: iv.meter && iv.meter.calls ? { ...iv.meter, usd: meterCost(iv.meter) } : null,
  };
  const ok = await WorkStore.put("interviews", rec);
  S.interviews = [rec].concat(S.interviews.filter((x) => x.id !== rec.id));
  $("ivNote").textContent = ok ? "면접 기록을 연습 탭에 남겼습니다." : "면접 기록을 저장하지 못했습니다.";
  $("ivNote").className = ok ? "note grow" : "note grow err";
}

function renderInterviewHistory() {
  const ul = $("ivHistory");
  ul.innerHTML = "";
  if (!S.interviews.length) {
    ul.innerHTML = '<li class="empty"><b>아직 면접 기록이 없습니다</b>면접 볼 곳을 고르고 면접 시작을 누르세요. 끝나면 점수와 약점, 다음 연습 과제가 여기에 남습니다.</li>';
    return;
  }
  for (const r of S.interviews.slice(0, 30)) {
    const li = document.createElement("li");
    li.className = "unit mitem";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.dataset.picked = openInterview === r.id ? "1" : "0";
    const left = document.createElement("div");
    left.style.minWidth = "0";
    const ag = document.createElement("p");
    ag.className = "ag";
    ag.textContent = r.target;
    const dt = document.createElement("div");
    dt.className = "dt";
    dt.textContent = `${r.interviewer} · ${r.mode === "hard" ? "압박" : "실전"} · ${fmtDate(r.at)}`;
    left.append(ag, dt);
    const sc = document.createElement("span");
    sc.className = "score-pill";
    sc.dataset.v = r.result ? r.result.verdict : "";
    sc.textContent = r.result ? `${r.result.total}점` : "중단";
    li.append(left, sc);
    const open = () => { openInterview = openInterview === r.id ? null : r.id; renderInterviewHistory(); renderInterviewDetail(); };
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    ul.append(li);
  }
}

function renderInterviewDetail() {
  const box = $("ivDetail");
  const r = S.interviews.find((x) => x.id === openInterview);
  box.innerHTML = "";
  if (!r) {
    box.innerHTML = '<div class="empty"><b>면접 결과가 여기에 나옵니다</b>질문과 내 답, 질문마다 받은 피드백, 최종 점수와 다음 연습 과제를 보여 줍니다.</div>';
    return;
  }
  const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; box.append(el); return el; };
  const res = r.result;
  const head = document.createElement("div");
  head.className = "score-head";
  const big = document.createElement("div");
  big.className = "score-big";
  big.dataset.v = res ? res.verdict : "";
  big.innerHTML = res ? `<b>${res.total}</b><span>점</span>` : "<b>-</b>";
  const hr = document.createElement("div");
  hr.style.minWidth = "0";
  const ttl = document.createElement("h2");
  ttl.textContent = r.target;
  const meta = document.createElement("p");
  meta.className = "muted";
  const prev = S.interviews.find((x) => x.id !== r.id && x.target === r.target && x.at < r.at && x.result);
  meta.textContent = `${res ? res.verdict : "중단"} · 면접관 ${r.interviewer}${prev && res ? ` · 지난번 ${prev.result.total}점에서 ${res.total - prev.result.total >= 0 ? "+" : ""}${res.total - prev.result.total}점` : ""} · ${fmtDate(r.at)}`;
  hr.append(ttl, meta);
  head.append(big, hr);
  box.append(head);
  if (res) {
    if (res.say) add("p", res.say, "lead");
    const list = (title, items, tag = "ul") => {
      if (!items || !items.length) return;
      add("h3", title);
      const l = document.createElement(tag);
      for (const x of items) { const li = document.createElement("li"); li.textContent = x; l.append(li); }
      box.append(l);
    };
    list("약점", res.weaknesses, "ol");
    list("강점", res.strengths);
    list("다음 면접 전까지", res.homework);
  }
  add("h3", "질문별 기록");
  const ol = document.createElement("ol");
  ol.className = "qa";
  for (const t of r.turns) {
    const li = document.createElement("li");
    const q = document.createElement("p");
    q.className = "q";
    q.textContent = t.q;
    const a = document.createElement("p");
    a.className = "a";
    a.textContent = t.a || "(답하지 않음)";
    li.append(q, a);
    if (t.fb) {
      const f = document.createElement("p");
      f.className = "f";
      f.dataset.s = String(t.fb.score);
      f.textContent = `${t.fb.score}/5. ${[t.fb.bad, t.fb.better && `방향: ${t.fb.better}`].filter(Boolean).join(" ")}`;
      li.append(f);
    }
    ol.append(li);
  }
  box.append(ol);
  if (r.usage) add("p", "사용량: " + meterLine(r.usage), "muted");
  const row = document.createElement("div");
  row.className = "row-actions";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "btn small primary";
  again.textContent = "같은 곳으로 다시 면접";
  again.addEventListener("click", () => {
    if (r.appId && [...$("ivTarget").options].some((o) => o.value === "app:" + r.appId)) $("ivTarget").value = "app:" + r.appId;
    else if ([...$("ivTarget").options].some((o) => o.value === "preset:" + r.target)) $("ivTarget").value = "preset:" + r.target;
    else { $("ivTarget").value = "custom"; $("ivCustom").value = r.target; }
    if ([...$("ivWho").options].some((o) => o.value === r.headId)) $("ivWho").value = r.headId;
    syncTargetInputs();
    $("ivStart").click();
  });
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn small";
  del.textContent = "삭제";
  let armed = 0;
  del.addEventListener("click", async () => {
    if (!armed) { del.textContent = "정말 삭제"; del.classList.add("danger"); armed = setTimeout(() => { armed = 0; del.textContent = "삭제"; del.classList.remove("danger"); }, 3000); return; }
    clearTimeout(armed);
    await WorkStore.del("interviews", r.id);
    S.interviews = S.interviews.filter((x) => x.id !== r.id);
    openInterview = null;
    renderInterviewHistory();
    renderInterviewDetail();
  });
  row.append(again, del);
  box.append(row);
}

// =========================================================================
// After a meeting: turn the outcome into tasks
// =========================================================================
let meetingActs = [];

function actionsPrompt(m) {
  const team = S.heads.filter((h) => !h.auditor).map((h) => `- ${h.title} ${h.name} (id: ${h.id}): ${h.role.split(".")[0]}.`).join("\n");
  return `${companyLine()}

방금 끝난 회의의 결과를 팀원들의 업무로 나눈다.

[안건] ${m.agenda}
[CEO 결재] ${DECISION[m.decision.k]}${m.decision.memo ? `. 메모: ${m.decision.memo}` : ""}
[감사 판정] ${m.audit ? `${m.audit.verdict}. 조건: ${m.audit.conditions.join(" / ") || "없음"}. 중단 기준: ${m.audit.killCriteria.join(" / ") || "없음"}` : "없음"}

[팀원]
${team}

[규칙]
- 1~4개. 결재가 기각이면 "왜 안 되는지 정리"나 "대안 찾기"처럼 다음에 쓸 수 있는 일만 낸다.
- 팀원이 할 수 있는 일은 조사, 정리, 초안, 점검, 계획뿐이다. 실제로 만들고 지원하는 사람은 원준 님이다.
- 각 업무는 보고서 하나로 끝나는 크기로 쪼갠다. 지시는 2문장 이내, 무엇을 보고할지 분명하게.

${RULES}

JSON 객체 하나로만 답하라: {"actions":[{"headId":"","title":"20자 이내","instruction":""}]}`;
}

async function proposeActions(m) {
  meetingActs = [];
  const box = $("actBox");
  box.hidden = true;
  if (!m || !m.decision) return;
  let acts = [];
  if (m.demo || (S.mode !== "claude" && S.mode !== "api")) {
    const plan = S.heads.find((h) => h.id === "h-plan") || S.heads.find((h) => !h.auditor && !h.secretary);
    acts = (m.audit?.conditions || []).slice(0, 3).map((c) => ({ headId: plan.id, title: str(c, 20), instruction: `회의 조건 "${c}"을 어떻게 맞출지 정리해 주세요.` }));
  } else {
    $("actNote").textContent = "회의 결과를 업무로 나누는 중입니다.";
    box.hidden = false;
    $("actList").innerHTML = "";
    $("actSave").disabled = true;
    try {
      const r = await AI.json(actionsPrompt(m), undefined, m.meter, { tier: "quick" });
      acts = (Array.isArray(r && r.actions) ? r.actions : []).slice(0, 4).map((a) => ({ headId: findHead(S.heads, a && a.headId)?.id || "h-plan", title: str(a && a.title, 40), instruction: str(a && a.instruction, 400) })).filter((a) => a.title && a.instruction);
    } catch {
      acts = [];
    }
  }
  if (S.m !== m) return;
  meetingActs = acts.map((a) => ({ ...a, pick: true }));
  renderActs();
}

function renderActs() {
  const box = $("actBox");
  box.hidden = !meetingActs.length;
  $("actSave").disabled = false;
  $("actNote").textContent = "";
  const ul = $("actList");
  ul.innerHTML = "";
  meetingActs.forEach((a, i) => {
    const li = document.createElement("li");
    const l = document.createElement("label");
    l.className = "toggle";
    const c = document.createElement("input");
    c.type = "checkbox";
    c.checked = a.pick;
    c.addEventListener("change", () => { a.pick = c.checked; });
    const h = headById(a.headId);
    const t = document.createElement("span");
    t.textContent = `${a.title} → ${h ? `${h.name} ${h.title}` : "담당 미정"}`;
    const d = document.createElement("span");
    d.className = "t";
    d.textContent = a.instruction;
    l.append(c, t);
    li.append(l, d);
    ul.append(li);
    if (a.saved) { c.disabled = true; t.textContent += " (등록함)"; }
  });
}

$("actSave").addEventListener("click", async () => {
  const picks = meetingActs.filter((a) => a.pick && !a.saved);
  if (!picks.length) { $("actNote").textContent = "등록할 일을 골라 주세요."; return; }
  $("actSave").disabled = true;
  let n = 0;
  for (const a of picks) {
    const t = { id: "t-" + Date.now().toString(36) + n, headId: a.headId, title: a.title, instruction: a.instruction, refs: S.m ? `회의 안건: ${S.m.agenda}` : "", repeat: "once", weekday: 0, createdAt: new Date().toISOString(), lastPeriod: null, active: true, fromMeeting: S.m ? S.m.id : null };
    if (await WorkStore.put("tasks", t)) {
      if (!S.tasks.some((x) => x.id === t.id)) S.tasks.push(t);
      a.saved = true;
      n++;
    }
  }
  renderWorkBadge();
  renderActs();
  if (!n) { $("actNote").textContent = "업무를 저장하지 못했습니다."; $("actNote").className = "note grow err"; return; }
  const code = S.db ? await kickReporter() : "local";
  $("actNote").textContent = code === "ok" ? `${n}건을 업무로 등록했고 조사를 시작했습니다. 보고는 업무 탭으로 들어옵니다.` : code === "local" ? `${n}건을 업무로 등록했습니다. 업무 탭에서 지금 받기를 누르세요.` : kickCopy(code, "");
  $("actNote").className = code === "ok" || code === "local" ? "note grow" : "note grow err";
});
