/* modal.js : 쇼릴 영상 창. 유튜브·비메오 주소나 mp4 파일 모두 됩니다.
   content.js 의 hero.showreel.show 가 true 일 때만 버튼이 생깁니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.toEmbed = function (url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { type: "video", src: url };
};

SITE.fx.modal = function (content) {
  const btn = document.querySelector("[data-open-showreel]");
  if (!btn) return;
  const url = (content.hero.showreel || {}).url;

  if (!url) {
    btn.setAttribute("aria-disabled", "true");
    btn.textContent = `${btn.textContent} (준비 중)`;
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "modal";
  dialog.setAttribute("aria-label", "쇼릴 영상");
  dialog.innerHTML = `
    <button class="btn modal__close" type="button" data-close>닫기</button>
    <div class="modal__frame"></div>`;
  document.body.append(dialog);
  const frame = dialog.querySelector(".modal__frame");

  btn.addEventListener("click", () => {
    const e = SITE.fx.toEmbed(url);
    frame.innerHTML = e.type === "iframe"
      ? `<iframe src="${SITE.text.escape(e.src)}" title="쇼릴 영상" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${SITE.text.escape(e.src)}" controls autoplay playsinline></video>`;
    dialog.showModal();
  });

  const stop = () => { frame.innerHTML = ""; };
  dialog.addEventListener("close", stop);
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
};
