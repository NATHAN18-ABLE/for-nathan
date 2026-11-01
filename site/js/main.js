/* main.js : 시작점. content.js 를 읽어 화면을 그리고, 연출을 연결합니다. */
(function () {
  const C = CONTENT;
  const t = SITE.text;

  document.title = t.plain(C.site.title);
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t.plain(C.site.description));

  document.getElementById("site-nav").innerHTML = SITE.render.nav(C);
  document.getElementById("main").innerHTML =
    SITE.render.hero(C) +
    SITE.render.opening(C) +
    SITE.render.about(C) +
    SITE.render.upcoming(C);

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  SITE.fx.heroScroll(C);
  SITE.fx.navBehavior(C);
  SITE.fx.cursor();
  SITE.fx.modal();
  SITE.fx.mediaPlay();
  SITE.fx.reveal();

  /* 폰트가 늦게 도착하면 위치를 다시 계산 */
  if (document.fonts && document.fonts.ready && typeof ScrollTrigger !== "undefined") {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
