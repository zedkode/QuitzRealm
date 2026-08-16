# QuizRealm — memorie comună AI

Acest fișier este jurnalul de predare între Codex, Claude și ceilalți asistenți
care lucrează la QuizRealm.

## Protocol obligatoriu

- Citește integral `owner-plan.md`, apoi acest fișier, înainte de modificări.
- Păstrează intrările existente și adaugă o intrare nouă, datată, la final.
- Notează autorul, obiectivul, fișierele schimbate, verificările efectuate,
  rezultatul, blocajele și următorul pas concret.
- Nu introduce parole, tokenuri, chei private, conținutul fișierelor `.env` sau
  alte secrete.
- Nu atribui unui alt agent schimbări pe care nu le-ai verificat în Git.
- VPS-ul este partajat. Nu șterge containere și nu executa operații Docker
  destructive; limitează orice operație la stiva `quizrealm-*`.

## 2026-08-15 — Codex

### Obiectiv

Continuarea dezvoltării conform `owner-plan.md`, cu verificarea GitHub,
telefonului Android și a VPS-ului.

### Verificări efectuate

- Repo local: ramura `main`, commit `1a5d5ac`, sincronizat cu `origin/main` după
  `git fetch origin --prune`.
- GitHub remote: `https://github.com/zedkode/quitzrealm.git`.
- `owner-plan.md` a fost căutat în workspace, în toate referințele remote Git și
  read-only pe VPS în `/opt/quizrealm`; fișierul nu există încă în niciunul
  dintre aceste locuri.
- Telefonul `SM-S938B` este conectat și autorizat prin ADB.
- VPS-ul a fost accesat exclusiv read-only pentru căutarea documentului; nu a
  fost modificat și nu a fost atins niciun container.
- Modificarea locală deja existentă în
  `mobile/assets/questions/istorie.json` a fost identificată și păstrată; nu
  este atribuită acestei sesiuni Codex.

### Fișiere schimbate de Codex în această etapă

- `memory-ai.md` — creat la cererea proprietarului pentru coordonarea cu Claude.

### Blocaj

`owner-plan.md`, indicat de proprietar drept document obligatoriu, lipsește.
Nu se alege și nu se implementează următoarea funcționalitate până când
documentul nu este adăugat local sau publicat în `origin/main`.

### Următorul pas concret

După apariția `owner-plan.md`: citește-l integral, compară cerințele cu starea
repo-ului și cu această memorie, apoi implementează primul task permis de plan.

## 2026-08-15 — Codex (continuare)

### Obiectiv

Continuarea Fazei 2 după `owner-plan.md`, cu un slice jucabil și verificabil:
chatul de bază în meci, conectat end-to-end la duelul realtime.

### Corecție față de intrarea anterioară

`owner-plan.md` a apărut ulterior în rădăcina repo-ului și a fost citit integral,
urmat de `memory-ai.md`, `plan.md`, `init.md` și `agents.md`. Este acum sursa de
adevăr pentru dezvoltarea nouă. `plan.md` și `init.md` au fost actualizate să-l
referențieze direct.

### Implementare

- Realtime: evenimente `chat:match:join`, `chat:match:send` și
  `chat:match:react`; camera este izolată prin `matchId`, iar serverul verifică
  atât partida activă din Redis, cât și apartenența din starea meciului.
- Chat de meci efemer: maximum 50 mesaje, TTL o oră, istoric livrat la intrare
  și reconectare; nu se persistă în Postgres.
- Siguranță server-side: T0/minorii folosesc numai patru reacții presetate;
  textul cere permisiunea `ownMatches`/`public`; se aplică mute, rate limit,
  blocări și interdicția linkurilor înainte de treapta permisă.
- Flutter: contracte tipizate, integrare în `RealtimeClient` și
  `DuelController`, panou „Cronica luptei”, icon de chat desenat în sistemul
  vizual al jocului, reacții și text RO/EN, plus mesaje oneste la refuz.
- Documentație: contractul Socket.IO este în `backend/realtime/EVENTS.md`;
  checklist-ul „Chat de bază în meci” este bifat în `init.md`.
- Abaterea existentă Duo hardcodat vs. model generic `N=2..8` din
  `owner-plan.md` este documentată în ADR 0009 și în `passed.md`. Campania
  offline existentă se păstrează, nu se extinde, până la decizia explicită a
  proprietarului.

### Fișiere schimbate de Codex

- `backend/realtime/src/chat/chat.gateway.ts`
- `backend/realtime/src/chat/chat.service.ts`
- `backend/realtime/src/chat/chat.service.spec.ts`
- `backend/realtime/src/chat/dto/chat.dto.ts`
- `backend/realtime/test/duo.e2e-spec.ts`
- `backend/realtime/EVENTS.md`
- `mobile/lib/core/network/realtime_client.dart`
- `mobile/lib/core/ui/game_icons.dart`
- `mobile/lib/domain/duel/duel_events.dart`
- `mobile/lib/features/duel/duel_controller.dart`
- `mobile/lib/features/duel/duel_screen.dart`
- `mobile/lib/l10n/app_ro.arb`, `app_en.arb` și fișierele generate l10n
- testele/fake-urile Duel din `mobile/test/`
- `plan.md`, `init.md`, `passed.md`
- `docs/adr/0009-adopt-owner-plan-and-remediate-phase-2-gaps.md`
- `memory-ai.md`

Modificarea preexistentă din `mobile/assets/questions/istorie.json` nu a fost
atinsă sau atribuită lui Codex.

### Verificări și runtime

- Realtime unit: 7/7; realtime E2E: 5/5; `nest build`: trecut; ESLint pe lotul
  modificat: curat.
- Flutter: `flutter analyze` curat; 106/106 teste trecute.
- APK release construit cu endpoint-urile publice, 86,0 MB, instalat prin ADB pe
  `SM-S938B`; aplicația pornește în foreground fără `FATAL EXCEPTION`.
- VPS: încărcat numai `backend/realtime`; rulat `docker compose ... build
  realtime` și `up -d --no-deps realtime`. Niciun `down`, `rm`, `prune`, volum
  sau container al altei stive nu a fost atins. Health final:
  `{"status":"ok","redis":"up"}`; logul confirmă toate evenimentele noi.
