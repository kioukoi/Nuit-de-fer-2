# Nuit de Fer 2

Prototype de beat'em up à défilement horizontal (3 héros, 1 niveau, 1 boss, 1 ou 2 joueurs, en ligne possible).
Ouvrir `index.html` dans un navigateur.

## Organisation

Les scripts sont chargés dans cet ordre (variables globales partagées, l'ordre compte) :

| Fichier | Contenu |
|---|---|
| `css/style.css` | Styles de la page et des contrôles tactiles |
| `js/touch.js` | Contrôles tactiles |
| `js/config.js` | Constantes d'écran, canvas |
| `js/input.js` | Clavier et manettes |
| `js/audio.js` | Bruitages et musique synthétiques |
| `js/data.js` | Données : ennemis, attaques, armes, héros, niveau |
| `js/state.js` | État du jeu, création des joueurs et ennemis |
| `js/combat.js` | Coups, dégâts, tonneaux |
| `js/players.js` | Mise à jour des joueurs |
| `js/enemies.js` | Ennemis, objets, projectiles, vagues et caméra |
| `js/net.js` | Jeu en ligne (relais MQTT) |
| `js/menus.js` | Menus titre, sélection, en ligne |
| `js/simulation.js` | Simulation d'une image, menu en jeu, boucle de mise à jour |
| `js/render-base.js` | Rendu : décor, texte |
| `js/characters.js` | Rendu vectoriel des personnages |
| `js/render-ui.js` | Rendu : objets, effets, HUD, écrans |
| `js/main.js` | Boucle principale |
