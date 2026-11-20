"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Shuffle } from "@phosphor-icons/react";
import { ToonFigure, type Action } from "./ToonFigure";
import { useLang } from "@/lib/lang.ts";
import {
  HAIR_COLORS,
  OUTFITS,
  SKINS,
  defaultAvatar,
  hairsFor,
  outfitsFor,
  paletteOf,
  sanitizeAvatar,
  withGender,
  type Avatar,
  type Gender,
} from "@/lib/metaverse/outfit.ts";
import { ITEMS, SCARF_COLORS, defaultLook, sanitizeLook, toggleItem, type Look } from "@/lib/metaverse/look.ts";
import styles from "./FittingRoom.module.css";

const KEY = "seoul.mv.avatar1";
const LOOK_KEY = "seoul.mv.look2"; // shared with the metaverse room

const T = {
  en: {
    title: "Fitting room",
    lead: "Choose how you look before you walk into Seoul.",
    gender: "Figure",
    genders: { f: "Woman", m: "Man" },
    outfit: "Outfit",
    color: "Colour",
    hair: "Hair",
    hairColor: "Hair colour",
    skin: "Skin tone",
    skinN: (n: number) => `Skin tone ${n}`,
    props: "Things to carry",
    propsHint: "One each in the hand, at the waist, round the neck and in the hair.",
    scarfColor: "Scarf colour",
    scarfN: (n: number) => `Scarf colour ${n}`,
    shuffle: "Surprise me",
    saved:
      "Saved on this device. Your traveler will look like this in the metaverse.",
    preview: "Try a move",
    actions: {
      idle: "Stand",
      walk: "Walk",
      wave: "Wave",
      bow: "Bow",
      sit: "Sit",
      hop: "Hop",
    },
  },
  ko: {
    title: "옷장",
    lead: "서울을 걷기 전에 내 모습을 골라 보세요.",
    gender: "캐릭터",
    genders: { f: "여자", m: "남자" },
    outfit: "옷",
    color: "색",
    hair: "머리",
    hairColor: "머리색",
    skin: "피부 톤",
    skinN: (n: number) => `피부 톤 ${n}`,
    props: "소품",
    propsHint: "손, 허리, 목, 머리에 하나씩 달 수 있어요.",
    scarfColor: "목도리 색",
    scarfN: (n: number) => `목도리 색 ${n}`,
    shuffle: "무작위로 고르기",
    saved: "이 기기에 저장됩니다. 메타버스에서 이 모습으로 걷게 됩니다.",
    preview: "동작 보기",
    actions: {
      idle: "서 있기",
      walk: "걷기",
      wave: "손 흔들기",
      bow: "인사",
      sit: "앉기",
      hop: "점프",
    },
  },
} as const;

const ACTIONS: Action[] = ["idle", "walk", "wave", "bow", "sit", "hop"];
const pick = <X,>(xs: readonly X[]) =>
  xs[Math.floor(Math.random() * xs.length)];

