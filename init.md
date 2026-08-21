# INIT.md — Bootstrap proiect QuizRealm

> Acest fișier e scris pentru un **agent AI de coding** (Claude Code / Codex) care pornește implementarea de la zero, pe baza `plan.md`. Execută pașii în ordine. Nu sări faze. La final de fiecare pas, verifică output-ul înainte de a continua.

---

## Regula zero — de unde se lucrează

**Singura listă validă de lucru din proiect e `ai/tasks/`.** Douăsprezece
registre acoperă serverul core, panoul de administrare, platforma web,
aplicația, plus disciplinele care nu sunt cod: design de joc, conținut, artă și
sunet, creștere, infrastructură, legal, calitate, analiză.

Niciun agent nu scrie cod pentru ceva ce nu are ID de task într-un registru.
Niciun task nu se închide fără dată și hash de commit completate acolo.
Fișierul de față descrie **cum e organizat** proiectul; `ai/tasks/` descrie **ce
se construiește**. Nu confunda cele două.

---

## Pas 0 — Prerechizite de mediu

Verifică/instalează (nu presupune că există deja):

- Flutter SDK (stable channel) + Android SDK/toolchain pentru build Android.
- Node.js LTS (≥ 20) + npm/pnpm pentru backend NestJS.
- Docker + docker-compose (pentru Postgres, Redis, MinIO local).
- `flutter doctor` trebuie să treacă fără erori blocante înainte de a continua.

---

## Pas 1 — Structura monorepo

> **Actualizat 21 august 2026.** Panoul de administrare a fost scos din `web/`
> într-un pachet propriu, iar contractul comun cu serverul a fost extras în
> `shared/`. Structura de mai jos e cea curentă și e **obligatorie** — vezi
> `agents.md` §3 pentru regula completă.

Regula: **o componentă livrabilă = un folder, care conține tot ce îi trebuie ei
și nimic ce aparține alteia.**

```
quizrealm/
├── ai/
│   ├── tasks/               # ⚠️ SINGURA listă validă de lucru (12 registre)
│   ├── taskmaster.md        # faze, cronologie, decizii blocante
│   └── needdesign.md        # lipsuri cunoscute din panou
├── plan.md                  # viziune + arhitectură (sursă de design)
├── owner-plan.md            # sisteme sociale, ranguri, turnee, i18n, mecanici unice
├── init.md                  # acest fișier — structură + bootstrap
├── agents.md                # reguli obligatorii pentru agenți
├── package.json             # rădăcina workspace-ului pnpm (shared + web + admin)
├── pnpm-workspace.yaml
├── scripts/
│   └── check-versions.mjs   # verifică regula de versionare, rulează în CI
│
├── backend/                 # SERVER CORE — singura sursă de adevăr
│   ├── api/                 # NestJS REST + Prisma + toate regulile de joc
│   ├── realtime/            # Socket.IO, motorul de partidă, matchmaking
│   └── workers/             # job-uri programate
│
├── shared/                  # contractul frontend: client HTTP, sesiune, tipuri comune
├── web/                     # SITE PUBLIC + ZONA DE JOC (fără nimic de admin)
├── admin/                   # PANOUL DE ADMINISTRARE (aplicație separată, servită la /admin)
├── mobile/                  # APLICAȚIA FLUTTER
│
├── infra/                   # compose de producție, tunel, variabile de exemplu
├── design-reference/        # capturi aprobate de design
└── docs/
    ├── adr/                 # Architecture Decision Records
    ├── archive/             # analize datate, păstrate ca dovadă
    ├── design-system.md     # tokeni vizuali (sursă de design)
    └── deploy-vps.md        # procedura de implementare
```

**Ce nu are voie să se amestece:**

- `admin/` nu importă din `web/` și invers. Ce e cu adevărat comun urcă în `shared/`.
- `shared/` conține doar ce folosesc *amândouă*. Un tip al unuia singur rămâne la el.
- `web/`, `admin/` și `mobile/` nu conțin logică de joc, economie sau progres —
  aceea trăiește exclusiv în `backend/`.
