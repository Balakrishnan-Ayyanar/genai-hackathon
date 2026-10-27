#!/usr/bin/env bash
set -eu
cd -- "$(dirname -- "$0")/.."
python3 ../connection-tools/start_nightshift_tunnel.py || printf '%s\n' 'Nightshift tunnel unavailable; deterministic evidence checks can still run.'
exec env NODE_ENV=production ./node_modules/.bin/tsx src/server.ts
