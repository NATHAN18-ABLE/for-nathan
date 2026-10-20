// ---------------------------------------------------------------------------
// 1:1 talk with one team member, the secretary's daily check-in, the profile
// tab, and the meeting call-up form.
// ---------------------------------------------------------------------------

const Chat = {
  cache: new Map(),
  col() { return S.db.collection(`data/users/${S.uid}/chats/list`); },
  async load(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    let msgs = [];
    if (S.db) {
      try {
        const snap = await this.col().doc(id).get();
        if (snap.exists) msgs = (snap.data().messages || []).slice(-40);
      } catch {}
    } else {
      msgs = LS.get("boardroom.chat." + id, []) || [];
    }
    this.cache.set(id, msgs);
    return msgs;
  },
  async push(id, msg) {
    const msgs = this.cache.get(id) || [];
    msgs.push(msg);
    while (msgs.length > 40) msgs.shift();
    this.cache.set(id, msgs);
    if (S.db) {
      try { await this.col().doc(id).set({ headId: id, messages: clone(msgs), updatedAt: new Date().toISOString() }); } catch {}
    } else {
      LS.set("boardroom.chat." + id, msgs);
    }
  },
};

function talkRules(h) {
  let r = RULES.replace("이모지, 마크다운, 목록 기호 금지.", "이모지와 마크다운 금지. 단계가 필요하면 줄을 바꾸고 1. 2. 3. 으로만 나눈다.");
  if (h.secretary) r = r.replace("회의 말투의 존댓말.", "친한 친구처럼 편한 반말.");
  else r = r.replace("회의 말투의 존댓말.", "1:1 대화의 존댓말.");
  return r;
}

function teamLines(except) {
  return S.heads.filter((x) => x.id !== except).map((x) => `- ${x.title} ${x.name} (id: ${x.id}): ${x.role.split(".")[0]}.`).join("\n");
}
function tasksOf(h) {
  return S.tasks.filter((t) => t.headId === h.id).map((t) => `- ${t.title} (${repeatLabel(t)}): ${t.instruction}`).join("\n");
}
function reportsOf(h, n = 3) {
  return S.reports.filter((r) => r.headId === h.id).slice(0, n).map((r) => `- ${fmtDate(r.at)} "${r.title}": ${r.summary}`).join("\n");
}
function chatLines(h, msgs, n = 14) {
  return msgs.slice(-n).map((m) => `${m.role === "ceo" ? "원준" : h.name}: ${m.text}`).join("\n");
}
function profileGaps() {
  const p = S.profile || {};
  return PROFILE_FIELDS.filter(([k]) => k !== "notes" && (!String(p[k] || "").trim() || /예정|확인 안 됨|모름/.test(p[k]))).map(([, label]) => label);
}

const TALK_JSON = `JSON 객체 하나로만 답하라:
{"say":"답변. 2~6문장. 단계가 필요하면 줄바꿈과 1. 2. 3.","profileNote":"원준 님이 자기 경험, 활동, 생각, 사실을 새로 알려 줬으면 프로필에 남길 한 줄 요약. 아니면 빈 문자열","task":null 또는 {"headId":"맡을 팀원 id","title":"업무 이름, 20자 이내","instruction":"지시 내용","repeat":"once 또는 daily 또는 weekly","weekday":0~6 정수(일요일 0)}}
task는 원준 님이 일을 맡기거나, 네가 제안한 일을 맡기자고 동의했을 때만 채운다. 다른 팀이 더 잘할 일이면 그 팀 id로 채운다.`;

function talkPrompt(h, msgs, text) {
  const tasks = tasksOf(h), reps = reportsOf(h);
  return `${companyLine()}

너는 이 팀의 ${h.title} ${h.name}이다. 지금 원준 님과 1:1로 대화하고 있다.
너의 담당: ${h.role}
너의 관점: ${h.persona}
말투: ${h.secretary ? "친한 친구처럼 편한 반말. 하지만 정보는 정확하게." : HARSH[h.harsh] || HARSH[4]}
${tasks ? `\n[너에게 맡겨진 업무]\n${tasks}\n` : ""}${reps ? `\n[네가 최근에 올린 보고]\n${reps}\n` : ""}
[다른 팀원]
${teamLines(h.id)}

[지금까지 대화, 오래된 것부터]
${chatLines(h, msgs) || "(처음 대화)"}

[원준 님의 새 말]
${text}

${talkRules(h)}
- 실시간 인터넷은 볼 수 없다. 최신 소식이 필요하면 서치팀이나 비서의 정기 보고로 넘기자고 말한다.

${TALK_JSON}`;
}

