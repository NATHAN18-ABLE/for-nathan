/* modal.js : 영상 창. data-play-url 이 있는 버튼을 누르면 열립니다.
   유튜브·비메오 주소나 mp4 파일 모두 됩니다. 닫으면 영상이 멈춥니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.toEmbed = function (url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { type: "video", src: url };
};

SITE.fx.modal = function () {
  const dialog = document.createElement("dialog");
  dialog.className = "modal";
  dialog.setAttribute("aria-label", "영상 보기");
  dialog.innerHTML = `
    <button class="btn modal__close" type="button" data-close>닫기</button>
    <div class="modal__frame"></div>`;
  document.body.append(dialog);
  const frame = dialog.querySelector(".modal__frame");
  let opener = null;

  document.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest("[data-play-url]") : null;
    if (!btn) return;
    opener = btn;
    const embed = SITE.fx.toEmbed(btn.dataset.playUrl);
    const src = SITE.text.escape(embed.src);
    frame.innerHTML = embed.type === "iframe"
      ? `<iframe src="${src}" title="영상" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${src}" controls autoplay playsinline></video>`;
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    frame.innerHTML = "";
    if (opener) opener.focus({ preventScroll: true });
  });
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
};
