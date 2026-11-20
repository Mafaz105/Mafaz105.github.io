/* ===== produits.js — catalogue, stock, favoris, cartes produit ===== */
const IMG = 'assets/images/';
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRODUCTS = [
  { id: 'tshirt', name: 'T-SHIRT GENESIS', price: 20000, status: 'stock', colors: ['noir', 'blanc'],
    desc: 'Coton épais, coupe oversize. Emblème losange devant, grand visuel LACHOR dans le dos.',
    img: { noir: { front: IMG + 'tshirt-noir-devant.png', back: IMG + 'tshirt-noir-dos.png' }, blanc: { front: IMG + 'tshirt-blanc-devant.png', back: IMG + 'tshirt-blanc-dos.png' } } },
  { id: 'jorts', name: 'JORTS CAMO', price: 28000, status: 'soon', cover: IMG + 'logo.png', desc: 'Jorts camouflage Drop 01. Photos et date de sortie très bientôt.' },
  { id: 'casquette', name: 'CASQUETTE LACHOR', price: 15000, status: 'soon', cover: IMG + 'logo.png', desc: 'Casquette brodée à l\'emblème LACHOR. Bientôt disponible.' }
];
const DEF_STOCK = { noir: { S: 6, M: 8, L: 7, XL: 5, XXL: 3 }, blanc: { S: 5, M: 6, L: 6, XL: 4, XXL: 2 } };
const GUIDE = [['S', 56, 70], ['M', 58, 72], ['L', 60, 74], ['XL', 62, 76], ['XXL', 64, 78]];
const getP = id => PRODUCTS.find(p => p.id === id);

/* Stock réel (T-shirt, par couleur et taille) — diminue à chaque commande */
const Stock = {
  all() { return jget('lachor_stock', null) || JSON.parse(JSON.stringify(DEF_STOCK)); },
  get(c, s) { return (this.all()[c] || {})[s] ?? 0; },
  dec(c, s, n) { const a = this.all(); if (a[c]) a[c][s] = Math.max(0, a[c][s] - n); jset('lachor_stock', a); }
};
const Favs = {
  list() { return jget('lachor_favs', []); },
  has(id) { return this.list().includes(id); },
  toggle(id) { const l = this.list(), i = l.indexOf(id); i < 0 ? l.push(id) : l.splice(i, 1); jset('lachor_favs', l); }
};

function cardHTML(p, o = {}) {
  const soon = p.status === 'soon', cover = soon ? p.cover : p.img.noir.front;
  const name = o.detail ? `<h1 style="font-size:1.4rem">${p.name}</h1>` : `<h3><a href="produit.html?id=${p.id}">${p.name}</a></h3>`;
  let ctrl = '';
  if (o.simple) ctrl = `<a class="btn" href="produit.html?id=${p.id}">${soon ? 'EN SAVOIR PLUS' : 'VOIR LE PRODUIT'}</a>`;
  else if (soon) ctrl = `<button class="btn notify">M'AVERTIR</button><p class="msg" role="status"></p>`;
  else ctrl = `
    <div class="opt"><span class="lbl">Couleur</span><div class="chips" data-g="color"><button class="chip on" data-v="noir">NOIR</button><button class="chip" data-v="blanc">BLANC</button></div></div>
    <div class="opt"><span class="lbl">Vue</span><div class="chips" data-g="view"><button class="chip on" data-v="front">DEVANT</button><button class="chip" data-v="back">DOS</button></div></div>
    <div class="opt"><span class="lbl">Taille</span><div class="chips" data-g="size">${SIZES.map(s => `<button class="chip" data-v="${s}">${s}</button>`).join('')}</div></div>
    <details class="guide"><summary>Guide des tailles</summary><table><tr><th>Taille</th><th>Largeur (cm)</th><th>Longueur (cm)</th></tr>${GUIDE.map(g => `<tr><td>${g[0]}</td><td>${g[1]}</td><td>${g[2]}</td></tr>`).join('')}</table><p style="margin-top:6px;color:#777">Mesures à plat, à titre indicatif. Coupe oversize.</p></details>
    <p class="stockline" aria-live="polite"></p>
    <button class="btn add">AJOUTER AU PANIER</button><p class="msg" role="status"></p>`;
  return `<article class="pcard" data-id="${p.id}" data-reveal style="--d:${o.i ? o.i * .12 : 0}s">
    <div class="pimg ${soon ? 'ph' : ''}"><img class="zoom" src="${cover}" alt="${p.name}" loading="lazy">
      <span class="badge ${soon ? 'soon' : ''}">${soon ? 'BIENTÔT DISPONIBLE' : 'EN STOCK'}</span>
      <button class="fav" aria-label="Favori">${Favs.has(p.id) ? '♥' : '♡'}</button></div>
    <div class="pinfo">${name}<p class="price">${fmt(p.price)}</p><p class="pdesc">${p.desc}</p>${ctrl}</div></article>`;
}