- O reorganizare a structurii cere un ADR care o justifică.

---

## Pas 1b — Versionare obligatorie

Fiecare componentă livrabilă are număr de versiune propriu, semantic:
`backend/api`, `backend/realtime`, `shared/`, `web/`, `admin/` în `package.json`;
`mobile/` în `pubspec.yaml`.

`node scripts/check-versions.mjs` verifică regula și oprește build-ul dacă o
componentă n-are versiune sau are una invalidă. Detalii în `agents.md` §4.

---

## Pas 2 — Infra locală (docker-compose)

În `infra/docker-compose.yml`, definește servicii pentru:
- `postgres` (versiune stabilă recentă, volum persistent, DB `quizrealm`)
- `redis` (versiune stabilă recentă, volum persistent)
- `minio` (S3-compatible storage, cu bucket implicit `quizrealm-assets`)

Creează `infra/.env.example` cu toate variabilele necesare (credențiale DB, Redis, MinIO, JWT secret, chei API pentru provider-ul AI folosit la generarea întrebărilor) — **fără valori reale**, doar placeholder-e.

Verificare: `docker-compose up -d` din `infra/` pornește toate cele 3 servicii fără erori.

---

## Pas 3 — Backend API (`backend/api`)

1. Inițializează un proiect **NestJS** (TypeScript strict mode activat).
2. Adaugă module inițiale conform schemei din `plan.md` secțiunea 4:
   - `auth` (email/parolă + Google OAuth, JWT)
   - `users` (profil, XP, ELO, coins)
   - `questions` (CRUD + status pending/approved/rejected, endpoint de listare filtrată pe categorie/dificultate)
   - `categories`
   - `matches` (istoric partide, rezultate)
   - `cosmetics` + `inventory`
   - `reports` (raportare întrebări)
3. Configurează ORM: **Prisma** sau **TypeORM** (alege unul, documentează alegerea într-un ADR în `docs/adr/`) conectat la Postgres din `infra`.
4. Migrările inițiale trebuie să creeze exact tabelele descrise în `plan.md` secțiunea 4 (`users`, `questions`, `categories`, `matches`, `match_players`, `match_events`, `cosmetics`, `user_inventory`, `question_reports`).
5. Endpoint de sănătate `/health` funcțional.

Verificare: `npm run start:dev` pornește API-ul, `/health` răspunde 200, migrările rulează curat pe DB-ul din docker-compose.

---

## Pas 4 — Serviciu realtime (`backend/realtime`)

1. Proiect Node.js/NestJS separat (sau serviciu minimal Socket.IO) — decizie documentată în ADR dacă diferă de stack-ul din `api`.
2. Implementează:
   - conectare autentificată (validare JWT emis de `api`)
   - coadă de matchmaking simplă în Redis (mod `duo` întâi, restul modurilor ulterior)
   - camera de joc: emitere întrebare, colectare răspunsuri, validare server-side a corectitudinii, actualizare scor/teritoriu
   - la finalul partidei: trimite rezultatul către `api` (endpoint intern) pentru persistare în Postgres + recalcul ELO
3. Nu implementa încă anti-cheat avansat — doar validare server-side a răspunsului (clientul nu poate decide singur un rezultat).

Verificare: două conexiuni de test (scripturi/client de test) pot fi matchate într-o partidă `duo` simplă și pot termina o rundă cu scor calculat corect.

---

## Pas 5 — Workers (`backend/workers`)

1. Configurează **BullMQ** peste Redis-ul din `infra`.
2. Implementează job-ul `generate-questions`:
   - primește parametri (categorie, dificultate, cantitate)
   - apelează provider-ul AI configurat prin variabilă de mediu (fără chei hardcodate)
   - validează formatul JSON al răspunsului înainte de inserare (`status = pending`)
   - respinge/loghează orice output malformat, nu-l inserează silențios
3. Implementează job-ul `recalculate-leaderboard` (rulează periodic, populează Sorted Set în Redis din datele din Postgres).