- GitHub: schimbările acestei sesiuni sunt încă locale, necomise și neîmpinse.
  Remote-ul rămâne `https://github.com/zedkode/quitzrealm.git`.

### Checklist bifat

- `init.md` / Faza 2: `[x] Chat de bază în meci`.

### Următorul pas concret

Începe subtask-ul Faza 2 din ADR 0009: înlocuiește tipurile, coada și starea
hardcodate Duo cu o configurație generică de meci `N=2..8`, păstrând contractul
Duo compatibil. Abia apoi implementează „Partide private cu cod + roboți
configurabili” peste același motor. Nu începe Faza 3.

## 2026-08-15 — Codex (categorii cerute de proprietar)

### Obiectiv

Adăugarea celor 20 de categorii cerute explicit de proprietar și a unui prim
lot de întrebări cu răspunsuri, fără a încălca regula fail-closed a băncii de
întrebări. Înainte de schimbarea priorității a fost început și subtask-ul Faza 2
pentru motorul generic de meci.

### Implementare categorii și întrebări

- `categories` are acum coloana opțională și unică `code`, prin migrarea
  aditivă `20260815223000_category_stable_code`; nu s-a șters nicio categorie.
- Taxonomia mapează exact cele 20 de coduri: `geography`, `history`, `science`,
  `wars`, `gaming`, `movies`, `music`, `sports`, `general-knowledge`,
  `technology`, `mythology`, `animals`, `space`, `literature`, `art`, `cars`,
  `logic`, `economy`, `medieval`, `royal-challenge`.
- Au fost create 60 de întrebări în română (3/categorie), fiecare cu patru
  variante, răspuns corect și explicație. Proveniența este onestă:
  `source=AI`, `status=PENDING`, deci nu intră în rotația live.
- Scriptul `npm run questions:owner-categories` este dry-run implicit și
  acceptă scrierea numai cu `--apply-pending`; protejează orice rând care nu
  mai este `AI/PENDING` și este idempotent.
- Extinderea taxonomiei față de cele opt domenii inițiale este documentată în
  `docs/adr/0010-stable-gameplay-category-codes.md`; verificarea factuală a
  lotului este trecută în `passed.md`.

### Subtask Faza 2 început înaintea schimbării de prioritate

- Realtime are profiluri de meci generice, validate pentru 2–8 participanți;
  Duo rămâne profil compatibil, iar Clasic public acceptă lobby-uri 4–8.
- Cozile Redis sunt separate după mod și dimensiune; există test E2E cu patru
  clienți. FFA păstrează răspunsurile până la deadline și rezolvă runda atomic;
  Duo poate închide mai devreme după răspunsul ambilor jucători.
- API-ul poate persista 2–8 participanți. Clasic are momentan `eloDelta=0`;
  rank-ul FFA bazat pe plasament rămâne corect în Faza 3.
- Acest subtask nu bifează încă motorul FFA complet: lipsesc modelul teritorial,
  plasamentul și UI-ul Clasic.

### Verificări și stare DB locală

- Migrarea Prisma locală: aplicată curat.
- Seed taxonomy: 13 rădăcini + 56 subcategorii = 69 noduri, verificare validă;
  20 categorii au cod stabil.
- Seed întrebări: aplicat 60, iar reluarea dry-run raportează `60 unchanged`.
- DB locală: 62 întrebări `AI/PENDING` (cele 60 noi + 2 preexistente) și 14
  `CURATED/APPROVED`; lotul nou acoperă 20 de categorii distincte.
- API: 11 suite / 69 teste trecute; build Nest trecut.
- Realtime: 3 suite unitare / 14 teste și 3 suite E2E / 6 teste trecute;
  build Nest trecut.
- `git diff --check`: trecut. Nu s-a făcut deploy pe VPS, commit sau push.
- Fișierul preexistent `mobile/assets/questions/istorie.json` a rămas neatins.

### Checklist

- Nu s-a bifat un criteriu nou din `init.md`: lotul de ~5.000 și bootstrap-ul
  rămân incomplete.
- În `passed.md` a fost adăugată verificarea factuală obligatorie a celor 60 de
  întrebări înainte de orice aprobare.

### Următorul pas concret

Revizuiește factual lotul de 60 în tranșe pe categorie, adaugă sursa de
verificare și promovează individual numai întrebările confirmate la
`APPROVED`. După această cerere de conținut, reia motorul generic Faza 2 cu
modelul de plasament/teritorii Clasic și UI-ul de selectare a lobby-ului; nu
trece la Faza 3.

## 2026-08-15 — Codex (20 pachete mobile × 50 întrebări)

### Obiectiv

Crearea în `mobile/assets/questions/` a tuturor celor 20 de categorii cerute de
proprietar, cu minimum 50 de întrebări și răspunsuri pentru fiecare categorie,
fără a introduce automat conținut nerevizuit în gameplay.

### Implementare

- Au fost create exact 20 de fișiere JSON: `geography`, `history`, `science`,
  `wars`, `gaming`, `movies`, `music`, `sports`, `general-knowledge`,
  `technology`, `mythology`, `animals`, `space`, `literature`, `art`, `cars`,
  `logic`, `economy`, `medieval` și `royal-challenge`.
- Fiecare fișier conține exact 50 de întrebări în română, cu patru variante,
  răspuns corect, explicație și dificultăți distribuite între 1 și 5: 1.000 de
  întrebări în total.
- Toate pachetele declară onest `source=ai` și `reviewStatus=pending`. Nu au fost
  conectate la `RealmChapter.all`, campania offline sau rotația API; înainte de
  folosire este obligatorie verificarea factuală pe categorie.
- `mobile/lib/data/pack/owner_question_pack_catalog.dart` definește catalogul
  stabil al celor 20 de pachete și căile lor de asset.
- `mobile/tool/generate_owner_question_packs.dart` regenerează determinist lotul
  și refuză o categorie care nu poate produce 50 de întrebări valide.
- `mobile/test/data/owner_question_packs_test.dart` validează numărul exact de
  categorii și întrebări, unicitatea globală a celor 1.000 de ID-uri și texte,
  răspunsurile, explicațiile, variantele și acoperirea dificultăților.
