/* text.js : content.js 의 표기법(==금색==, _기울임_, 【빈자리】)을 화면용 HTML 로 바꿉니다 */
window.SITE = window.SITE || {};

SITE.text = (function () {
  function escape(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 표기법을 HTML 로 */
  function rich(str) {
    return escape(str)
      .replace(/【([^】]*)】/g, '<span class="ph-text">$1</span>')
      .replace(/==([^=]+)==/g, '<span class="gold">$1</span>')
      .replace(/_([^_]+)_/g, '<span class="slant">$1</span>');
  }

  /* 표기법 기호를 지운 순수 글자 (탭 제목, 접근성 라벨용) */
  function plain(str) {
    return String(str == null ? "" : str).replace(/==|_|【|】/g, "");
  }

  return { escape, rich, plain };
})();
