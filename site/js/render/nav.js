/* nav.js : 상단 메뉴와 모바일 전체 화면 메뉴를 그립니다 */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

SITE.render.nav = function (content) {
  const t = SITE.text;
  const items = content.nav || [];

  const links = items
    .map((it) => `<li><a href="#${t.escape(it.target)}" data-nav-target="${t.escape(it.target)}">${t.escape(it.label)}</a></li>`)
    .join("");

  const menuLinks = items
    .map((it, i) => `<li style="--i:${i}"><a href="#${t.escape(it.target)}" data-nav-target="${t.escape(it.target)}">${t.escape(it.label)}</a></li>`)
    .join("");

  return `
    <nav class="nav" aria-label="주요 메뉴">
      <div class="nav__bar">
        <a class="nav__brand" href="#top">${t.rich(content.person.nameKo)}</a>
        <ul class="nav__links">${links}</ul>
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="메뉴 열기">
          <span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="menu" id="site-menu" aria-hidden="true">
      <ul>${menuLinks}</ul>
    </div>`;
};