- Fișierele vechi cu denumiri românești nu au fost suprascrise; în particular,
  modificarea preexistentă din `istorie.json` a rămas la 250 de întrebări.
- `passed.md` consemnează explicit revizuirea factuală obligatorie a noului lot.

### Verificări

- Test țintit pachete: trecut (20 × 50, total 1.000).
- `flutter test`: 113/113 teste trecute.
- `flutter analyze`: fără probleme.
- `flutter build apk --debug`: trecut; artefactul este
  `mobile/build/app/outputs/flutter-apk/app-debug.apk`.
- Nu s-a făcut deploy pe VPS, nu s-a șters sau modificat vreun container și nu
  s-a făcut commit ori push GitHub în această sesiune.

### Checklist și următorul pas

- Nu s-a bifat un criteriu nou din `init.md`: conținutul este complet structural,
  dar rămâne nerevizuit factual și nu echivalează cu lotul online de aproximativ
  5.000 de întrebări cerut pentru bootstrap.
- Următorul pas concret este revizuirea factuală, categorie cu categorie,
  începând cu `geography.json`; după aprobarea explicită se poate proiecta
  integrarea acestor pachete în selectorul de categorii conform `owner-plan.md`.

## 2026-08-15 — Claude

### Obiectiv

Finalizarea §1 din `owner-plan.md` (livrare reală de email) și implementarea §2
(chat cu trepte de încredere, prietenii, blocare, raportare).

### Implementare §1 — încheiat

- Email real prin **Resend** (`MAIL_TRANSPORT=resend`), API HTTP, fără
  dependență nouă. Cheia și expeditorul vin din mediu; domeniul verificat în
  contul Resend este `mail.dohotstudio.com`, deci `MAIL_FROM` trebuie să fie pe
  el. Eșecul de livrare **nu** se propagă la înregistrare și la cererea de
  resetare — un 5xx doar pentru adresele existente ar fi un oracol de enumerare.
- Două pagini HTML servite de API pentru linkurile din email
  (`GET /auth/verify-email`, `GET|POST /auth/reset-password`). Fără ele, linkul
  deschis în browser arăta ca o eroare.
- `canPlayRanked` se aplică acum la intrarea în coadă, în `backend/realtime`,
  cu citire proaspătă din `GET /users/internal/:id/capabilities`. Refuzul vine
  ca `matchmaking:rejected`; aplicația oferă retrimiterea linkului.
- Verificat în producție: înregistrare → email `delivered` (confirmat prin API-ul
  Resend), resetare parolă → `delivered`, paginile răspund 200 `text/html`.
  Contul de test a fost șters din baza de pe VPS.

### Implementare §2 — API + aplicație

- Model de date: `friendships` (pereche normalizată), `user_blocks`
  (direcțional, separat — vezi ADR 0010), `conversations`,
  `conversation_participants`, `messages`, `chat_reports`,
  `user_privacy_settings`, plus `users.correct_answers` și
  `users.chat_muted_until`. Migrare
  `20260815200000_chat_friendships_and_trust`.
- Nouă trepte de încredere calculate server-side din răspunsuri corecte
  cumulate; pragurile stau într-un singur loc și se expun prin `GET /chat/trust`.
- Filtru de limbaj (RO+EN, cu normalizare de diacritice/„leet”/litere repetate),
  detecție de spam cu mut automat de 10 minute, raportare cu copie a
  conținutului, blocare valabilă în ambele sensuri.
- Chat global efemer în Redis (100 mesaje, TTL 24 h), livrare cu excluderea
  perechilor blocate; conversații persistente prin API.
- Aplicație: ecran `/social` (prieteni, cereri, conversații, cereri de mesaj),
  ecran de conversație, card de treaptă cu progres, setare de confidențialitate
  DM, intrare nouă în meniul principal.

### Fișiere schimbate de Claude

- `backend/api/src/mail/*`, `src/auth/auth-pages.controller.ts`,
  `src/auth/auth.service.ts`, `src/auth/auth.module.ts`
- `backend/api/src/chat/*`, `src/social/*`, `src/users/users-internal.controller.ts`,
  `src/users/users.service.ts`, `src/users/users.module.ts`, `src/app.module.ts`
- `backend/api/prisma/schema.prisma` + migrarea nouă
- `backend/api/src/matches/matches.service.ts` și `dto/record-match.dto.ts`
  (câmpul `correctAnswers`, implicit `0`)
- `backend/realtime/src/chat/chat.service.ts`, `chat.gateway.ts`,
  `presence.service.ts`, `chat.module.ts`, `api-client.service.ts`
- `backend/realtime/EVENTS.md` (secțiunile `chat:global:*`, `chat:send`,
  `chat:message`, `friends:presence`)
- `mobile/lib/domain/social/*`, `data/social/*`, `features/social/*`,
  `core/network/api_client.dart` (PATCH/DELETE), `core/providers/`,
  `core/router/`, `features/title/title_screen.dart`, ARB-urile RO/EN
- `docs/adr/0008-identity-and-sessions.md` (actualizat),
  `docs/adr/0010-chat-friendships-and-trust-tiers.md` (nou), `init.md`

### Verificări

- API: 69 unit + 39 e2e (din care 17 noi pe chat/prietenii), lint curat.
- Flutter: `analyze` curat pe `lib/`, **113 teste** trecute (6 noi pe ecranul
  social).
- Realtime: typecheck curat, 14/14 unit. La e2e rămâne
  `generic-match.e2e-spec.ts` roșu — fișierul și motorul din spatele lui sunt
  ale lui Codex, în curs de refactorizare; `duo` și `reconnect` trec.
- Lint API: 3 erori rămase, toate în `src/matches/matches.service.spec.ts`
  (fișier nou al lui Codex, netrimis încă în Git).
- **Producție**: stiva reconstruită pe VPS fără a atinge alte containere
  (`alvenqis-*`, `sharedhouse-*`, `vaultwarden` intacte). Verificat pe domeniul
  public: `/health` 200, `/chat/trust` și `/friends` 401 fără token, tabelele noi
  există. Flux real cu două conturi: cerere → acceptare → conversație → mesaj,
  profanitate mascată (`esti un ***** dar respect`), link refuzat la T0 (403),
  DM către necunoscut refuzat la T0 cu mesaj explicit, blocare 204 și refuz
  reciproc ulterior. Conturile de test au fost șterse din baza de producție.