function checkinPrompt(h, msgs) {
  const brief = S.reports.find((r) => r.headId === h.id && kstDate(new Date(r.at)) === kstDate());
  const gaps = profileGaps();
  return `${companyLine()}

너는 이 팀의 ${h.title} ${h.name}이다. 원준 님이 오늘 처음 너를 불렀다.
너의 담당: ${h.role}
너의 관점: ${h.persona}
말투: 친한 친구처럼 편한 반말.

할 일, 이 순서로 짧게:
1. 인사 한 마디.
2. ${brief ? `오늘 브리핑 "${brief.title}"의 핵심을 한두 문장으로 전한다: ${brief.summary}` : "오늘 브리핑은 아직 안 왔다고 말한다(매일 아침 9시쯤 들어온다)."}
3. 원준 님 프로필에서 비어 있거나 덜 채워진 부분 하나를 골라 질문을 딱 하나 한다. 덜 채워진 부분: ${gaps.join(", ") || "없음. 그러면 요즘 하고 있는 작업을 묻는다"}.

[지금까지 대화, 오래된 것부터]
${chatLines(h, msgs, 8) || "(처음 대화)"}

${talkRules(h)}

${TALK_JSON}`;
}

function introLine(h) {
  if (h.secretary) return "응, 불렀어? 오늘 이슈 들을래, 아니면 부탁할 거 있어?";
  return `${h.title} ${h.name}입니다. ${h.role.split(".")[0]}. 무엇을 도와드릴까요?`;
}

async function openTalk(id) {
  if (S.m) return;
  const a = Office.get(id);
  if (!a) return;
  S.talkTo = id;
  S.suggestTask = null;
  if (a.mode === "stand" || (a.mode === "walk" && a.onArrive && !a.until)) { a.until = 0; Office.goHome(a); }
  showView("room");
  showConsole("talk");
  renderTalk();
  renderUnits();
  const h = a.h;
  const msgs = await Chat.load(id);
  if (S.talkTo !== id) return;
  renderTalk();
  const today = kstDate();
  const ai = S.mode === "claude" || S.mode === "api";
  if (h.secretary && ai && !msgs.some((m) => m.role === "head" && kstDate(new Date(m.at)) === today)) {
    await askHead(h, null);
    return;
  }
  const last = [...msgs].reverse().find((m) => m.role === "head");
  Dialogue.plain(h, last ? last.text : introLine(h), []);
}

async function talkSend() {
  const id = S.talkTo;
  const text = $("talkMsg").value.trim();
  if (!id || !text) return;
  const h = (Office.get(id) || {}).h;
  if (!h) return;
  if (S.mode !== "claude" && S.mode !== "api") {
    $("talkNote").textContent = "AI가 연결되어야 대화할 수 있습니다. claude.ai 링크로 열거나 팀 관리에서 API 키를 넣어 주세요.";
    $("talkNote").className = "note grow err";
    return;
  }
  $("talkMsg").value = "";
  await Chat.push(id, { role: "ceo", text, at: new Date().toISOString() });
  renderTalk();
  await askHead(h, text);
}

