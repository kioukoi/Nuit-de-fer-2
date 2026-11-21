# Tests de simulation

Scripts Node.js (et Python 3 pour construire le jeu) qui font tourner le jeu sans navigateur, avec un canvas simulé : synchro en ligne à 2-4 joueurs, événements de niveau, boss, modes de jeu, replays, fusion d'ultimes, armes des ennemis, vies bonus.

Lancer depuis le dossier `v2` : `sh tests/lancer.sh <script>` (le jeu est construit en mode debug dans `tests/.build/`).

- `sh tests/lancer.sh modes.js` : Boss rush, Défi du jour, Chaos sur 3 niveaux (affiche `err null` si tout va bien)
- `sh tests/lancer.sh rep.js` : un replay doit redonner exactement la même partie (`ident true`)
- `sh tests/lancer.sh lot3.js` : Rogue, Niveau perso, Versus
- `PEERS=3 sh tests/lancer.sh net5.js` : parties en ligne simulées (cherche `desync : false` partout)
- `evt.js`, `boss.js`, `gun.js`, `fus.js`, `up.js` : événements, boss, armes des ennemis, fusion d'ultimes, vies bonus

Ce sont des scripts de travail qui affichent des chiffres à lire, pas une suite de tests automatique avec « réussi / échoué ». Certains (`net5.js`, `boss.js`) durent plusieurs minutes.
