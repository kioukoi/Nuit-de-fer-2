# Nuit de fer — version 2 (v2)

Jeu jouable : `index.html` (fichier généré, c'est lui que GitHub Pages sert).
**Ne pas le modifier à la main** : on modifie les fichiers de `src/` puis on lance le build.

## Organisation
```
v2/
├─ index.html            ← généré par build.py
├─ build.py              ← assemble src/ en index.html
└─ src/
   ├─ template.html      ← page (CSS, boutons tactiles, chargement de la librairie réseau)
   ├─ js/                ← le jeu, dans l'ordre des numéros (même portée globale)
   │  ├─ 01-base-entrees.js            canvas, clavier, manette
   │  ├─ 02-audio-musique.js           bruitages et musique synthétiques
   │  ├─ 03-donnees-niveaux.js         ennemis (T), armes, HÉROS, niveaux, pièges
   │  ├─ 04-etat-classement-combat.js  nom, classement mondial (Supabase), dégâts, XP et spécialisations
   │  ├─ 05-heros-pieges-ennemis.js    logique des joueurs, des alliés (kopins), pièges, boss, ennemis
   │  ├─ 06-reseau-en-ligne.js         multijoueur (lockstep, relais MQTT, jusqu'à 4)
   │  ├─ 07-menus-simulation.js        menus, simulation d'une image, boucle de mise à jour
   │  ├─ 08-decors.js                  décors des 4 niveaux
   │  ├─ 09-personnages-sprites.js     dessin vectoriel des personnages (mains, armes, chapeaux…)
   │  ├─ 10-objets-hud-rendu.js        objets, HUD, écrans (sélection, scores, options), rendu
   │  └─ 11-boucle-principale.js       boucle à 60 Hz
   └─ dev/debug.js       ← API de test (jamais dans la version publiée)
```

## Travailler
```
python3 build.py                         # produit index.html (publié)
python3 build.py --debug -o /tmp/t.html  # version avec l'API de test window.__dbg
```
Ajouter un héros : `HEROES` + `HERO_KEYS` + `SPECS`, son pouvoir dans `updPlayer`,
son look dans `09-personnages-sprites.js` (`BASEMAP` + un `case` pour le chapeau/accessoire).

Règle d'or du multijoueur : la simulation doit être déterministe (uniquement `rng()` et `simF`,
jamais `Math.random()` ni l'heure) ; l'affichage, lui, peut utiliser `Math.random()`.