function bindCard(el, p) {
  const img = $('img', el), msg = $('.msg', el);
  const say = (t, c = '') => { if (msg) { msg.textContent = t; msg.className = 'msg ' + c; } };
  $('.fav', el).addEventListener('click', e => { Favs.toggle(p.id); e.currentTarget.textContent = Favs.has(p.id) ? '♥' : '♡'; });
  if (p.status === 'soon') {
    $('.notify', el)?.addEventListener('click', () => { window.open(waLink(`Bonjour LACHOR, merci de m'avertir dès que "${p.name}" est disponible.`), '_blank'); say('Demande envoyée sur WhatsApp.', 'ok'); });
    return;
  }
  if (!$('.add', el)) return;
  const st = { color: 'noir', view: 'front', size: 'M' };
  const refresh = () => {
    $$('.chips', el).forEach(g => $$('.chip', g).forEach(c => {
      c.classList.toggle('on', st[g.dataset.g] === c.dataset.v);
      if (g.dataset.g === 'size') c.disabled = Stock.get(st.color, c.dataset.v) <= 0;
    }));
    if (st.size && Stock.get(st.color, st.size) <= 0) st.size = SIZES.find(s => Stock.get(st.color, s) > 0) || null;
    $$('[data-g=size] .chip', el).forEach(c => c.classList.toggle('on', c.dataset.v === st.size));
    const src = p.img[st.color][st.view];
    if (!img.src.endsWith(src)) { img.classList.add('swap'); setTimeout(() => { img.src = src; img.classList.remove('swap'); }, 180); }
    const sl = $('.stockline', el), n = st.size ? Stock.get(st.color, st.size) : 0;
    sl.className = 'stockline' + (n > 0 && n <= 8 ? ' low' : '');
    sl.textContent = !st.size ? 'Épuisé dans cette couleur' : n <= 0 ? `Épuisé en taille ${st.size}` : n <= 8 ? `Plus que ${n} en stock en taille ${st.size}` : `En stock en taille ${st.size}`;
    $('.add', el).disabled = !st.size;
  };
  el.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    st[c.parentElement.dataset.g] = c.dataset.v; say(''); refresh();
  });
  $('.add', el).addEventListener('click', () => {
    const r = Cart.add(p.id, st.color, st.size);
    r.ok ? say('Ajouté au panier ✓', 'ok') : say(r.err, 'err');
  });
  window.addEventListener('lachor:update', refresh);
  refresh();
}

document.addEventListener('DOMContentLoaded', () => {
  const mount = (sel, opt, filter) => {
    const box = $(sel); if (!box) return;
    box.innerHTML = PRODUCTS.map((p, i) => cardHTML(p, { ...opt, i })).join('');
    PRODUCTS.forEach(p => bindCard($(`[data-id="${p.id}"]`, box), p)); observeReveal(box);
  };
  mount('#productGrid', {}); mount('#featured', { simple: true });
  const det = $('#productDetail');
  if (det) {
    const p = getP(new URLSearchParams(location.search).get('id')) || PRODUCTS[0];
    document.title = `${p.name} — LACHOR BÉNIN`;
    det.innerHTML = cardHTML(p, { detail: true }); bindCard($('.pcard', det), p); observeReveal(det);
  }
});
