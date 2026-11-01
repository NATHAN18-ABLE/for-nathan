/* opening.js : [1-2] 오프닝 트릭. 마술 공연이 짧은 트릭 하나로 시작하듯, 대표작 한 편을 먼저 보여줍니다. */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

SITE.render.opening = function (content) {
  const o = content.opening;
  if (!o || !o.show) return "";
  const t = SITE.text;
  const r = SITE.render;

  const media = r.media(o.media, {
    label: t.plain(o.title),
    what: `${t.plain(o.title)} 영상`,
    where: "content.js > opening.media 에 loop(미리보기 mp4)와 poster(대표 이미지)",
    spec: "16:9 · 1920×1080 · 미리보기는 3MB 이하"
  });

  return `
    <section class="opening" id="opening" aria-labelledby="opening-title">
      <div class="opening__frame">${media}</div>
      <div class="wrap opening__info">
        <h2 class="opening__title" id="opening-title">${t.rich(o.title)}</h2>
        <p class="opening__meta">${t.rich(o.meta)}</p>
        <p class="opening__summary">${t.rich(o.summary)}</p>
        <div class="opening__actions">
          ${r.playButton(o.media && o.media.fullUrl, o.buttons.play, "btn--solid")}
          <a class="btn" href="#video">${t.escape(o.buttons.allWorks)}</a>
        </div>
      </div>
    </section>`;
};