Verificare: rularea manuală a job-ului `generate-questions` cu o categorie de test populează tabela `questions` cu întrebări valide, cu `status = pending`.

---

## Pas 6 — Bootstrap taxonomy + primul batch de întrebări

- [x] Populează tabela `categories` cu taxonomy-ul inițial descris în `plan.md` secțiunea 5.1 (istorie, geografie, știință, sport, film/muzică, literatură, actualitate, România specific — cu subcategorii unde are sens).
- [ ] Rulează `generate-questions` pentru ~5.000 de întrebări distribuite pe categorii (batch de test pentru Faza 0, nu setul final de 50.000+).
  - [x] Orchestrator reluabil + planificare verificată pentru 45 subcategorii × 5 dificultăți.
  - [x] Gate factual generator-verificator separat, fail-closed, cu raportare distinctă pentru întrebările respinse semantic.
  - [ ] Validează manual un preflight de 10 întrebări (5 Biologie + 5 Istoria României) cu o combinație provider-verificator suficient de corectă și rapidă.
  - [ ] Rulează orchestratorul cu un provider AI real și verifică ~5.000 întrebări în DB.
- [ ] Marchează manual (sau prin script de sampling) un eșantion ca `approved` pentru a putea testa gameplay-ul solo end-to-end.

---

## Pas 7 — Aplicația Flutter (`mobile/`)

> **Excepție de ordine acceptată la 2026-08-14:** Pasul 7 a fost început înainte de finalizarea Pasului 6, la cererea explicită a proprietarului. Vezi `docs/adr/0003-defer-question-bootstrap-for-mobile-prototype.md` și lista de revenire din `passed.md`.

1. `flutter create mobile` (sau echivalent) cu suport Android activat (iOS opțional, dar structura de proiect rămâne cross-platform).
2. Adaugă dependențe conform `plan.md` secțiunea 3.1: `flutter_riverpod`, `go_router`, `web_socket_channel` sau `socket_io_client`, `flutter_secure_storage`, `isar` sau `drift`.
3. Structură `lib/` recomandată:
   ```
   lib/
   ├── core/            # theming, constante, utilitare, client HTTP/WS
   ├── data/            # repositories, modele, surse de date (API, local cache)
   ├── domain/           # entități, use-cases
   ├── features/
   │   ├── auth/
   │   ├── question/     # ecran întrebare (grilă + numeric), cronometru
   │   ├── match/         # flux partidă, hartă, teritorii
   │   ├── profile/
   │   ├── shop/
   │   └── leaderboard/
   └── main.dart
   ```
4. Implementează mai întâi ecranul de întrebare (grilă + numeric) și modul antrenament/solo consumând `api`-ul de întrebări — **nu conecta realtime încă** (asta e Faza 2 din `plan.md`).

Verificare: aplicația rulează pe emulator/device Android, poate face login, poate juca o rundă solo cu întrebări reale din backend.

### Stare verificabilă Pas 7

- [x] Proiect Flutter stable generat cu suport Android și instalat pe device-ul fizic `SM-S938B`.
- [x] Dependențe adăugate: Riverpod, go_router, web_socket_channel, flutter_secure_storage, Drift și `shared_preferences` (progres local).
- [x] Structură `core/data/domain/features`, client HTTP centralizat, i18n română/engleză și temă originală QuizRealm.
- [x] Autentificare/înregistrare REST, tokenuri în storage securizat și stare de sesiune prin Riverpod. Contul este acum **opțional** (campania merge offline).
- [x] Ecran de asalt pentru grilă + numeric, timer, scor, serie și feedback corect/greșit/timeout.
- [x] Validarea răspunsului online se face server-side prin `POST /questions/:id/answer`; clientul nu primește răspunsul corect înainte de submit. Sursa e abstractizată prin `RoundSource` (vezi ADR 0004).
- [x] Teste: 59 de teste (reguli de scor, progres, pachete de întrebări, controller de asalt, widget-uri, layout pe 3 dimensiuni de telefon). `flutter analyze` curat, `flutter test` verde, build APK debug trece.
- [x] API-ul local este accesibil de pe telefon prin `adb reverse tcp:3000 tcp:3000`, iar `/health` confirmă DB `up`.
- [x] Campanie solo jucabilă end-to-end **offline**, din pachete curatoriate livrate cu jocul: 9 ținuturi × 3 asalturi, stele, XP/nivel, progres salvat local (ADR 0004).
- [ ] Login-ul și o rundă solo completă cu întrebări reale `APPROVED` **din backend** sunt validate pe device (blocat corect de 0 întrebări aprobate; vezi `passed.md`).

