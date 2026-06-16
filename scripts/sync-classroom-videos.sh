#!/usr/bin/env bash
# Reconciliação periódica do espelho de vídeos do ClassRoom (categoria Consultoria).
# Lê a chave do .env e chama o endpoint local de sync. Acionado pelo systemd timer.
set -euo pipefail
cd "$(dirname "$0")/.."
KEY="$(grep -E '^CLASSROOM_INTEGRATION_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"')"
[ -n "$KEY" ] || { echo "CLASSROOM_INTEGRATION_KEY ausente no .env"; exit 1; }
curl -fsS --max-time 60 -X POST -H "X-Integration-Key: $KEY" http://127.0.0.1:3000/api/videos/sync
