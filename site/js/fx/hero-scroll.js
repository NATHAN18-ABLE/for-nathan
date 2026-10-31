/* hero-scroll.js : 히어로를 화면에 고정하고, 스크롤에 맞춰
   (1) 영상 프레임을 넘기고 (2) 글씨를 걷어내고 (3) 마지막에 설명을 띄웁니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.heroScroll = function (content) {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const canvas = hero.querySelector(".hero__canvas");
  const stage = hero.querySelector(".hero__stage");
  const copy = hero.querySelector(".hero__content");
  const caption = hero.querySelector(".hero__caption");
  const scrim = hero.querySelector(".hero__scrim");
  const seq = content.hero.sequence || {};
  const reduce = SITE.env.reducedMotion();
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  /* 어떤 프레임 묶음을 쓸지: 휴대폰은 mobile 우선, 없으면 desktop */
  const desk = seq.desktop && seq.desktop.count > 0 ? seq.desktop : null;
  const mob = seq.mobile && seq.mobile.count > 0 ? seq.mobile : null;
  const set = SITE.env.narrow() ? (mob || desk) : (desk || mob);

  /* 움직임 줄이기 / 데이터 절약: 포스터 한 장이 있으면 그것만 */
  if ((reduce || SITE.env.saveData()) && seq.poster) {
    const img = new Image();
    img.className = "hero__poster";
    img.alt = "";
    img.src = seq.poster;
    canvas.replaceWith(img);
    return;
  }

  let painter;
  let visible = true;
  let rafId = 0;

  function useSmoke() {
    painter = SITE.fx.createInkSmoke(canvas);
    painter.resize();
    if (reduce) painter.setProgress(0.3);
    kick();
  }

  if (set) {
    const effective = reduce ? Object.assign({}, set, { count: 1 }) : set;
    painter = SITE.fx.createSequence(canvas, effective, null, useSmoke);
    painter.resize();
    painter.start();
  } else {
    useSmoke();
  }

  /* 그리기: 연기는 보일 때만 계속, 프레임은 스크롤이 바뀔 때만 */
  function frame(now) {
    rafId = 0;
    painter.render(now / 1000);
    if (painter.animated && visible && !reduce && !document.hidden) kick();
  }
  function kick() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  new ResizeObserver(() => { painter.resize(); kick(); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
  document.addEventListener("visibilitychange", kick);

  /* 마우스를 따라 연기가 아주 조금 움직임 (마우스 기기에서만) */
  if (SITE.env.finePointer() && !reduce) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      painter.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      kick();
    }, { passive: true });
  }

  if (reduce || !hasGsap) return;

  /* 스크롤 연출: 데스크톱 1.5화면, 휴대폰 1.2화면 동안 고정 */
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: ctx.conditions.mobile ? "+=120%" : "+=150%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1
      },
      onUpdate() {
        painter.setProgress(tl.progress());
        kick();
      }
    });

    tl.to(copy, { opacity: 0, y: -48, filter: "blur(6px)", duration: 0.3 }, 0.12)
      .to(scrim, { opacity: 0.55, duration: 0.3 }, 0.12)
      .to(stage, { scale: 1.06, duration: 1 }, 0);
    if (caption) tl.to(caption, { opacity: 1, duration: 0.12 }, 0.8);
    tl.set({}, {}, 1); // 타임라인 길이를 정확히 1로 맞춤

    return () => painter.setProgress(0);
  });
};
