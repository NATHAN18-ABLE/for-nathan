// ---------------------------------------------------------------------------
// 업무 지시: standing orders to department heads, and the reports they file.
// Scheduled reports are written by a cloud reporter (Claude Code scheduled task)
// that researches the web and writes into the same db; "지금 받기" writes one
// here, without web access, and says so.
// ---------------------------------------------------------------------------

// ----- dates in KST
function kstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}
function kstWeekday(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).getUTCDay();
}
// A report day starts at 07:00 KST, so opening the app at 1 a.m. doesn't make
// the morning briefing "due" before there is any morning news.
const DAY_START_H = 7;
function periodFor(t, now = new Date()) {
  if (t.repeat === "once") return "once";
  const day = new Date(now.getTime() - DAY_START_H * 3600e3);
  if (t.repeat === "daily") return kstDate(day);
  const back = (kstWeekday(day) - (t.weekday | 0) + 7) % 7;
  return kstDate(new Date(day.getTime() - back * 864e5));
}
// requestedAt: 원준 pressed 웹으로 받기, so the cloud reporter should do it now
// whatever the schedule says.
// A request stamp that is always later than the last report, even if the
// cloud reporter's clock ran a little ahead of this browser's.
function stampAfter(prev) {
  return new Date(Math.max(Date.now(), (Date.parse(prev || "") || 0) + 1000)).toISOString();
}
function isRequested(t) {
  return !!t.requestedAt && (!t.lastReportAt || t.requestedAt > t.lastReportAt);
}
function isDue(t, now = new Date()) {
  if (t.active === false) return false;
  if (isRequested(t)) return true;
  const p = periodFor(t, now);
  if (t.lastPeriod === p) return false;
  if (p === "once") return true;
  return kstDate(new Date(t.createdAt || 0)) <= p;
}
function dayLabel(ymd) {
  const d = new Date(ymd + "T00:00:00Z");
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}
function repeatLabel(t) {
  if (t.repeat === "once") return "한 번만";
  if (t.repeat === "daily") return "매일";
  return `매주 ${WEEKDAYS[t.weekday | 0]}요일`;
}
function nextLabel(t) {
  if (isRequested(t) || (t.kind === "ask" && isDue(t))) return "웹으로 조사 중";
  if (isDue(t)) return "보고할 차례";
  if (t.repeat === "once") return t.lastPeriod ? "보고 완료" : "보고할 차례";
  if (t.repeat === "daily") return "다음 보고: 내일 아침";
  const p = periodFor(t);
  const next = t.lastPeriod === p || kstDate(new Date(t.createdAt || 0)) > p ? new Date(new Date(p + "T00:00:00Z").getTime() + 7 * 864e5).toISOString().slice(0, 10) : p;
  return `다음 보고: ${dayLabel(next)}`;
}

// ----- storage
const WorkStore = {
  col(kind) { return S.db.collection(`data/users/${S.uid}/${kind}/list`); },
  async list(kind) {
    if (S.db) {
      try {
        const q = await this.col(kind).get();
        return q.docs.map((d) => ({ ...d.data(), id: d.id }));
      } catch { return []; }
    }
    return LS.get("boardroom." + kind, kind === "tasks" ? null : []);
  },
  async put(kind, doc) {
    if (S.db) {
      try { await this.col(kind).doc(doc.id).set(clone(doc)); return true; } catch { return false; }
    }
    const all = (LS.get("boardroom." + kind, []) || []).filter((x) => x.id !== doc.id);
    all.unshift(doc);
    return LS.set("boardroom." + kind, all.slice(0, 200));
  },
  async del(kind, id) {
    if (S.db) {
      try { await this.col(kind).doc(id).delete(); return true; } catch { return false; }
    }
    return LS.set("boardroom." + kind, (LS.get("boardroom." + kind, []) || []).filter((x) => x.id !== id));
  },
};

