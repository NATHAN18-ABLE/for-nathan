/* about.js : [2] About. 왼쪽 사진(스크롤해도 따라옴) / 오른쪽 소개, 지원 분야, 이력 */
window.SITE = window.SITE || {};
SITE.render = SITE.render || {};

SITE.render.about = function (content) {
  const a = content.about;
  const p = content.person;
  const t = SITE.text;
  const r = SITE.render;

  const photo = a.photo && a.photo.src
    ? `<img src="${t.escape(a.photo.src)}" alt="${t.escape(t.plain(a.photo.alt))}" loading="lazy" decoding="async">`
    : r.placeholder("프로필 사진", "content.js > about.photo.src", "세로 4:5 · 1200×1500");

  const body = (a.body || []).map((line) => `<p data-reveal>${t.rich(line)}</p>`).join("");

  const s = a.seeking;
  const seeking = s && s.show
    ? `<div class="about__seeking" data-reveal>
         <p class="about__seeking-text">${t.rich(s.text)}</p>
         <ul class="chips" aria-label="지원 분야">
           ${(s.roles || []).map((role) => `<li>${t.rich(role)}</li>`).join("")}
         </ul>
         ${s.employment && s.employment.show ? `<p class="about__employment">${t.rich(s.employment.text)}</p>` : ""}
       </div>`
    : "";

  const timeline = (a.timeline || [])
    .map((it, i) => `
      <li class="timeline__item" data-reveal${i === 0 ? " data-current" : ""}>
        <span class="timeline__period">${t.rich(it.period)}</span>
        <p class="timeline__text">${t.rich(it.text)}</p>
      </li>`)
    .join("");

  const resume = a.resume && a.resume.show
    ? `<div class="about__resume">${r.linkButton(content.links.resume, a.resume.label, "", " download")}</div>`
    : "";

  return `
    <section class="about" id="about" aria-labelledby="about-lead">
      <div class="wrap about__grid">
        <figure class="about__photo">${photo}</figure>

        <div class="about__text">
          <p class="about__name">
            <span class="about__name-ko">${t.rich(p.nameKo)}</span>
            <span class="about__name-en">${t.rich(p.nameEn)}</span>
          </p>
          <p class="about__roles">${t.rich(a.roles)}</p>

          <h2 class="about__lead" id="about-lead">${t.rich(a.lead)}</h2>
          <div class="about__body">${body}</div>

          ${seeking}

          <h3 class="sr-only">이력</h3>
          <ol class="timeline">${timeline}</ol>
          ${resume}
        </div>
      </div>
    </section>`;
};