let talkBusy = false;
async function askHead(h, text) {
  if (talkBusy) return;
  talkBusy = true;
  $("talkSend").disabled = true;
  $("talkNote").textContent = "";
  S.thinking.add(h.id);
  Dialogue.thinking(h, h.secretary ? `${h.name}가 생각하는 중이야.` : `${h.name} ${h.title}이 생각하는 중입니다.`);
  try {
    const msgs = Chat.cache.get(h.id) || [];
    const meter = newMeter();
    if (S.mcp && !text) await Promise.race([refreshHF(true), sleep(3000)]);
    const r = await AI.json(text ? talkPrompt(h, msgs.slice(0, -1), text) : checkinPrompt(h, msgs), undefined, meter);
    const say = String((r && r.say) || "").trim();
    if (!say) throw { code: "invalid_json" };
    S.thinking.delete(h.id);
    await Chat.push(h.id, { role: "head", text: say, at: new Date().toISOString() });
    const meta = [];
    const note = String((r && r.profileNote) || "").trim();
    if (note) { appendProfileNote(note); meta.push({ chip: "찬성", label: "프로필에 기록함" }); }
    const t = r && r.task && typeof r.task === "object" && r.task.title ? r.task : null;
    if (t) S.suggestTask = { headId: findHead(S.heads, t.headId)?.id || h.id, title: str(t.title, 40), instruction: str(t.instruction, 800), repeat: ["once", "daily", "weekly"].includes(t.repeat) ? t.repeat : "once", weekday: clamp(Number(t.weekday) || 1, 0, 6) };
    renderTalk();
    if (S.talkTo === h.id) await talkShow(h, say, meta);
  } catch (e) {
    S.thinking.delete(h.id);
    Dialogue.plain(h, h.secretary ? "앗, 답을 못 받았어. 잠깐 뒤에 다시 말해 줘." : "답변을 받지 못했습니다. 잠시 뒤에 다시 말씀해 주세요.", []);
    $("talkNote").textContent = errCopy(e);
    $("talkNote").className = "note grow err";
  } finally {
    S.thinking.delete(h.id);
    talkBusy = false;
    $("talkSend").disabled = false;
  }
}

async function talkShow(h, text, meta) {
  Dialogue.cancel();
  S.speaker = h.id;
  Dialogue.setWho(h);
  $("skel").hidden = true;
  $("say").classList.remove("muted");
  Dialogue.setMeta(meta);
  await Dialogue.type(text);
  if (S.speaker === h.id && !S.m) S.speaker = null;
}

function appendProfileNote(note) {
  const line = `[${kstDate().slice(5).replace("-", "/")}] ${note}`;
  S.profile.notes = S.profile.notes ? `${S.profile.notes}\n${line}` : line;
  queueSave();
  if (!$("view-profile").hidden) renderProfile();
}

function renderTalk() {
  const id = S.talkTo;
  const a = id && Office.get(id);
  const h = a && a.h;
  $("talkWho").textContent = h ? `${h.name} ${h.title}` : "팀원을 누르면 그 사람과 1:1로 대화합니다";
  $("talkStatus").textContent = h ? Office.status(a) : "";
  $("talkMsg").disabled = !h;
  $("talkSend").disabled = !h || talkBusy;
  $("talkTask").disabled = !h;
  $("talkMsg").placeholder = h ? (h.secretary ? "서윤에게 편하게 말해 봐" : `${h.name} ${h.title}에게 질문하거나 일을 맡기세요`) : "먼저 사무실에서 팀원을 누르세요";
  const ol = $("talkLog");
  ol.innerHTML = "";
  const msgs = (id && Chat.cache.get(id)) || [];
  ol.hidden = !msgs.length;
  for (const m of msgs.slice(-12)) {
    const li = document.createElement("li");
    li.className = m.role === "ceo" ? "me" : "them";
    const who = document.createElement("b");
    who.textContent = m.role === "ceo" ? "나" : h ? h.name : "";
    const p = document.createElement("span");
    p.textContent = m.text;
    li.append(who, p);
    ol.append(li);
  }
  ol.scrollTop = ol.scrollHeight;
  const sg = S.suggestTask;
  $("taskSuggest").hidden = !sg;
  if (sg) {
    const who = S.heads.find((x) => x.id === sg.headId);
    $("suggestText").textContent = `${who ? `${who.name} ${who.title}` : ""}에게 "${sg.title}" (${repeatLabel(sg)})`;
  }
}

$("talkSend").addEventListener("click", talkSend);
$("talkMsg").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); talkSend(); } });
$("talkTask").addEventListener("click", () => {
  if (!S.talkTo) return;
  showView("work");
  S.editTask = null;
  renderTaskForm();
  $("tkHead").value = S.talkTo;
  $("tkTitle").focus();
});
$("convene").addEventListener("click", () => { renderConvene(); showConsole("pre"); $("agenda").focus({ preventScroll: true }); });
$("cancelConvene").addEventListener("click", () => { showConsole("talk"); renderTalk(); });
$("acceptTask").addEventListener("click", async () => {
  const sg = S.suggestTask;
  if (!sg) return;
  const t = { id: "t-" + Date.now().toString(36), createdAt: new Date().toISOString(), lastPeriod: null, active: true, refs: "", ...sg };
  const ok = await WorkStore.put("tasks", t);
  if (ok) S.tasks.push(t);
  S.suggestTask = null;
  $("talkNote").textContent = ok ? `업무로 등록했습니다. ${t.repeat === "once" ? "다음 날 아침 정기 보고 때 처리되고, 업무 탭에서 지금 받기도 할 수 있습니다." : repeatLabel(t) + " 보고가 들어옵니다."}` : "업무를 저장하지 못했습니다.";
  $("talkNote").className = ok ? "note grow" : "note grow err";
  renderTalk();
  renderWorkBadge();
});
$("dismissTask").addEventListener("click", () => { S.suggestTask = null; renderTalk(); });

