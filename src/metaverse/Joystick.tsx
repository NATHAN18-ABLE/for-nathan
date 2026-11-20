"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Joystick.module.css";

/** Where the stick points: x right, y down (towards the camera), each -1..1. */
export interface Stick {
  x: number;
  y: number;
  active: boolean;
}

const R = 46; // how far the knob travels from the centre, px

/**
 * An on-screen stick for touch screens, bottom left. Push to walk; push it to the rim to run.
 * The stick is read every frame by the room; it never re-renders the scene.
 */
export function Joystick({ stick, label }: { stick: React.RefObject<Stick>; label: string }) {
  const [touch, setTouch] = useState(false);
  const knob = useRef<HTMLSpanElement>(null);
  const centre = useRef({ x: 0, y: 0 });
  const id = useRef<number | null>(null);

  useEffect(() => {
    const q = window.matchMedia("(pointer: coarse)");
    const set = () => setTouch(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  const move = (cx: number, cy: number) => {
    let dx = cx - centre.current.x;
    let dy = cy - centre.current.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    stick.current.x = dx / R;
    stick.current.y = dy / R;
    stick.current.active = true;
  };
  const release = () => {
    id.current = null;
    stick.current.x = stick.current.y = 0;
    stick.current.active = false;
    if (knob.current) knob.current.style.transform = "";
  };

  if (!touch) return null;
  return (
    <div
      className={styles.base}
      data-stick
      role="application"
      aria-label={label}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        centre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        id.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => e.pointerId === id.current && move(e.clientX, e.clientY)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span ref={knob} className={styles.knob} />
    </div>
  );
}
