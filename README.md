# Nuit de Fer 2

Prototype de beat'em up à défilement horizontal (3 héros, 1 niveau, 1 boss, 1 ou 2 joueurs, en ligne possible).
Ouvrir `index.html` dans un navigateur.

## Organisation

Le code est regroupé **par élément du jeu** : chaque fichier contient les données, la création, la mise à jour et le dessin d'un même élément.
Les scripts sont chargés dans l'ordre ci-dessous (variables globales partagées, l'ordre compte).

**Socle**

| Fichier | Contenu |
|---|---|
| `css/style.css` | Styles de la page et des contrôles tactiles |
| `js/touch.js` | Contrôles tactiles |
| `js/config.js` | Constantes d'écran, canvas |
| `js/input.js` | Clavier et manettes |
| `js/audio.js` | Bruitages et musique synthétiques |
| `js/state.js` | Variables globales de l'état du jeu, générateur aléatoire |

**Éléments du jeu**

| Fichier | Contenu |
|---|---|
| `js/level.js` | Niveau : données, démarrage de partie, vagues, caméra, décor |
| `js/weapons.js` | Armes : données, bonus de coup, dessin en main et au sol, chute |
| `js/heroes.js` | Héros : données, création, attaques, mise à jour, HUD du joueur |
| `js/enemies.js` | Ennemis et boss : données, création, apparition, comportement |
| `js/combat.js` | Coups, dégâts, projection (commun à tous les éléments) |
| `js/barrels.js` | Tonneaux : destruction, dessin |
| `js/items.js` | Pommes, viande, armes au sol : mise à jour, dessin |
| `js/projectiles.js` | Objets lancés : mise à jour, dessin |
| `js/effects.js` | Effets visuels (étincelles, textes flottants) |

**Réseau, menus et boucle**

| Fichier | Contenu |
|---|---|
| `js/net.js` | Jeu en ligne (relais MQTT) |
| `js/menus.js` | Menus titre, sélection, en ligne |
| `js/simulation.js` | Simulation d'une image, menu en jeu, boucle de mise à jour |
| `js/hud.js` | Interface : texte, HUD, menus et écrans, rendu global |
| `js/character-draw.js` | Rendu vectoriel des personnages (héros et ennemis) |
| `js/main.js` | Boucle principale |

Pour ajouter un ennemi : `T` dans `js/enemies.js` (données) et son comportement dans `updEnemy`.
Pour ajouter une arme : `WEAPONS` et `WKEYS` dans `js/weapons.js`, et son dessin dans `drawWeapon` / `drawWeaponGround`.
