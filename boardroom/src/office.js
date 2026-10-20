// ---------------------------------------------------------------------------
// Office: everyone has a desk, wanders off now and then, and walks to the
// meeting table only when 원준 calls a meeting. Positions are sprite origins
// (top-left of the 16px figure); a standing figure is 30px tall.
// ---------------------------------------------------------------------------

const AISLE = 138; // the walkway between the meeting table and the bottom desks
const DESK_SPOTS = [
  { x: 28, y: 76, side: "L" }, { x: 28, y: 116, side: "L" }, { x: 28, y: 156, side: "L" },
  { x: 340, y: 76, side: "R" }, { x: 340, y: 116, side: "R" }, { x: 340, y: 156, side: "R" },
  { x: 92, y: 162, side: "B" }, { x: 136, y: 162, side: "B" }, { x: 284, y: 162, side: "B" },
];
const CEO_SPOT = { x: 184, y: 162, side: "B" };
const SEC_SPOT = { x: 232, y: 162, side: "B" };
const POIS = [
  { name: "정수기", x: 82, y: 58, via: [[82, AISLE], [82, 58]] },
  { name: "커피", x: 276, y: 58, via: [[276, AISLE], [276, 58]] },
];
const WALK_SPEED = 1.2;

// Route from the walkway to a desk seat, ending standing just behind the chair.
function deskVia(spot) {
  if (spot.side === "L") return [[62, AISLE], [62, spot.y - 17], [spot.x, spot.y - 17], [spot.x, spot.y - 3]];
  if (spot.side === "R") return [[314, AISLE], [314, spot.y - 17], [spot.x, spot.y - 17], [spot.x, spot.y - 3]];
  return [[spot.x, AISLE], [spot.x, spot.y - 3]];
}
// Where a visitor stands when dropping by someone's desk.
function visitPoint(spot) {
  if (spot.side === "L") return { x: 62, y: spot.y - 10, via: [[62, AISLE], [62, spot.y - 10]] };
  if (spot.side === "R") return { x: 314, y: spot.y - 10, via: [[314, AISLE], [314, spot.y - 10]] };
  return { x: spot.x + (spot.x > 200 ? -20 : 20), y: AISLE, via: [[spot.x + (spot.x > 200 ? -20 : 20), AISLE]] };
}

