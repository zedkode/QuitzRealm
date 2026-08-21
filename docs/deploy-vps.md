# Deployment pe VPS — QuizRealm

**Server:** `144.91.81.81` (Ubuntu, kernel 6.8) — VPS partajat cu alte stive.
**Director:** `/opt/quizrealm`
**Ultima actualizare:** 2026-08-16

## Regula de aur: nu atinge stivele existente

Pe acest VPS rulează deja `alvenqis-operator-*`, `sharedhouse-production-*` și
`vaultwarden`. Stiva QuizRealm e izolată prin:

- **proiect compose propriu** (`name: quizrealm`) → containere `quizrealm-*`,
  volume `quizrealm_*`;
- **rețea proprie** `quizrealm-net`, nu `default` partajată;
- **postgres / redis / minio nu publică niciun port** pe gazdă;
- **api / realtime / web publică doar pe `127.0.0.1`** (13000, 13001, 13002) —
  nu sunt expuse direct în internet; accesul public vine exclusiv prin
  Cloudflare Tunnel.

Comenzile de mai jos ating strict serviciile `quizrealm-*`. Nu rula niciodată
`docker compose down` fără `-f docker-compose.prod.yml`, nu rula `docker system
prune -a` și nu adăuga `-v` la `down` (ar șterge baza de date).

## Pornire / oprire

```bash
cd /opt/quizrealm/infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.prod down   # fără -v
```

`migrate` rulează `prisma migrate deploy` la fiecare pornire și se oprește;
`api` pornește doar după ce migrarea s-a terminat cu succes.

## Secrete

`infra/.env.prod` se generează **pe server**, o singură dată:

```bash
cd /opt/quizrealm/infra && bash generate-prod-env.sh
```

Scriptul refuză să suprascrie un fișier existent — secrete noi ar invalida
toate sesiunile active. Fișierul e `chmod 600` și nu se copiază de pe server.

## Sincronizarea codului de pe laptop

Codul se urcă prin arhivă (serverul nu clonează din GitHub):

```bash
cd d:/Projects/Games/QuizRealm
tar czf - --exclude=node_modules --exclude=dist --exclude=build \
  --exclude=.manus-logs --exclude=.env \
  backend/api backend/realtime infra \
  shared web admin package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc .dockerignore \
  | ssh -i ~/.ssh/quizrealm_vps_ed25519 root@144.91.81.81 'tar xzf - -C /opt/quizrealm'
```

`--exclude=.env` protejează `infra/.env.prod` de pe server; arhiva nu trebuie
să conțină niciodată fișiere de mediu locale.

Din 21 august 2026 imaginea web se construiește din **rădăcina** depozitului,
nu din `web/`: workspace-ul cuprinde `shared/`, `web/` și `admin/`, iar panoul
se servește sub `/admin` din același proces. De aceea arhiva trebuie să conțină
și manifestele de la rădăcină — fără ele, `pnpm install` din Dockerfile nu
găsește workspace-ul și build-ul cade.

Legătura SSH pică intermitent; rulează comenzile printr-un wrapper cu
reîncercare dacă dai peste `Connection timed out`.

## Populare date

```bash
cd /opt/quizrealm/infra
C="docker compose -f docker-compose.prod.yml --env-file .env.prod"
$C run --rm --entrypoint sh migrate -c "npx ts-node prisma/seed.ts"                       # 53 categorii
$C run --rm --entrypoint sh migrate -c "npx ts-node prisma/seed-curated-solo-questions.ts"  # dry-run
$C run --rm --entrypoint sh migrate -c "npx ts-node prisma/seed-curated-solo-questions.ts --confirm-reviewed"
```

Pachetul curatoriat intră cu `status = APPROVED`. Verificarea faptelor a fost
făcută de agent pe surse oficiale, **nu** de un recenzent uman — vezi
`passed.md`.

## Verificări rapide

```bash
curl -s http://127.0.0.1:13000/health                 # {"status":"ok","database":"up"}
curl -s http://127.0.0.1:13000/leaderboard
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:13002/   # panoul web: 200
# CORS: originea din WEB_APP_ORIGINS primește antetul, alta nu.
curl -s -i -H 'Origin: https://quitzrealm.dohotstudio.com' \
  http://127.0.0.1:13000/health/stats | grep -i access-control-allow-origin
KEY=$(grep ^INTERNAL_API_KEY= /opt/quizrealm/infra/.env.prod | cut -d= -f2)
curl -s http://127.0.0.1:13000/questions/internal/random -H "x-internal-api-key: $KEY"
curl -s http://127.0.0.1:13000/questions/internal/random   # trebuie 403
```

## Cloudflare Tunnel

Cele trei tuneluri de pe VPS sunt **token-based**, deci regulile de rutare
stau în dashboard-ul Cloudflare Zero Trust, nu în fișiere pe server —
`/etc/cloudflared/tunnel.token` conține doar tokenul, iar containerele
`*-cloudflared-1` pornesc cu `--token-file`. Configurarea se face din
dashboard sau prin API, nu prin SSH.

Hostname-uri necesare (vezi `infra/cloudflared/ingress.example.yml`):

| Hostname | Serviciu | Ce servește |
|---|---|---|
| `quitzrealm.dohotstudio.com` | `http://localhost:13002` | Panoul web |
| `quizrealmapi.dohotstudio.com` | `http://localhost:13000` | REST API |
| `quizrealmws.dohotstudio.com` | `http://localhost:13001` | Socket.IO (dueluri) |

Tunelul systemd are ID-ul `9137a2c2-7c83-4a4a-a68b-847cb5a27b8e`.

Hostname-ul panoului web e scris **`quitzrealm`** (cu `t`), la fel ca numele
repo-ului; `quizrealm.dohotstudio.com` nu are DNS.

## Panoul web

Serviciul `web` din aceeași stivă servește bundle-ul Vite prin Express, pe
`127.0.0.1:13002`. Nu are bază de date proprie: browserul apelează direct
`quizrealmapi` (REST) și `quizrealmws` (Socket.IO).

URL-urile backendului sunt **inline-uite în bundle la build**, nu citite la
runtime, deci orice schimbare a lor cere rebuild, nu doar restart:

```bash
cd /opt/quizrealm/infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build web
```

Variabilele relevante din `.env.prod`:

| Variabilă | Rol |
|---|---|
| `WEB_HOST_PORT` | portul pe gazdă (13002) |
| `WEB_API_URL` / `WEB_SOCKET_URL` | build args → `VITE_QUIZREALM_*` din bundle |
| `WEB_APP_ORIGINS` | originile acceptate de CORS pe `api` și de handshake-ul Socket.IO pe `realtime`; **gol = niciun browser** |

Fără `WEB_APP_ORIGINS`, backendul se poartă exact ca înainte de panoul web
(aplicația mobilă nu trimite `Origin`, deci nu e afectată), iar browserul
blochează fiecare cerere din panou.

Logul `[OAuth] ERROR: OAUTH_SERVER_URL is not configured` la pornirea
containerului e schela Manus rămasă în `server/_core`; autentificarea reală
trece prin REST-ul QuizRealm, deci mesajul e inofensiv.

## Aplicația mobilă

Base URL-urile sunt `String.fromEnvironment`, deci se aleg la build:

```bash
cd mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://quizrealmapi.dohotstudio.com \
  --dart-define=REALTIME_BASE_URL=https://quizrealmws.dohotstudio.com
```

Fără `--dart-define`, aplicația țintește `10.0.2.2` (emulator) și cere
`adb reverse` pe device fizic.