// ----- statuses in the rail, refreshed while the office is on screen
function refreshStatuses() {
  if (S.m) return;
  for (const li of $("units").children) {
    const a = Office.get(li.dataset.id);
    const t = li.querySelector('[data-role="status"]');
    if (a && t) t.textContent = `${a.h.title} · ${Office.status(a)}`;
  }
  if (S.talkTo) $("talkStatus").textContent = Office.status(Office.get(S.talkTo));
  renderToday();
}

function renderToday() {
  const box = $("todayInfo");
  if (!box) return;
  const brief = S.reports.find((r) => (S.heads.find((h) => h.id === r.headId) || {}).secretary);
  const due = S.tasks.filter((t) => isDue(t)).length;
  const unread = S.reports.filter((r) => !r.read).length;
  const parts = [];
  if (brief) parts.push(`최근 브리핑: ${brief.title} (${fmtDate(brief.at)})`);
  parts.push(unread ? `읽지 않은 보고 ${unread}건` : "새 보고 없음");
  if (due) parts.push(`처리 대기 업무 ${due}건`);
  const txt = parts.join("\n");
  if (box.textContent !== txt) box.textContent = txt;
}

// ----- meeting call-up form
function renderConvene() {
  const box = $("partList");
  const keep = new Set([...box.querySelectorAll("input")].filter((i) => !i.checked).map((i) => i.value));
  box.innerHTML = "";
  for (const h of S.heads.filter((x) => !x.auditor && !x.secretary)) {
    const l = document.createElement("label");
    l.className = "toggle";
    const i = document.createElement("input");
    i.type = "checkbox";
    i.value = h.id;
    i.checked = !keep.has(h.id);
    l.append(i, document.createTextNode(` ${h.short || h.title}`));
    box.append(l);
  }
  const aud = S.heads.find((x) => x.auditor);
  $("partNote").textContent = aud ? `${aud.title} ${aud.name}은 항상 참석해서 마지막에 감사 판정을 냅니다.` : "";
}

// ----- profile tab
function renderProfile() {
  const box = $("profileForm");
  if (!box) return;
  const p = S.profile;
  if (!box.dataset.built) {
    box.dataset.built = "1";
    box.innerHTML = "";
    const nameF = document.createElement("div");
    nameF.className = "field";
    nameF.innerHTML = '<label for="pf-name">호칭</label>';
    const nameI = document.createElement("input");
    nameI.type = "text"; nameI.id = "pf-name"; nameI.maxLength = 20; nameI.autocomplete = "off";
    nameI.addEventListener("input", () => { S.profile.name = nameI.value.trim() || "원준"; queueSave(); });
    nameF.append(nameI);
    box.append(nameF);
    for (const [k, label] of PROFILE_FIELDS) {
      const f = document.createElement("div");
      f.className = "field";
      const l = document.createElement("label");
      l.htmlFor = "pf-" + k;
      l.textContent = label + (k === "notes" ? " (팀원들이 대화하면서 자동으로 적습니다)" : "");
      const t = document.createElement("textarea");
      t.id = "pf-" + k;
      t.maxLength = 4000;
      t.addEventListener("input", () => { S.profile[k] = t.value; queueSave(); $("profileNote").textContent = "저장 중입니다."; });
      f.append(l, t);
      box.append(f);
    }
  }
  $("pf-name").value = p.name || "";
  for (const [k] of PROFILE_FIELDS) {
    const t = $("pf-" + k);
    if (t && document.activeElement !== t) t.value = p[k] || "";
  }
  const gaps = profileGaps();
  $("profileGaps").textContent = gaps.length ? `비서가 물어볼 빈칸: ${gaps.join(", ")}` : "빈칸 없이 채워져 있습니다.";
}
