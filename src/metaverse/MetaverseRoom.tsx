"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { findPath, isWalkable, nearestWalkable, type P } from "@/lib/metaverse/path.ts";
import { joinRoom, type Presence, type RoomConnection, type RoomEvent } from "@/lib/metaverse/realtime.ts";
import { CAPACITY, isIdle, seatMembers, statusOf } from "@/lib/metaverse/queue.ts";
import { EMOTES, PHRASES, phraseText } from "@/lib/metaverse/phrases.ts";
import { autoName } from "@/lib/metaverse/names.ts";
import { typeCode, type Answer } from "@/lib/match/match.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { useLang } from "@/lib/lang.ts";
import { Phrases } from "@/components/Phrases";
import { Avatar, WALK_SPEED, newMotion, type Motion } from "./Avatar";
import { OUTFITS } from "./glaze";
import { heightAt } from "./world";
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
    hint: "Tap the ground to walk",
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
    hint: "바닥을 누르면 걸어가요",
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
  const [members, setMembers] = useState<Presence[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const [near, setNear] = useState<Poi | null>(null);
  const [sayOpen, setSayOpen] = useState(false);
  const [actsOpen, setActsOpen] = useState(false);
  const [away, setAway] = useState(false);
  const [hint, setHint] = useState(true);
  const [look, setLook] = useState({ body: 0, hat: 0 });

  const me = useRef<{ id: string; type: string | null; name: string }>({ id: "", type: null, name: "" });
  const motions = useRef(new Map<string, Motion>());
  const conn = useRef<RoomConnection | null>(null);
  const lastInput = useRef(Date.now());
  const view = useRef<View>({ yaw: (room.spawnHeading ?? 0) + Math.PI, pitch: 0.3, dist: 5.6, touchedAt: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const ground = useCallback((x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) : 0), [room]);

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
      v.pitch = Math.min(1.2, Math.max(0.08, v.pitch + (e.clientY - prev.y) * 0.004));
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
    let body = parseInt(id.replace(/\D/g, "").slice(0, 3) || "0", 10) % OUTFITS.length;
    let hat = 0;
    try {
      const saved = JSON.parse(localStorage.getItem("seoul.mv.look") ?? "null");
      if (saved && typeof saved.body === "number") ({ body, hat } = saved);
    } catch {}
    setLook({ body, hat });
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

  // Join the room's channel.
  useEffect(() => {
    if (!ready || !webgl) return;
    const { id, type, name } = me.current;
    const spawn = { x: room.spawn.x + (Math.random() - 0.5) * 3, z: room.spawn.z + (Math.random() - 0.5) * 1.5 };
    motions.current.set(id, newMotion(spawn.x, spawn.z, room.spawnHeading ?? 0));
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
      }
    };
    const c = joinRoom(room.slug, presence, {
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
  }, [ready, webgl, room, session]);

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
  }, []);

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

  const changeOutfit = () => {
    touch();
    const next = { body: (look.body + 1) % OUTFITS.length, hat: look.body % 2 === 1 ? 1 - look.hat : look.hat };
    setLook(next);
    try {
      localStorage.setItem("seoul.mv.look", JSON.stringify(next));
    } catch {}
    conn.current?.update({ look: next });
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
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: room.world ? 50 : 34, near: 0.3, far: 600, position: [0, 12, 14] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NeutralToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
        >
          <Lights room={room} motions={motions} meId={me.current.id} />
          <Walkable room={room} onPick={walkTo}>
            <room.Scene />
          </Walkable>
          {inside && me.current.id && (
            <Avatar
              key="me"
              motion={motions.current.get(me.current.id) ?? newMotion(room.spawn.x, room.spawn.z)}
              outfit={look.body}
              hat={look.hat}
              name={me.current.name}
              type={me.current.type}
              sameType={false}
              isMe
              bubble={bubbles[me.current.id] ?? null}
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
                outfit={p.look?.body ?? 0}
                hat={p.look?.hat ?? 0}
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
          <PoiWatch room={room} motions={motions} meId={me.current.id} onNear={setNear} />
        </Canvas>
      )}

      <header className={styles.top}>
        <Link href="/metaverse" className={styles.back}>
          {t.rooms}
        </Link>
        <div className={styles.title}>
          <h1>{room.name[lang]}</h1>
          <p>
            <span className="phrase">{room.place[lang]}</span> <span className="phrase">· {room.hour[lang]}</span>
          </p>
        </div>
        <div className={styles.topRight}>
          <span className={styles.count} aria-live="polite">
            {status === "connecting" ? t.connecting : t.here(count)}
          </span>
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

      {status === "offline" && !away && <p className={styles.notice}>{t.offline}</p>}
      {hint && inside && <p className={styles.hint}>{t.hint}</p>}

      {near && inside && (
        <aside className={styles.poi} aria-live="polite">
          <h2>{near.title[lang]}</h2>
          <p>
            <Phrases text={near.line[lang]} />
          </p>
        </aside>
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
        </nav>
      )}

      {waiting > 0 && (
        <div className={styles.overlay} role="status">
          <div className={styles.card}>
            <h2>{t.fullTitle}</h2>
            <p>
              <Phrases text={t.fullBody(waiting)} />
            </p>
            <Link className="btn btn-primary" href="/metaverse">
              {t.leave}
            </Link>
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

function Lights({ room, motions, meId }: { room: RoomConfig; motions: React.RefObject<Map<string, Motion>>; meId: string }) {
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
  const ground = (x: number, z: number) => (room.world ? heightAt(x, z, room.world.hills) : 0);
  useFrame((_, dt) => {
    const m = motions.current?.get(meId);
    const v = view.current;
    if (!m || !v) return;
    const k = 1 - Math.exp(-dt * 6);
    const ty = ground(m.x, m.z) + 0.95;
    look.current.x += (m.x - look.current.x) * k;
    look.current.y += (ty - look.current.y) * k;
    look.current.z += (m.z - look.current.z) * k;
    if (m.path && performance.now() - v.touchedAt > 1500) {
      const behind = m.heading + Math.PI;
      v.yaw += Math.atan2(Math.sin(behind - v.yaw), Math.cos(behind - v.yaw)) * (1 - Math.exp(-dt * 1.2));
    }
    const c = Math.cos(v.pitch);
    camera.position.set(
      look.current.x + Math.sin(v.yaw) * c * v.dist,
      look.current.y + Math.sin(v.pitch) * v.dist,
      look.current.z + Math.cos(v.yaw) * c * v.dist,
    );
    const floor = ground(camera.position.x, camera.position.z) + 0.6;
    if (camera.position.y < floor) camera.position.y = floor;
    camera.lookAt(look.current);
  });
  return null;
}

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
}: {
  room: RoomConfig;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  onNear: (p: Poi | null) => void;
}) {
  const last = useRef<string | null>(null);
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
  });
  return null;
}
