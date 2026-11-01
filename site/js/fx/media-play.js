/* media-play.js : 미리보기 영상은 화면 가까이 왔을 때만 받고, 보일 때만 재생합니다.
   (데이터 절약 + 배터리 절약) 움직임 줄이기 사용자에게는 자동 재생하지 않습니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.mediaPlay = function () {
  const videos = Array.from(document.querySelectorAll("video.lazy-loop"));
  if (!videos.length) return;
  const autoplay = !SITE.env.reducedMotion() && !SITE.env.saveData();

  const loader = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const v = e.target;
      if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); }
      loader.unobserve(v);
    });
  }, { rootMargin: "400px 0px" });

  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && autoplay) v.play().catch(() => {});
      else v.pause();
    });
  }, { threshold: 0.35 });

  videos.forEach((v) => { loader.observe(v); player.observe(v); });
};
