/* reveal.js : 스크롤 등장 연출
   1) 오프닝 트릭: 좁은 틈이 열리듯 대표작 화면이 펼쳐짐 (스크롤에 맞춰)
   2) [data-reveal]: 글 덩어리가 아래에서 살짝 떠오름 (한 번만)
   자바스크립트가 꺼져 있거나 움직임 줄이기 설정이면 처음부터 다 보입니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.reveal = function () {
  if (SITE.env.reducedMotion() || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  /* 1) 오프닝 트릭 */
  const frame = document.querySelector(".opening__frame");
  if (frame) {
    const inner = frame.firstElementChild;
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
      const from = ctx.conditions.mobile ? "inset(10% 8% round 14px)" : "inset(16% 24% round 14px)";
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: frame, start: "top 92%", end: "top 28%", scrub: 0.6 }
      });
      tl.fromTo(frame, { clipPath: from }, { clipPath: "inset(0% 0% round 14px)" }, 0);
      if (inner) tl.fromTo(inner, { scale: 1.12 }, { scale: 1 }, 0);
    });
  }

  /* 2) 글 덩어리 등장 */
  const items = gsap.utils.toArray("[data-reveal]");
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 18 });
  ScrollTrigger.batch(items, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.06,
      overwrite: true
    })
  });
};
