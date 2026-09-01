#!/bin/sh
# Bump the version shown in Settings and the service-worker cache name together.
#
# They must move as a pair: the version is what tells you which build your
# phone actually has, and the cache name is what makes an installed copy
# refetch. Matching on the SHAPE of each value rather than the previous
# literal means a missed edit fails loudly instead of silently no-opping.
set -eu
# a bare number, e.g.  sh bump.sh 2.2
V="${1:-$(date +%Y.%m.%d)}"
cd "$(dirname "$0")"
python3 - "$V" <<'PY'
import re, sys
v = sys.argv[1]
for path, pat in [("docs/index.html", r"11:59 · v([0-9][^<]*)<"),
                  ("docs/sw.js",      r"const VERSION = 'eleventh-hour-v([^']+)'")]:
    s = open(path, encoding='utf-8').read()
    m = re.search(pat, s)
    if not m:
        sys.exit("FAILED: no version string in " + path)
    print("  %s: %s -> %s" % (path, m.group(1), v))
    open(path, "w", encoding='utf-8').write(s[:m.start(1)] + v + s[m.end(1):])
PY
