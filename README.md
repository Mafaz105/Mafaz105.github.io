# LACHOR BÉNIN — Consistency Over Excuses

Site e-commerce statique (HTML / CSS / JS), sans serveur. Les données (comptes, panier, commandes, stock) sont stockées dans le `localStorage` du navigateur.

## Structure
```
lachor/
├── index.html      Accueil (hero, compte à rebours, vedettes, maison, avis, contact)
├── produits.html   Drop 01 — Genesis (couleur, devant/dos, tailles, stock, panier)
├── produit.html    Fiche produit (?id=tshirt | jorts | casquette)
├── compte.html     Se connecter / Créer un compte
├── admin.html      Dashboard (admin@lachor.com / lachor123)
├── css/style.css
├── js/app.js       Header/footer, animations, compte à rebours, chiffres, effet magnétique
├── js/produits.js  Catalogue, stock, favoris, cartes produit
├── js/panier.js    Panier latéral, livraison, commande WhatsApp
├── js/compte.js    Comptes clients + admin
└── assets/images/  Photos T-shirt + logo (noir et crème)
```

## À personnaliser
- Photos Jorts / Casquette : ajouter les images dans `assets/images/` puis, dans `js/produits.js`, remplacer `cover` et passer `status` à `'stock'` quand ils sortent.
- Stock de départ : `DEF_STOCK` dans `js/produits.js`.
- Numéro WhatsApp : constante `WA` dans `js/app.js`.
- Avis clients : exemples dans `index.html` — à remplacer par de vrais avis.
- Date du drop : `startCountdown()` dans `js/app.js` (20 décembre, heure du Bénin).

## Limites à connaître
- Tout est local au navigateur : un client ne voit pas les comptes/commandes d'un autre appareil. Le dashboard admin ne montre que les données du navigateur qui l'ouvre. Le mot de passe admin est visible dans le code : c'est une démo, pas une sécurité. Pour un vrai suivi multi-appareils, il faudra un backend (Firebase, Supabase…).
- Les commandes sont réellement confirmées via le message WhatsApp reçu.

## Publier sur GitHub Pages
1. Crée un compte sur github.com puis un dépôt public nommé `lachor`.
2. Envoie tous les fichiers (index.html à la racine du dépôt) : bouton « Add file → Upload files » puis « Commit changes ».
3. Va dans **Settings → Pages**.
4. Source : « Deploy from a branch », branche `main`, dossier `/ (root)`, puis **Save**.
5. Attends 1 à 2 minutes : le site est en ligne sur `https://TON-PSEUDO.github.io/lachor/`.
6. Teste sur téléphone : menu, panier, création de compte, bouton WhatsApp, compte à rebours.
7. (Optionnel) Domaine perso : Settings → Pages → Custom domain.

## Direction artistique — vert #123D30
Un seul vert, `#123D30`. Seule son opacité baisse selon la page (variable `--g`, `PAGE_G` dans `js/app.js`) : Accueil 100 % → Produits 85 % → Fiche produit 70 % → Compte 55 % → Admin 40 %. Elle s'anime en 1000 ms d'une page à l'autre. Sous 70 %, les textes passent en #111 pour rester lisibles.
