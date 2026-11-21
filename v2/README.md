# COMPAS NOIR — beat'em up (HTML5 / JavaScript)

Jeu de combat de rue en vue de côté, **1 joueur ou jusqu'à 4 en ligne**, 10 niveaux, 14 héros. Tout tient dans un seul fichier `index.html` : aucune installation, aucun framework.

## Lancer le jeu en local

**Méthode la plus simple** : double-cliquer sur `v2/index.html` (ou le glisser dans Chrome / Firefox / Safari / Edge). Le mode solo fonctionne tout de suite, même sans internet.

**Méthode conseillée** (le navigateur se comporte comme sur le vrai site, utile pour le mode en ligne et le classement) : ouvrir un terminal dans le dossier `v2/` puis lancer un petit serveur local :

```bash
cd v2
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000> dans le navigateur. (Sans Python : `npx serve` fonctionne aussi.)

> Le mode « En ligne » et le classement mondial demandent une connexion internet.
> Pour jouer en ligne avec des amis : chacun ouvre le jeu, clique sur **EN LIGNE**, et tout le monde arrive dans la même salle. Un joueur qui perd la connexion retrouve sa place en se reconnectant **avec le même pseudo**.

Version publiée : <https://kioukoi.github.io/Nuit-de-fer-2/v2/>

## Touches

| Action | Clavier |
|---|---|
| Se déplacer | flèches ou ZQSD (double appui sur → / ← : sprint) |
| Frapper (3 fois = combo) | J |
| Attaque spéciale (jauge SP) | K |
| Lancer l'arme | L |
| Sauter (puis J en l'air : coup de pied) | Espace |
| Menu / pause / musique | Échap / P / M |

Variante « main gauche » : F, G, H à la place de J, K, L. Marcher sur une arme ou une potion la ramasse.

## Modifier le jeu

Le fichier `index.html` est **généré**. Les sources sont dans `v2/src/` :

- `src/template.html` : page HTML et styles ;
- `src/js/*.js` : le code, découpé par thème et assemblé dans l'ordre des numéros (même portée globale) ;
- `build.py` : assemble le tout.

```bash
cd v2
python3 build.py                 # produit index.html (version à publier)
python3 build.py --debug -o /tmp/jeu-debug.html   # version avec l'API de test (window.__dbg)
```

Avant de publier : vérifier la syntaxe (`cat src/js/*.js > /tmp/r.js && node --check /tmp/r.js`) et ouvrir la page pour s'assurer qu'elle s'affiche.

Le jeu tourne à 60 images/s fixes avec un générateur aléatoire à graine : la simulation est **déterministe** (c'est ce qui permet le jeu en ligne par synchronisation des touches). Dans le code de simulation, utiliser `rng()` et jamais `Math.random()`.

## Contenu

Voir [`RECENSEMENT.md`](RECENSEMENT.md) : héros, niveaux, boss, monstres, pièges et événements.
