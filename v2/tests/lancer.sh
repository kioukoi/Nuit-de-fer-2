#!/bin/sh
# Usage : sh tests/lancer.sh <script>   ex. : sh tests/lancer.sh modes.js   |   PEERS=3 sh tests/lancer.sh net5.js
# Construit le jeu en mode debug puis lance le test demandé (Node.js et Python 3 requis).
cd "$(dirname "$0")/.." || exit 1
mkdir -p tests/.build && python3 build.py --debug -o tests/.build/index.html >/dev/null || exit 1
cd tests && exec node "$@"
