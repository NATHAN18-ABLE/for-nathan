"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { cleanPath, cleanSpeed, findPath, isWalkable, nearestWalkable, RUN_SPEED, WALK_SPEED, type P } from "@/lib/metaverse/path.ts";
import { fetchLanterns, hangLantern, joinRoom, peekCounts, type Lantern, type Presence, type RoomConnection, type RoomEvent } from "@/lib/metaverse/realtime.ts";
import { LANTERN_COLORS, WISHES, type WishId } from "@/lib/metaverse/lanterns.ts";
import { ITEMS, SCARF_COLORS, defaultLook, sanitizeLook, toggleItem, type ItemId, type Look } from "@/lib/metaverse/look.ts";
import { defaultAvatar, hairsFor, outfitsFor, sanitizeAvatar, type Avatar as AvatarLook } from "@/lib/metaverse/outfit.ts";
import { CAPACITY, MAX_INSTANCES, isIdle, pickInstance, seatMembers, statusOf } from "@/lib/metaverse/queue.ts";
import { EMOTES, PHRASES, phraseText } from "@/lib/metaverse/phrases.ts";
import { cleanChat, guessLang, MAX_CHAT, RateLimit } from "@/lib/metaverse/chat.ts";
import { canTranslate, translate } from "./translate";
import { autoName, cleanName, savedName } from "@/lib/metaverse/names.ts";
import { typeCode, type Answer } from "@/lib/match/match.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { useLang } from "@/lib/lang.ts";
import { Phrases } from "@/components/Phrases";
import { Avatar, newMotion, type Motion } from "./Avatar";
import { Joystick, type Stick } from "./Joystick";
import { heightAt, LampPost, Quality, ToonSky } from "./world";
import { LanternRack } from "./Lanterns";
import { FallingLeaves } from "./autumn";
import { Effects } from "./Effects";
import { chime, setSound, stopSound } from "./sound";
import { emit, on } from "./bus";
import { MapSheet } from "./MapSheet";
import { framePhoto } from "./photo";
import { sanitizeStamps, stamp } from "@/lib/metaverse/stamps.ts";
import { mergeStatic } from "./mergeStatic";
import type { Poi, RoomConfig } from "./types";
import styles from "./Metaverse.module.css";

const UI = {
  en: {
    rooms: "All rooms",
    here: (n: number) => `${n} of ${CAPACITY} here`,
    say: "Say",
    actions: "Actions",
    outfit: "Outfit",
    dress: "Dress up",
    soundOn: "Sound on",
    soundOff: "Sound off",
    firstPerson: "See through your own eyes",
    thirdPerson: "See yourself from behind",
    hangLantern: "Hang a wish lantern",
    hangTitle: "Hang a wish lantern",
    hangBody: "Choose a wish and a colour. Your lantern stays lit on the wall for a day, for everyone in this room.",
    wish: "Wish",
    color: "Colour",
    hang: "Hang it",
    hung: "Your lantern is lit.",
    recent: "Recently hung",
    lanternsToday: (n: number) => (n === 1 ? "1 lantern on the wall today" : `${n} lanterns on the wall today`),
    lightLamp: "Light the lamp",
    sit: "Sit on the pyeongsang",
    watch: "Watch the craftsperson",
    dressTitle: "Dress up",
    dressBody: "Tap an item to wear it, tap again to take it off. One item per spot.",
    wardrobe: "Change clothes in the wardrobe",
    scarfColor: "Scarf colour",
    done: "Done",
    otherCopy: "Go to another copy",
    map: "Map",
    loading: "Setting up the neighbourhood",
    mapTitle: (place: string) => `Around ${place}`,
    mapHint: "Tap a place to walk there.",
    you: "You",
    hint: "Tap the ground to walk, or use the stick. Drag to look around.",
    joystick: "Move",
    photo: "Photo",
    photoHere: "Take a photo here",
    signal: "Send a smoke signal",
    photoTitle: "Your photo",
    photoAlt: (room: string) => `A photo taken in the ${room} room`,
    save: "Save",
    share: "Share",
    stampCount: (n: number, total: number) => `Stamps ${n} of ${total}. Walk to each place to collect them.`,
    stamped: "stamped",
    stampNew: (place: string, n: number, total: number) => `Stamp collected: ${place} (${n}/${total})`,
    stampDone: (room: string) => `Every stamp in ${room} collected. Well walked!`,
    chatPlaceholder: "Type a message",
    send: "Send",
    tooSoon: "Give it a moment before the next message.",
    hide: "Hide",
    hidden: (n: string) => `Messages from ${n} are hidden.`,
    original: "Original:",
    translateOn: "Messages in other languages are translated for you. Without a built-in translator, the free MyMemory service is used.",
    translateOff: "",
    connecting: "Finding other travelers…",
    offline: "Couldn't reach other travelers right now. You can still look around.",
    fullTitle: "This room is full",
    fullBody: (n: number) => `You are number ${n} in line. You'll walk in as soon as a spot opens.`,
    awayTitle: "You were away for a while",
    awayBody: "We gave your spot to the next traveler.",
    comeBack: "Come back in",
    leave: "Leave",
    close: "Close",
    noWebgl: "This device can't show the 3D room. Here is what it looks like in words.",
  },
  ko: {
    rooms: "모든 방",
    here: (n: number) => `${CAPACITY}명 중 ${n}명`,
    say: "말하기",
    actions: "동작",
    outfit: "옷 바꾸기",
    dress: "꾸미기",
    soundOn: "소리 켜기",
    soundOff: "소리 끄기",
    firstPerson: "1인칭 시점으로 보기",
    thirdPerson: "3인칭 시점으로 보기",
    hangLantern: "소원 등 달기",
    hangTitle: "소원 등 달기",
    hangBody: "소원과 색을 골라 주세요. 등은 하루 동안 담장에 켜져 있고, 이 방의 모두에게 보여요.",
    wish: "소원",
    color: "색",
    hang: "달기",
    hung: "소원 등에 불이 켜졌어요.",
    recent: "최근에 달린 소원",
    lanternsToday: (n: number) => `오늘 담장에 걸린 등 ${n}개`,
    lightLamp: "등불 켜기",
    sit: "평상에 앉기",
    watch: "공방 구경하기",
    dressTitle: "꾸미기",
    dressBody: "소품을 누르면 착용하고, 다시 누르면 벗어요. 한 부위에 하나씩이에요.",
    wardrobe: "옷장에서 옷 갈아입기",
    scarfColor: "목도리 색",
    done: "완료",
    otherCopy: "다른 방으로 가기",
    map: "지도",
    loading: "동네를 준비하는 중",
    mapTitle: (place: string) => `${place} 둘러보기`,
    mapHint: "가고 싶은 곳을 누르면 걸어가요.",
    you: "나",
    hint: "바닥을 누르거나 조이스틱으로 걸어요. 드래그하면 둘러볼 수 있어요.",
    joystick: "이동",
    photo: "사진",
    photoHere: "여기서 사진 찍기",
    signal: "봉수 올리기",
    photoTitle: "찍은 사진",
    photoAlt: (room: string) => `${room} 방에서 찍은 사진`,
    save: "저장",
    share: "공유",
    stampCount: (n: number, total: number) => `도장 ${n}/${total}개. 각 장소로 걸어가면 도장을 받아요.`,
    stamped: "도장 받음",
    stampNew: (place: string, n: number, total: number) => `도장을 받았어요: ${place} (${n}/${total})`,
    stampDone: (room: string) => `${room}의 도장을 모두 모았어요!`,
    chatPlaceholder: "메시지를 입력하세요",
    send: "보내기",
    tooSoon: "조금 뒤에 다시 보내 주세요.",
    hide: "숨기기",
    hidden: (n: string) => `${n}님의 메시지를 숨겼어요.`,
    original: "원문:",
    translateOn: "다른 언어로 온 메시지는 자동으로 번역돼요. 기기에 번역 기능이 없으면 무료 번역 서비스(MyMemory)를 써요.",
    translateOff: "",
    connecting: "다른 여행자를 찾는 중…",
    offline: "지금은 다른 여행자와 연결되지 않아요. 혼자 둘러볼 수는 있어요.",
    fullTitle: "방이 가득 찼어요",
    fullBody: (n: number) => `대기 ${n}번째예요. 자리가 나면 바로 들어가요.`,
    awayTitle: "한동안 자리를 비우셨어요",
    awayBody: "다음 여행자에게 자리를 양보했어요.",
    comeBack: "다시 들어가기",
    leave: "나가기",
    close: "닫기",
    noWebgl: "이 기기에서는 3D 방을 볼 수 없어요. 대신 글로 소개할게요.",
  },
} as const;

