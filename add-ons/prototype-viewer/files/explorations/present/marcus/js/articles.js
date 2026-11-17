// The articles, and the page each one renders to.
//
// Article 1 is the one the loader hands over to (its hero is the photo
// that fills the loader box). Every page shares one placeholder layout.

// placeholder images: a translucent grey fill with a picture glyph, so
// they sit right on both themes
const PH = n => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 402 290" preserveAspectRatio="xMidYMid slice"><rect width="402" height="290" fill="rgba(128,134,146,${.2 + n * .03})"/><g fill="none" stroke="rgba(160,166,178,.55)" stroke-width="3" stroke-linejoin="round" transform="translate(171 110)"><rect x="0" y="0" width="60" height="46" rx="6"/><circle cx="18" cy="16" r="5"/><path d="M4 42l16-16 12 10 8-6 16 12"/></g></svg>`);

const ARTICLES = [0, 1, 2, 3, 4, 5, 6, 7].map(n => ({ hero: PH(n % 5), n }));

// a generic article: kicker, headline, standfirst, byline, body copy with
// a pull quote, an inline figure with caption, a subhead and tags
const articlePage = (a, i) => `
  <div class="a-scroll page" data-i="${i}">
    <div class="a-hero"><img src="${a.hero}" alt="" draggable="false"></div>
    <div class="a-body">
      <div class="a-meta"><span class="sk" style="width:70px;height:9px"></span></div>
      <h1 class="sk-lines"><span class="sk" style="width:94%;height:22px"></span><span class="sk" style="width:72%;height:22px"></span></h1>
      <p class="standfirst sk-lines"><span class="sk" style="width:100%;height:13px"></span><span class="sk" style="width:80%;height:13px"></span></p>
      <div class="byline"><span class="sk sk-c" style="width:32px;height:32px"></span><span class="sk-lines" style="flex:1"><span class="sk" style="width:110px;height:10px"></span><span class="sk" style="width:150px;height:8px"></span></span></div>
      <p class="story sk-lines"><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:97%;height:11px"></span><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:92%;height:11px"></span><span class="sk" style="width:64%;height:11px"></span></p>
      <p class="story sk-lines"><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:95%;height:11px"></span><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:48%;height:11px"></span></p>
      <blockquote class="quote sk-lines"><span class="sk" style="width:92%;height:15px"></span><span class="sk" style="width:70%;height:15px"></span><span class="sk" style="width:90px;height:9px;margin-top:6px"></span></blockquote>
      <p class="story sk-lines"><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:98%;height:11px"></span><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:86%;height:11px"></span><span class="sk" style="width:58%;height:11px"></span></p>
      <figure class="a-fig"><span class="sk f-img"></span><figcaption class="sk-lines"><span class="sk" style="width:76%;height:9px"></span></figcaption></figure>
      <h3 class="subhead"><span class="sk" style="width:160px;height:15px"></span></h3>
      <p class="story sk-lines"><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:96%;height:11px"></span><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:90%;height:11px"></span><span class="sk" style="width:40%;height:11px"></span></p>
      <p class="story sk-lines"><span class="sk" style="width:100%;height:11px"></span><span class="sk" style="width:93%;height:11px"></span><span class="sk" style="width:72%;height:11px"></span></p>
      <div class="tags"><span class="sk sk-pill" style="width:64px;height:26px"></span><span class="sk sk-pill" style="width:82px;height:26px"></span><span class="sk sk-pill" style="width:56px;height:26px"></span></div>
      <button class="view-all page-all" aria-label="View all"><span class="sk" style="width:64px;height:10px"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </div>
    <aside class="a-side wide-only">
      <span class="sk" style="width:110px;height:12px"></span>
      ${[0, 1, 2].map(() => `<div class="as-card"><span class="as-img"></span><span class="sk-lines"><span class="sk" style="width:90%;height:10px"></span><span class="sk" style="width:60%;height:9px"></span></span></div>`).join('')}
      <div class="as-box"><span class="sk" style="width:70%;height:11px"></span><span class="sk" style="width:100%;height:36px;border-radius:18px;margin-top:14px"></span></div>
    </aside>
    <section class="a-related wide-only"><span class="sk" style="width:130px;height:14px"></span>
      <div class="am-grid">${[0, 1, 2].map(k => `<div class="am-card"><span class="am-img" style="--sh:${.14 + k * .05}"></span><span class="sk-lines"><span class="sk" style="width:30%;height:8px"></span><span class="sk" style="width:94%;height:12px"></span><span class="sk" style="width:66%;height:12px"></span></span></div>`).join('')}</div>
    </section>
    <footer class="wide-foot a-foot wide-only">${[0, 1, 2, 3].map(() => `<div class="sk-lines"><span class="sk" style="width:70px;height:11px"></span><span class="sk" style="width:96px;height:8px"></span><span class="sk" style="width:80px;height:8px"></span><span class="sk" style="width:88px;height:8px"></span></div>`).join('')}</footer>
  </div>`;

// the chart is a placeholder block in the template
const drawChart = () => {};
