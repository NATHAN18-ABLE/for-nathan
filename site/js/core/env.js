/* env.js : 기기와 사용자 설정 확인 (움직임 줄이기, 마우스 기기, 화면 크기) */
window.SITE = window.SITE || {};

SITE.env = (function () {
  const mq = (q) => window.matchMedia(q);
  const reduce = mq("(prefers-reduced-motion: reduce)");
  const finePointer = mq("(hover: hover) and (pointer: fine)");
  const narrow = mq("(max-width: 767px)");

  return {
    reducedMotion: () => reduce.matches,
    finePointer: () => finePointer.matches,
    narrow: () => narrow.matches,
    /* 데이터 절약 모드면 큰 시퀀스를 받지 않습니다 */
    saveData: () => !!(navigator.connection && navigator.connection.saveData),
    onChange(query, fn) {
      const m = mq(query);
      m.addEventListener ? m.addEventListener("change", fn) : m.addListener(fn);
    }
  };
})();
