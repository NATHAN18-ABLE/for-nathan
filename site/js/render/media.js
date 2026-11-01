/* media.js : 이미지·영상 자리 그리기. 파일이 없으면 눈에 띄는 점선 상자(placeholder)를 그립니다. */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

/* 빈자리 상자: 무엇을, 어디에, 어떤 비율로 넣으면 되는지 적어 줌 */
SITE.render.placeholder = function (what, where, spec) {
  const t = SITE.text;
  return `<div class="ph media-ph" role="img" aria-label="${t.escape(what)} 자리">
      <strong>${t.escape(what)} 자리</strong>
      <small>${t.escape(where)}${spec ? `<br>${t.escape(spec)}` : ""}</small>
    </div>`;
};

/* 소리 없이 반복되는 미리보기 영상 (보일 때만 받아서 재생) */
SITE.render.loopVideo = function (media, label) {
  const t = SITE.text;
  const poster = media.poster ? ` poster="${t.escape(media.poster)}"` : "";
  return `<video class="lazy-loop" muted loop playsinline preload="none"${poster}
            data-src="${t.escape(media.loop)}" aria-label="${t.escape(label)} 미리보기"></video>`;
};

/* 영상 > 대표 이미지 > 빈자리 순으로 고름 */
SITE.render.media = function (media, opts) {
  const t = SITE.text;
  media = media || {};
  if (media.loop) return SITE.render.loopVideo(media, opts.label);
  if (media.poster) return `<img src="${t.escape(media.poster)}" alt="${t.escape(opts.label)}" loading="lazy" decoding="async">`;
  return SITE.render.placeholder(opts.what, opts.where, opts.spec);
};

/* 링크가 비어 있으면 "준비 중" 버튼 */
SITE.render.linkButton = function (href, label, cls, extra) {
  const t = SITE.text;
  if (!href) {
    return `<span class="btn ${cls || ""}" aria-disabled="true">${t.escape(label)} <span class="btn__note">준비 중</span></span>`;
  }
  return `<a class="btn ${cls || ""}" href="${t.escape(href)}"${extra || ""}>${t.escape(label)}</a>`;
};

/* 영상 창을 여는 버튼 (주소가 없으면 "준비 중") */
SITE.render.playButton = function (url, label, cls) {
  const t = SITE.text;
  if (!url) {
    return `<span class="btn ${cls || ""}" aria-disabled="true">${t.escape(label)} <span class="btn__note">준비 중</span></span>`;
  }
  return `<button class="btn ${cls || ""}" type="button" data-play-url="${t.escape(url)}">${t.escape(label)}</button>`;
};
