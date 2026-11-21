# COMPAS NOIR : analyse complète (21 novembre 2026)

Cette analyse repose sur la lecture du code, les simulations (parties en ligne à 2, 3 et 4 joueurs, bots, tests des boss et des événements) et les données du classement mondial. **Aucun humain n'a testé le jeu à la manette ou au clavier pour cette analyse** : tout ce qui touche au ressenti (rythme, plaisir, lisibilité) est une hypothèse à vérifier en jouant.

## 1. Ce que disent les données du classement

43 parties enregistrées, par seulement deux joueurs réguliers (LE B : 27, EXOPOLE : 12).

- **27 parties sur 43 se terminent au niveau 4 (le toit), 0 victoire, aucune partie au-delà du niveau 5.** Soit le niveau 4 est un mur, soit les sessions s'arrêtent là. À vérifier en jouant : boss du toit, vagues avant lui, nombre de vies.
- **Gitan (17 parties) et médic (10) dominent.** Cogneur, vive, ombre, dalto et livreur n'ont aucune partie enregistrée. Soit ils sont moins attirants, soit personne ne les a essayés : sur 14 héros, 5 jamais joués, c'est beaucoup de contenu à entretenir.
- Il y a une ligne « TEST » (score 0) ajoutée par moi pendant le diagnostic du classement ; elle est à supprimer dans le tableau Supabase.

## 2. Classement mondial

Le serveur fonctionne (lecture et écriture testées depuis un navigateur). Ce qui trompait :

- Le rang obtenu n'était **jamais affiché** : la variable existait mais n'était jamais remplie. C'est corrigé : l'écran de fin affiche « Classement mondial : n°X ».
- Seul le top 10 était visible : un score moyen donnait l'impression de ne rien avoir enregistré. Ton meilleur score est maintenant affiché en vert, avec son rang, même hors du top 10.
- Reste à savoir : **n'importe qui peut envoyer un faux score** (la clé publique permet d'écrire sans contrôle). Sans importance entre amis. Si le jeu s'ouvre à plus de monde, il faudra valider côté serveur.

## 3. Problèmes et dettes à traiter

| Sujet | Constat | Piste |
|---|---|---|
| Réseau en lockstep | Le plus lent des joueurs ralentit tout le monde. Une machine qui rame fait monter le délai chez les autres. | Afficher un petit diagnostic (touche F3 : images/s, temps de dessin, délai, ping) pour voir qui rame. J'ai déjà ajouté l'allègement du dessin et le moteur continuant en onglet masqué. |
| Relais en ligne | Salle fixe et relais publics : n'importe qui connaissant le code peut rejoindre. | Code de salle aléatoire par partie et mot de passe optionnel. |
| Tests | Mes tests (synchro, boss, événements, ultimes) ne sont pas dans le dépôt. | Les ajouter dans `v2/tests/` et lancer le build + tests à chaque push (GitHub Actions). |
| Version | Le numéro est modifié à la main. | Le build l'écrit tout seul avec la date. |
| Code mort | 4 fonctions jamais appelées (`copyInvite`, `durBar`, `newCode`, `spBar`). Le mode « 2 joueurs sur le même clavier » (touches J2) n'est plus accessible. | Les retirer. |
| Performances | Aucune mesure sur une vraie machine. Le niveau 6 semble lourd chez toi. | Pré-dessiner les décors (qui ne bougent pas) dans une image au lieu de les redessiner à chaque image. |

## 4. À retirer ou simplifier

- Le code du mode deux joueurs sur le même ordinateur (cf. ci-dessus).
- Réduire la liste des héros ou les rendre plus distincts : si 5 sur 14 ne sont jamais choisis, mieux vaut les rendre attirants (ultime, style de jeu) que d'en ajouter d'autres.
- Les « dégâts entre alliés » activés par défaut : fréquent source de frustration entre amis. À mettre sur NON par défaut ?

## 5. Nouveautés qui apporteraient le plus

1. **Relever un allié K.O.** en restant à côté de lui (coopération centrale d'un beat'em up).
2. **Défi du jour** : une graine de partie par jour (le moteur est déterministe), avec son classement. Facile à faire, donne une raison de revenir.
3. **Replays** : comme la partie ne dépend que des touches, on peut enregistrer et rejouer une partie très légèrement (et l'envoyer à un ami). Aussi utile pour reproduire un bug.
4. **Saisies et projections** (attraper puis lancer un ennemi), classique de Streets of Rage.
5. **Mode survie / enchaînement de boss** avec classement séparé.
6. **Déblocages** : héros et tenues débloqués par le jeu, pour donner de l'intérêt aux héros jamais joués.
7. **Mise à l'échelle de la difficulté selon le nombre de joueurs** (vie des ennemis, nombre d'attaquants), pour que 4 joueurs ne rendent pas tout trivial et que le solo ne soit pas un mur.
8. **Tutoriel court** au niveau 1 (une ligne par touche, une fois) : les touches ne sont expliquées que dans le texte sous l'écran, pas dans le jeu.

## 6. Graphismes et réalisme (à valider à l'œil)

- **Éclairage** : halos additifs sous les lampadaires, flammes, néons du casino ; vignettage léger.
- **Météo** par niveau : pluie dans la rue, neige/vent sur le toit, poussière dans les catacombes.
- **Retour des coups** : étincelles, chiffres de dégâts, flash blanc, écrasement/étirement bref du sprite, débris sur les objets cassés. Les poids des coups (arrêt sur image, recul) peuvent être différenciés par arme.
- **Agrandissement net** : mise à l'échelle par pas entiers pour éviter le flou, plus un filtre « écran cathodique » optionnel.
- **Intelligence des ennemis** : encerclement et contournement plutôt que tous face au joueur, fuite à faible vie, ramassage d'armes déjà présent. Les tireurs et leurs grenades viennent d'être améliorés (cadence à ajuster en jouant).
- **Lisibilité** : annonces des attaques de boss plus nettes (zones au sol colorées), déjà amorcées.

## 7. Jouabilité

- Mémoriser une touche appuyée juste avant la fin d'un coup (« input buffering ») : à vérifier dans le code des coups, j'ai l'impression qu'elle n'existe pas partout.
- Écran de pause avec la liste des touches et un rappel du héros (spécial, ultime).
- Remappage des touches ; test à la manette.
- Options d'accessibilité : taille du texte, réduction des clignotements, couleurs alternatives.
- Niveau 4 à rééquilibrer en premier (cf. §1), puis revoir 5 et 6.

## 8. Ordre conseillé

1. Rééquilibrer le niveau 4 et ajouter le diagnostic F3 (comprendre les problèmes sur les machines des amis).
2. Relever un allié + tutoriel court.
3. Tests dans le dépôt + build automatique.
4. Défi du jour et replays.
5. Éclairage / météo / retour des coups.
