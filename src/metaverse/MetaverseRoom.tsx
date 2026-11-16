"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { findPath, isWalkable, nearestWalkable, type P } from "@/lib/metaverse/path.ts";
import { fetchLanterns, hangLantern, joinRoom, peekCounts, type Lantern, type Presence, type RoomConnection, type RoomEvent } from "@/lib/metaverse/realtime.ts";
import { LANTERN_COLORS, WISHES, type WishId } from "@/lib/metaverse/lanterns.ts";
import { ITEMS, SCARF_COLORS, defaultLook, sanitizeLook, toggleItem, type ItemId, type Look } from "@/lib/metaverse/look.ts";
import { CAPACITY, MAX_INSTANCES, isIdle, pickInstance, seatMembers, statusOf } from "@/lib/metaverse/queue.ts";
import { EMOTES, PHRASES, phraseText } from "@/lib/metaverse/phrases.ts";
import { autoName } from "@/lib/metaverse/names.ts";
import { typeCode, type Answer } from "@/lib/match/match.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { useLang } from "@/lib/lang.ts";
import { Phrases } from "@/components/Phrases";
import { Avatar, WALK_SPEED, newMotion, type Motion } from "./Avatar";
import { heightAt, LampPost } from "./world";
import { LanternRack } from "./Lanterns";
import { FallingLeaves } from "./autumn";
import { Effects } from "./Effects";
import { chime, setSound, stopSound } from "./sound";
import { emit } from "./bus";
import { MapSheet } from "./MapSheet";
import { asset } from "@/lib/base-path.ts";
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
    scarfColor: "Scarf colour",
    done: "Done",
    otherCopy: "Go to another copy",
    map: "Map",
    loading: "Setting up the neighbourhood",
    mapTitle: "Around Seosulla-gil",
    mapHint: "Tap a place to walk there.",
    you: "You",
    hint: "Tap the ground to walk. Drag to look around.",
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
    scarfColor: "목도리 색",
    done: "완료",
    otherCopy: "다른 방으로 가기",
    map: "지도",
    loading: "동네를 준비하는 중",
    mapTitle: "서순라길 둘러보기",
    mapHint: "가고 싶은 곳을 누르면 걸어가요.",
    you: "나",
    hint: "바닥을 누르면 걸어가요. 드래그하면 둘러볼 수 있어요.",
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
  const [members, setMembers] = useState<Presence[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const [near, setNear] = useState<Poi | null>(null);
  const [sayOpen, setSayOpen] = useState(false);
  const [actsOpen, setActsOpen] = useState(false);
  const [away, setAway] = useState(false);
  const [hint, setHint] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setHint(false), 7000);
    return () => clearTimeout(id);
  }, []);
  const [look, setLook] = useState<Look>(defaultLook());
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
  const view = useRef<View>({ yaw: (room.spawnHeading ?? 0) + Math.PI, pitch: 0.2, dist: 5.2, touchedAt: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const ground = useCallback((x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) : 0), [room]);
  // Phones get lighter effects; iPads and computers keep the full set. (An automatic
  // step-down tripped on loading hitches and left iPads blurry and jagged, so it is gone.)
  const [lowPower] = useState(() => typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 600);

  // Drag to look around, wheel or pinch to come closer.
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [role=menu]")) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !room.world) return;
    const v = view.current;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) v.dist = Math.min(14, Math.max(2.8, v.dist * (pinch.current / Math.max(1, d))));
      pinch.current = d;
    } else {
      v.yaw -= (e.clientX - prev.x) * 0.006;
      v.pitch = Math.min(1.1, Math.max(-0.08, v.pitch + (e.clientY - prev.y) * 0.005));
    }
    v.touchedAt = performance.now();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = 0;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!room.world) return;
    view.current.dist = Math.min(14, Math.max(2.8, view.current.dist * Math.exp(e.deltaY * 0.0012)));
  };
  const bubbleTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Identity, look and capability checks happen in the browser only.
  useEffect(() => {
    const id = myId();
    me.current = { id, type: myType(), name: autoName(id) };
    try {
      setLook(sanitizeLook(JSON.parse(localStorage.getItem("seoul.mv.look2") ?? "null")));
    } catch {}
    setWebgl(hasWebgl());
    setReady(true);
  }, []);

  const showBubble = useCallback(
    (id: string, phrase: string) => {
      const text = phraseText(phrase, lang);
      if (!text) return;
      setBubbles((b) => ({ ...b, [id]: text }));
      clearTimeout(bubbleTimers.current.get(id));
      bubbleTimers.current.set(
        id,
        setTimeout(() => setBubbles((b) => Object.fromEntries(Object.entries(b).filter(([k]) => k !== id))), 4200),
      );
    },
    [lang],
  );
  const showBubbleRef = useRef(showBubble);
  showBubbleRef.current = showBubble;

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
    // ?at=x,z starts somewhere else (for checking a spot); the point is snapped onto the walkable area.
    const at = new URLSearchParams(location.search).get("at")?.split(",").map(Number);
    const spawn = lastSpot.current
      ? lastSpot.current
      : at && at.length === 2 && at.every(Number.isFinite)
        ? nearestWalkable({ x: at[0], z: at[1] }, room.walk)
        : { x: room.spawn.x + (Math.random() - 0.5) * 3, z: room.spawn.z + (Math.random() - 0.5) * 1.5 };
    motions.current.set(id, newMotion(spawn.x, spawn.z, lastSpot.current?.heading ?? room.spawnHeading ?? 0));
    lastSpot.current = null;
    const presence: Presence = { id, joinedAt: Date.now(), name, type, look, x: spawn.x, z: spawn.z, heading: 0 };
    lastInput.current = Date.now();
    setAway(false);

    const onEvent = (e: RoomEvent) => {
      const m = motions.current.get(e.id);
      if (e.kind === "move" && m && e.path.length > 1) {
        m.path = [{ x: m.x, z: m.z }, ...e.path.slice(1)];
        m.start = performance.now();
        m.sitting = false;
      } else if (e.kind === "say") {
        showBubbleRef.current(e.id, e.phrase);
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
    const c = joinRoom(room.slug, instance, presence, {
      onMembers: (list) => {
        for (const p of list) if (!motions.current.has(p.id)) motions.current.set(p.id, newMotion(p.x, p.z, p.heading));
        setMembers(list);
      },
      onEvent,
      onStatus: setStatus,
    });
    conn.current = c;
    const bye = () => c.leave();
    window.addEventListener("pagehide", bye);
    return () => {
      window.removeEventListener("pagehide", bye);
      c.leave();
      conn.current = null;
      motions.current.clear();
      setMembers([]);
    };
    // Look changes are sent with update(), not by rejoining.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, webgl, room, session, instance]);

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
      m.path = path;
      m.start = performance.now();
      m.sitting = false;
      conn.current?.send({ kind: "move", id: me.current.id, path });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inside, room],
  );

  const arrived = useCallback(() => {
    const m = motions.current.get(me.current.id);
    if (m) conn.current?.update({ x: m.x, z: m.z, heading: m.heading });
    const next = pending.current;
    pending.current = null;
    next?.();
  }, []);

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

  const others = members.filter((p) => p.id !== me.current.id && seated.has(p.id));

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
          dpr={lowPower ? [1, 1.25] : [1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: room.world ? 50 : 34, near: 0.3, far: 600, position: [0, 12, 14] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NeutralToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
        >
          <Lights room={room} motions={motions} meId={me.current.id} low={lowPower} />
          <Walkable room={room} onPick={walkTo}>
            <Frozen>
              <room.Scene />
            </Frozen>
            {room.Live && <room.Live />}
            {room.lamps?.map((pos, i) => <LampPost key={i} position={pos} lit={!!lit[i]} hills={room.world?.hills} />)}
            {room.lanterns && <LanternRack lanterns={lanterns} fresh={fresh} />}
          </Walkable>
          {room.world && <FallingLeaves motions={motions} meId={me.current.id} />}
          {room.world && <Effects low={lowPower} />}
          {inside && me.current.id && (
            <Avatar
              key="me"
              motion={motions.current.get(me.current.id) ?? newMotion(room.spawn.x, room.spawn.z)}
              look={look}
              name={me.current.name}
              type={me.current.type}
              sameType={false}
              isMe
              bubble={bubbles[me.current.id] ?? null}
              meLabel={t.you}
              onArrive={arrived}
              ground={ground}
            />
          )}
          {others.map((p) => {
            const m = motions.current.get(p.id) ?? newMotion(p.x, p.z, p.heading);
            motions.current.set(p.id, m);
            return (
              <Avatar
                key={p.id}
                motion={m}
                look={sanitizeLook(p.look)}
                name={p.name}
                type={p.type}
                sameType={!!p.type && p.type === me.current.type}
                isMe={false}
                bubble={bubbles[p.id] ?? null}
                rest={{ x: p.x, z: p.z }}
                ground={ground}
              />
            );
          })}
          {room.world ? <Rig room={room} motions={motions} meId={me.current.id} view={view} /> : <TopRig room={room} motions={motions} meId={me.current.id} />}
          <Keys room={room} motions={motions} meId={me.current.id} conn={conn} enabled={inside} onInput={touch} onArrive={arrived} view={view} />
          <PoiWatch room={room} motions={motions} meId={me.current.id} onNear={setNear} onNearLamp={setNearLamp} />
        </Canvas>
      )}

      {ready && <Loader label={t.loading} />}

      <header className={styles.top}>
        <Link href="/metaverse" className={styles.back}>
          {t.rooms}
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
          <p>
            <span className="phrase">{room.place[lang]}</span> <span className="phrase">· {room.hour[lang]}</span>
          </p>
        </div>
        <div className={styles.topRight}>
          <span className={styles.count} aria-live="polite">
            {status === "connecting" ? t.connecting : t.here(count)}
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

      {status === "offline" && !away && offlineLong && <p className={styles.notice}>{t.offline}</p>}
      {hint && inside && <p className={styles.hint}>{t.hint}</p>}

      {near && inside && <PoiCard key={near.id} poi={near} lang={lang} />}

      {toast && <p className={styles.notice}>{toast}</p>}

      {inside && mapOpen && (
        <MapSheet
          room={room}
          lang={lang}
          labels={t}
          motions={motions}
          meId={me.current.id}
          onGo={(p) => {
            setMapOpen(false);
            walkTo(nearestWalkable(p, room.walk));
          }}
          onClose={() => setMapOpen(false)}
        />
      )}

      {inside && !sayOpen && !actsOpen && !dressOpen && !hangOpen && !mapOpen && (
        <ContextAction
          poi={near}
          lamp={nearLamp !== null && !lit[nearLamp] ? nearLamp : null}
          labels={t}
          onLantern={() => (touch(), setHangOpen(true))}
          onSit={() => near && sitHere(near)}
          onWatch={watch}
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
        <div className={styles.phrases} role="menu" id="phrase-menu">
          {PHRASES.map((p) => (
            <button key={p.id} type="button" role="menuitem" onClick={() => say(p.id)}>
              {p[lang]}
            </button>
          ))}
        </div>
      )}

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

