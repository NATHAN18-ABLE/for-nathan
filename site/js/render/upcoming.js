/* upcoming.js : 아직 만들지 않은 섹션의 임시 자리 (섹션을 만들 때마다 하나씩 사라집니다) */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

SITE.render.upcoming = function (content) {
  const t = SITE.text;
  return (content.upcoming || [])
    .map((s) => `
      <section class="upcoming" id="${t.escape(s.id)}">
        <div class="wrap upcoming__inner">
          <h2>${t.rich(s.title)}</h2>
          <div class="ph"><strong>다음 단계에서 만듭니다</strong><small>이 섹션은 아직 비어 있습니다.</small></div>
        </div>
      </section>`)
    .join("");
};