### Stare `owner-plan.md` §1 — Login & înregistrare

- [x] Sesiuni pe dispozitiv: refresh token per sesiune, listare, revocare
  individuală și în masă, rotație cu detecție de rejucare (ADR 0008).
- [x] Identitate: `username` (cooldown 30 zile) separat de `displayName`.
- [x] Age gate cu dată de naștere: sub 13 ani contul e refuzat; 13-15 ani e cont
  de minor, cu chat global și linkuri externe blocate.
- [x] Verificare email și resetare parolă cap-coadă (token `selector.verifier`,
  consum unic, resetarea închide toate sesiunile).
- [x] Livrare reală de email prin Resend (`MAIL_TRANSPORT=resend`), verificată
  în producție: verificare de adresă și resetare de parolă ajung la destinatar.
  Expeditorul trebuie să fie pe domeniul verificat în Resend
  (`mail.dohotstudio.com`).
- [x] Pagini HTML pentru linkurile din email (`GET /auth/verify-email`,
  `GET|POST /auth/reset-password`) — altfel linkul deschis în browser arăta ca
  o eroare.
- [x] `canPlayRanked` aplicat la intrarea în coadă, în `backend/realtime`, cu
  citire proaspătă a capabilităților; refuzul vine ca `matchmaking:rejected`,
  iar aplicația oferă retrimiterea linkului de confirmare.
- [ ] 2FA TOTP, captcha la înregistrare, conversie cont de invitat, recuperare
  manuală prin suport.
- [ ] Ecran pentru completarea datei de naștere la conturile vechi
  (`PATCH /users/me/birth-date` există deja). Se face în §2, unde lipsa datei
  devine vizibilă prin restricțiile de chat.

### Stare `owner-plan.md` §2 — Chat, prietenii și trepte de încredere

- [x] Nouă trepte de încredere din răspunsuri corecte cumulate, calculate
  server-side; pragurile se expun prin `GET /chat/trust`, nu sunt hardcodate în
  client (ADR 0010).
- [x] Sistem de prietenie: cerere / acceptare / refuz, cerere inversă tratată ca
  acceptare, listă cu prezență online.
- [x] Blocare valabilă în ambele sensuri, care rupe și prietenia, și scoate
  conversația din listă.
- [x] Conversații persistente 1:1 (prieteni și DM), cu coadă de „cerere de
  mesaj” pentru necunoscuți și limita de un singur mesaj până la acceptare.
- [x] Confidențialitate DM (`Oricine` / `Doar prietenii` / `Nimeni`), impusă pe
  `Doar prietenii` la conturile de minor.
- [x] Chat global efemer în Redis (100 mesaje, TTL 24 h), cerând T2 + email
  confirmat, cu livrare care exclude perechile blocate.
- [x] Protecții: rate limiting, filtru de limbaj RO/EN cu mascare, detecție de
  spam cu mut automat, raportare cu copie a conținutului și prioritate mai mare
  pentru contextul privat.
- [x] Chat de bază în meci (`chat:match:*`) — implementat de Codex, vezi ADR 0009.
- [x] Aplicație: ecran de prieteni și mesaje, ecran de conversație, card de
  treaptă cu progres, setare de confidențialitate.
- [ ] Livrarea prin socket a mesajelor directe în aplicație. Serverul emite deja
  `chat:message` și `friends:presence`; până la legarea lor, ecranul de
  conversație reîmprospătează firul la 4 secunde cât e deschis.