const Office = {
  agents: new Map(),
  meetSeats: new Map(), // id -> {x, y, row, via}

  sync() {
    const keep = this.agents;
    this.agents = new Map();
    const heads = S.heads.filter((h) => !h.secretary);
    const sec = S.heads.find((h) => h.secretary);
    const add = (h, spot) => {
      const old = keep.get(h.id);
      const a = old || { x: spot.x, y: spot.y, mode: "sit", path: [], facing: "front", next: tick + 300 + ((Math.random() * 900) | 0), bubbleUntil: 0 };
      a.h = h;
      a.spot = spot;
      if (!old) { a.x = spot.x; a.y = spot.y; }
      else if (a.mode === "sit" && (a.x !== spot.x || a.y !== spot.y)) this.walkTo(a, deskVia(spot), () => this.sitDown(a));
      this.agents.set(h.id, a);
    };
    heads.slice(0, DESK_SPOTS.length).forEach((h, i) => add(h, DESK_SPOTS[i]));
    if (sec) add(sec, SEC_SPOT);
    add({ ...CEO, name: S.profile?.name || "원준" }, CEO_SPOT);
  },

  get(id) {
    return this.agents.get(id) || null;
  },

  busy(a) {
    const id = a.h.id;
    return id === "ceo" || S.talkTo === id || S.thinking.has(id) || [...S.writing].some((tid) => (S.tasks.find((t) => t.id === tid) || {}).headId === id) || (S.m && this.meetSeats.has(id));
  },

  working(a) {
    const id = a.h.id;
    return S.tasks.some((t) => t.headId === id && (isDue(t) || S.writing.has(t.id)));
  },

  // Build a path: leave the current spot via its route, cross the walkway, enter the target route.
  route(a, targetVia) {
    const out = (a.leaveVia || []).slice().reverse();
    const first = targetVia[0];
    const pts = [...out];
    const lastOut = pts.length ? pts[pts.length - 1] : [a.x, a.y];
    if (lastOut[1] !== AISLE) pts.push([lastOut[0], AISLE]);
    pts.push([first[0], AISLE]);
    for (const p of targetVia) pts.push(p);
    return pts;
  },

  walkTo(a, via, onArrive) {
    a.path = this.route(a, via);
    a.leaveVia = via;
    a.mode = "walk";
    a.onArrive = onArrive || null;
    if (reduceMotion.matches) {
      const last = a.path[a.path.length - 1];
      a.x = last[0]; a.y = last[1]; a.path = [];
      const fn = a.onArrive; a.onArrive = null;
      a.mode = "stand";
      if (fn) fn();
    }
  },

  sitDown(a) {
    a.x = a.spot.x;
    a.y = a.spot.y;
    a.mode = "sit";
    a.facing = "front";
    a.leaveVia = deskVia(a.spot);
    a.next = tick + 600 + ((Math.random() * 1200) | 0);
  },

  goHome(a) {
    this.walkTo(a, deskVia(a.spot), () => this.sitDown(a));
  },

  update() {
    let walking = 0;
    for (const a of this.agents.values()) {
      if (a.mode === "walk") {
        walking++;
        const p = a.path[0];
        if (!p) { a.mode = "stand"; const fn = a.onArrive; a.onArrive = null; if (fn) fn(); continue; }
        const dx = p[0] - a.x, dy = p[1] - a.y;
        const d = Math.hypot(dx, dy);
        if (d <= WALK_SPEED) {
          a.x = p[0]; a.y = p[1]; a.path.shift();
        } else {
          a.x += (dx / d) * WALK_SPEED;
          a.y += (dy / d) * WALK_SPEED;
        }
        a.facing = dy < -0.1 && Math.abs(dy) > Math.abs(dx) ? "back" : "front";
      } else if (a.mode === "stand" && a.until && tick >= a.until) {
        a.until = 0;
        this.goHome(a);
      }
    }
    if (S.m || reduceMotion.matches) return;
    // wander: at most two people up at once
    for (const a of this.agents.values()) {
      if (walking >= 2) break;
      if (a.mode !== "sit" || tick < a.next || this.busy(a)) continue;
      const r = Math.random();
      if (r < 0.4 || this.working(a)) { a.next = tick + 600 + ((Math.random() * 1200) | 0); continue; }
      walking++;
      if (r < 0.75) {
        const poi = POIS[(Math.random() * POIS.length) | 0];
        a.where = poi.name;
        this.walkTo(a, poi.via, () => { a.facing = "back"; a.until = tick + 150 + ((Math.random() * 150) | 0); });
      } else {
        const others = [...this.agents.values()].filter((b) => b !== a && b.mode === "sit" && b.h.id !== "ceo");
        const b = others[(Math.random() * others.length) | 0];
        if (!b) { a.next = tick + 600; continue; }
        const v = visitPoint(b.spot);
        a.where = `${b.h.name} 자리`;
        this.walkTo(a, v.via, () => {
          a.facing = "front";
          a.until = tick + 180;
          a.bubbleUntil = tick + 150;
          b.bubbleUntil = tick + 150;
        });
      }
    }
  },

  // ----- meetings
  assignMeetSeats(m) {
    this.meetSeats.clear();
    const speakers = m.speakers;
    const top = speakers.filter((_, i) => i % 2 === 0);
    const bot = speakers.filter((_, i) => i % 2 === 1);
    const spread = (row, n, i) => Math.round(TABLE.x + 14 + (n === 1 ? (TABLE.w - 28) / 2 : ((TABLE.w - 28) * i) / (n - 1))) - 8;
    top.forEach((h, i) => {
      const x = spread(top, top.length, i);
      this.meetSeats.set(h.id, { x, y: TABLE.y - 26, row: "top", via: [[112, AISLE], [112, 50], [x, 50], [x, TABLE.y - 29]] });
    });
    bot.forEach((h, i) => {
      const x = spread(bot, bot.length, i);
      this.meetSeats.set(h.id, { x, y: TABLE.y + 20, row: "bot", via: [[x, AISLE], [x, TABLE.y + 17]] });
    });
    this.meetSeats.set("ceo", { x: 106, y: TABLE.y + 2, row: "ceo", via: [[106, AISLE], [106, TABLE.y - 1]] });
    if (m.auditor && this.agents.has(m.auditor.id)) {
      this.meetSeats.set(m.auditor.id, { x: 262, y: TABLE.y + 2, row: "aud", via: [[270, AISLE], [270, TABLE.y - 1], [262, TABLE.y - 1]] });
    }
  },

  gather(m) {
    this.assignMeetSeats(m);
    const moves = [];
    for (const [id, seat] of this.meetSeats) {
      const a = this.agents.get(id);
      if (!a) continue;
      a.until = 0;
      moves.push(new Promise((res) => {
        this.walkTo(a, seat.via, () => {
          a.x = seat.x; a.y = seat.y; a.mode = "meet";
          a.facing = seat.row === "bot" ? "back" : "front";
          a.leaveVia = seat.via;
          res();
        });
      }));
    }
    return Promise.race([Promise.all(moves), sleep(9000)]).then(() => {
      // anyone still on the way takes their seat
      for (const [id, seat] of this.meetSeats) {
        const a = this.agents.get(id);
        if (a && a.mode !== "meet") { a.path = []; a.x = seat.x; a.y = seat.y; a.mode = "meet"; a.facing = seat.row === "bot" ? "back" : "front"; a.leaveVia = seat.via; }
      }
    });
  },

  dismiss() {
    for (const id of this.meetSeats.keys()) {
      const a = this.agents.get(id);
      if (a) this.goHome(a);
    }
    this.meetSeats.clear();
  },

  // ----- drawing
  sortKey(a) {
    if (a.mode === "sit") return a.spot.y + 11.5;
    if (a.mode === "meet") {
      const seat = this.meetSeats.get(a.h.id);
      return seat && seat.row === "top" ? TABLE.y - 1 : seat && seat.row === "bot" ? TABLE.y + TABLE.h + 2 : a.y + 29;
    }
    // walking into or out of their own chair: stay behind the desk
    if (a.spot && Math.abs(a.x - a.spot.x) < 1 && a.y >= a.spot.y - 18 && a.y <= a.spot.y) return a.spot.y + 11.5;
    return a.y + 29;
  },

  status(a) {
    if (!a) return "";
    const id = a.h.id;
    if (S.m && this.meetSeats.has(id)) return "회의 중";
    if (S.talkTo === id) return "원준 님과 대화 중";
    if ([...S.writing].some((tid) => (S.tasks.find((t) => t.id === tid) || {}).headId === id)) return "보고서 쓰는 중";
    if (a.mode === "walk") return "이동 중";
    if (a.mode === "stand") return a.where ? `${a.where}에 잠깐` : "잠깐 자리 비움";
    if (S.tasks.some((t) => t.kind === "ask" && t.headId === id && isDue(t))) return "웹으로 조사 중";
    if (this.working(a)) return "업무 중";
    return "자리에 있음";
  },
};