async function loadWork() {
  let tasks = await WorkStore.list("tasks");
  if (!S.db && tasks === null) {
    // first local run: start with the three standing orders
    const now = new Date().toISOString();
    tasks = DEFAULT_TASKS.map((t) => ({ ...t, createdAt: now, active: true, lastPeriod: null }));
    LS.set("boardroom.tasks", tasks);
  }
  S.tasks = (tasks || []).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  S.reports = (await WorkStore.list("reports")).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  $("reporterNote").textContent = S.db
    ? "정기 보고는 클라우드 조사원이 매일 아침 8시 52분(한국 시간)에 보고할 차례인 업무를 웹으로 조사해서 여기에 넣습니다. 이 화면을 열어 두지 않아도 됩니다. 한 번만 하는 업무와 대화 중 웹으로 알아봐는 바로 시작합니다."
    : "내 컴퓨터에서 실행 중이라 정기 보고가 자동으로 들어오지 않습니다. 업무 옆의 지금 받기를 누르세요.";
  renderWorkBadge();
  if (!$("view-work").hidden) renderWork();
  deliverAnswers();
  watchWork();
}

// Reports and task updates written by the cloud reporter show up while the
// page is open. Subscribed once; later loadWork() calls only re-read.
let workWatched = false;
function watchWork() {
  if (!S.db || workWatched) return;
  workWatched = true;
  WorkStore.col("reports").onSnapshot((snap) => {
    const fresh = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    const had = new Set(S.reports.map((r) => r.id));
    const keep = new Map(S.reports.map((r) => [r.id, r]));
    // keep a local read mark that hasn't round-tripped yet
    S.reports = fresh.map((r) => (keep.get(r.id)?.read && !r.read ? { ...r, read: true } : r)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (S.openReport && !S.reports.some((r) => r.id === S.openReport)) S.openReport = null;
    renderWorkBadge();
    if (!$("view-work").hidden) { renderReports(); renderReportDetail(); }
    if (fresh.some((r) => !had.has(r.id))) deliverAnswers();
  }, () => { workWatched = false; });
  WorkStore.col("tasks").onSnapshot((snap) => {
    S.tasks = snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    renderWorkBadge();
    if (!$("view-work").hidden) renderTasks();
    deliverAnswers();
  }, () => {});
}

// ----- web questions. The page itself can't browse, so a question from a 1:1
// talk becomes a one-off task, and the cloud reporter (a Claude Code
// scheduled task with web search) is started right away through the
// Claude Code Remote connector. Its answer comes back as a report, and a
// short version is dropped into that member's chat.
const REPORTER_TRIGGER = "trig_011jdky5Vph2QbSjmDYTzDBh";

async function kickReporter() {
  if (!S.mcp) return "no_mcp";
  try {
    await S.mcp.callTool("Claude Code Remote", "fire_trigger", { trigger_id: REPORTER_TRIGGER }, { cache: false });
    return "ok";
  } catch (e) {
    return (e && e.code) || "upstream_error";
  }
}

function kickCopy(code, who) {
  const later = "그대로 두면 내일 아침 정기 보고 때 처리됩니다.";
  switch (code) {
    case "ok": return `${who} 웹으로 조사를 시작했습니다. 보통 5~10분 뒤 보고함에 들어오고, 이 대화에도 답이 남습니다.`;
    case "no_mcp": return `업무로 등록했습니다. 이 화면에서는 클라우드 조사를 바로 시작할 수 없어서 ${later}`;
    case "server_not_connected":
    case "needs_reauth": return `업무로 등록했습니다. 바로 시작하려면 claude.ai 설정 → 커넥터에서 Claude Code Remote를 연결해 주세요. ${later}`;
    case "approval_required":
    case "not_in_manifest":
    case "consent_required": return `업무로 등록했습니다. 바로 시작하려면 Claude Code Remote 사용을 허용해야 합니다. 웹으로 알아봐를 다시 누르면 다시 묻습니다. ${later}`;
    case "server_unavailable":
    case "upstream_error": return "업무로 등록했습니다. 조사가 시작됐는지 확실하지 않습니다. 10분 뒤에도 보고가 없으면 웹으로 알아봐를 다시 눌러 주세요.";
    default: return `업무로 등록했습니다. 클라우드 조사를 시작하지 못했습니다 (${code}). ${later}`;
  }
}

function isAskReport(r) {
  return String(r.taskId || "").startsWith("w-") || (S.tasks.find((t) => t.id === r.taskId) || {}).kind === "ask";
}

function pendingAsks(headId) {
  return S.tasks.filter((t) => t.kind === "ask" && isDue(t) && (!headId || t.headId === headId));
}

async function askWeb(h, question, context) {
  const t = {
    id: "w-" + Date.now().toString(36),
    kind: "ask",
    headId: h.id,
    title: "웹 조사: " + str(question.replace(/\s+/g, " "), 18),
    instruction: question,
    refs: context,
    repeat: "once",
    weekday: 0,
    createdAt: new Date().toISOString(),
    lastPeriod: null,
    active: true,
  };
  if (!(await WorkStore.put("tasks", t))) return "save_failed";
  if (!S.tasks.some((x) => x.id === t.id)) S.tasks.push(t);
  renderWorkBadge();
  return kickReporter();
}

// Drop each finished web answer into the asker's chat, once.
let delivering = false;
async function deliverAnswers() {
  if (delivering) return;
  delivering = true;
  try {
    for (const t of S.tasks.filter((x) => x.kind === "ask" && x.lastPeriod && !x.answered)) {
      const r = S.reports.find((x) => x.taskId === t.id);
      const h = headById(t.headId);
      if (!r || !h) continue;
      t.answered = true;
      await WorkStore.put("tasks", t);
      await Chat.load(h.id);
      const tail = h.secretary ? `자세한 건 보고함 "${r.title}"에 올려 놨어.` : `자세한 내용은 보고함 "${r.title}"에 올렸습니다.`;
      const text = `${r.summary || r.title}\n${tail}`;
      await Chat.push(h.id, { role: "head", text, at: new Date().toISOString(), reportId: r.id });
      if (S.talkTo === h.id) {
        renderTalk();
        if (!talkBusy && !S.m) talkShow(h, text, [{ chip: "찬성", label: "웹 조사 결과" }]);
      }
    }
  } finally {
    delivering = false;
  }
}

function unreadFor(headId) {
  return S.reports.filter((r) => !r.read && (!headId || r.headId === headId));
}
function renderWorkBadge() {
  const n = unreadFor().length;
  const due = S.tasks.filter((t) => isDue(t)).length;
  const b = $("workBadge");
  b.hidden = !(n || due);
  b.textContent = n ? String(n) : "!";
  b.title = n ? `새 보고 ${n}건` : `보고할 차례 ${due}건`;
  if (typeof renderToday === "function") renderToday();
}

function headById(id) {
  return S.heads.find((h) => h.id === id) || null;
}

// ----- report generation without web access ("지금 받기")
function reportPrompt(t, h) {
  return `${companyLine()}

너는 이 팀의 ${h.title} ${h.name}이다. 원준 님이 맡긴 업무의 보고서를 쓴다.
너의 담당: ${h.role}
너의 관점: ${h.persona}
말투: ${HARSH[h.harsh] || HARSH[4]}

[업무]
${t.title}
${t.instruction}
${t.refs ? `\n[원준 님이 준 참고 자료]\n${t.refs}\n` : ""}
[오늘 날짜] ${kstDate()}

[정보의 한계: 반드시 지킨다]
- 너는 지금 인터넷을 볼 수 없다. 네가 학습한 내용과 위의 참고 자료만 쓸 수 있다.
- 그래서 "이번 주 소식"이라고 단정하지 않는다. 언제 나온 정보인지 모르면 "시점 확인 필요"라고 쓴다.
- 링크를 지어내지 않는다. sources에는 참고 자료에 실제로 있던 링크만 넣고, 없으면 빈 배열로 둔다.

${RULES}

JSON 객체 하나로만 답하라:
{"title":"보고서 제목, 30자 이내","summary":"한 줄 요약, 80자 이내","points":[{"title":"핵심 내용 제목, 25자 이내","body":"2~3문장"}],"forUs":"원준 님 취업 준비에 무슨 뜻인지 2~3문장","actions":[{"what":"이번 주에 해 볼 일","cost":"예상 크레딧과 시간"}],"caveats":"확인이 필요한 것 1~2문장","sources":[{"title":"","url":""}]}
points는 3~5개, actions는 1~3개.`;
}

function cleanReport(r) {
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const points = (Array.isArray(r.points) ? r.points : []).map((p) => ({ title: str(p && p.title, 60), body: str(p && p.body, 400) })).filter((p) => p.title || p.body).slice(0, 6);
  if (!points.length && !r.summary) throw { code: "invalid_json" };
  return {
    title: str(r.title, 60) || "보고서",
    summary: str(r.summary, 160),
    points,
    forUs: str(r.forUs, 400),
    actions: (Array.isArray(r.actions) ? r.actions : []).map((a) => ({ what: str(a && a.what, 160), cost: str(a && a.cost, 80) })).filter((a) => a.what).slice(0, 4),
    caveats: str(r.caveats, 300),
    sources: (Array.isArray(r.sources) ? r.sources : []).map((x) => ({ title: str(x && x.title, 120), url: str(x && x.url, 400) })).filter((x) => /^https?:\/\//.test(x.url)).slice(0, 10),
  };
}

async function writeReportNow(t) {
  const h = headById(t.headId);
  if (!h || S.writing.has(t.id)) return;
  if (S.mode !== "claude" && S.mode !== "api") {
    $("workNote").textContent = "AI가 연결되지 않아 보고서를 쓸 수 없습니다. claude.ai 링크로 열거나 API 키를 넣어 주세요.";
    $("workNote").className = "note err";
    return;
  }
  S.writing.add(t.id);
  renderWork();
  const meter = newMeter();
  try {
    await refreshHF(true);
    const r = cleanReport(await AI.json(reportPrompt(t, h), undefined, meter));
    const rep = {
      id: "r-" + Date.now().toString(36),
      taskId: t.id,
      headId: h.id,
      headName: `${h.name} ${h.title}`,
      at: new Date().toISOString(),
      period: null,
      source: "model",
      read: false,
      usage: meter.calls ? { ...meter, usd: meterCost(meter) } : null,
      ...r,
    };
    await WorkStore.put("reports", rep);
    S.reports.unshift(rep);
    S.openReport = rep.id;
    $("workNote").textContent = "";
  } catch (e) {
    $("workNote").textContent = `${h.name} ${h.title}의 보고서를 받지 못했습니다. ${errCopy(e)}`;
    $("workNote").className = "note err";
  } finally {
    S.writing.delete(t.id);
    renderWork();
    renderWorkBadge();
  }
}

async function requestWeb(t) {
  const h = headById(t.headId);
  if (!h) return;
  const note = $("workNote");
  if (!isRequested(t) && !(t.kind === "ask" && isDue(t))) {
    t.requestedAt = stampAfter(t.lastReportAt);
    if (!(await WorkStore.put("tasks", t))) {
      delete t.requestedAt;
      note.textContent = "업무를 저장하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.";
      note.className = "note err";
      return;
    }
    renderTasks();
    renderWorkBadge();
  }
  const code = await kickReporter();
  note.textContent = kickCopy(code, josa(h.secretary ? h.name : `${h.name} ${h.title}`, "이", "가")).replace("업무로 등록했습니다. ", "요청을 남겼습니다. ").replace("이 대화에도 답이 남습니다", "새 보고가 오면 머리 위에 봉투가 뜹니다");
  note.className = code === "ok" ? "note" : "note err";
}

// ----- rendering
function renderWork() {
  renderTasks();
  renderReports();
  renderReportDetail();
  renderTaskForm();
}

function renderTasks() {
  const ul = $("taskList");
  ul.innerHTML = "";
  const tasks = S.tasks.filter((t) => !(t.kind === "ask" && t.lastPeriod));
  $("workCount").textContent = tasks.length ? `${tasks.length}건` : "";
  if (!tasks.length) {
    ul.innerHTML = '<li class="empty"><b>맡긴 업무가 없습니다</b>아래에서 팀장을 고르고 업무를 지시하세요. 매주 정해진 요일에 보고가 들어옵니다.</li>';
    return;
  }
  for (const t of tasks) {
    const h = headById(t.headId);
    const li = document.createElement("li");
    li.className = "task";
    const cv = document.createElement("canvas");
    drawPortrait(cv, h ? h.look : EXT_AUDIT_LOOK);
    const mid = document.createElement("div");
    mid.className = "task-mid";
    const ttl = document.createElement("div");
    ttl.className = "n";
    ttl.textContent = t.title;
    const meta = document.createElement("div");
    meta.className = "t";
    meta.textContent = `${repeatLabel(t)} · ${h ? `${h.name} ${h.title}` : "담당자 없음"}`;
    const st = document.createElement("div");
    st.className = "t";
    const due = isDue(t);
    st.textContent = nextLabel(t);
    if (due) st.style.color = "var(--amber)";
    mid.append(ttl, meta, st);
    const acts = document.createElement("div");
    acts.className = "task-acts";
    const now = document.createElement("button");
    now.type = "button";
    now.className = "btn small" + (due ? " primary" : "");
    const busy = S.writing.has(t.id);
    if (S.db) {
      // on claude.ai the cloud reporter can search the web, so ask it instead
      // of writing a no-web report here
      const asked = isRequested(t) || (t.kind === "ask" && due);
      now.textContent = asked ? "조사 중" : "웹으로 받기";
      now.disabled = busy || !h;
      now.addEventListener("click", () => requestWeb(t));
    } else {
      now.textContent = busy ? "작성 중" : "지금 받기";
      now.disabled = busy || !h;
      now.addEventListener("click", () => writeReportNow(t));
    }
    const ed = document.createElement("button");
    ed.type = "button";
    ed.className = "btn small";
    ed.textContent = "수정";
    ed.addEventListener("click", () => { S.editTask = t.id; renderTaskForm(); $("tkTitle").focus({ preventScroll: false }); });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn small";
    del.textContent = "삭제";
    let armed = 0;
    del.addEventListener("click", async () => {
      if (!armed) { del.textContent = "정말 삭제"; del.classList.add("danger"); armed = setTimeout(() => { armed = 0; del.textContent = "삭제"; del.classList.remove("danger"); }, 3000); return; }
      clearTimeout(armed);
      await WorkStore.del("tasks", t.id);
      S.tasks = S.tasks.filter((x) => x.id !== t.id);
      if (S.editTask === t.id) S.editTask = null;
      renderWork();
      renderWorkBadge();
    });
    acts.append(now, ed, del);
    li.append(cv, mid, acts);
    ul.append(li);
  }
}

function renderReports() {
  const ul = $("reportList");
  ul.innerHTML = "";
  if (!S.reports.length) {
    ul.innerHTML = '<li class="empty"><b>아직 들어온 보고가 없습니다</b>정해진 날이 되면 클라우드 조사원이 웹을 조사해서 여기에 넣습니다. 지금 바로 보려면 업무 옆의 버튼을 누르세요.</li>';
    return;
  }
  for (const r of S.reports) {
    const li = document.createElement("li");
    li.className = "unit mitem";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.dataset.picked = S.openReport === r.id ? "1" : "0";
    const left = document.createElement("div");
    left.style.minWidth = "0";
    const ag = document.createElement("p");
    ag.className = "ag";
    ag.textContent = r.title;
    const dt = document.createElement("div");
    dt.className = "dt";
    dt.textContent = `${r.headName || ""} · ${fmtDate(r.at)}`;
    left.append(ag, dt);
    const tags = document.createElement("div");
    tags.className = "tags";
    if (!r.read) tags.append(chip("새 보고", "조건부"));
    tags.append(chip(r.source === "web" ? "웹 조사" : "웹 검색 없음", r.source === "web" ? "찬성" : "결석"));
    li.append(left, tags);
    const open = () => openReport(r.id);
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    ul.append(li);
  }
}

function chip(text, s) {
  const c = document.createElement("span");
  c.className = "chip";
  c.dataset.s = s;
  c.textContent = text;
  return c;
}

async function openReport(id) {
  S.openReport = S.openReport === id ? null : id;
  const r = S.reports.find((x) => x.id === id);
  if (r && !r.read && S.openReport === id) {
    r.read = true;
    WorkStore.put("reports", r);
    renderWorkBadge();
  }
  renderReports();
  renderReportDetail();
  if (S.openReport && matchMedia("(max-width: 1080px)").matches) $("reportDetail").scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function renderReportDetail() {
  const box = $("reportDetail");
  const r = S.reports.find((x) => x.id === S.openReport);
  if (!r) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = "";
  const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; box.append(el); return el; };
  const h = headById(r.headId);
  const head = document.createElement("div");
  head.className = "report-head";
  const cv = document.createElement("canvas");
  drawPortrait(cv, h ? h.look : EXT_AUDIT_LOOK);
  const hr = document.createElement("div");
  hr.style.minWidth = "0";
  const ttl = document.createElement("h2");
  ttl.textContent = r.title;
  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = `${r.headName || ""} · ${fmtDate(r.at)} · ${r.source === "web" ? "웹 조사 보고" : "웹 검색 없이 작성 (학습한 내용 기준)"}`;
  hr.append(ttl, meta);
  head.append(cv, hr);
  box.append(head);
  if (r.summary) add("p", r.summary, "lead");
  for (const p of r.points || []) {
    add("h3", p.title);
    add("p", p.body);
  }
  if (r.forUs) { add("h3", "우리에게 의미"); add("p", r.forUs); }
  if (r.actions?.length) {
    add("h3", "이번 주에 해 볼 일");
    const ul = document.createElement("ul");
    for (const a of r.actions) { const li = document.createElement("li"); li.textContent = a.cost ? `${a.what} (${a.cost})` : a.what; ul.append(li); }
    box.append(ul);
  }
  if (r.caveats) { add("h3", "확인 필요"); add("p", r.caveats); }
  if (r.sources?.length) {
    add("h3", "출처");
    const ul = document.createElement("ul");
    for (const x of r.sources) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = x.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = x.title || x.url;
      li.append(a);
      ul.append(li);
    }
    box.append(ul);
  }
  if (r.usage) add("p", "사용량: " + meterLine(r.usage), "muted");

  const row = document.createElement("div");
  row.className = "row-actions";
  const note = document.createElement("p");
  note.className = "note grow";
  const cp = document.createElement("button");
  cp.type = "button";
  cp.className = "btn small";
  cp.textContent = "복사";
  cp.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(reportMarkdown(r)); note.textContent = "복사했습니다."; }
    catch { note.textContent = "복사하지 못했습니다. 내용을 직접 선택해 복사하세요."; }
  });
  const dl = document.createElement("button");
  dl.type = "button";
  dl.className = "btn small";
  dl.textContent = "마크다운으로 내려받기";
  dl.addEventListener("click", async () => {
    note.textContent = (await saveFile(`보고서-${r.at.slice(0, 10)}-${r.id}.md`, reportMarkdown(r))) ? "" : "이 화면에서는 파일을 내려받을 수 없습니다. 복사해서 쓰세요.";
  });
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn small";
  del.textContent = "삭제";
  let armed = 0;
  del.addEventListener("click", async () => {
    if (!armed) { del.textContent = "정말 삭제"; del.classList.add("danger"); armed = setTimeout(() => { armed = 0; del.textContent = "삭제"; del.classList.remove("danger"); }, 3000); return; }
    clearTimeout(armed);
    await WorkStore.del("reports", r.id);
    S.reports = S.reports.filter((x) => x.id !== r.id);
    S.openReport = null;
    renderWork();
    renderWorkBadge();
  });
  row.append(cp, dl, del, note);
  box.append(row);
}

