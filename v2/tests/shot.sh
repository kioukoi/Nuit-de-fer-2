#!/bin/bash
# usage: shot.sh name "js code"
name=$1; js=$2
python3 - "$name" "$js" <<'PY'
import sys
n,js=sys.argv[1],sys.argv[2]
h=open('${GAME:-tests/.build/index.html}',encoding='utf8').read()
h=h.replace('</body>','<script>setTimeout(function(){'+js+'},200)</script></body>')
open('/home/claude/test/shots/%s.html'%n,'w',encoding='utf8').write(h)
PY
google-chrome --headless=new --no-sandbox --disable-gpu --window-size=1000,640 --virtual-time-budget=3000 --screenshot=/home/claude/test/shots/$name.png file:///home/claude/test/shots/$name.html >/dev/null 2>&1
ls -la /home/claude/test/shots/$name.png
