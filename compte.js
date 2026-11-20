/* ===== compte.js — comptes clients (localStorage) + espace admin ===== */
const Auth = {
  users: () => jget('lachor_users', []),
  hash(s) { let h = 5381; for (const c of s) h = (h * 33) ^ c.charCodeAt(0); return (h >>> 0).toString(36); },
  current() { const e = localStorage.getItem('lachor_session'); return this.users().find(u => u.email === e) || null; }
};
const say = (el, t, c) => { el.textContent = t; el.className = 'msg ' + c; };

/* ---------- Page MON COMPTE ---------- */
function renderAccount() {
  const root = $('#accountApp'), u = Auth.current();
  if (u) {
    const orders = Orders.all().filter(o => o.email === u.email).reverse(), favs = Favs.list().map(getP).filter(Boolean);
    root.innerHTML = `<div class="center"><p class="eyebrow">Mon espace</p><h1 class="title">Bonjour ${esc(u.name.split(' ')[0])}</h1></div>
    <h3 style="margin:30px 0 14px">Mes commandes</h3>
    ${orders.length ? orders.map(o => `<div class="card"><h4>${o.ref} — ${o.status}</h4><p>${o.items.map(i => `${esc(i.name)} (${i.color}, ${i.size}) x${i.qty}`).join('<br>')}</p><p><b>${fmt(o.total)}</b> · ${new Date(o.date).toLocaleDateString('fr-FR')}</p></div>`).join('') : `<div class="card"><p>Aucune commande pour le moment.</p></div><a class="btn" href="produits.html">Voir les produits</a>`}
    <h3 style="margin:30px 0 14px">Mes favoris</h3>
    ${favs.length ? favs.map(p => `<div class="card"><h4><a href="produit.html?id=${p.id}">${p.name}</a></h4><p>${fmt(p.price)}</p></div>`).join('') : `<div class="card"><p>Aucun favori. Touche le ♡ sur un produit pour l'ajouter.</p></div>`}
    <button class="btn ghost" id="logout" style="margin-top:20px">DÉCONNEXION</button>`;
    $('#logout').onclick = () => { localStorage.removeItem('lachor_session'); location.reload(); };
    return;
  }
  root.innerHTML = `<div class="tabs"><button class="on" data-t="login">Se connecter</button><button data-t="signup">Créer un compte</button></div>
  <form class="form" id="fLogin" novalidate><input type="email" id="lEmail" placeholder="Email" autocomplete="email" required><input type="password" id="lPass" placeholder="Mot de passe" autocomplete="current-password" required><button class="btn">SE CONNECTER</button><p class="msg" id="lMsg" role="status"></p></form>
  <form class="form" id="fSignup" novalidate hidden><input id="sName" placeholder="Nom complet" autocomplete="name" required><input type="email" id="sEmail" placeholder="Email" autocomplete="email" required><input type="tel" id="sPhone" placeholder="Téléphone (ex : 62 05 90 66)" autocomplete="tel" required><input type="password" id="sPass" placeholder="Mot de passe (6 caractères min.)" autocomplete="new-password" required><input type="password" id="sPass2" placeholder="Confirmer le mot de passe" autocomplete="new-password" required><button class="btn">CRÉER MON COMPTE</button><p class="msg" id="sMsg" role="status"></p></form>`;
  const tabs = $$('.tabs button'), fl = $('#fLogin'), fs = $('#fSignup');
  tabs.forEach(b => b.onclick = () => { tabs.forEach(x => x.classList.toggle('on', x === b)); fl.hidden = b.dataset.t !== 'login'; fs.hidden = b.dataset.t !== 'signup'; });
  fl.onsubmit = e => {
    e.preventDefault(); const m = $('#lMsg'), em = $('#lEmail').value.trim().toLowerCase(), found = Auth.users().find(x => x.email === em);
    if (!found) return say(m, 'Compte introuvable, crée un compte.', 'err');
    if (found.pass !== Auth.hash($('#lPass').value)) return say(m, 'Mot de passe incorrect.', 'err');
    localStorage.setItem('lachor_session', em); location.reload();
  };
  fs.onsubmit = e => {
    e.preventDefault(); const m = $('#sMsg'), name = $('#sName').value.trim(), em = $('#sEmail').value.trim().toLowerCase(), ph = $('#sPhone').value.trim(), p1 = $('#sPass').value;
    if (name.length < 2) return say(m, 'Entre ton nom complet.', 'err');
    if (!/^\S+@\S+\.\S+$/.test(em)) return say(m, 'Email invalide.', 'err');
    if (ph.replace(/\D/g, '').length < 8) return say(m, 'Téléphone invalide.', 'err');
    if (p1.length < 6) return say(m, 'Mot de passe : 6 caractères minimum.', 'err');
    if (p1 !== $('#sPass2').value) return say(m, 'Les mots de passe ne correspondent pas.', 'err');
    const us = Auth.users(); if (us.some(x => x.email === em)) return say(m, 'Un compte existe déjà avec cet email. Connecte-toi.', 'err');
    us.push({ name, email: em, phone: ph, pass: Auth.hash(p1), date: new Date().toISOString() }); jset('lachor_users', us);
    localStorage.setItem('lachor_session', em); say(m, 'Compte créé ! Bienvenue chez LACHOR', 'ok'); setTimeout(() => location.reload(), 1300);
  };
}

/* ---------- Page ADMIN (admin@lachor.com / lachor123) ---------- */
function renderAdmin() {
  const root = $('#adminApp');
  if (sessionStorage.getItem('lachor_admin') !== '1') {
    root.innerHTML = `<form class="form" id="fAdmin" style="margin:auto"><input type="email" id="aE" placeholder="Email admin" required><input type="password" id="aP" placeholder="Mot de passe" required><button class="btn">ACCÉDER AU DASHBOARD</button><p class="msg" id="aM" role="status"></p></form>`;
    $('#fAdmin').onsubmit = e => { e.preventDefault(); if ($('#aE').value.trim().toLowerCase() === 'lmafaz431@gmail.com' && $('#aP').value === 'Mafaz12') { sessionStorage.setItem('lachor_admin', '1'); renderAdmin(); } else say($('#aM'), 'Identifiants incorrects.', 'err'); };
    return;
  }
  const users = Auth.users(), orders = Orders.all(), top = {};
  orders.forEach(o => o.items.forEach(i => top[i.name] = (top[i.name] || 0) + i.qty));
  const topL = Object.entries(top).sort((a, b) => b[1] - a[1]);
  root.innerHTML = `<div class="sgrid"><div class="card"><b>${users.length}</b>Clients inscrits</div><div class="card"><b>${orders.length}</b>Commandes</div><div class="card"><b>${fmt(orders.reduce((t, o) => t + o.total, 0))}</b>Revenu total</div>
    <div class="card"><b style="font-size:1rem">${topL.length ? topL.slice(0, 3).map(t => `${esc(t[0])} (${t[1]})`).join('<br>') : '—'}</b>Produits les plus vendus</div></div>
    <h3 style="margin-bottom:14px">Clients</h3><div class="tw"><table class="t"><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Inscription</th><th>Commandes</th></tr>
    ${users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${new Date(u.date).toLocaleDateString('fr-FR')}</td><td>${orders.filter(o => o.email === u.email).length}</td></tr>`).join('') || '<tr><td colspan="5">Aucun client.</td></tr>'}</table></div>
    <h3 style="margin-bottom:14px">Commandes</h3><div class="tw"><table class="t"><tr><th>N°</th><th>Client</th><th>Produit</th><th>Taille</th><th>Total</th><th>Statut</th></tr>
    ${orders.map((o, k) => `<tr><td>${o.ref}</td><td>${esc(o.client)}</td><td>${o.items.map(i => `${esc(i.name)} x${i.qty}`).join('<br>')}</td><td>${o.items.map(i => i.size).join(', ')}</td><td>${fmt(o.total)}</td>
    <td><select data-k="${k}">${['En attente', 'Confirmée', 'Livrée'].map(s => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="6">Aucune commande.</td></tr>'}</table></div>
    <button class="btn ghost" id="aOut">DÉCONNEXION ADMIN</button>`;
  $$('select[data-k]', root).forEach(s => s.onchange = () => { const o = Orders.all(); o[+s.dataset.k].status = s.value; Orders.save(o); renderAdmin(); });
  $('#aOut').onclick = () => { sessionStorage.removeItem('lachor_admin'); renderAdmin(); };
}
document.addEventListener('DOMContentLoaded', () => { $('#accountApp') && renderAccount(); $('#adminApp') && renderAdmin(); });