function reportMarkdown(r) {
  const L = [`# ${r.title}`, "", `- 보고: ${r.headName || ""}`, `- 날짜: ${fmtDate(r.at)}`, `- 방식: ${r.source === "web" ? "웹 조사" : "웹 검색 없이 작성"}`, ""];
  if (r.summary) L.push(r.summary, "");
  for (const p of r.points || []) L.push(`## ${p.title}`, "", p.body, "");
  if (r.forUs) L.push("## 우리에게 의미", "", r.forUs, "");
  if (r.actions?.length) { L.push("## 이번 주에 해 볼 일", ""); r.actions.forEach((a) => L.push(`- ${a.what}${a.cost ? ` (${a.cost})` : ""}`)); L.push(""); }
  if (r.caveats) L.push("## 확인 필요", "", r.caveats, "");
  if (r.sources?.length) { L.push("## 출처", ""); r.sources.forEach((x) => L.push(`- [${x.title || x.url}](${x.url})`)); }
  return L.join("\n") + "\n";
}

// ----- task form
function renderTaskForm() {
  const sel = $("tkHead");
  const keep = sel.value;
  sel.innerHTML = "";
  for (const h of S.heads) {
    const o = document.createElement("option");
    o.value = h.id;
    o.textContent = `${h.name} ${h.title}`;
    sel.append(o);
  }
  const t = S.tasks.find((x) => x.id === S.editTask);
  $("taskFormTitle").textContent = t ? "업무 수정" : "새 업무 지시";
  $("tkSave").textContent = t ? "수정 저장" : "업무 지시";
  $("tkCancel").hidden = !t;
  if (t && $("taskForm").dataset.loaded !== t.id) {
    $("taskForm").dataset.loaded = t.id;
    sel.value = t.headId;
    $("tkRepeat").value = t.repeat;
    $("tkDay").value = String(t.weekday ?? 1);
    $("tkTitle").value = t.title;
    $("tkInst").value = t.instruction;
    $("tkRefs").value = t.refs || "";
  } else if (!t) {
    if ($("taskForm").dataset.loaded) {
      $("taskForm").dataset.loaded = "";
      for (const id of ["tkTitle", "tkInst", "tkRefs"]) $(id).value = "";
    }
    if (keep && S.heads.some((h) => h.id === keep)) sel.value = keep;
  }
  $("tkDayWrap").hidden = $("tkRepeat").value !== "weekly";
}