- **Aplicație pe telefon**: APK release `1.4.0+2007` (86,7 MB) construit cu
  endpoint-urile publice și instalat pe `SM-S938B`; pornește fără excepții,
  ecranul social se deschide și detectează corect lipsa sesiunii.

### Coliziuni cu Codex și ce NU am atins

Codex lucra **în paralel, în același working tree**, pe motorul de joc. Am
constatat direct: `backend/realtime/src/game/game.service.ts` și
`test/reconnect.e2e-spec.ts` s-au schimbat sub mine în timpul unei sesiuni de
depanare, iar instrumentarea mea temporară a fost suprascrisă. **Nu am modificat
`backend/realtime/src/game/*`, testele lui, `mobile/lib/features/duel/*` și nici
`mobile/lib/core/network/realtime_client.dart`.** Eșecurile e2e pe care le-am
văzut în `duo`/`reconnect`/`generic-match` erau stări intermediare ale
refactorizării lui, nu regresii ale acestui lot — rămân în sarcina lui.

### Blocaj asumat

Livrarea prin socket a mesajelor directe în aplicație nu e legată, pentru că
`realtime_client.dart` era în curs de modificare de către Codex. Serverul emite
deja `chat:message` și `friends:presence`, documentate în `EVENTS.md`. Ca soluție
intermediară, ecranul de conversație reîmprospătează firul la 4 secunde cât e
deschis. Este marcat explicit în cod și în ADR 0010.

### Următorul pas concret

1. Legarea `chat:message` și `friends:presence` în `realtime_client.dart`, după
   ce Codex termină pe fișierul acela, și eliminarea reîmprospătării periodice.
2. Ecran pentru completarea datei de naștere la conturile create înainte de age
   gate (`PATCH /users/me/birth-date` există deja). Fără el, conturile vechi —
   inclusiv al proprietarului — sunt tratate ca minori și n-au chat global.

---

## 2026-08-16 — Claude — Sistem de design reconstruit din capturi; Acasă și Setări

**Sursa de adevăr:** cele 10 PNG-uri din `design-reference/`. Cerința
proprietarului e reconstrucție fidelă, nu reinterpretare creativă, cu Flutter
păstrat ca implementare de producție (SuperDesign doar ca strat de design).

### Fazele 1–4 (analiză, sistem de design, SuperDesign)

- Capturile au fost redenumite canonic (`01-home-main.png` … `10-duel-live.png`).
- `docs/design-system.md`: tokenii au fost **măsurați** din imagini cu scripturi
  de eșantionare, nu aleși din ochi. Două valori contrazic implementarea veche:
  auriul real e `#C9A45C` (metalic), nu `#F0B542`; fundalul e `#010C1A`
  (bleumarin), nu `#080B1C` (violet).
- Constatarea structurală care ține tot sistemul: **panourile nu se disting prin
  umplutură** (aproape identică cu fundalul), ci prin **ramă**. De aceea
  `GoldFrame` desenează fir exterior + corp în degradeu + ornamente în toate
  cele patru colțuri, nu un `Border.all`.
- `mobile/lib/core/design/quizrealm_tokens.dart`: cele 8 grupuri cerute.
  **Regulă: niciun ecran nu-și mai definește culori, spațieri sau raze proprii.**
- SuperDesign: proiect `8344de87-c6b2-4936-a1eb-8462912c6534`, canvas la
  `superdesign.dev/teams/ae2d44a7-…/projects/8344de87-…`. Am folosit
  `import-design-draft` (HTML scris de mână, fără generare AI și fără credite),
  plus o buclă de comparație cu Playwright față de captura de referință.

### Componente noi în `lib/core/design/`

`GoldFrame`, `FantasyPanel`, `PanelRow`, `QuizRealmScaffold`, `QuizRealmTopBar`,
`DiamondDivider`, `QuizRealmBottomNavigation`, `PlayerAvatar`, `AvatarWithLevel`,
`LevelBadge`, `XpProgressBar`, `CurrencyCounter`, `PlayerIdentityHeader`,
`SectionHeader`, `TitledPanel`, `PrimaryGameButton`, `SecondaryGameButton`,
`GameModeCard`, `RewardBadge`, `StatLine`, `GameToggle`, `GameSlider`,
`GameTabBar`, `GameSearchField`, `SettingsRow`.

Iconografia trece prin `GameSymbol`, nu prin Material: siluetele Material sunt
subțiri și rup unitatea cu restul interfeței. `FantasyPanel` a fost schimbat din
`IconData` în `GameSymbol` tocmai ca regula să nu poată fi ocolită din greșeală.

### Ecrane livrate

1. **Acasă** (`features/title/title_screen.dart`) — rescris ca tablou de bord
   după captura 02: antet de identitate, patru cartonașe de mod, progres recent,
   „Regatul tău", ținuturile, bara de jos.
2. **Setări** (`features/settings/`) — ecran nou, rută `/setari`, cu stare reală:
   `AppSettings` + `SettingsStore` (SharedPreferences) + `SettingsController`.
   Limba nu mai e fixată în `app.dart`; comutatorul chiar schimbă locale-ul.

### Verificare vizuală, nu presupusă

Am adăugat două teste-captură (`test/features/*_golden_test.dart`) care încarcă
fontul real prin `tester.runAsync` — fără el, I/O real nu se rezolvă în zona de
timp simulat și testul **atârnă** în loc să cadă. Comparând captura generată cu
referința am găsit și corectat: titlurile de mod și etichetele barei de jos se
tăiau („MULTIP…", „CLASAMEN…"), o iconiță Material scăpase într-un antet de
panou, iar jumătatea de jos a ecranului rămânea goală.

### Ce NU am inventat

Capturile arată misiuni zilnice, pass sezonier, cristale, putere și resurse pe
oră — **niciuna n-are sursă de date**. Nu le-am desenat cu valori false; sunt
trecute în `ASSET_GAPS.md`, secțiunea nouă „Goluri de date", cu trimitere la
locul din `owner-plan.md` unde sunt planificate. Din același motiv lipsește
comutatorul de temă: aplicația are o singură temă implementată.

