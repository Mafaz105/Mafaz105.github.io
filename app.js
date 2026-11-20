/* ===== app.js — outils communs, header/footer, animations ===== */
const WA = '22962059066';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0\s]/g, '.') + ' FCFA';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const waLink = txt => `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- Vert #123D30 : l'opacité baisse page après page (transition 1000 ms, voir style.css) --- */
const PAGE_G = { home: 1, produits: .85, produit: .7, compte: .55, admin: .4 };
const G = PAGE_G[document.body.dataset.page] ?? 1;
document.body.classList.toggle('lite', G < .7); // textes foncés sur les fonds vert très clair
(function () {
  const root = document.documentElement, prev = sessionStorage.getItem('lachor_g');
  if (reduced || prev === null) root.style.setProperty('--g', G);
  else { root.style.setProperty('--g', prev); requestAnimationFrame(() => requestAnimationFrame(() => root.style.setProperty('--g', G))); }
  sessionStorage.setItem('lachor_g', G);
})();
const LOGO = G < .7 ? 'assets/images/logo.png' : 'assets/images/logo-light.png';

/* --- Header & footer injectés (un seul endroit à modifier) --- */
function accLabel() {
  const em = localStorage.getItem('lachor_session');
  const u = jget('lachor_users', []).find(x => x.email === em);
  return u ? u.name.split(' ')[0].toUpperCase() : 'MON COMPTE';
}
function buildChrome() {
  const page = document.body.dataset.page;
  const on = p => page === p ? 'on' : '';
  const h = $('#site-header');
  if (h) h.outerHTML = `<header class="hdr" id="hdr"><div class="hdr-in">
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">☰</button>
    <nav class="nav-l" id="nav" aria-label="Navigation">
      <a href="index.html" class="${on('home')}">Accueil</a><a href="produits.html" class="${on('produits')}">Produits</a>
      <a href="index.html#maison">À propos</a><a href="index.html#contact">Contact</a>
      <a class="only-m" href="compte.html">${accLabel()}</a></nav>
    <a class="logo" href="index.html" aria-label="LACHOR Bénin"><img src="${LOGO}" alt=""><span>LACHOR BÉNIN</span></a>
    <div class="nav-r"><a class="acc" href="compte.html">${accLabel()}</a><button class="cart-btn" id="cartBtn" aria-label="Ouvrir le panier">Panier (<span id="cartCount">0</span>)</button></div>
  </div></header>`;
  const f = $('#site-footer');
  if (f) f.outerHTML = `<footer><div class="wrap"><div class="fgrid">
    <div><h4>LACHOR BÉNIN</h4><p style="opacity:.8;max-width:30ch">Consistency Over Excuses.</p></div>
    <div><h4>Service Client</h4><ul><li><a href="index.html#contact">Nous contacter</a></li><li><a href="${waLink('Bonjour LACHOR, j\'ai une question.')}" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="produits.html">Guide des tailles</a></li></ul></div>
    <div><h4>La Maison</h4><ul><li><a href="index.html#maison">À propos</a></li><li><a href="produits.html">Drop 01 — Genesis</a></li><li><a href="https://instagram.com/lachor.benin" target="_blank" rel="noopener">@lachor.benin</a></li></ul></div>
    <div><h4>Mon Espace</h4><ul><li><a href="compte.html">Mon compte</a></li><li><a href="mailto:lmafaz45@gmail.com">lmafaz45@gmail.com</a></li><li><a href="${waLink('Bonjour LACHOR')}" target="_blank" rel="noopener">+229 62 05 90 66</a></li><li>Cotonou - Bénin</li></ul></div>
  </div><p class="copy">© ${new Date().getFullYear()} LACHOR BÉNIN — CONSISTENCY OVER EXCUSES</p></div></footer>`;
}
buildChrome();

/* --- Animation au scroll (fade + translation) --- */
let io;
function observeReveal(root = document) {
  const els = $$('[data-reveal]:not(.in)', root);
  if (reduced || !('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
}

/* --- Chiffres qui défilent --- */
function runCounters() {
  const els = $$('[data-count]');
  const go = el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', pad = +el.dataset.pad || 0;
    const show = v => el.textContent = String(v).padStart(pad, '0') + suf;
    if (reduced) return show(end);
    const t0 = performance.now(), d = 1600;
    const step = t => { const p = Math.min((t - t0) / d, 1); show(Math.round(end * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (reduced || !('IntersectionObserver' in window)) return els.forEach(go);
  const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { go(e.target); o.unobserve(e.target); } }), { threshold: .6 });
  els.forEach(e => { e.textContent = '0'; o.observe(e); });
}

/* --- Compte à rebours Drop 01 : 20 Décembre (heure du Bénin, UTC+1) --- */
function startCountdown() {
  const box = $('#countdown'); if (!box) return;
  const now = new Date(); let y = now.getFullYear();
  let target = new Date(`${y}-12-20T00:00:00+01:00`);
  if (target < now) target = new Date(`${y + 1}-12-20T00:00:00+01:00`);
  const set = (k, v) => { const e = $(`[data-cd="${k}"]`, box); if (e) e.textContent = String(v).padStart(2, '0'); };
  const tick = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    set('d', Math.floor(s / 86400)); set('h', Math.floor(s % 86400 / 3600)); set('m', Math.floor(s % 3600 / 60)); set('s', s % 60);
  };
  tick(); setInterval(tick, 1000);
}

/* --- Effet magnétique sur les boutons (souris uniquement) --- */
function magnetic() {
  if (reduced || !matchMedia('(hover:hover)').matches) return;
  let cur = null, raf = 0;
  document.addEventListener('pointermove', e => {
    const b = e.target.closest && e.target.closest('.btn:not(:disabled)');
    if (cur && cur !== b) cur.style.transform = '';
    cur = b; if (!b) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
  });
  document.addEventListener('pointerout', e => { const b = e.target.closest && e.target.closest('.btn'); if (b) b.style.transform = ''; });
}

document.addEventListener('DOMContentLoaded', () => {
  /* header compact au scroll */
  const hdr = $('#hdr'); let tick = false;
  const onScroll = () => { hdr.classList.toggle('scrolled', scrollY > 40); tick = false; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
  /* menu mobile */
  const bg = $('#burger'), nav = $('#nav');
  bg.addEventListener('click', () => { const o = nav.classList.toggle('open'); bg.setAttribute('aria-expanded', o); bg.textContent = o ? '✕' : '☰'; });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); bg.textContent = '☰'; }));
  observeReveal(); runCounters(); startCountdown(); magnetic();
});