$("tkRepeat").addEventListener("change", () => { $("tkDayWrap").hidden = $("tkRepeat").value !== "weekly"; });
$("tkCancel").addEventListener("click", () => { S.editTask = null; renderTaskForm(); });
$("tkSave").addEventListener("click", async () => {
  const title = $("tkTitle").value.trim();
  const instruction = $("tkInst").value.trim();
  if (!title || !instruction) {
    $("tkNote").textContent = "업무 이름과 지시 내용을 적어 주세요.";
    $("tkNote").className = "note grow err";
    return;
  }
  const prev = S.tasks.find((x) => x.id === S.editTask);
  const t = {
    ...(prev || { id: "t-" + Date.now().toString(36), createdAt: new Date().toISOString(), lastPeriod: null, active: true }),
    headId: $("tkHead").value,
    title,
    instruction,
    refs: $("tkRefs").value.trim(),
    repeat: $("tkRepeat").value,
    weekday: Number($("tkDay").value),
  };
  const ok = await WorkStore.put("tasks", t);
  S.tasks = prev ? S.tasks.map((x) => (x.id === t.id ? t : x)) : S.tasks.concat(t);
  S.editTask = null;
  const who = headById(t.headId);
  $("tkNote").textContent = ok ? (prev ? "수정했습니다." : `${who?.name || ""} ${who?.title || ""}에게 지시했습니다.`) : "저장하지 못했습니다.";
  $("tkNote").className = ok ? "note grow" : "note grow err";
  renderWork();
  renderWorkBadge();
  if (ok && !prev && t.repeat === "once" && S.db) {
    const code = await kickReporter();
    $("tkNote").textContent = kickCopy(code, who ? josa(who.secretary ? who.name : `${who.name} ${who.title}`, "이", "가") : "팀원이").replace("업무로 등록했습니다. ", "지시했습니다. ");
    $("tkNote").className = code === "ok" ? "note grow" : "note grow err";
  }
});
$("reportRefresh").addEventListener("click", () => loadWork());