- [ ] Ecran pentru completarea datei de naștere la conturile vechi — fără el,
  acele conturi rămân tratate ca minori, deci fără chat global.
- [ ] Imagini/GIF-uri (cer canal de upload și moderare de imagine), shadow-ban,
  coadă de moderare umană (§13), sharding pe limbă al camerei globale,
  sugestii de prieteni.

### Stare Faza 2 (`plan.md`) — Multiplayer MVP

- [x] Serviciu realtime (Socket.IO) + matchmaking Redis.
- [x] Mod Duo 1v1 pe **runde multiple** (implicit 5), cu întrebări nerepetate în aceeași
  partidă și verdict exclusiv server-side (ADR 0005).
- [x] Client Flutter de duel: matchmaking, rundă live, verdict cu răspunsurile ambilor
  jucători și timpii lor, rezultat final. Verificat pe device contra unui al doilea
  jucător real.
- [x] Sincronizare rezultate în Postgres + calcul ELO (verificat: 1000 → 1044 / 956).
- [x] Sistem de rang: 22 de trepte fixe + „Legendă” (Top 100), calculate din ELO
  server-side, cu insignă și progres spre treapta următoare în aplicație (ADR 0006).
- [x] Clasament global: `GET /leaderboard`, `/leaderboard/me`, `/leaderboard/tiers` +
  ecran în aplicație cu poziția proprie evidențiată.
- [x] Reconectare la deconectare: partida intră în pauză, locul e rezervat 75 s
  (plafonat la 90 s), cronometrul rundei îngheață, iar la revenire clientul
  primește un instantaneu complet. Neprezentarea în fereastră = abandon
  (ADR 0007).
- [x] Stivă publicată pe VPS (`docs/deploy-vps.md`): Postgres, Redis, API și
  realtime în containere proprii, expuse doar prin Cloudflare Tunnel.
- [ ] Partide private cu cod + roboți configurabili.
- [x] Chat de bază în meci (`owner-plan.md` §2, mapat pe Faza 2): cameră efemeră
  izolată per partidă, istoric la reconectare, reacții presetate pentru T0/minori,
  text liber numai cu permisiune server-side, rate limit, mute, blocări și UI Flutter.

### Stare Faza 1 (`plan.md`) — gameplay solo

- [x] Ecran de întrebare (grilă + numeric), cronometru circular, scor cu bonus de timp și multiplicator de serie.
- [x] Mod solo/campanie funcțional end-to-end, fără realtime.
- [x] Hartă de ținuturi (statică, cu noduri, deblocări pe stele) + traseu vizual al asaltului.
- [x] Design system de joc: paletă proprie, iconografie vectorială desenată în cod, panouri/butoane cu relief, fundal animat. **Adus mai devreme din Faza 4**, la cererea proprietarului (ADR 0004). Cosmeticele și magazinul din aceeași fază **nu** au fost aduse.

---

## Pas 8 — Documentare progres

Pentru fiecare decizie tehnică semnificativă care se abate de la `plan.md` sau adaugă un detaliu nou (ex: alegerea Prisma vs TypeORM, structura exactă a evenimentelor Socket.IO), scrie un fișier scurt în `docs/adr/NNNN-titlu.md` (format ADR: context, decizie, consecințe).

---

## Definiție de "gata" pentru bootstrap

Bootstrap-ul e considerat complet când:
- [x] `docker-compose up -d` pornește Postgres, Redis, MinIO fără erori.
- [x] `backend/api` pornește, migrările rulează, `/health` răspunde 200.
- [x] `backend/realtime` poate matcha 2 clienți de test într-o partidă `duo` simplă.
- [x] `backend/workers` poate genera și insera un batch de întrebări valide.
- [ ] `mobile/` rulează pe Android și poate juca o rundă solo end-to-end cu date reale din backend.
- [ ] Cel puțin taxonomy-ul de categorii + ~5.000 întrebări de test există în DB.

După acest punct, continuă cu **Faza 1** din `plan.md`.