export function FittingRoom() {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const [av, setAv] = useState<Avatar>(() => defaultAvatar("f"));
  const [action, setAction] = useState<Action>("idle");
  const [look, setLook] = useState<Look>(defaultLook);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setAv(sanitizeAvatar(JSON.parse(saved)));
      setLook(sanitizeLook(JSON.parse(localStorage.getItem(LOOK_KEY) ?? "null")));
    } catch {}
  }, []);

  const update = (next: Avatar) => {
    setAv(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const wear = (next: Look) => {
    setLook(next);
    try {
      localStorage.setItem(LOOK_KEY, JSON.stringify(next));
    } catch {}
  };

  const outfit = OUTFITS.find((o) => o.id === av.outfit)!;
  const colorway = outfit.colorways[av.colorway];
  const palette = paletteOf(av);
  const shuffle = () => {
    const gender: Gender = Math.random() < 0.5 ? "f" : "m";
    const o = pick(outfitsFor(gender));
    update({
      gender,
      outfit: o.id,
      colorway: Math.floor(Math.random() * o.colorways.length),
      hair: pick(hairsFor(gender)).id,
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      skin: av.skin,
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <Canvas
          flat
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.9, 3.7], fov: 30 }}
        >
          <color attach="background" args={["#ece5d9"]} />
          <hemisphereLight args={["#fff6e8", "#d9c8b6", 1.05]} />
          <directionalLight
            position={[1.6, 2.6, 4.2]}
            intensity={2.1}
            color="#fff3e2"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <ToonFigure
            outfit={av.outfit}
            hair={av.hair}
            palette={palette}
            lashes={av.gender === "f"}
            action={action}
            look={look}
            position={[0, 0.03, 0]}
          />
          {/* a low round stand, like a shop's fitting podium */}
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.62, 0.64, 0.03, 64]} />
            <meshToonMaterial color="#f6f0e6" />
          </mesh>
          <ContactShadows
            position={[0, 0.032, 0]}
            opacity={0.32}
            scale={2.4}
            blur={2}
            far={1.2}
          />
          <OrbitControls
            target={[0, 0.56, 0]}
            enablePan={false}
            minDistance={1.6}
            maxDistance={4.6}
            minPolarAngle={0.6}
            maxPolarAngle={1.62}
          />
        </Canvas>
        <div className={styles.moves} role="group" aria-label={t.preview}>
          {ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={action === a}
              onClick={() => setAction(a)}
            >
              {t.actions[a]}
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.panel}>
        <header className={styles.head}>
          <div>
            <h1>{t.title}</h1>
            <p>{t.lead}</p>
          </div>
          <button
            type="button"
            className={styles.lang}
            onClick={() => chooseLang(lang === "ko" ? "en" : "ko")}
          >
            {lang === "ko" ? "EN" : "한국어"}
          </button>
        </header>

        <section aria-labelledby="fr-gender">
          <h2 id="fr-gender">{t.gender}</h2>
          <div className={styles.segment}>
            {(["f", "m"] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={av.gender === g}
                onClick={() => update(withGender(av, g))}
              >
                {t.genders[g]}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="fr-outfit">
          <h2 id="fr-outfit">{t.outfit}</h2>
          <div className={styles.cards}>
            {outfitsFor(av.gender).map((o) => {
              const c =
                o.colorways[o.id === av.outfit ? av.colorway : 0].colors;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={av.outfit === o.id}
                  onClick={() =>
                    update({
                      ...av,
                      outfit: o.id,
                      colorway: o.id === av.outfit ? av.colorway : 0,
                    })
                  }
                >
                  <span
                    className={styles.duo}
                    aria-hidden="true"
                    style={
                      { "--a": c.top, "--b": c.bottom } as React.CSSProperties
                    }
                  />
                  {o[lang]}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="fr-color">
          <h2 id="fr-color">
            {t.color} <span>{colorway[lang]}</span>
          </h2>
          <div className={styles.swatches}>
            {outfit.colorways.map((c, i) => (
              <button
                key={c.en}
                type="button"
                className={styles.swatch}
                aria-pressed={av.colorway === i}
                aria-label={c[lang]}
                title={c[lang]}
                onClick={() => update({ ...av, colorway: i })}
                style={
                  {
                    "--a": c.colors.top,
                    "--b":
                      outfit.id === "dress" || outfit.id === "durumagi"
                        ? c.colors.accent
                        : c.colors.bottom,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="fr-hair">
          <h2 id="fr-hair">{t.hair}</h2>
          <div className={styles.chips}>
            {hairsFor(av.gender).map((h) => (
              <button
                key={h.id}
                type="button"
                aria-pressed={av.hair === h.id}
                onClick={() => update({ ...av, hair: h.id })}
              >
                {h[lang]}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="fr-haircolor">
          <h2 id="fr-haircolor">{t.hairColor}</h2>
          <div className={styles.swatches}>
            {HAIR_COLORS.map((c, i) => (
              <button
                key={c.hex}
                type="button"
                className={styles.swatch}
                aria-pressed={av.hairColor === i}
                aria-label={c[lang]}
                title={c[lang]}
                onClick={() => update({ ...av, hairColor: i })}
                style={{ "--a": c.hex, "--b": c.hex } as React.CSSProperties}
              />
            ))}
          </div>
        </section>
        <section aria-labelledby="fr-skin">
          <h2 id="fr-skin">{t.skin}</h2>
          <div className={styles.swatches}>
            {SKINS.map((c, i) => (
              <button
                key={c}
                type="button"
                className={styles.swatch}
                aria-pressed={av.skin === i}
                aria-label={t.skinN(i + 1)}
                title={t.skinN(i + 1)}
                onClick={() => update({ ...av, skin: i })}
                style={{ "--a": c, "--b": c } as React.CSSProperties}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="fr-props">
          <h2 id="fr-props">{t.props}</h2>
          <p className={styles.hint}>{t.propsHint}</p>
          <div className={styles.chips}>
            {ITEMS.map((it) => (
              <button key={it.id} type="button" aria-pressed={look.items.includes(it.id)} onClick={() => wear(toggleItem(look, it.id))}>
                {it[lang]}
              </button>
            ))}
          </div>
          {look.items.includes("scarf") && (
            <div className={styles.sub}>
              <h3>{t.scarfColor}</h3>
              <div className={styles.swatches}>
                {SCARF_COLORS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.swatch}
                    aria-pressed={look.scarf === i}
                    aria-label={t.scarfN(i + 1)}
                    title={t.scarfN(i + 1)}
                    onClick={() => wear({ ...look, scarf: i })}
                    style={{ "--a": c, "--b": c } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className={styles.foot}>
          <button type="button" className={styles.shuffle} onClick={shuffle}>
            <Shuffle size={18} weight="bold" aria-hidden="true" />
            {t.shuffle}
          </button>
          <p>{t.saved}</p>
        </footer>
      </aside>
    </div>
  );
}