### Stare

- `flutter analyze lib/`: curat.
- `flutter test`: 111 trec, 4 cad — toate în `test/data/` pe pachetele de
  întrebări, din migrarea în curs la cele 20 de categorii (`arte.json` șters,
  `art.json` adăugat, iar `RealmChapter` încă trimite la numele vechi). Nu e
  lotul acesta și nu l-am atins: întrebările sunt ale proprietarului, pachetele
  sunt la Codex.
- Rămân de reconstruit: Chat (05, 06), Campanie (07), Clasament (08),
  Multiplayer (09), Duel live (10). Selecția de categorii per meci e gata pe
  server și așteaptă ecranul de Multiplayer ca să primească interfață.

---

## 2026-08-16 (II) — Claude — Întrebările noi în joc, emulator, divergență de structură

### Ce am găsit

Catalogul celor 20 de categorii (`owner_question_pack_catalog.dart`) era **cod
mort**: pachetele intrau în APK, dar niciun ecran nu le folosea. Campania juca
doar pachetele românești vechi. Între timp proprietarul a **șters** toate
pachetele vechi (`istorie.json`, `romania.json`, `geografie.json`, …), deci două
ținuturi trimiteau la fișiere inexistente — jocul ar fi crăpat acolo.

### Ce am făcut

- Am repointat cele 9 ținuturi pe pachetele de categorii (istorie→history,
  arte→art, mituri→mythology etc.). **Identificatorii ținuturilor rămân cei
  vechi**: cheia de progres salvată e `<chapterId>/<etapă>`, iar redenumirea ar
  fi șters în tăcere progresul jucătorilor.
- `CategoryRoundSource` (nou): compune o rundă din mai multe categorii, cu
  **deduplicare**. „Cultură Generală" reia intenționat 114 întrebări din
  literatură/istorie/geografie; fără filtru, o rundă pe două categorii bifate ar
  fi pus aceeași întrebare de două ori. Zero duplicate *în interiorul* unui
  pachet — conținutul e curat.
- Testele de pachete erau lipite de lotul inițial (exact 50/pachet, 1000 total,
  `source: ai`). Le-am rescris pe invarianți care rezistă la creștere: id-uri
  unice global, texte unice în pachet, 4 variante distincte, explicație
  prezentă, dificultăți 1–5. Tipul `numeric` (645 întrebări) e valid și acceptat.
- Terminologie `owner-plan.md` §7.3: „Nivel de cont", nu „Nivel".

### Emulator

Nu exista niciunul. Am instalat `system-images;android-36;google_apis;x86_64` și
am creat AVD-ul `quizrealm`. Pe el am găsit și corectat două defecte reale:
`Flexible` are implicit `flex: 1`, deci antetul rezerva jumătate de rând gol și
împingea butonul de meniu în mijlocul ecranului; iar descrierile cartonașelor se
tăiau la jumătate de frază. Emulatorul e instabil cu `swiftshader_indirect` —
moare după câteva minute.

### Divergență de structură — cere decizia proprietarului

`docs/structura-joc.md` (nou). Pe scurt: `owner-plan.md` §7.3 spune că jocul
**nu are și nu va avea campanie de nivele secvențiale**, dar aplicația e
construită exact așa (9 ținuturi, stele, deblocare), iar multiplayer-ul — miezul
după `plan.md` §0 — e subțire. În același timp, capturile de design **aprobate**
conțin „Campanie" ca mod. Cele două nu pot fi ambele adevărate. Nu am retras
nimic din campanie; am propus trei variante, cu recomandare pentru compromisul
„Antrenament pe categorii" (sancționat de `plan.md` §6).

### Stare

- `flutter analyze`: curat. `flutter test`: **119 trec, 0 cad**.
- 20 de pachete, **6.485 întrebări**. `sports`, `technology`, `wars` sunt încă la
  50 — proprietarul mai lucrează la ele.
- Interfața de selecție a categoriilor per meci încă lipsește; stratul de date
  (`CategoryRoundSource`) și serverul (`agreeOnCategories`) sunt gata.

---

## 2026-08-16 (III) — Claude — Opțiunea C: Antrenament pe categorii

Proprietarul a ales **varianta C** din `docs/structura-joc.md`: campania
secvențială e înlocuită cu „Antrenament pe categorii", cu progres vizibil, fără
hartă de nivele. Rezolvă contradicția dintre `owner-plan.md` §7.3 (fără campanie
secvențială) și capturile aprobate (care cereau progres solo).

### Livrat

- `domain/training/category_progress.dart` — progres per categorie, cu trepte de
  măiestrie (bronz 25 / argint 100 / aur 250 **răspunsuri corecte**, nu runde
  jucate: altfel s-ar putea acumula răspunzând la întâmplare).
- `data/training/category_progress_store.dart` — persistență.
- `features/training/` — controller, ecran de selecție (toate cele 20 de
  categorii, bifare multiplă, lungime scurtă/medie/lungă), ecran de rundă.
- `core/design/quiz_widgets.dart` — `QuizQuestionCard`, `QuizAnswerButton`,
  `MatchProgressBar` (cerute în specificația de design). Răspunsul corect/greșit
  are **și** iconiță, nu doar culoare — verde/roșu singur e inaccesibil.
- Rute `/antrenament` și `/antrenament/runda`; fila „Campanie" și cartonașul de
  pe ecranul principal duc acum la antrenament.
- Etichetele categoriilor trec prin i18n (ro+en), nu prin numele din fișierele
  de pachet: fișierele sunt scrise în română.

### Decizii de reținut

- **Nicio categorie nu se deblochează prin alta.** §7.3 interzice progresul
  secvențial prin conținut, iar `plan.md` §6 cere antrenamentul pentru onboarding
  și testarea băncii — o poartă l-ar contrazice. Progresul se vede ca măiestrie.
- `BattleStage` a primit `secondsOverride`; antrenamentul folosește 30s, nu 9-15s
  ca asalturile. `plan.md` §6 spune „mod **fără presiune**".