for (const [i, d] of WEEKDAYS.entries()) {
  const o = document.createElement("option");
  o.value = String(i);
  o.textContent = d + "요일";
  $("tkDay").append(o);
}
$("tkDay").value = "1";

// ----- Higgsfield: read the real credit balance and per-model spend
function summarizeSpend(items) {
  const by = new Map();
  for (const it of items || []) {
    if (it.action !== "spend") continue;
    const v = Math.abs(Number(it.credits) || 0);
    if (!v) continue;
    const k = it.display_name || "기타";
    const e = by.get(k) || { name: k, sum: 0, n: 0, min: Infinity, max: 0 };
    e.sum += v; e.n++; e.min = Math.min(e.min, v); e.max = Math.max(e.max, v);
    by.set(k, e);
  }
  return [...by.values()].sort((a, b) => b.sum - a.sum).slice(0, 6).map((e) => ({ name: e.name, avg: Math.round((e.sum / e.n) * 100) / 100, min: e.min, max: e.max, n: e.n }));
}

let hfInflight = null;
async function refreshHF(quiet) {
  if (!S.mcp) return false;
  if (hfInflight) return hfInflight;
  hfInflight = (async () => {
    try {
      const [bal, tx] = await Promise.all([
        S.mcp.callTool("higgsfield", "balance", {}),
        S.mcp.callTool("higgsfield", "transactions", { size: 50 }).catch(() => null),
      ]);
      const b = bal && bal.payload;
      if (!b || b.credits == null) return false;
      const costs = summarizeSpend(tx && tx.payload && tx.payload.items);
      S.reality.hf = { ...(S.reality.hf || {}), plan: b.subscription_plan_type || S.reality.hf?.plan, credits: Number(b.credits), at: new Date().toISOString(), costs: costs.length ? costs : S.reality.hf?.costs || [] };
      renderReality();
      queueSave();
      return true;
    } catch (e) {
      if (!quiet) { $("hfInfo").textContent = "힉스필드에서 불러오지 못했습니다. claude.ai 설정에서 힉스필드 연결을 확인하세요."; }
      return false;
    } finally {
      setTimeout(() => (hfInflight = null), 0);
    }
  })();
  return hfInflight;
}

