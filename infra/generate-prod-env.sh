#!/usr/bin/env bash
# Generează `.env.prod` cu secrete aleatoare, direct pe VPS.
#
# Secretele nu trec niciodată prin repo sau prin laptop: se nasc aici și rămân
# aici. Scriptul refuză să suprascrie un `.env.prod` existent, ca o rerulare
# accidentală să nu invalideze tokenurile emise deja.
set -euo pipefail

cd "$(dirname "$0")"
target=".env.prod"

if [[ -e "$target" ]]; then
  echo "EROARE: $target există deja. Șterge-l manual dacă chiar vrei secrete noi." >&2
  echo "Atenție: secrete noi = toate sesiunile active devin invalide." >&2
  exit 1
fi

secret() { openssl rand -base64 48 | tr -d '\n=+/' | cut -c1-48; }

api_domain="${API_DOMAIN:-quizrealmapi.dohotstudio.com}"

umask 077
cat > "$target" <<EOF
POSTGRES_DB=quizrealm
POSTGRES_USER=quizrealm
POSTGRES_PASSWORD=$(secret)

API_HOST_PORT=${API_HOST_PORT:-13000}
REALTIME_HOST_PORT=${REALTIME_HOST_PORT:-13001}

JWT_ACCESS_SECRET=$(secret)
JWT_REFRESH_SECRET=$(secret)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

INTERNAL_API_KEY=$(secret)

GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
GOOGLE_CALLBACK_URL=https://${api_domain}/auth/google/callback

ROUND_DURATION_MS=12000
MATCH_STATE_TTL_SECONDS=3600
MATCH_TOTAL_ROUNDS=5
RECONNECT_GRACE_MS=75000

MINIO_ROOT_USER=quizrealm
MINIO_ROOT_PASSWORD=$(secret)
MINIO_BUCKET=quizrealm-assets
EOF

chmod 600 "$target"
echo "Am scris $target (chmod 600). Nu-l comita și nu-l copia de pe server."