- `BattleController` a fost **refolosit** neschimbat — aceeași logică de joc.
- Progresul pe categorii se scrie din ecran, nu din `onFinished`: doar ecranul
  știe din ce categorie a venit fiecare întrebare.

### Verificat pe emulator (AVD `quizrealm`)

Selecția celor 20 de categorii, pornirea rundei, o întrebare reală din
`science.json` cu explicație și dezvăluirea răspunsului corect. Iconițele de
categorie existau deja în `assets/game/icons/quiz-categories/`.

### Stare

`flutter analyze` curat, `flutter test` **119/119**. Ecranul vechi de hartă
(`/harta`) și campania rămân în cod, nescoase din uz — pot deveni tabla modului
Clasic (`plan.md` §6), conform recomandării din `docs/structura-joc.md`.

---

## 2026-08-16 (IV) — Claude — Efectele înapoi; release pe telefon

Proprietarul a semnalat că trecerea la `QuizRealmScaffold` a **scos** efectele și
animațiile din joc. Avea dreptate: scaffold-ul nou punea un gradient static în
locul lui `RealmBackdrop` (cer animat, aurore, praf de stele), iar ecranele noi
n-aveau nicio animație de intrare.

### Reparat

- `QuizRealmScaffold` folosește din nou `RealmBackdrop`, cu `backdropAccent` per
  ecran, ca secțiunile să nu arate toate la fel.
- `core/design/entrance.dart` (nou): `EntranceFade`, helperul `staggered()`,
  `PulseGlow`, `ShakeOnChange`.
- Ecranul principal și selecția de categorii intră decalat (55 ms/element —
  peste ~70 ms, un ecran cu șase panouri se lasă așteptat).
- Butonul principal *emphasized* pulsează; doar el, altfel nimic n-ar mai ieși
  în evidență.
- La răspuns greșit sau timp expirat, cardul întrebării se scutură. La răspuns
  corect **nu** — e semnal, nu decor.

### Bug real prins de teste

`EntranceFade` folosea `Future.delayed`, care supraviețuiește widget-ului: la
ieșirea rapidă dintr-un ecran rămâneau zeci de temporizatoare care se trezeau pe
un arbore distrus. Înlocuit cu `Timer` anulat în `dispose`.

### Livrat pe telefon

APK **release** construit cu endpointurile de producție
(`quizrealmapi` / `quizrealmws.dohotstudio.com`), instalat pe `SM-S938B`.
Verificat pe dispozitiv cu contul real: profil „Andrei", 1085/1200 XP, 18/27
teritorii, 33/81 stele, toate ecranele se desenează.

### Stare

`flutter analyze` curat, `flutter test` **119/119**.

### Ce urmează din owner-plan.md (neînceput)

Turul acesta a mers pe design și pe livrarea pe telefon. Rămân, în ordinea din
`plan.md` §6 și `docs/structura-joc.md`: ecranul de moduri („Joacă" → Clasic /
Blitz / Duo / Privată), selecția de categorii în matchmaking (serverul e gata cu
`agreeOnCategories`), modul Clasic cu harta ca tablă de meci.

---

## 2026-08-16 (V) — Claude — Ecranul „Joacă" și categoriile în matchmaking

### Golul închis

Serverul accepta de mult `mode` și `categoryCodes` în `matchmaking:join`, dar
clientul trimitea `{'mode': 'duo'}` **hardcodat**, fără categorii. Munca de pe
server (`agreeOnCategories`, preferințe în Redis) era inaccesibilă din aplicație.

### Livrat

- `domain/duel/match_preferences.dart` — `MatchMode` (duo/classic) cu `wireValue`
  separat de `name`, ca o redenumire în Dart să nu rupă tăcut contractul de rețea;
  `MatchPreferences` cu serializare în parametri de rută.
- `RealtimeClient.joinQueue(preferences)` — categoriile lipsesc din mesaj când
  lista e goală, pentru că pe server absența preferinței înseamnă „accept orice".
- `DuelController.start(preferences)` — preferințele se rețin, fiindcă intrarea în
  coadă are loc abia la confirmarea sesiunii, nu la apăsarea butonului.
- `features/play/play_setup_screen.dart` — rută `/joaca`: mod, număr de jucători
  (doar la Clasic), grilă de categorii, buton „Caută meci".
- `features/categories/category_picker_grid.dart` — grila de categorii extrasă și
  folosită **și** la antrenament, **și** la meci; înainte era duplicată.
- Bara de jos: a patra filă alternează Clasament ↔ Multiplayer, ca în capturi.

### Decizii

- Enumerarea are doar `duo` și `classic`, deși `plan.md` §6 listează și Blitz și
  Partidă privată: serverul nu le are, iar un buton care trimite un mod refuzat
  ar fi o promisiune falsă.
- Sub grilă apare explicit că serverul folosește **intersecția** preferințelor
  celor doi jucători, cu revenire la „toate" — altfel jucătorul ar crede că
  meciul i-a ignorat bifele.

### Teste

Două teste noi verifică exact ce conta: modul și categoriile alese ajung la
server, iar lipsa preferințelor înseamnă duel pe toate categoriile. Fără ele,
ecranul de pregătire ar fi putut rămâne decor.

`flutter analyze` curat, `flutter test` **121/121**. APK release instalat pe
`SM-S938B` și verificat pe dispozitiv.

### Rămâne

Modul Clasic propriu-zis (harta ca tablă de meci, `plan.md` §6 + §7) și
ecranele care încă folosesc stilul vechi: chat, clasament, duel, cont.

---

## 2026-08-16 (VI) — Claude — Constrângerile reale ale modului Clasic

### Bug propriu, prins la verificarea serverului

Ecranul „Joacă" oferea 2/4/6/8 jucători la Clasic, dar `publicMatchProfile` din
`backend/realtime/src/game/match-profile.ts` **respinge orice sub 4**. Un meci
pornit cu 2 ar fi fost refuzat, iar jucătorul ar fi văzut o eroare fără motiv.
Corectat: `MatchPreferences.classicPlayerCounts = [4, 6, 8]`, cu test care leagă
lista de regula de pe server.

### Clasic e vizibil, dar nu selectabil — deliberat