/** Where the camera looks from: yaw around the traveler, pitch above the ground, distance. */
export interface View {
  yaw: number;
  pitch: number;
  dist: number;
  touchedAt: number; // last time the person turned the camera themselves
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
    }
  });
  return <group ref={g}>{children}</group>;
}

function Lights({ room, motions, meId, low }: { room: RoomConfig; motions: React.RefObject<Map<string, Motion>>; meId: string; low: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  // The sun's shadow box follows the traveler, so a large map keeps crisp shadows nearby.
  useFrame(() => {
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
        shadow-mapSize={[2048, 2048]}
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
          <Environment files={asset(room.world.hdr)} background environmentIntensity={0.9} backgroundIntensity={1} />
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
  const ground = (x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) : 0);
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
    const k = 1 - Math.exp(-dt * 6);
    const ty = ground(m.x, m.z) + 1.25; // pivot at head height
    look.current.x += (m.x - look.current.x) * k;
    look.current.y += (ty - look.current.y) * k;
    look.current.z += (m.z - look.current.z) * k;
    if (m.path && performance.now() - v.touchedAt > 1500) {
      const behind = m.heading + Math.PI;
      v.yaw += Math.atan2(Math.sin(behind - v.yaw), Math.cos(behind - v.yaw)) * (1 - Math.exp(-dt * 1.2));
    }
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
}: {
  room: RoomConfig;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  conn: React.RefObject<RoomConnection | null>;
  enabled: boolean;
  onInput: () => void;
  onArrive: () => void;
  view: React.RefObject<View>;
}) {
  const keys = useRef(new Set<string>());
  const lastSend = useRef(0);
  const moving = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
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
    const dx = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    const dz = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    if (!dx && !dz) {
      if (moving.current) {
        moving.current = false;
        conn.current?.send({ kind: "move", id: meId, path: [{ x: m.x, z: m.z }, { x: m.x, z: m.z }] });
        onArrive();
      }
      return;
    }
    onInput();
    moving.current = true;
    m.path = null;
    m.sitting = false;
    // Forward is away from the camera.
    const yaw = view.current?.yaw ?? 0;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = -fz;
    const rz = fx;
    const wx = fx * -dz + rx * dx;
    const wz = fz * -dz + rz * dx;
    const len = Math.hypot(wx, wz) || 1;
    const step = WALK_SPEED * Math.min(dt, 0.05);
    const nx = m.x + (wx / len) * step;
    const nz = m.z + (wz / len) * step;
    if (isWalkable({ x: nx, z: nz }, room.walk)) (m.x = nx), (m.z = nz);
    else if (isWalkable({ x: nx, z: m.z }, room.walk)) m.x = nx;
    else if (isWalkable({ x: m.x, z: nz }, room.walk)) m.z = nz;
    m.heading = Math.atan2(wx, wz);
    const now = performance.now();
    if (now - lastSend.current > 250) {
      lastSend.current = now;
      const ahead = nearestWalkable({ x: m.x + (wx / len) * WALK_SPEED * 0.3, z: m.z + (wz / len) * WALK_SPEED * 0.3 }, room.walk);
      conn.current?.send({ kind: "move", id: meId, path: [{ x: m.x, z: m.z }, ahead] });
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
}: {
  room: RoomConfig;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  onNear: (p: Poi | null) => void;
  onNearLamp: (i: number | null) => void;
}) {
  const last = useRef<string | null>(null);
  const lastLamp = useRef<number | null>(null);
  const tick = useRef(0);
  useFrame((_, dt) => {
    tick.current += dt;
    if (tick.current < 0.2) return;
    tick.current = 0;
    const m = motions.current?.get(meId);
    if (!m) return;
    const hit = room.pois.find((p) => Math.hypot(p.at.x - m.x, p.at.z - m.z) < p.radius) ?? null;
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

/** One clear thing to do where the traveler stands. */
function ContextAction({
  poi,
  lamp,
  labels,
  onLantern,
  onSit,
  onWatch,
  onLamp,
}: {
  poi: Poi | null;
  lamp: number | null;
  labels: Labels;
  onLantern: () => void;
  onSit: () => void;
  onWatch: () => void;
  onLamp: (i: number) => void;
}) {
  let label: string | null = null;
  let run: (() => void) | null = null;
  if (poi?.action === "lantern") (label = labels.hangLantern), (run = onLantern);
  else if (poi?.action === "sit") (label = labels.sit), (run = onSit);
  else if (poi?.action === "watch") (label = labels.watch), (run = onWatch);
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
    const id = setTimeout(() => setOpen(false), 6000);
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
  const { progress, active } = useProgress();
  const [gone, setGone] = useState(false);
  const done = !active && progress >= 100;
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