function renderReality() {
  const r = S.reality;
  $("reTeam").value = r.team || "";
  $("reHours").value = r.hours || "";
  $("reBudget").value = r.budget || "";
  $("reCreditWon").value = r.creditWon || "";
  $("reTools").value = r.tools || "";
  const hf = r.hf || {};
  const lines = [];
  if (hf.credits != null) lines.push(`힉스필드 ${String(hf.plan || "").toUpperCase()} · 잔액 ${fmtCredits(hf.credits)}크레딧 (${hf.at ? fmtDate(hf.at) : ""} 기준)`);
  for (const c of hf.costs || []) lines.push(`${c.name}: 1번에 평균 ${fmtCredits(c.avg)}크레딧 (최근 ${c.n}번)`);
  $("hfInfo").textContent = lines.join("\n") || "아직 불러온 정보가 없습니다.";
  $("hfBtn").hidden = !S.mcp;
}

for (const [id, key] of [["reTeam", "team"], ["reHours", "hours"], ["reBudget", "budget"], ["reCreditWon", "creditWon"], ["reTools", "tools"]]) {
  $(id).addEventListener("input", () => { S.reality[key] = $(id).value.trim(); queueSave(); });
}
$("hfBtn").addEventListener("click", async () => {
  $("hfBtn").disabled = true;
  $("hfInfo").textContent = "불러오는 중입니다.";
  const ok = await refreshHF(false);
  $("hfBtn").disabled = false;
  if (!ok && $("hfInfo").textContent === "불러오는 중입니다.") renderReality();
});

boot();
