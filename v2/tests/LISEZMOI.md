# Tests de simulation

Scripts Node.js qui font tourner le jeu sans navigateur (canvas simulé) : synchro en ligne à 2-4 joueurs (`net5.js`, `net6.js`), événements de niveau, boss, modes de jeu, replays, fusion d'ultimes, armes des ennemis, vies bonus.

Ils lisent le jeu construit avec le mode debug : `cd v2 && python3 build.py --debug -o /home/claude/game/index.html` (chemin à adapter dans chaque script). Exemple : `PEERS=3 node tests/net5.js`. Résultat attendu pour la synchro : « desync : false » partout.
Ce sont des scripts de travail, pas une suite de tests automatique.