Serverul suportă Clasic (profil propriu, `resolutionPolicy: 'deadline'`, 4-8
jucători). **Clientul nu.** `DuelState` are `myPoints`/`opponentPoints` și
`opponentId` — un singur adversar, ales cu `playerIds.firstWhere(...)`. Într-o
partidă de patru, ecranul ar arăta unul din trei adversari și ar ascunde restul.

Am marcat modul „În pregătire" în loc să-l las selectabil: datele tuturor
jucătorilor **există deja** în `lastResult.players`, deci lipsa e strict de
prezentare, dar un meci care arată greșit e mai rău decât unul care lipsește.

**Următorul pas real pentru Clasic:** înlocuirea perechii
`myPoints`/`opponentPoints` cu un clasament per jucător în `DuelState` și un
`duel_scoreboard` care afișează N jucători. E o modificare a codului de duel
funcțional, deci cere atenție și teste, nu un patch rapid.

### Stare

`flutter analyze` curat, `flutter test` **126/126** (5 teste noi pe
`MatchPreferences`). APK release instalat pe `SM-S938B` și verificat: modul,
categoriile și fila de Multiplayer din bara de jos arată corect.

---

## 2026-08-16 (VII) — Claude — Clasament multi-jucător; modul Clasic deblocat

### Ce bloca Clasicul

`DuelState` reducea orice partidă la perechea „eu / adversar":
`myPoints`/`opponentPoints` și un `opponentId` ales cu
`playerIds.firstWhere(...)`. Într-o partidă de patru, doi jucători din trei
dispăreau din ecran, deși datele lor **soseau deja** în `lastResult.players`.

### Soluție — aditivă, fără a rescrie duelul

- `domain/duel/duel_standing.dart` — `DuelStanding` + `sortedStandings()`.
  Ordonare: puncte → teritorii → `userId`. Ultimul criteriu nu e decorativ:
  fără el, doi jucători la egalitate își schimbă locurile la fiecare
  redesenare. Lista rezultată e `List.unmodifiable`.
- `DuelState.standings` (nou), plus `isMultiplayer` și `myPosition`.
  `myPoints`/`opponentPoints` **rămân neatinse**, deci afișajul 1v1 existent
  funcționează exact ca înainte.
- Populat din `DuelRoundResult` și din instantaneul de reconectare (acolo se
  păstrează și `connected`, ca un jucător deconectat să se vadă în listă, nu să
  dispară).
- `features/duel/widgets/match_standings.dart` — clasament pentru N jucători,
  cu locul meu evidențiat și iconiță pentru cel deconectat. Ecranul de duel
  alege între față-în-față și clasament după `state.isMultiplayer`.
- Modul **Clasic e din nou selectabil** pe ecranul „Joacă".

### Teste (132 în total, toate trec)

`test/domain/duel_standing_test.dart` — ordonare, stabilitate la egalitate,
păstrarea tuturor celor 8 jucători, imutabilitate.
`duel_controller_test.dart` — o partidă de patru păstrează tot clasamentul și
calculează corect `myPosition`; un duel obișnuit **nu** e tratat ca multi-jucător.

### Stare

`flutter analyze` curat. APK release instalat pe `SM-S938B`; verificat pe
dispozitiv: Clasic selectabil, numărul de jucători 4/6/8, categoriile vizibile.

### Rămâne

Harta ca tablă de meci pentru Clasic (`plan.md` §6-§7) — clasamentul e acum
corect, dar cucerirea de teritorii se vede doar ca număr, nu pe hartă.
Ecranele chat, clasament, cont încă folosesc stilul vechi.

---

## 2026-08-16 (VIII) — Claude — Modelul de teritorii (fundația modului Clasic)

### Constatarea care a schimbat abordarea

Serverul trimite doar `territoriesWon` — un **număr**, nu identitatea
teritoriilor. Nu există noțiunea de hartă nicăieri în `backend/realtime`. Deci
harta ca tablă de meci nu era o problemă de client: aș fi inventat cine ce
deține, exact ce n-am voie.

### Livrat: `backend/realtime/src/game/territory-map.ts`

Modul **pur**, fără stare, fără ceas, fără Redis. Generează harta pe server;
clientul n-o calculează niciodată singur — două calcule independente ar putea
diverge, iar doi jucători ar vedea hărți diferite ale aceleiași partide.

- Grilă hexagonală în coordonate axiale, generată în spirală (conexă și compactă;
  generarea pe rânduri ar lăsa margini unde jucătorii n-ar avea ce ataca).
- Adiacență explicită și **reciprocă**, cerută de §12.2 pentru faza de atac.
- Sursă de aleator injectabilă ⇒ hartă reproductibilă dintr-o sămânță. Fără asta,
  un bug de poziționare n-ar putea fi reprodus.

### Două lucruri învățate din eșecuri de test, nu din presupuneri

1. **Aserțiune inventată de mine.** Primul test cerea `teritorii >= jucători * 6`
   — o formulă pe care o scrisesem eu, nu din plan. Înlocuită cu intervalele
   reale din §12.2.
2. **Defect real de algoritm.** Alegerea lacomă „cel mai depărtat teritoriu"
   împrăștia bazele spre margine și rămânea fără locuri neadiacente, așa că baze
   ale unor jucători diferiți ajungeau lipite — partida s-ar fi decis în prima
   rundă. Reparat prin construcție: bazele se aleg dintr-o **subrețea** de celule
   cu același `(q + 2r) mod 3`, care nu pot fi vecine, pentru că orice pas către
   un vecin schimbă restul cu ±1.

### Abatere conștientă de la plan

§12.2 dă numere marcate „orientativ". Le-am depășit (8 jucători: 54 în loc de
40-48) dintr-un motiv geometric măsurabil: subrețeaua fără vecini e exact o
treime din hartă, deci 16 baze cer minimum 48 de celule **fără nicio rezervă**.
Testul verifică acum pragul real (`teritorii >= baze * 3`), nu tabelul.

### Stare

`npx jest src/game`: **28/28 trec** (12 noi). Modulul nu e încă legat de motorul
de partidă — pasul următor e transportul hărții în `match:found`/snapshot și
apoi randarea ei în client.

---

