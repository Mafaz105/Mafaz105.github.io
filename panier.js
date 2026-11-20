/* ===== panier.js — panier latéral, livraison, commande WhatsApp ===== */
const ZONES = { cotonou: { label: 'Cotonou', fee: 2000 }, hors: { label: 'Hors Cotonou', fee: 3500 } };
const Orders = { all: () => jget('lachor_orders', []), save: o => jset('lachor_orders', o) };

const Cart = {
  items: jget('lachor_cart', []),
  zone: localStorage.getItem('lachor_zone') || 'cotonou',
  save() { jset('lachor_cart', this.items); this.render(); window.dispatchEvent(new Event('lachor:update')); },
  qtyIn(id, c, s) { const i = this.items.find(x => x.id === id && x.color === c && x.size === s); return i ? i.qty : 0; },
  add(id, color, size) {
    if (!size) return { ok: false, err: 'Choisis une taille.' };
    if (this.qtyIn(id, color, size) + 1 > Stock.get(color, size)) return { ok: false, err: 'Stock maximum atteint pour cette taille.' };
    const i = this.items.find(x => x.id === id && x.color === color && x.size === size);
    i ? i.qty++ : this.items.push({ id, color, size, qty: 1 });
    this.save(); this.open(); return { ok: true };
  },
  change(k, d) {
    const i = this.items[k]; if (!i) return;
    if (d > 0 && i.qty + 1 > Stock.get(i.color, i.size)) return;
    i.qty += d; if (i.qty <= 0) this.items.splice(k, 1); this.save();
  },
  remove(k) { this.items.splice(k, 1); this.save(); },
  sub() { return this.items.reduce((t, i) => t + getP(i.id).price * i.qty, 0); },
  fee() { return this.items.length ? ZONES[this.zone].fee : 0; },
  open() { $('#cartOv').classList.add('open'); $('#cartDrawer').classList.add('open'); },
  close() { $('#cartOv').classList.remove('open'); $('#cartDrawer').classList.remove('open'); },
  build() {
    document.body.insertAdjacentHTML('beforeend', `<div class="ov" id="cartOv"></div>
    <aside class="drawer" id="cartDrawer" aria-label="Panier"><div class="dh"><h2>Mon panier</h2><button id="cartX" aria-label="Fermer">✕</button></div>
      <div class="db" id="cartBody"></div>
      <div class="df" id="cartFoot"><div class="zone"><span class="lbl">Livraison</span>
        ${Object.entries(ZONES).map(([k, z]) => `<label><input type="radio" name="zone" value="${k}"> ${z.label} — ${fmt(z.fee)}</label>`).join('')}</div>
        <div class="tot"><span>Sous-total</span><span id="tSub"></span></div><div class="tot"><span>Livraison</span><span id="tFee"></span></div><div class="tot g"><span>Total</span><span id="tTot"></span></div>
        <button class="btn" id="wa">COMMANDER SUR WHATSAPP</button><p class="msg" id="cartMsg" role="status"></p></div></aside>`);
    $('#cartBtn').addEventListener('click', () => this.open());
    $('#cartX').addEventListener('click', () => this.close()); $('#cartOv').addEventListener('click', () => this.close());
    addEventListener('keydown', e => e.key === 'Escape' && this.close());
    $$('input[name=zone]').forEach(r => r.addEventListener('change', () => { this.zone = r.value; localStorage.setItem('lachor_zone', r.value); this.render(); }));
    $('#cartBody').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const k = +b.dataset.k;
      b.dataset.a === 'p' ? this.change(k, 1) : b.dataset.a === 'm' ? this.change(k, -1) : this.remove(k);
    });
    $('#wa').addEventListener('click', () => this.order());
  },
  render() {
    $('#cartCount').textContent = this.items.reduce((t, i) => t + i.qty, 0);
    const body = $('#cartBody'), foot = $('#cartFoot');
    foot.style.display = this.items.length ? '' : 'none';
    if (!this.items.length) { body.innerHTML = `<div class="empty"><p>Ton panier est vide</p><a class="btn" href="produits.html">Voir les produits</a></div>`; return; }
    body.innerHTML = this.items.map((i, k) => { const p = getP(i.id); return `<div class="ci"><img src="${p.img[i.color].front}" alt="${p.name}">
      <div><h4>${p.name}</h4><small>Taille ${i.size} · ${i.color.toUpperCase()}</small><small>${fmt(p.price)}</small>
      <div class="qty"><button data-a="m" data-k="${k}" aria-label="Moins">−</button><span>${i.qty}</span><button data-a="p" data-k="${k}" aria-label="Plus">+</button><button class="rm" data-a="r" data-k="${k}">Supprimer</button></div></div></div>`; }).join('');
    $$('input[name=zone]').forEach(r => r.checked = r.value === this.zone);
    $('#tSub').textContent = fmt(this.sub()); $('#tFee').textContent = fmt(this.fee()); $('#tTot').textContent = fmt(this.sub() + this.fee());
  },
  /* Envoi de la commande : message WhatsApp + enregistrement + baisse du stock */
  order() {
    const msg = $('#cartMsg'); if (!this.items.length) return;
    for (const i of this.items) if (i.qty > Stock.get(i.color, i.size)) { msg.className = 'msg err'; msg.textContent = 'Stock insuffisant : ajuste ta commande.'; return; }
    const em = localStorage.getItem('lachor_session'), u = jget('lachor_users', []).find(x => x.email === em);
    const orders = Orders.all(), ref = 'LCH-' + String(orders.length + 1).padStart(4, '0');
    const total = this.sub() + this.fee();
    const lines = this.items.map((i, n) => { const p = getP(i.id); return `${n + 1}. ${p.name} | ${i.color.toUpperCase()} | Taille ${i.size} | x${i.qty} = ${fmt(p.price * i.qty)}`; });
    const text = `*NOUVELLE COMMANDE LACHOR* (${ref})\n${u ? `Client : ${u.name} — ${u.phone}\n` : ''}\n${lines.join('\n')}\n\nSous-total : ${fmt(this.sub())}\nLivraison (${ZONES[this.zone].label}) : ${fmt(this.fee())}\n*TOTAL : ${fmt(total)}*\n\nMerci de confirmer ma commande.`;
    orders.push({ ref, email: u ? u.email : '', client: u ? u.name : 'Invité', phone: u ? u.phone : '', date: new Date().toISOString(), zone: this.zone, fee: this.fee(), total, status: 'En attente',
      items: this.items.map(i => ({ id: i.id, name: getP(i.id).name, color: i.color, size: i.size, qty: i.qty, price: getP(i.id).price })) });
    Orders.save(orders);
    this.items.forEach(i => Stock.dec(i.color, i.size, i.qty));
    this.items = []; this.save(); this.close();
    window.open(waLink(text), '_blank');
  }
};
document.addEventListener('DOMContentLoaded', () => { Cart.build(); Cart.render(); });