function drawOffice() {
  const items = [];
  for (const a of Office.agents.values()) {
    if (a.spot) items.push({ k: a.spot.y + 12, draw: () => drawDesk(g, a.spot.x, a.spot.y, a.mode === "sit" && Office.working(a), tick) });
    items.push({ k: Office.sortKey(a), draw: () => drawAgent(a) });
  }
  items.push({ k: TABLE.y + TABLE.h, draw: () => drawTable(g, S.flash > 0 && (S.flash >> 2) % 2 === 0) });
  // meeting chairs
  for (const [id, seat] of Office.meetSeats) {
    const a = Office.agents.get(id);
    if (!a || a.mode !== "meet") continue;
    if (seat.row === "top") items.push({ k: TABLE.y - 1.5, draw: () => drawChairBack(g, seat.x + 8, seat.y + 7, "#2a3366") });
    else if (seat.row === "bot") items.push({ k: TABLE.y + TABLE.h + 2.5, draw: () => drawChairBack(g, seat.x + 8, seat.y + 15, "#2a3366") });
    else items.push({ k: seat.y + 28, draw: () => drawChairBack(g, seat.x + 8, seat.y + 6, seat.row === "ceo" ? "#7a4a12" : "#3b2c5c") });
  }
  items.sort((p, q) => p.k - q.k);
  for (const it of items) it.draw();

  // desk nameplates on top of everything at desk level
  for (const a of Office.agents.values()) {
    if (!a.spot) continue;
    const label = a.h.id === "ceo" ? a.h.name : a.h.short || a.h.title.slice(0, 3);
    drawPlate(a.spot.x + 10, a.spot.y + 19, label, a.h.id === "ceo" ? "#8a5410" : a.h.secretary ? "#5a2f66" : "#1c2b66");
  }
}

