/* hero.js : [1] Hero 화면을 그립니다 */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

SITE.render.hero = function (content) {
  const t = SITE.text;
  const h = content.hero;
  const seq = h.sequence || {};
  const hasFrames = (seq.desktop && seq.desktop.count > 0) || (seq.mobile && seq.mobile.count > 0);

  const title = (h.title || []).map((line) => `<span class="line">${t.rich(line)}</span>`).join("");

  const showreelBtn = h.showreel && h.showreel.show
    ? `<button class="btn" type="button" data-open-showreel>${t.escape(h.buttons.showreel)}</button>`
    : "";

  const caption = h.caption && h.caption.show
    ? `<p class="hero__caption">${t.rich(h.caption.text)}</p>`
    : "";

  /* 영상 프레임이 아직 없을 때 보이는 안내 */
  const phTag = hasFrames
    ? ""
    : `<div class="ph hero__ph-tag" role="note">
         <strong>히어로 영상 자리</strong>
         <small>지금은 임시 먹 연기 화면입니다. tools/extract-frames.bat 으로 프레임을 만들어 assets/hero 에 넣으세요.</small>
       </div>`;

  return `
    <section class="hero" id="top" aria-label="소개">
      <div class="hero__stage" aria-hidden="true">
        <canvas class="hero__canvas"></canvas>
      </div>
      <div class="hero__scrim" aria-hidden="true"></div>
      ${phTag}
      <div class="hero__content">
        <p class="hero__label">${t.rich(h.label)}</p>
        <h1 class="hero__title">${title}</h1>
        <p class="hero__subtitle">${t.rich(h.subtitle)}</p>
        <p class="hero__body">${t.rich(h.body)}</p>
        <div class="hero__actions">
          <a class="btn btn--solid" href="#why-me">${t.escape(h.buttons.whyMe)}</a>
          ${showreelBtn}
        </div>
      </div>
      ${caption}
    </section>`;
};
