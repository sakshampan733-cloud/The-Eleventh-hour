#!/bin/sh
# Run every suite against index.html.  Needs nothing installed: jsc ships with macOS.
#   sh tests/run.sh
cd "$(dirname "$0")/.."
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
[ -x "$JSC" ] || { echo "JavaScriptCore not found at $JSC"; exit 1; }
T=tests

# the app's script block, pulled out so it can run headless
python3 - <<'PY'
import re
src=open('index.html',encoding='utf-8').read()
blocks=re.findall(r'<script>(.*?)</script>', src, re.S)
open('tests/app.js','w',encoding='utf-8').write(blocks[-1])
PY

"$JSC" -e "try{new Function(readFile('tests/app.js'));print('syntax OK')}catch(e){print('SYNTAX ERROR: '+e.message);}"

TOTAL=0; BAD=0
for f in catch feat smooth appeal plan worth runway ui plans feel report marked live pick leave home walk; do
  [ -f "$T/$f.js" ] || continue
  cat "$T/shim.js" "$T/$f.js" > "$T/.tmp.js"
  LINE=$("$JSC" "$T/.tmp.js" 2>&1 | grep "═══" || echo "CRASHED")
  P=$(echo "$LINE" | grep -o '[0-9]* passed' | grep -o '[0-9]*')
  F=$(echo "$LINE" | grep -o '[0-9]* failed' | grep -o '[0-9]*')
  TOTAL=$((TOTAL+${P:-0})); BAD=$((BAD+${F:-1}))
  printf "  %-8s %s\n" "$f" "$LINE"
  [ "${F:-1}" != "0" ] && "$JSC" "$T/.tmp.js" 2>&1 | grep FAIL
done
cat "$T/shim.js" "$T/hunt.js" > "$T/.tmp.js"
"$JSC" "$T/.tmp.js" 2>&1 | grep -E "BUG|═══"
cat "$T/shim.js" "$T/perf.js" > "$T/.tmp.js"
"$JSC" "$T/.tmp.js" 2>&1 | grep renderHome
rm -f "$T/.tmp.js"
echo
echo "  ── $TOTAL checks · $BAD failures"
[ "$BAD" = "0" ] || exit 1