function drawAgent(a) {
  let st = seatState.get(a.h.id);
  if (!st) { st = { lift: 0, blinkAt: tick + 40 + ((Math.random() * 120) | 0) }; seatState.set(a.h.id, st); }
  const speaking = S.speaker === a.h.id;
  const seated = a.mode === "sit" || a.mode === "meet";
  const target = speaking && seated ? 5 : 0;
  st.lift = reduceMotion.matches ? target : st.lift + (target - st.lift) * 0.25;
  let blink = false;
  if (tick >= st.blinkAt) {
    blink = true;
    if (tick >= st.blinkAt + 3) st.blinkAt = tick + 60 + ((Math.random() * 140) | 0);
  }
  const typing = speaking && Dialogue.typing;
  const walking = a.mode === "walk";
  const legs = seated ? 0 : walking && !reduceMotion.matches ? 2 + ((tick >> 2) % 2) : 1;
  const bob = a.mode === "sit" && Office.working(a) && !reduceMotion.matches && (tick >> 3) % 2 ? 1 : 0;
  const x = Math.round(a.x), y = Math.round(a.y) - Math.round(st.lift) + bob;
  drawPerson(g, x, y, a.h.look, {
    facing: a.facing,
    blink: reduceMotion.matches ? false : blink,
    talk: typing && (tick >> 2) % 2 === 0,
    frown: speaking && S.m?.phase === "clash",
    legs,
  });
  a.drawX = x;
  a.drawY = y;
}

function drawOfficeOverlays() {
  for (const a of Office.agents.values()) {
    const x = a.drawX ?? Math.round(a.x), y = a.drawY ?? Math.round(a.y);
    const headTop = y - (a.h.look.style === 3 ? 2 : 0);
    const id = a.h.id;
    if (S.thinking.has(id)) drawBubble(g, x + 10, headTop - 11, tick);
    else if (!S.m && S.reports.some((r) => !r.read && r.headId === id)) drawEnvelope(g, x + 8, headTop - 10, reduceMotion.matches ? 0 : tick);
    else if (a.bubbleUntil > tick) drawBubble(g, x + 10, headTop - 11, tick);
    else if (S.m && S.speaker !== id && a.mode === "meet") {
      const stc = stanceOf(id);
      if (stc) drawStance(g, x + 8, headTop - 10, stc);
    }
    if (S.picked === id || (!S.m && S.talkTo === id && S.speaker !== id)) drawCursor(g, x, headTop, 16, a.mode === "sit" || a.mode === "meet" ? 22 : 29, 0, "#3fd6c4");
  }
}

function hitAgent(lx, ly) {
  let best = null;
  for (const a of Office.agents.values()) {
    if (a.h.id === "ceo") continue;
    const x = a.drawX ?? a.x, y = a.drawY ?? a.y;
    const h = a.mode === "sit" || a.mode === "meet" ? 24 : 30;
    if (lx >= x - 2 && lx <= x + 18 && ly >= y - 4 && ly <= y + h) {
      if (!best || (best.drawY ?? best.y) < y) best = a;
    }
  }
  return best;
}