function myId() {
  try {
    const saved = sessionStorage.getItem("seoul.mv.id");
    if (saved) return saved;
    const id = crypto.randomUUID();
    sessionStorage.setItem("seoul.mv.id", id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function myType(): string | null {
  try {
    const a = JSON.parse(sessionStorage.getItem("seoul.answers") ?? "[]") as Answer[];
    return Array.isArray(a) && a.length >= QUESTIONS.length ? typeCode(a) : null;
  } catch {
    return null;
  }
}

function hasWebgl() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function MetaverseRoom({ room }: { room: RoomConfig }) {
  const [lang, setLang] = useLang();
  const t = UI[lang];
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [session, setSession] = useState(0); // bump to rejoin
  // Which copy of the room ("Jongno 01", "02"…). Chosen from how full each copy is.
  const [instance, setInstance] = useState<number | null>(null);
  const [copies, setCopies] = useState<number[]>([]);
  const [copiesOpen, setCopiesOpen] = useState(false);
  const lastSpot = useRef<{ x: number; z: number; heading: number } | null>(null);
  // Where each other traveler last stopped, from their broadcasts (Presence only holds where they came in).
  // Mutated in place: the figures read it every frame.
  const spots = useRef(new Map<string, P>());
  const greeted = useRef(new Set<string>());
  const [members, setMembers] = useState<Presence[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const [near, setNear] = useState<Poi | null>(null);
  const [sitting, setSitting] = useState(false);
  // The stamp card: every place in the room except benches and the like.
  const places = useMemo(() => room.pois.filter((p) => p.stamp !== false).map((p) => p.id), [room]);
  const [stamps, setStamps] = useState<string[]>([]);
  const stampKey = `seoul.mv.stamps.${room.slug}`;
  useEffect(() => {
    try {
      setStamps(sanitizeStamps(JSON.parse(localStorage.getItem(stampKey) ?? "[]"), places));
    } catch {}
  }, [stampKey, places]);
  // Photo mode: a framed keepsake of the current view.
  const [photo, setPhoto] = useState<{ url: string; blob: Blob } | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [sayOpen, setSayOpen] = useState(false);
  const [actsOpen, setActsOpen] = useState(false);
  const [away, setAway] = useState(false);
  const [hint, setHint] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setHint(false), 7000);
    return () => clearTimeout(id);
  }, []);
  const [look, setLook] = useState<Look>(defaultLook());
  const [avatar, setAvatar] = useState<AvatarLook>(() => defaultAvatar("f"));
  const [dressOpen, setDressOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [hangOpen, setHangOpen] = useState(false);
  const [wish, setWish] = useState<WishId>("journey");
  const [paper, setPaper] = useState(0);
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [fresh, setFresh] = useState(-1);
  const [lit, setLit] = useState<Record<number, boolean>>({});
  const [nearLamp, setNearLamp] = useState<number | null>(null);
  const [sound, setSoundOn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Realtime reconnects on its own; only mention it if it stays down for a while.
  const [offlineLong, setOfflineLong] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const me = useRef<{ id: string; type: string | null; name: string }>({ id: "", type: null, name: "" });
  const motions = useRef(new Map<string, Motion>());
  const conn = useRef<RoomConnection | null>(null);
  const lastInput = useRef(Date.now());
  // A raised three-quarter view, like looking down on a little town.
  const view = useRef<View>({ yaw: (room.spawnHeading ?? 0) + Math.PI, pitch: 0.5, dist: 7.4, touchedAt: 0, first: false, tilt: 0 });
  // First or third person; the choice is kept on this device.
  const [firstPerson, setFirstPerson] = useState(false);
  const chooseView = useCallback((first: boolean) => {
    view.current.first = first;
    view.current.tilt = 0;
    setFirstPerson(first);
    try {
      localStorage.setItem("seoul.mv.view", first ? "first" : "third");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (localStorage.getItem("seoul.mv.view") === "first") chooseView(true);
    } catch {}
    // V switches the view, outside text fields
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "v" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      chooseView(!view.current.first);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [chooseView]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const stick = useRef<Stick>({ x: 0, y: 0, active: false });
  const propCache = useRef(new Map<string, { key: string; look: Look; avatar: AvatarLook; rest: P }>());
  // The scenery never changes while in a room: build its elements once, so room updates
  // (chat, notices, stamps) do not walk the whole scene again.
  const sceneEl = useMemo(
    () => (
      <Frozen>
        <room.Scene />
      </Frozen>
    ),
    [room],
  );
  const liveEl = useMemo(() => (room.Live ? <room.Live /> : null), [room]);
  const pinch = useRef(0);
  const ground = useCallback((x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) + (room.world.floorLift ?? 0) : 0), [room]);
  // Phones get lighter effects; iPads and computers keep the full set. (An automatic
  // step-down tripped on loading hitches and left iPads blurry and jagged, so it is gone.)
  // Drawing budget by device: phones draw simpler (no post effects, lower resolution, shadows
  // refreshed less often, plainer trees), tablets skip a little, computers get everything.
  const [tier] = useState<"low" | "mid" | "high">(() => {
    if (typeof window === "undefined") return "high";
    if (Math.min(window.innerWidth, window.innerHeight) < 600) return "low";
    return window.matchMedia("(pointer: coarse)").matches ? "mid" : "high";
  });
  const lowPower = tier === "low";
  const quality = useMemo(() => ({ low: lowPower }), [lowPower]);

  // Drag to look around, wheel or pinch to come closer.
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [role=menu], [data-stick], input, form")) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastInput.current = Date.now(); // looking around counts as being here
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !room.world) return;
    const v = view.current;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) v.dist = Math.min(14, Math.max(3.4, v.dist * (pinch.current / Math.max(1, d))));
      pinch.current = d;
    } else if (v.first) {
      // looking around from the eyes: sideways turns, up and down tilts the gaze
      v.yaw -= (e.clientX - prev.x) * 0.005;
      v.tilt = Math.min(0.6, Math.max(-0.75, v.tilt - (e.clientY - prev.y) * 0.004));
    } else {
      v.yaw -= (e.clientX - prev.x) * 0.006;
      v.pitch = Math.min(1.1, Math.max(0.05, v.pitch + (e.clientY - prev.y) * 0.005));
    }
    v.touchedAt = performance.now();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = 0;
  };
  const onWheel = (e: React.WheelEvent) => {
    lastInput.current = Date.now();
    if (!room.world) return;
    view.current.dist = Math.min(14, Math.max(3.4, view.current.dist * Math.exp(e.deltaY * 0.0012)));
  };
  const bubbleTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Identity, look and capability checks happen in the browser only.
  useEffect(() => {
    const id = myId();
    me.current = { id, type: myType(), name: savedName() ?? autoName(id) };
    try {
      setLook(sanitizeLook(JSON.parse(localStorage.getItem("seoul.mv.look2") ?? "null")));
    } catch {}
    try {
      // Chosen in the wardrobe. Without one, a figure is drawn at random once and kept, so the
      // traveler looks the same in every room.
      const saved = localStorage.getItem("seoul.mv.avatar1");
      const figure = saved ? sanitizeAvatar(JSON.parse(saved)) : sanitizeAvatar({ ...defaultAvatar(Math.random() < 0.5 ? "f" : "m"), skin: Math.floor(Math.random() * 4) });
      if (!saved) localStorage.setItem("seoul.mv.avatar1", JSON.stringify(figure));
      setAvatar(figure);
    } catch {}
    setWebgl(hasWebgl());
    setReady(true);
  }, []);

  const showText = useCallback((id: string, text: string, ms = 4200) => {
    setBubbles((b) => ({ ...b, [id]: text }));
    clearTimeout(bubbleTimers.current.get(id));
    bubbleTimers.current.set(
      id,
      setTimeout(() => setBubbles((b) => Object.fromEntries(Object.entries(b).filter(([k]) => k !== id))), ms),
    );
  }, []);
  const showBubble = useCallback(
    (id: string, phrase: string) => {
      const text = phraseText(phrase, lang);
      if (text) showText(id, text);
    },
    [lang, showText],
  );
  const showBubbleRef = useRef(showBubble);
  showBubbleRef.current = showBubble;

  // Free chat: a short log, people you have hidden, and translation into your language.
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [muted, setMuted] = useState<Set<string>>(() => new Set());
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const langRef = useRef(lang);
  langRef.current = lang;
  const names = useRef(new Map<string, string>());
  const limit = useRef(new RateLimit());
  const chatSeq = useRef(0);
  const hear = useCallback(
    (id: string, raw: unknown, mine = false) => {
      const text = cleanChat(raw);
      if (!text || mutedRef.current.has(id)) return;
      const key = ++chatSeq.current;
      const name = mine ? me.current.name : names.current.get(id) ?? "";
      setChat((list) => [...list.slice(-29), { key, id, name, text, mine }]);
      showText(id, text, 6500);
      if (mine) return;
      translate(text, guessLang(text), langRef.current).then((raw) => {
        // A translation is still a message: it goes through the same filter.
        const tr = raw ? cleanChat(raw) : null;
        if (!tr) return;
        setChat((list) => list.map((l) => (l.key === key ? { ...l, translated: tr } : l)));
        setBubbles((b) => (b[id] === text ? { ...b, [id]: tr } : b));
      });
    },
    [showText],
  );
  const hearRef = useRef(hear);
  hearRef.current = hear;

  // Pick the first copy of the room with space (or ?copy=N for a specific one).
  useEffect(() => {
    if (!ready || !webgl || instance !== null) return;
    const asked = Number(new URLSearchParams(location.search).get("copy"));
    if (Number.isInteger(asked) && asked >= 1 && asked <= MAX_INSTANCES) {
      setInstance(asked);
      return;
    }
    let live = true;
    peekCounts(room.slug, MAX_INSTANCES).then((counts) => {
      if (!live) return;
      setCopies(counts);
      setInstance(pickInstance(counts));
    });
    return () => {
      live = false;
    };
  }, [ready, webgl, instance, room]);

  const switchCopy = (n: number) => {
    const m = motions.current.get(me.current.id);
    if (m) lastSpot.current = { x: m.x, z: m.z, heading: m.heading };
    setCopiesOpen(false);
    setInstance(n);
  };

  const openCopies = () => {
    setCopiesOpen((v) => !v);
    peekCounts(room.slug, MAX_INSTANCES, 1200).then(setCopies);
  };

  // Join the room's channel.
  useEffect(() => {
    if (!ready || !webgl || instance === null) return;
    const { id, type, name } = me.current;
    // ?at=x,z[,heading] starts somewhere else (for checking a spot); the point is snapped onto the walkable area.
    const at = new URLSearchParams(location.search).get("at")?.split(",").map(Number);
    const spawn = lastSpot.current
      ? lastSpot.current
      : at && at.length >= 2 && at.every(Number.isFinite)
        ? nearestWalkable({ x: at[0], z: at[1] }, room.walk)
        : { x: room.spawn.x + (Math.random() - 0.5) * 3, z: room.spawn.z + (Math.random() - 0.5) * 1.5 };
    const atHeading = !lastSpot.current && at?.length === 3 && Number.isFinite(at[2]) ? at[2] : undefined;
    motions.current.set(id, newMotion(spawn.x, spawn.z, lastSpot.current?.heading ?? atHeading ?? room.spawnHeading ?? 0));
    if (atHeading !== undefined) view.current.yaw = atHeading + Math.PI; // look the same way
    lastSpot.current = null;
    const presence: Presence = { id, joinedAt: Date.now(), name, type, look, avatar, x: spawn.x, z: spawn.z, heading: 0 };
    lastInput.current = Date.now();
    setAway(false);

    const onEvent = (e: RoomEvent) => {
      let m = motions.current.get(e.id);
      const path = e.kind === "move" ? cleanPath(e.path) : null;
      if (e.kind === "move" && path && typeof e.id === "string") {
        const end = path[path.length - 1];
        if (!m) motions.current.set(e.id, (m = newMotion(path[0].x, path[0].z)));
        const spot = spots.current.get(e.id);
        if (spot) (spot.x = end.x), (spot.z = end.z);
        else spots.current.set(e.id, { x: end.x, z: end.z });
        m.path = [{ x: m.x, z: m.z }, ...path.slice(1)];
        m.start = performance.now();
        m.speed = cleanSpeed(e.speed);
        m.sitting = false;
      } else if (e.kind === "say") {
        showBubbleRef.current(e.id, e.phrase);
      } else if (e.kind === "signal") {
        if (!spam(e.id, "signal")) emit("signal");
      } else if (e.kind === "use") {
        if (typeof e.effect === "string" && EFFECT.test(e.effect) && !spam(e.id, e.effect)) emit(`use:${e.effect}`);
      } else if (e.kind === "chat") {
        hearRef.current(e.id, e.text);
      } else if (e.kind === "emote" && m) {
        m.emote = e.emote;
        m.emoteAt = performance.now();
      } else if (e.kind === "lantern") {
        setLanterns((list) => {
          setFresh(list.length);
          return [...list, e.lantern];
        });
        chime(1.2);
      } else if (e.kind === "lamp" && Number.isInteger(e.lamp)) {
        setLit((l) => ({ ...l, [e.lamp]: true }));
      }
    };
    if (room.lanterns) fetchLanterns(room.slug).then(setLanterns);
    let greetTimer: ReturnType<typeof setTimeout> | undefined;
    const c = joinRoom(room.slug, instance, presence, {
      onMembers: (raw) => {
        // Names come from anyone's browser: the same filter as the wardrobe, else the auto name.
        const list = raw.map((p) => ({ ...p, name: cleanName(p.name) ?? autoName(String(p.id)) }));
        let newcomer = false;
        for (const p of list) {
          if (!motions.current.has(p.id)) motions.current.set(p.id, newMotion(p.x, p.z, p.heading));
          if (!spots.current.has(p.id)) spots.current.set(p.id, { x: p.x, z: p.z });
          if (typeof p.name === "string") names.current.set(p.id, p.name.slice(0, 40));
          if (p.id !== id && !greeted.current.has(p.id)) {
            greeted.current.add(p.id);
            newcomer = true;
          }
        }
        setMembers(list);
        // Someone new only knows where I came in: tell them where I am now.
        if (newcomer) {
          clearTimeout(greetTimer);
          greetTimer = setTimeout(() => {
            const m = motions.current.get(id);
            if (m) conn.current?.send({ kind: "move", id, path: [{ x: m.x, z: m.z }, { x: m.x, z: m.z }], speed: m.speed });
          }, 400 + Math.random() * 600);
        }
      },
      onEvent,
      onStatus: setStatus,
    });
    conn.current = c;
    const bye = () => c.leave();
    window.addEventListener("pagehide", bye);
    return () => {
      window.removeEventListener("pagehide", bye);
      clearTimeout(greetTimer);
      c.leave();
      spots.current.clear();
      greeted.current.clear();
      conn.current = null;
      motions.current.clear();
      setMembers([]);
    };
    // Look changes are sent with update(), not by rejoining.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, webgl, room, session, instance]);

  // ?bots=N: a local crowd for checking performance. Never sent to anyone.
  const [bots, setBots] = useState<Presence[]>([]);
  useEffect(() => {
    if (!ready) return;
    const n = Math.min(30, Math.max(0, Math.floor(Number(new URLSearchParams(location.search).get("bots")) || 0)));
    if (!n) return;
    const list: Presence[] = Array.from({ length: n }, (_, i) => {
      const gender = i % 2 ? "m" : "f";
      const outfits = outfitsFor(gender);
      const hairs = hairsFor(gender);
      const at = nearestWalkable({ x: room.spawn.x + (Math.random() - 0.5) * 8, z: room.spawn.z - Math.random() * 14 }, room.walk);
      const avatar = sanitizeAvatar({ gender, outfit: outfits[i % outfits.length].id, colorway: i % 3, hair: hairs[i % hairs.length].id, hairColor: i % 3, skin: i % 4 });
      return { id: `bot-${i}`, joinedAt: 0, name: `Bot ${i + 1}`, type: null, look: defaultLook(), avatar, x: at.x, z: at.z, heading: 0 };
    });
    for (const b of list) motions.current.set(b.id, newMotion(b.x, b.z));
    setBots(list);
    const iv = setInterval(() => {
      for (const b of list) {
        const m = motions.current.get(b.id);
        if (!m || m.path || Math.random() < 0.5) continue;
        const to = nearestWalkable({ x: m.x + (Math.random() - 0.5) * 10, z: m.z + (Math.random() - 0.5) * 10 }, room.walk);
        m.path = findPath({ x: m.x, z: m.z }, to, room.walk);
        m.start = performance.now();
        m.speed = WALK_SPEED;
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [ready, room]);

  // Give the spot away after a long time without input.
  useEffect(() => {
    if (away) return;
    const iv = setInterval(() => {
      if (isIdle(lastInput.current, Date.now()) && conn.current) {
        conn.current.leave();
        conn.current = null;
        setAway(true);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [away, session]);

  useEffect(() => {
    if (status !== "offline") {
      setOfflineLong(false);
      return;
    }
    const id = setTimeout(() => setOfflineLong(true), 10000);
    return () => clearTimeout(id);
  }, [status]);

  const seated = useMemo(() => new Set(seatMembers(members).inRoom), [members]);
  const myStatus = status === "live" && me.current.id ? statusOf(me.current.id, members) : null;
  const inside = !away && (status !== "live" || myStatus?.state === "in" || myStatus?.state === "absent");
  const waiting = !away && myStatus?.state === "waiting" ? myStatus.position : 0;
  const count = status === "live" ? Math.min(CAPACITY, members.length) : 1;

  const touch = () => {
    lastInput.current = Date.now();
    setHint(false);
  };

  const walkTo = useCallback(
    (to: P) => {
      if (!inside) return;
      const m = motions.current.get(me.current.id);
      if (!m) return;
      touch();
      setSayOpen(false);
      setActsOpen(false);
      const path = findPath({ x: m.x, z: m.z }, to, room.walk);
      // A long way off: run there.
      let len = 0;
      for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
      const speed = len > 9 ? RUN_SPEED : WALK_SPEED;
      m.path = path;
      m.start = performance.now();
      m.speed = speed;
      m.sitting = false;
      conn.current?.send({ kind: "move", id: me.current.id, path, speed });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inside, room],
  );

  const arrived = useCallback(() => {
    const m = motions.current.get(me.current.id);
    if (m) conn.current?.remember({ x: m.x, z: m.z, heading: m.heading });
    const next = pending.current;
    pending.current = null;
    next?.();
  }, []);

  // A new place reached: stamp it.
  useEffect(() => {
    if (!near || !inside) return;
    setStamps((current) => {
      const r = stamp(current, near.id, places);
      if (!r.isNew) return current;
      try {
        localStorage.setItem(stampKey, JSON.stringify(r.stamps));
      } catch {}
      chime(r.done ? 0.8 : 1.4);
      flash(r.done ? t.stampDone(room.name[lang]) : t.stampNew(near.title[lang], r.stamps.length, places.length));
      return r.stamps;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, inside]);

  const takePhoto = useCallback(
    async (shot: string) => {
      setFlashOn(true);
      setTimeout(() => setFlashOn(false), 420);
      try {
        const blob = await framePhoto(shot, {
          brand: "Seoul, Curated",
          place: `${room.name[lang]} · ${room.place[lang]}`,
          date: new Date().toLocaleDateString(lang === "ko" ? "ko-KR" : "en-GB", { year: "numeric", month: "short", day: "numeric" }),
        });
        setPhoto({ url: URL.createObjectURL(blob), blob });
      } catch {}
    },
    [room, lang],
  );
  const closePhoto = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
  };
  const canShare = (blob: Blob) => {
    try {
      return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([blob], "photo.jpg", { type: "image/jpeg" })] });
    } catch {
      return false;
    }
  };
  const sharePhoto = async (blob: Blob) => {
    try {
      await navigator.share({ files: [new File([blob], `seoul-curated-${room.slug}.jpg`, { type: "image/jpeg" })], title: "Seoul, Curated" });
    } catch {}
  };

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast((x) => (x === text ? null : x)), 2600);
  };

  const toggleSound = () => {
    const on = !sound;
    setSoundOn(on);
    setSound(on);
  };
  useEffect(() => () => stopSound(), []);

  const doHang = async () => {
    touch();
    setHangOpen(false);
    const l: Lantern = { wish, color: paper, name: me.current.name };
    setLanterns((list) => {
      setFresh(list.length);
      return [...list, l];
    });
    chime(1);
    emote("bow");
    flash(t.hung);
    conn.current?.send({ kind: "lantern", id: me.current.id, lantern: l });
    await hangLantern(room.slug, l);
  };

  const lightLamp = (i: number) => {
    touch();
    setLit((l) => ({ ...l, [i]: true }));
    chime(1.5);
    conn.current?.send({ kind: "lamp", id: me.current.id, lamp: i });
  };

  const sitHere = (poi: Poi) => {
    if (!poi.seat) return;
    const seat = poi.seat;
    pending.current = () => {
      const m = motions.current.get(me.current.id);
      if (!m) return;
      m.heading = seat.heading;
      m.seat = seat.on ?? null;
      emote("sit");
    };
    walkTo({ x: seat.x, z: seat.z });
  };

  // The room's own interaction: it plays here at once and for everyone else in the room.
  const usedAt = useRef(0);
  const use = (poi: Poi) => {
    if (!poi.effect || !EFFECT.test(poi.effect)) return;
    touch();
    const now = performance.now();
    if (now - usedAt.current < 1200) return; // one press at a time
    usedAt.current = now;
    const m = motions.current.get(me.current.id);
    if (m && poi.face) m.heading = Math.atan2(poi.face.x - m.x, poi.face.z - m.z);
    if (poi.gesture) emote(poi.gesture);
    emit(`use:${poi.effect}`);
    conn.current?.send({ kind: "use", id: me.current.id, effect: poi.effect });
  };

  // A smoke signal (봉수): everyone in the room sees the smoke rise.
  const signal = () => {
    touch();
    emit("signal");
    conn.current?.send({ kind: "signal", id: me.current.id });
  };

  const watch = () => {
    touch();
    const m = motions.current.get(me.current.id);
    const poi = near;
    if (m && poi) m.heading = Math.atan2(poi.at.x - 1.2 - m.x, poi.at.z - m.z); // face the bench
    emit("workshop");
  };

  const wear = (id: ItemId) => {
    touch();
    const next = toggleItem(look, id);
    setLook(next);
    try {
      localStorage.setItem("seoul.mv.look2", JSON.stringify(next));
    } catch {}
    conn.current?.update({ look: next });
  };

  const scarf = (i: number) => {
    const next = { ...look, scarf: i };
    setLook(next);
    try {
      localStorage.setItem("seoul.mv.look2", JSON.stringify(next));
    } catch {}
    conn.current?.update({ look: next });
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = cleanChat(draft);
    if (!text) return;
    touch();
    if (!limit.current.take(Date.now())) {
      flash(t.tooSoon);
      return;
    }
    setDraft("");
    hear(me.current.id, text, true);
    conn.current?.send({ kind: "chat", id: me.current.id, text });
  };

  const hide = (id: string, name: string) => {
    setMuted((m) => new Set(m).add(id));
    setChat((list) => list.filter((l) => l.id !== id));
    setBubbles((b) => Object.fromEntries(Object.entries(b).filter(([k]) => k !== id)));
    flash(t.hidden(name));
  };

  const say = (phrase: string) => {
    touch();
    setSayOpen(false);
    showBubble(me.current.id, phrase);
    conn.current?.send({ kind: "say", id: me.current.id, phrase });
  };

  const emote = (id: string) => {
    touch();
    setActsOpen(false);
    const m = motions.current.get(me.current.id);
    if (m) {
      m.emote = id;
      m.emoteAt = performance.now();
    }
    conn.current?.send({ kind: "emote", id: me.current.id, emote: id });
  };

  // Keep bubbles in the reader's language when they switch.
  useEffect(() => setBubbles({}), [lang]);

  if (ready && !webgl) {
    return (
      <main className={styles.fallback}>
        <Link href="/metaverse" className={styles.back}>
          {t.rooms}
        </Link>
        <h1>{room.name[lang]}</h1>
        <p>
          <Phrases text={t.noWebgl} />
        </p>
        <ul>
          {room.pois.map((p) => (
            <li key={p.id}>
              <strong>{p.title[lang]}</strong>
              <Phrases text={p.line[lang]} />
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const others = [...members.filter((p) => p.id !== me.current.id && seated.has(p.id)), ...bots];
  // Cleaned look and position for each traveler, reused while unchanged so their figures
  // are not re-rendered on every update from the room.
  const props = (p: Presence) => {
    let rest = spots.current.get(p.id);
    if (!rest) spots.current.set(p.id, (rest = { x: p.x, z: p.z }));
    const key = JSON.stringify([p.look, p.avatar]);
    const hit = propCache.current.get(p.id);
    if (hit && hit.key === key && hit.rest === rest) return hit;
    const next = { key, look: sanitizeLook(p.look), avatar: sanitizeAvatar(p.avatar), rest };
    propCache.current.set(p.id, next);
    return next;
  };

  return (
    <div
      className={styles.room}
      style={{ "--sky-top": room.sky.top, "--sky-bottom": room.sky.bottom } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {ready && (
        <Canvas
          className={styles.canvas}
          shadows
          dpr={lowPower ? [1, 1] : [1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: room.world ? 42 : 34, near: 0.3, far: 600, position: [0, 12, 14] }}
          onCreated={({ gl, scene, camera }) => {
            // Toon colours are painted as they should look; no film curve on top.
            gl.toneMapping = THREE.NoToneMapping;
            // ?perf: expose the renderer's counters for performance checks.
            if (new URLSearchParams(location.search).has("perf")) {
              gl.info.autoReset = false;
              (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl;
              Object.assign(window, { __mv: { room, scene, camera, motions: motions.current, me: () => me.current.id, isWalkable } });
            }
          }}
        >
          <Lights room={room} motions={motions} meId={me.current.id} low={lowPower} />
          <Quality.Provider value={quality}>
          <Walkable room={room} onPick={walkTo}>
            {sceneEl}
            {liveEl}
            {room.lamps?.map((pos, i) => <LampPost key={i} position={pos} lit={!!lit[i]} hills={room.world?.hills} />)}
            {room.lanterns && <LanternRack lanterns={lanterns} fresh={fresh} />}
          </Walkable>
          {room.world && <FallingLeaves motions={motions} meId={me.current.id} count={lowPower ? 50 : 140} />}
          {room.world && !lowPower && <Effects low={tier !== "high"} ao={tier === "high"} />}
          {inside && me.current.id && (
            <Avatar
              key="me"
              motion={motions.current.get(me.current.id) ?? newMotion(room.spawn.x, room.spawn.z)}
              look={look}
              avatar={avatar}
              name={shownName(me.current.name, lang)}
              type={me.current.type}
              sameType={false}
              isMe
              bubble={bubbles[me.current.id] ?? null}
              meLabel={t.you}
              onArrive={arrived}
              ground={ground}
              hidden={firstPerson}
            />
          )}
          {others.map((p) => {
            const m = motions.current.get(p.id) ?? newMotion(p.x, p.z, p.heading);
            motions.current.set(p.id, m);
            return (
              <Avatar
                key={p.id}
                motion={m}
                look={props(p).look}
                avatar={props(p).avatar}
                name={shownName(p.name, lang)}
                type={p.type}
                sameType={!!p.type && p.type === me.current.type}
                isMe={false}
                bubble={bubbles[p.id] ?? null}
                rest={props(p).rest}
                ground={ground}
              />
            );
          })}
          {room.world ? <Rig room={room} motions={motions} meId={me.current.id} view={view} /> : <TopRig room={room} motions={motions} meId={me.current.id} />}
          <Keys room={room} motions={motions} meId={me.current.id} conn={conn} enabled={inside} onInput={touch} onArrive={arrived} view={view} stick={stick} />
          <TapTarget motions={motions} meId={me.current.id} ground={ground} />
          <PhotoBooth onShot={takePhoto} />
          <PoiWatch room={room} motions={motions} meId={me.current.id} onNear={setNear} onNearLamp={setNearLamp} onSitting={setSitting} />
          </Quality.Provider>
        </Canvas>
      )}

      {ready && <Loader label={t.loading} />}

      <header className={styles.top}>
        <Link href="/metaverse" className={styles.back} aria-label={t.rooms}>
          <span className={styles.backLabel}>{t.rooms}</span>
        </Link>
        <div className={styles.title}>
          <h1>
            {room.name[lang]}
            {instance !== null && (
              <button type="button" className={styles.copy} aria-expanded={copiesOpen} onClick={openCopies}>
                {String(instance).padStart(2, "0")}
              </button>
            )}
          </h1>
          <p className={styles.subtitle}>
            <span className="phrase">{room.place[lang]}</span> <span className="phrase">· {room.hour[lang]}</span>
          </p>
        </div>
        <div className={styles.topRight}>
          <span className={styles.count} aria-live="polite">
            <span className={styles.countLong}>{status === "connecting" ? t.connecting : t.here(count)}</span>
            {/* phones: just "3/30" with a person mark */}
            <span className={styles.countShort} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
              </svg>
              {status === "connecting" ? "…" : `${count}/${CAPACITY}`}
            </span>
          </span>
          <button type="button" className={styles.iconButton} aria-pressed={sound} aria-label={sound ? t.soundOff : t.soundOn} title={sound ? t.soundOff : t.soundOn} onClick={toggleSound}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
              {sound ? (
                <>
                  <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
                  <path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />
                </>
              ) : (
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
              )}
            </svg>
          </button>
          {room.world && (
            <button type="button" className={`${styles.iconButton} ${styles.viewToggle}`} aria-pressed={firstPerson} aria-label={firstPerson ? t.thirdPerson : t.firstPerson} title={`${firstPerson ? t.thirdPerson : t.firstPerson} (V)`} onClick={() => (touch(), chooseView(!firstPerson))}>
              {firstPerson ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.2" />
                  <path d="M5.5 20c.6-3.9 3.2-6 6.5-6s5.9 2.1 6.5 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
              )}
            </button>
          )}
          <div className={styles.lang} role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "ko"} onClick={() => setLang("ko")}>
              KO
            </button>
          </div>
        </div>
      </header>

      {copiesOpen && (
        <div className={styles.copies} role="menu">
          {Array.from({ length: Math.min(MAX_INSTANCES, Math.max(copies.length + 1, 2)) }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" role="menuitemradio" aria-checked={n === instance} onClick={() => switchCopy(n)}>
              <span>
                {room.name[lang]} {String(n).padStart(2, "0")}
              </span>
              <span className={styles.copyCount}>{t.here(copies[n - 1] ?? 0)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Short messages stack in one place under the header, so they never cover the controls. */}
      <div className={styles.notices} aria-live="polite">
        {status === "offline" && !away && offlineLong && (
          <p className={styles.notice}>
            <Phrases text={t.offline} />
          </p>
        )}
        {hint && inside && (
          <p className={styles.hint}>
            <Phrases text={t.hint} />
          </p>
        )}
        {toast && (
          <p className={styles.notice}>
            <Phrases text={toast} />
          </p>
        )}
      </div>

      {near && inside && <PoiCard key={near.id} poi={near} lang={lang} />}


      {flashOn && <div className={styles.flash} aria-hidden="true" />}

      {photo && (
        <div className={styles.sheet} role="dialog" aria-label={t.photoTitle}>
          <h2>{t.photoTitle}</h2>
          <img className={styles.photo} src={photo.url} alt={t.photoAlt(room.name[lang])} />
          <div className={styles.sheetActions}>
            <button type="button" className={styles.ghost} onClick={closePhoto}>
              {t.close}
            </button>
            {canShare(photo.blob) && (
              <button type="button" className={styles.ghost} onClick={() => sharePhoto(photo.blob)}>
                {t.share}
              </button>
            )}
            <a className="btn btn-primary" href={photo.url} download={`seoul-curated-${room.slug}.jpg`}>
              {t.save}
            </a>
          </div>
        </div>
      )}

      {inside && mapOpen && (
        <MapSheet
          room={room}
          lang={lang}
          labels={{ ...t, mapTitle: t.mapTitle(room.place[lang]) }}
          motions={motions}
          meId={me.current.id}
          onGo={(p) => {
            setMapOpen(false);
            walkTo(nearestWalkable(p, room.walk));
          }}
          onClose={() => setMapOpen(false)}
          stamps={stamps}
        />
      )}

      {inside && !sayOpen && !actsOpen && !dressOpen && !hangOpen && !mapOpen && (
        <ContextAction
          poi={near?.action === "sit" && sitting ? null : near}
          lamp={nearLamp !== null && !lit[nearLamp] ? nearLamp : null}
          lang={lang}
          labels={t}
          onLantern={() => (touch(), setHangOpen(true))}
          onSit={() => near && sitHere(near)}
          onWatch={watch}
          onSignal={signal}
          onUse={use}
          onLamp={lightLamp}
        />
      )}

      {inside && hangOpen && (
        <div className={styles.sheet} role="dialog" aria-label={t.hangTitle}>
          <h2>{t.hangTitle}</h2>
          <p>
            <Phrases text={t.hangBody} />
          </p>
          <fieldset className={styles.choices}>
            <legend>{t.wish}</legend>
            {WISHES.map((w) => (
              <button key={w.id} type="button" aria-pressed={wish === w.id} onClick={() => setWish(w.id)}>
                {w[lang]}
              </button>
            ))}
          </fieldset>
          <fieldset className={styles.swatches}>
            <legend>{t.color}</legend>
            {LANTERN_COLORS.map((c, i) => (
              <button key={c} type="button" aria-pressed={paper === i} aria-label={`${t.color} ${i + 1}`} style={{ background: c }} onClick={() => setPaper(i)} />
            ))}
          </fieldset>
          {lanterns.length > 0 && (
            <div className={styles.recent}>
              <p>
                {t.recent} · {t.lanternsToday(lanterns.length)}
              </p>
              <ul>
                {lanterns
                  .slice(-4)
                  .reverse()
                  .map((l, i) => (
                    <li key={i}>
                      <span className={styles.recentDot} style={{ background: LANTERN_COLORS[l.color] ?? LANTERN_COLORS[0] }} />
                      <span>{l.name}</span>
                      <span className={styles.recentWish}>{WISHES.find((w) => w.id === l.wish)?.[lang]}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className={styles.sheetActions}>
            <button type="button" className={styles.ghost} onClick={() => setHangOpen(false)}>
              {t.close}
            </button>
            <button type="button" className="btn btn-primary" onClick={doHang}>
              {t.hang}
            </button>
          </div>
        </div>
      )}

      {inside && dressOpen && (
        <div className={styles.sheet} role="dialog" aria-label={t.dressTitle}>
          <h2>{t.dressTitle}</h2>
          <p>
            <Phrases text={t.dressBody} />
          </p>
          <div className={styles.choices}>
            {ITEMS.map((it) => (
              <button key={it.id} type="button" aria-pressed={look.items.includes(it.id)} onClick={() => wear(it.id)}>
                {it[lang]}
              </button>
            ))}
          </div>
          {look.items.includes("scarf") && (
            <fieldset className={styles.swatches}>
              <legend>{t.scarfColor}</legend>
              {SCARF_COLORS.map((c, i) => (
                <button key={c} type="button" aria-pressed={look.scarf === i} aria-label={`${t.scarfColor} ${i + 1}`} style={{ background: c }} onClick={() => scarf(i)} />
              ))}
            </fieldset>
          )}
          <div className={styles.sheetActions}>
            <Link className={styles.ghost} href={`/metaverse/wardrobe?from=${room.slug}`}>
              {t.wardrobe}
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setDressOpen(false)}>
              {t.done}
            </button>
          </div>
        </div>
      )}

      {inside && actsOpen && (
        <div className={`${styles.phrases} ${styles.acts}`} role="menu" id="action-menu">
          {EMOTES.map((e) => (
            <button key={e.id} type="button" role="menuitem" onClick={() => emote(e.id)}>
              {e[lang]}
            </button>
          ))}
        </div>
      )}

      {inside && sayOpen && (
        <div className={styles.chatPanel} id="phrase-menu" role="dialog" aria-label={t.say}>
          {chat.length > 0 && (
            <ol className={styles.chatLog} aria-live="polite">
              {chat.slice(-12).map((l) => (
                <li key={l.key} data-mine={l.mine}>
                  <span className={styles.chatName}>{l.mine ? t.you : shownName(l.name, lang)}</span>
                  <span className={styles.chatText}>{l.translated ?? l.text}</span>
                  {l.translated && (
                    <span className={styles.chatOriginal}>
                      {t.original} {l.text}
                    </span>
                  )}
                  {!l.mine && (
                    <button type="button" className={styles.chatHide} onClick={() => hide(l.id, shownName(l.name, lang))}>
                      {t.hide}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
          <form className={styles.chatForm} onSubmit={sendChat}>
            <input
              type="text"
              value={draft}
              maxLength={MAX_CHAT}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.chatPlaceholder}
              aria-label={t.chatPlaceholder}
              enterKeyHint="send"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
              {t.send}
            </button>
          </form>
          <div className={styles.phraseGrid}>
            {PHRASES.map((p) => (
              <button key={p.id} type="button" onClick={() => say(p.id)}>
                {p[lang]}
              </button>
            ))}
          </div>
          <p className={styles.chatNote}>
            <Phrases text={canTranslate() ? t.translateOn : t.translateOff} />
          </p>
        </div>
      )}

      {inside && <Joystick stick={stick} label={t.joystick} />}

      {inside && (
        <nav className={styles.dock} aria-label={t.say}>
          <button type="button" className={styles.sayButton} aria-expanded={sayOpen} aria-controls="phrase-menu" onClick={() => (setActsOpen(false), setSayOpen((v) => !v))}>
            {sayOpen ? t.close : t.say}
          </button>
          {EMOTES.map((e) => (
            <button key={e.id} type="button" className={`${styles.dockButton} ${styles.wide}`} onClick={() => emote(e.id)}>
              {e[lang]}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.dockButton} ${styles.narrow}`}
            aria-expanded={actsOpen}
            aria-controls="action-menu"
            onClick={() => (setSayOpen(false), setActsOpen((v) => !v))}
          >
            {actsOpen ? t.close : t.actions}
          </button>
          <button type="button" className={styles.dockButton} onClick={() => (setSayOpen(false), setActsOpen(false), setDressOpen(true))}>
            {t.dress}
          </button>
          <button type="button" className={styles.dockButton} onClick={() => (setSayOpen(false), setActsOpen(false), setMapOpen(true))}>
            {t.map}
          </button>
          <button type="button" className={styles.dockButton} onClick={() => (setSayOpen(false), setActsOpen(false), touch(), emit("photo"))}>
            {t.photo}
          </button>
        </nav>
      )}

      {waiting > 0 && (
        <div className={styles.overlay} role="status">
          <div className={styles.card}>
            <h2>{t.fullTitle}</h2>
            <p>
              <Phrases text={t.fullBody(waiting)} />
            </p>
            <div className={styles.sheetActions}>
              <Link className={styles.ghost} href="/metaverse">
                {t.leave}
              </Link>
              <button type="button" className="btn btn-primary" onClick={() => switchCopy(pickInstance(copies.map((c, i) => (i + 1 === instance ? CAPACITY : c))))}>
                {t.otherCopy}
              </button>
            </div>
          </div>
        </div>
      )}

      {away && (
        <div className={styles.overlay} role="status">
          <div className={styles.card}>
            <h2>{t.awayTitle}</h2>
            <p>
              <Phrases text={t.awayBody} />
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setSession((s) => s + 1)}>
              {t.comeBack}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Automatic names read "Traveler 42" on the wire; Korean readers see "여행자 42". */
const shownName = (name: string, lang: "en" | "ko") => (lang === "ko" ? name.replace(/^Traveler (\d{1,2})$/, "여행자 $1") : name);

interface ChatLine {
  key: number;
  id: string;
  name: string;
  text: string;
  translated?: string;
  mine: boolean;
}

/** Where the camera looks from: yaw around the traveler, pitch above the ground, distance. */
export interface View {
  yaw: number;
  pitch: number;
  dist: number;
  touchedAt: number; // last time the person turned the camera themselves
  first: boolean; // first-person: the camera sits at the traveler's eyes
  tilt: number; // first-person only: looking up (+) or down (-)
}

/** Static scenery: compute transforms once, then skip them every frame. */
function Frozen({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const done = useRef(0);
  useFrame(() => {
    if (done.current > 2 || !g.current) return;
    // A couple of frames in, everything (including late textures) has been placed.
    if (++done.current === 2) {
      g.current.updateMatrixWorld(true);
      g.current.traverse((o) => {
        if (o === g.current) return;
        o.matrixAutoUpdate = false;
        o.matrixWorldAutoUpdate = false;
      });
      // Then draw it as a few large meshes instead of hundreds of small ones.
      mergeStatic(g.current);
    }
  });
  return <group ref={g}>{children}</group>;
}

function Lights({ room, motions, meId, low }: { room: RoomConfig; motions: React.RefObject<Map<string, Motion>>; meId: string; low: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  // The sun's shadow box follows the traveler, so a large map keeps crisp shadows nearby.
  const gl = useThree((st) => st.gl);
  const frame = useRef(0);
  useEffect(() => {
    gl.shadowMap.autoUpdate = !low;
    gl.shadowMap.needsUpdate = true;
  }, [gl, low]);
  useFrame(() => {
    // Phones redraw the shadows every third frame; the sun barely moves between them.
    if (low && frame.current++ % 3 === 0) gl.shadowMap.needsUpdate = true;
    const l = sun.current;
    const m = motions.current?.get(meId);
    if (!l || !m || !room.world) return;
    const [sx, sy, sz] = room.sun.position;
    l.position.set(m.x + sx, sy, m.z + sz);
    l.target.position.set(m.x, 0, m.z);
    l.target.updateMatrixWorld();
  });
  useEffect(() => {
    if (sun.current && !sun.current.target.parent) scene.add(sun.current.target);
  }, [scene]);
  const wide = !!room.world;
  return (
    <>
      <hemisphereLight args={[room.ambient.sky, room.ambient.ground, room.ambient.intensity]} />
      <directionalLight
        ref={sun}
        position={room.sun.position}
        color={room.sun.color}
        intensity={room.sun.intensity}
        castShadow
        shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={wide ? -26 : -18}
        shadow-camera-right={wide ? 26 : 18}
        shadow-camera-top={wide ? 26 : 14}
        shadow-camera-bottom={wide ? -26 : -14}
        shadow-camera-far={wide ? 140 : 60}
        shadow-radius={4}
      />
      {room.world ? (
        <>
          <ToonSky top={room.sky.top} horizon={room.sky.bottom} />
          <fog attach="fog" args={room.world.fog} />
        </>
      ) : (
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[0, 6, 6]} scale={[14, 4, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.2} position={[-8, 4, -4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} color={room.sky.top} />
          <Lightformer form="ring" intensity={1.5} position={[6, 7, -2]} scale={3} color={room.sun.color} />
        </Environment>
      )}
    </>
  );
}

/** Wraps the scene so a tap on any surface becomes a walk target (taps, not drags). */
function Walkable({ room, onPick, children }: { room: RoomConfig; onPick: (p: P) => void; children: React.ReactNode }) {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    onPick(nearestWalkable({ x: e.point.x, z: e.point.z }, room.walk));
  };
  return (
    <group onClick={onClick}>
      {children}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Third-person camera at eye level behind the traveler. Drag to look around, pinch or
 * scroll to come closer. While walking, it drifts back behind the traveler on its own.
 */
function Rig({ room, motions, meId, view }: { room: RoomConfig; motions: React.RefObject<Map<string, Motion>>; meId: string; view: React.RefObject<View> }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(room.spawn.x, 1, room.spawn.z));
  const aim = useRef(new THREE.Vector3());
  const ground = (x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) + (room.world.floorLift ?? 0) : 0);
  // Walls, buildings and posts the camera should not pass through.
  const { scene } = useThree();
  const solids = useRef<THREE.Object3D[]>([]);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const fit = useRef(v0(view));
  const frame = useRef(0);
  useFrame((_, dt) => {
    const m = motions.current?.get(meId);
    const v = view.current;
    if (!m || !v) return;
    const near = v.first ? 0.08 : 0.3; // close walls stay drawn from the eyes
    if ((camera as THREE.PerspectiveCamera).near !== near) {
      (camera as THREE.PerspectiveCamera).near = near;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    if (v.first) {
      // Through the traveler's eyes. A walk started by tapping turns the gaze along the way,
      // unless the person has just looked around themselves.
      if (m.path && performance.now() - v.touchedAt > 1500) {
        const want = m.heading + Math.PI;
        v.yaw += Math.atan2(Math.sin(want - v.yaw), Math.cos(want - v.yaw)) * (1 - Math.exp(-dt * 4));
      }
      const eye = ground(m.x, m.z) + (m.sitting ? 0.95 : 1.3);
      const kf = 1 - Math.exp(-dt * 16);
      look.current.x += (m.x - look.current.x) * kf;
      look.current.y += (eye - look.current.y) * kf;
      look.current.z += (m.z - look.current.z) * kf;
      camera.position.copy(look.current);
      const c = Math.cos(v.tilt);
      aim.current.set(look.current.x - Math.sin(v.yaw) * c, look.current.y + Math.sin(v.tilt), look.current.z - Math.cos(v.yaw) * c);
      camera.lookAt(aim.current);
      fit.current = v.dist; // back to the full distance when leaving first person
      return;
    }
    const k = 1 - Math.exp(-dt * 6);
    const ty = ground(m.x, m.z) + 1.25; // pivot at head height
    look.current.x += (m.x - look.current.x) * k;
    look.current.y += (ty - look.current.y) * k;
    look.current.z += (m.z - look.current.z) * k;
    // The camera no longer swings round behind a walk on its own: the place you tapped stays
    // where you tapped it, so the walk does not seem to overshoot.
    const c = Math.cos(v.pitch);
    // Pull the camera in when something stands between it and the traveler.
    dir.set(Math.sin(v.yaw) * c, Math.sin(v.pitch), Math.cos(v.yaw) * c).normalize();
    if (frame.current++ % 3 === 0) {
      if (!solids.current.length) scene.traverse((o) => o.userData.solid && solids.current.push(o));
      ray.set(look.current, dir);
      ray.far = v.dist;
      const hit = ray.intersectObjects(solids.current, false)[0];
      const want = hit ? Math.max(1.2, hit.distance - 0.35) : v.dist;
      fit.current = want < fit.current ? want : fit.current + (want - fit.current) * 0.25;
    }
    const d = Math.min(v.dist, fit.current);
    camera.position.set(look.current.x + dir.x * d, look.current.y + dir.y * d, look.current.z + dir.z * d);
    const floor = ground(camera.position.x, camera.position.z) + 0.5;
    if (camera.position.y < floor) camera.position.y = floor;
    // Look past the traveler toward the street ahead, so the view shows the lane and the
    // sky rather than the ground. Higher pitch tilts the gaze down more, like a person would.
    const ahead = Math.max(2, d * (1.1 - v.pitch * 0.8));
    aim.current.set(
      look.current.x - Math.sin(v.yaw) * ahead,
      look.current.y - Math.max(0, v.pitch - 0.15) * v.dist * 0.6,
      look.current.z - Math.cos(v.yaw) * ahead,
    );
    camera.lookAt(aim.current);
  });
  return null;
}

const v0 = (view: React.RefObject<View>) => view.current?.dist ?? 5;

/** The old top-down follow, kept for rooms without a world (none now, but cheap to keep). */
function TopRig({ room, motions, meId }: { room: RoomConfig; motions: React.RefObject<Map<string, Motion>>; meId: string }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(room.spawn.x, 0.6, room.spawn.z));
  useFrame((_, dt) => {
    const m = motions.current?.get(meId);
    if (!m) return;
    const k = 1 - Math.exp(-dt * 3);
    look.current.x += (m.x - look.current.x) * k;
    look.current.z += (m.z - look.current.z) * k;
    camera.position.set(look.current.x, 16, look.current.z + 18);
    camera.lookAt(look.current);
  });
  return null;
}

/** WASD and arrow keys on desktop. Sends short walks so others follow along. */
function Keys({
  room,
  motions,
  meId,
  conn,
  enabled,
  onInput,
  onArrive,
  view,
  stick,
}: {
  room: RoomConfig;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  conn: React.RefObject<RoomConnection | null>;
  enabled: boolean;
  onInput: () => void;
  onArrive: () => void;
  view: React.RefObject<View>;
  stick: React.RefObject<Stick>;
}) {
  const keys = useRef(new Set<string>());
  const lastSend = useRef(0);
  const moving = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) {
        keys.current.add(k);
        if (k.startsWith("arrow")) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  useFrame((_, dt) => {
    const m = motions.current?.get(meId);
    if (!m || !enabled) return;
    const k = keys.current;
    const s = stick.current;
    let dx = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    let dz = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    // Shift runs; on the joystick, pushing it most of the way out runs.
    let run = k.has("shift");
    if (s?.active && Math.hypot(s.x, s.y) > 0.15) {
      dx = s.x;
      dz = s.y;
      run = Math.hypot(s.x, s.y) > 0.82;
    }
    if (!dx && !dz) {
      if (moving.current) {
        moving.current = false;
        conn.current?.send({ kind: "move", id: meId, path: [{ x: m.x, z: m.z }, { x: m.x, z: m.z }], speed: m.speed });
        onArrive();
      }
      return;
    }
    onInput();
    moving.current = true;
    m.path = null;
    m.sitting = false;
    m.speed = run ? RUN_SPEED : WALK_SPEED;
    m.steerAt = performance.now();
    // Forward is away from the camera.
    const yaw = view.current?.yaw ?? 0;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = -fz;
    const rz = fx;
    const wx = fx * -dz + rx * dx;
    const wz = fz * -dz + rz * dx;
    const len = Math.hypot(wx, wz) || 1;
    // Allow longer frames than the renderer does, so slow phones still walk at full speed.
    const step = m.speed * Math.min(dt, 0.1);
    const nx = m.x + (wx / len) * step;
    const nz = m.z + (wz / len) * step;
    if (isWalkable({ x: nx, z: nz }, room.walk)) (m.x = nx), (m.z = nz);
    else if (isWalkable({ x: nx, z: m.z }, room.walk)) m.x = nx;
    else if (isWalkable({ x: m.x, z: nz }, room.walk)) m.z = nz;
    m.heading = Math.atan2(wx, wz);
    const now = performance.now();
    if (now - lastSend.current > 250) {
      lastSend.current = now;
      const ahead = nearestWalkable({ x: m.x + (wx / len) * m.speed * 0.3, z: m.z + (wz / len) * m.speed * 0.3 }, room.walk);
      conn.current?.send({ kind: "move", id: meId, path: [{ x: m.x, z: m.z }, ahead], speed: m.speed });
    }
  });
  return null;
}

function PoiWatch({
  room,
  motions,
  meId,
  onNear,
  onNearLamp,
  onSitting,
}: {
  room: RoomConfig;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  onNear: (p: Poi | null) => void;
  onNearLamp: (i: number | null) => void;
  onSitting: (sitting: boolean) => void;
}) {
  const last = useRef<string | null>(null);
  const wasSitting = useRef(false);
  const lastLamp = useRef<number | null>(null);
  const tick = useRef(0);
  useFrame((_, dt) => {
    tick.current += dt;
    if (tick.current < 0.2) return;
    tick.current = 0;
    const m = motions.current?.get(meId);
    if (!m) return;
    if (m.sitting !== wasSitting.current) {
      wasSitting.current = m.sitting;
      onSitting(m.sitting);
    }
    // where several places overlap, the one the traveler stands closest to wins
    let hit: Poi | null = null;
    let best = Infinity;
    for (const p of room.pois) {
      const d = Math.hypot(p.at.x - m.x, p.at.z - m.z);
      if (d < p.radius && d < best) (best = d), (hit = p);
    }
    if ((hit?.id ?? null) !== last.current) {
      last.current = hit?.id ?? null;
      onNear(hit);
    }
    let lamp: number | null = null;
    room.lamps?.forEach(([x, z], i) => {
      if (Math.hypot(x - m.x, z - m.z) < 2.2) lamp = i;
    });
    if (lamp !== lastLamp.current) {
      lastLamp.current = lamp;
      onNearLamp(lamp);
    }
  });
  return null;
}

type Labels = (typeof UI)[keyof typeof UI];

// Effect names a room may define; anything else arriving over the network is dropped.
const EFFECT = /^[a-z0-9-]{1,24}$/;
// The same traveler setting off the same effect again within a second and a half is ignored,
// so one visitor cannot flood everyone's screen.
const lastUse = new Map<string, number>();
function spam(id: string, effect: string) {
  const key = `${id}:${effect}`;
  const now = performance.now();
  const before = lastUse.get(key) ?? -Infinity;
  lastUse.set(key, now);
  return now - before < 1500;
}

/** One clear thing to do where the traveler stands. */
function ContextAction({
  poi,
  lamp,
  lang,
  labels,
  onLantern,
  onSit,
  onWatch,
  onSignal,
  onUse,
  onLamp,
}: {
  poi: Poi | null;
  lamp: number | null;
  lang: "en" | "ko";
  labels: Labels;
  onLantern: () => void;
  onSit: () => void;
  onWatch: () => void;
  onSignal: () => void;
  onUse: (poi: Poi) => void;
  onLamp: (i: number) => void;
}) {
  let label: string | null = null;
  let run: (() => void) | null = null;
  if (poi?.action === "lantern") (label = labels.hangLantern), (run = onLantern);
  else if (poi?.action === "sit") (label = poi.actionLabel?.[lang] ?? labels.sit), (run = onSit);
  else if (poi?.action === "watch") (label = labels.watch), (run = onWatch);
  else if (poi?.action === "signal") (label = poi.actionLabel?.[lang] ?? labels.signal), (run = onSignal);
  else if (poi?.action === "use" && poi.actionLabel) (label = poi.actionLabel[lang]), (run = () => onUse(poi));
  else if (poi?.action === "photo") (label = poi.actionLabel?.[lang] ?? labels.photoHere), (run = () => emit("photo"));
  else if (lamp !== null) (label = labels.lightLamp), (run = () => onLamp(lamp));
  if (!label || !run) return null;
  return (
    <button type="button" className={styles.contextAction} onClick={run}>
      {label}
    </button>
  );
}

/** The place note: opens for a few seconds, then folds to its title so it stays out of the way. */
function PoiCard({ poi, lang }: { poi: Poi; lang: "en" | "ko" }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    // Phones have little room: fold the note to its title sooner.
    const id = setTimeout(() => setOpen(false), window.innerWidth < 640 ? 3500 : 6000);
    return () => clearTimeout(id);
  }, []);
  return (
    <aside className={styles.poi} data-open={open} aria-live="polite">
      <button type="button" className={styles.poiHead} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <h2>{poi.title[lang]}</h2>
      </button>
      {open && (
        <p>
          <Phrases text={poi.line[lang]} />
        </p>
      )}
    </aside>
  );
}

/** Covers the first load (textures, the traveler, the sky) with a quiet progress line. */
function Loader({ label }: { label: string }) {
  const { progress, active, total } = useProgress();
  const [gone, setGone] = useState(false);
  // The toon world is drawn in code, so often nothing is downloaded at all; then the first
  // frames are the only wait.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(id);
  }, []);
  const done = !active && (progress >= 100 || (settled && total === 0));
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(id);
  }, [done]);
  if (gone) return null;
  return (
    <div className={styles.loader} data-done={done} role="status" aria-live="polite">
      <p>{label}</p>
      <div className={styles.loaderBar}>
        <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
      </div>
      <p className={styles.loaderPct}>{Math.round(progress)}%</p>
    </div>
  );
}

/** A soft ring where a tap-to-walk is headed, so you can see exactly where you are going. */
function TapTarget({ motions, meId, ground }: { motions: React.RefObject<Map<string, Motion>>; meId: string; ground: (x: number, z: number) => number }) {
  const ring = useRef<THREE.Mesh>(null);
  const shown = useRef(0);
  useFrame((state, dt) => {
    const m = motions.current?.get(meId);
    const r = ring.current;
    if (!r) return;
    const end = m?.path?.[m.path.length - 1];
    shown.current += ((end ? 1 : 0) - shown.current) * (1 - Math.exp(-dt * 10));
    r.visible = shown.current > 0.02;
    if (end) r.position.set(end.x, ground(end.x, end.z) + 0.04, end.z);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.06;
    r.scale.setScalar((0.6 + 0.4 * shown.current) * pulse);
    (r.material as THREE.MeshBasicMaterial).opacity = 0.8 * shown.current;
  });
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={2}>
      <ringGeometry args={[0.32, 0.42, 40]} />
      <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
    </mesh>
  );
}

/** Listens for the photo button: draws one clean frame of the 3D view and hands it over. */
function PhotoBooth({ onShot }: { onShot: (dataUrl: string) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(
    () =>
      on("photo", () => {
        // Read right after drawing, before the browser clears the canvas.
        gl.render(scene, camera);
        onShot(gl.domElement.toDataURL("image/jpeg", 0.92));
      }),
    [gl, scene, camera, onShot],
  );
  return null;
}
