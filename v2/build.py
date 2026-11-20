#!/usr/bin/env python3
"""Assemble le jeu : src/template.html + src/js/*.js (dans l'ordre des numéros) -> index.html.
   python3 build.py            -> index.html (version publiée, sans outils de test)
   python3 build.py --debug    -> ajoute src/dev/debug.js (API de test) ; sortie : -o chemin (défaut index.html)"""
import glob, os, sys
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(here, p), encoding='utf8').read()
args = sys.argv[1:]
out = args[args.index('-o') + 1] if '-o' in args else os.path.join(here, 'index.html')
js = ''.join(rd(os.path.relpath(p, here)) for p in sorted(glob.glob(os.path.join(here, 'src', 'js', '*.js'))))
if '--debug' in args:
    js = js.rstrip('\n') + '\n' + rd('src/dev/debug.js')
open(out, 'w', encoding='utf8').write(rd('src/template.html').replace('/*@@JS@@*/', js))
print('écrit', out, len(js), 'octets de JS')
