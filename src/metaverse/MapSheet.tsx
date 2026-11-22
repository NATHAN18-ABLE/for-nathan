"use client";

import { useEffect, useMemo, useState } from "react";
import type { P } from "@/lib/metaverse/path.ts";
import type { Motion } from "./Avatar";
import type { RoomConfig } from "./types";
import styles from "./Metaverse.module.css";

type Labels = { mapTitle: string; mapHint: string; close: string; you: string; stamped: string; stampCount: (n: number, total: number) => string };

/** A small plan of the neighbourhood. Tap a place to walk there. North is up. */
export function MapSheet({
  room,
  lang,
  labels,
  motions,
  meId,
  onGo,
  onClose,
  stamps,
}: {
  room: RoomConfig;
  lang: "en" | "ko";
  labels: Labels;
  motions: React.RefObject<Map<string, Motion>>;
  meId: string;
  onGo: (p: P) => void;
  onClose: () => void;
  stamps: string[];
}) {
  const places = room.pois.filter((p) => p.stamp !== false);
  const box = useMemo(() => {
    const xs = room.walk.rects.flatMap((r) => [r.x0, r.x1]);
    const zs = room.walk.rects.flatMap((r) => [r.z0, r.z1]);
    const pad = 4;
    return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, z0: Math.min(...zs) - pad, z1: Math.max(...zs) + pad };
  }, [room]);
  const w = box.x1 - box.x0;
  const h = box.z1 - box.z0;

  // Positions refresh a few times a second while the map is open.
  const [dots, setDots] = useState<{ id: string; x: number; z: number; me: boolean }[]>([]);
  useEffect(() => {
    const read = () =>
      setDots([...(motions.current?.entries() ?? [])].map(([id, m]) => ({ id, x: m.x, z: m.z, me: id === meId })));
    read();
    const iv = setInterval(read, 300);
    return () => clearInterval(iv);
  }, [motions, meId]);

  return (
    <div className={styles.sheet} role="dialog" aria-label={labels.mapTitle}>
      <h2>{labels.mapTitle}</h2>
      <p>{labels.mapHint}</p>
      <p className={styles.stampLine}>{labels.stampCount(stamps.length, places.length)}</p>
      <svg className={styles.map} viewBox={`${box.x0} ${box.z0} ${w} ${h}`} role="img" aria-label={labels.mapTitle}>
        <rect x={box.x0} y={box.z0} width={w} height={h} fill="#eee6d8" />
        {room.map?.green?.map(([x, z, r], i) => <circle key={`g${i}`} cx={x} cy={z} r={r} fill="#c9d8a8" />)}
        {room.map?.blocks?.map(([x0, z0, x1, z1], i) => (
          <rect key={`b${i}`} x={x0} y={z0} width={x1 - x0} height={z1 - z0} rx={0.6} fill="#c8bba7" />
        ))}
        {room.walk.rects.map((r, i) => (
          <rect key={i} x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill="#faf7f0" />
        ))}
        {room.map?.walls?.map(([x0, z0, x1, z1], i) => (
          <line key={`w${i}`} x1={x0} y1={z0} x2={x1} y2={z1} stroke="#6f6559" strokeWidth={1.1} strokeLinecap="round" />
        ))}
        {places.map((p) => (
          <g key={p.id} className={styles.mapPlace} onClick={() => onGo(p.at)} role="button" aria-label={`${p.title[lang]}${stamps.includes(p.id) ? ` · ${labels.stamped}` : ""}`} tabIndex={0}>
            <circle cx={p.at.x} cy={p.at.z} r={2.2} fill={stamps.includes(p.id) ? "#c0463c" : "#22418f"} />
            {/* a collected stamp: a red seal ring around the place */}
            {stamps.includes(p.id) && <circle cx={p.at.x} cy={p.at.z} r={3.4} fill="none" stroke="#c0463c" strokeWidth={0.7} />}
            {/* Labels on the right half point left, so they stay inside the map. */}
            <text
              x={p.at.x > (box.x0 + box.x1) / 2 ? p.at.x - 3 : p.at.x + 3}
              y={p.at.z + 1.3}
              fontSize={3.4}
              fill="#1e2126"
              textAnchor={p.at.x > (box.x0 + box.x1) / 2 ? "end" : "start"}
              paintOrder="stroke"
              stroke="#faf7f0"
              strokeWidth={1}
            >
              {p.title[lang]}
            </text>
          </g>
        ))}
        {dots.map((d) =>
          d.me ? (
            <g key={d.id}>
              <circle cx={d.x} cy={d.z} r={2.6} fill="#fff" stroke="#c0463c" strokeWidth={1.2} />
              <text x={d.x} y={d.z - 3.6} fontSize={3.2} textAnchor="middle" fill="#c0463c">
                {labels.you}
              </text>
            </g>
          ) : (
            <circle key={d.id} cx={d.x} cy={d.z} r={1.3} fill="#5f7f58" />
          ),
        )}
      </svg>
      <div className={styles.sheetActions}>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {labels.close}
        </button>
      </div>
    </div>
  );
}