## 2026-08-16 (IX) — Claude — Teritoriile intră în motorul de partidă

Continuare directă a modelului de hartă. Acum harta e parte din partidă, nu doar
un modul izolat.

### Livrat

- `territory-state.ts` (nou, pur, 12 teste): proprietatea asupra teritoriilor,
  faza partidei (`capture` → `battle` când nu mai e nimic liber), alegerea
  teritoriului contestat, teritoriile atacabile, eliminarea, numărătoarea.
  `claimTerritory` întoarce o **copie** — starea se serializează în Redis, iar
  mutațiile ascunse peste un obiect partajat produc stări imposibil de explicat.
- `MatchState.territory` — hartă + proprietate + teritoriul contestat.
  Generat la `createMatch` **doar pentru `classic`**; Duo rămâne neatins, cu
  contorul lui simplu. A-i inventa o hartă ar schimba un mod care funcționează.
- La rezolvarea rundei, câștigătorul primește **un teritoriu anume** de pe hartă,
  nu un increment. Contoarele `territoriesWon` se **recalculează din hartă**, nu
  se incrementează: harta e sursa de adevăr, iar o sumă ținută separat s-ar
  desincroniza tăcut.
- Transport: `round:result` primește `territory` (proprietate + teritoriul
  contestat următor); `match:snapshot` primește în plus `territoryMap` — harta
  întreagă. Harta merge **doar în snapshot**: e imuabilă, retrimiterea ei la
  fiecare rundă ar fi risipă. Documentat în `EVENTS.md`.

### Decizie de design

Teritoriul contestat se alege cu preferință pentru **granițele existente**. Fără
asta harta s-ar umple în pete rupte între ele, iar faza de luptă ar începe cu
jucători care n-au granițe comune și n-au pe cine ataca.

### Stare

`npx tsc --noEmit` curat. `npx jest` pe realtime: **44/44 trec**, inclusiv e2e.
Duo nu s-a schimbat în niciun test.

### Rămâne pentru Clasic

1. Faza de luptă (§12.3 faza 2): alegerea țintei, rezolvare simultană,
   departajare la atacuri multiple pe aceeași țintă.
2. Eliminare + mod spectator (§12.6).
3. Clientul: modelele Dart pentru hartă, randarea hexagonală și animația de
   cucerire (`plan.md` §7).

---

## 2026-08-16 (X) — Claude — Eliminare, spectator și tabla de joc în client

### Server: eliminare + mod spectator (§12.6)

- `elimination.ts` (nou, pur, 9 teste): `newlyEliminated` (nu elimină de două ori
  același jucător — ordinea decide locul final și o dublură ar falsifica-o),
  `finalPlacement`, `isSpectator`.
- Clasamentul final: supraviețuitorii după teritorii → scor → departajare
  stabilă; eliminații după ei, în **ordine inversă a eliminării**. Cine rezistă
  mai mult primește un loc mai bun, ca la battle royale.
- `MatchState.eliminated` + `eliminatedUserIds` în `round:result`.
- **Refuzul e pe server**: un spectator care încearcă să răspundă primește
  `WsException`. Clientul poate ascunde butoanele, dar nu poate fi crezut pe
  cuvânt.

### Client: modele + tabla hexagonală

- `domain/duel/territory_map.dart` — `HexCoordinates`, `Territory`,
  `TerritoryMap`, `TerritoryOwnership`. Doar de citire: harta vine de la server.
  Un mesaj malformat dă o hartă goală, nu o excepție în mijlocul partidei.
- `TerritoryOwnership.changedSince()` — exact teritoriile care și-au schimbat
  stăpânul. Animația se bazează pe lista asta; fără ea harta ar pâlpâi întreagă
  la fiecare rundă.
- `features/duel/widgets/territory_board.dart` — `CustomPainter` cu hexagoane
  „pointy-top", rază calculată din întinderea reală a hărții (o hartă de 8
  jucători are aproape dublul celulelor uneia de 4 și ar ieși din ecran cu o
  valoare fixă). Cucerirea curge în culoare cu halou care se stinge (`plan.md`
  §7); teritoriul contestat are contur auriu îngroșat.
- Culoarea mea e mereu albastrul regal, indiferent de ordinea din lobby — ca
  să-mi găsesc teritoriile dintr-o privire.

### Stare

Realtime: **53/53**. Mobil: **138/138**. `tsc --noEmit` și `flutter analyze`
curate.

### Rămâne pentru Clasic

1. Faza de luptă (§12.3 faza 2) — singura piesă de reguli care lipsește.
   Până la ea, eliminarea nu se poate declanșa în joc: în faza de capturare
   nimeni nu pierde teritorii.
2. Legarea `territory_board` în ecranul de duel (parsarea `territory` din
   `round:result` și `territoryMap` din snapshot în `RealtimeClient`).

---

## 2026-08-16 (XI) — Claude — Harta legată cap la cap în client

Ultima piesă de transport: harta ajunge de la server pe ecran.

- `RealtimeClient` parsează `territory` din `round:result` și `territoryMap` +
  `territory` din `match:state`. Harta vine **doar** în snapshot, fiind imuabilă.
- `DuelRoundResult` poartă `territory` și `eliminatedUserIds`;
  `DuelMatchSnapshot` poartă harta întreagă.
- `DuelState` ține `territoryMap`, `territory`, `spectatorUserIds` și expune
  `amSpectator`. Eliminații se acumulează între runde, nu se înlocuiesc.
- Ecranul de duel randează `TerritoryBoard` **doar** când serverul chiar a
  trimis hartă — la Duo nu apare nimic, iar modul existent rămâne identic.
- Ordinea culorilor vine din clasament, deci e stabilă pe toată partida.

### Stare

Mobil: **139/139**. Realtime: **53/53**. `flutter analyze` și `tsc --noEmit`
curate. APK release construit, dar **neinstalat**: telefonul s-a deconectat de la
laptop între build și install.

### Rămâne pentru Clasic

Faza de luptă (§12.3 faza 2) — ultima piesă de reguli. Până la ea, harta se umple
în faza de capturare și se oprește; nimeni nu pierde teritorii, deci eliminarea
și spectatorul (deja implementate și testate) nu se pot declanșa în joc.
