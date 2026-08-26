# Koala V1.7.2 — Correctif icône iPhone

Aucune fonctionnalité budget n'a été modifiée.

Correctif iOS :
- `apple-touch-icon.png` placé à la racine du site
- variante `apple-touch-icon-180x180.png` à la racine
- déclarations Apple classiques dans `index.html`
- aucune query string sur les icônes
- manifest PWA conservé
- cache du service worker changé

Après déploiement GitHub Pages :
1. attendre la publication ;
2. ouvrir Koala dans Safari ;
3. supprimer l'ancienne icône de l'écran d'accueil si elle existe ;
4. Safari > Partager > Sur l'écran d'accueil > Ajouter.
