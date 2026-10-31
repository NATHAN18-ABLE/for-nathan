/* nav-behavior.js : 스크롤하면 메뉴 바탕이 생기고, 지금 보고 있는 섹션을 표시하고,
   모바일 햄버거 메뉴를 열고 닫습니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.navBehavior = function () {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("site-menu");
  const main = document.getElementById("main");
  if (!nav) return;

  /* 1) 스크롤하면 반투명 바탕 */
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.create({
      start: 8,
      end: "max",
      onToggle: (self) => nav.classList.toggle("is-scrolled", self.isActive)
    });
  } else {
    nav.classList.add("is-scrolled");
  }

  /* 2) 지금 보고 있는 섹션 표시 */
  const links = Array.from(document.querySelectorAll("[data-nav-target]"));
  const ids = Array.from(new Set(links.map((a) => a.dataset.navTarget)));
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  const setCurrent = (id) => {
    links.forEach((a) => {
      if (a.dataset.navTarget === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));

  /* 3) 모바일 전체 화면 메뉴 */
  if (!toggle || !menu) return;
  const menuLinks = Array.from(menu.querySelectorAll("a"));

  function open() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "메뉴 닫기");
    document.documentElement.style.overflow = "hidden";
    main && main.setAttribute("inert", "");
    menuLinks[0] && menuLinks[0].focus({ preventScroll: true });
  }
  function close(returnFocus) {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");
    document.documentElement.style.overflow = "";
    main && main.removeAttribute("inert");
    if (returnFocus) toggle.focus({ preventScroll: true });
  }
  const isOpen = () => menu.classList.contains("is-open");

  toggle.addEventListener("click", () => (isOpen() ? close(true) : open()));
  menuLinks.forEach((a) => a.addEventListener("click", () => close(false)));

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") { close(true); return; }
    if (e.key === "Tab") {
      const items = [toggle, ...menuLinks];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });

  /* 화면이 넓어지면 메뉴를 닫음 */
  SITE.env.onChange("(min-width: 1181px)", (m) => { if (m.matches && isOpen()) close(false); });
};
