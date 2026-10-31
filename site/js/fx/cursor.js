/* cursor.js : 금색 점 + 따라오는 링.
   마우스 기기에서만 켜지고, 터치 기기와 움직임 줄이기 설정에서는 꺼집니다.
   글 입력칸이나 [data-native-cursor] 위에서는 원래 커서로 돌아갑니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.cursor = function () {
  if (!SITE.env.finePointer() || SITE.env.reducedMotion()) return;

  const root = document.documentElement;
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);
  root.classList.add("has-cursor");

  const pos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  let raf = 0;

  function loop() {
    ringPos.x += (pos.x - ringPos.x) * 0.2;
    ringPos.y += (pos.y - ringPos.y) * 0.2;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    const settled = Math.abs(pos.x - ringPos.x) < 0.1 && Math.abs(pos.y - ringPos.y) < 0.1;
    raf = settled ? 0 : requestAnimationFrame(loop);
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    root.classList.add("is-cursor-visible");
    if (!raf) raf = requestAnimationFrame(loop);

    const t = e.target instanceof Element ? e.target : null;
    const native = t && t.closest("input, textarea, select, [data-native-cursor]");
    root.classList.toggle("is-cursor-native", !!native);
    ring.classList.toggle("is-hover", !!(t && !native && t.closest("a, button, [role='button'], [data-cursor='hover']")));
  }, { passive: true });

  document.addEventListener("pointerleave", () => root.classList.remove("is-cursor-visible"));
  window.addEventListener("blur", () => root.classList.remove("is-cursor-visible"));
};
