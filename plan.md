# PLAN.md — QuizRealm (working title)
> Joc mobil de cultură generală + strategie de cucerire teritorii, inspirat din conQUIZtador2, reconstruit modern, cross-platform, multiplayer online din MVP.

**Status:** Draft v1 — planificare inițială
**Autor:** Dohot Studio
**Ultima actualizare:** 2026-08-14

---

## 0. Decizii confirmate

| Decizie | Alegere |
|---|---|
| Scop MVP | **Multiplayer online chiar de la MVP** (nu doar solo) |
| Stack mobil | **Flutter** (Android + posibil iOS mai târziu, ca la house-share-app) |
| Strategie bancă de întrebări | **Hibrid: generare AI + verificare manuală** ȘI **crowdsourcing + AI + moderare** |
| Nume de lucru | `QuizRealm` — se schimbă ușor mai târziu, e doar cod intern de proiect |

---

## 1. Viziune

Un joc mobil în care jucătorii răspund la întrebări de cultură generală pentru a cuceri teritorii pe o hartă, într-un duel sau o partidă multiplayer, cu:

- **Interfață mult mai modernă** decât conQUIZtador2 (animații fluide, hartă interactivă cu transformare de teritorii live, temă dark/light, feedback vizual/haptic la fiecare răspuns).
- **Bancă de întrebări mult mai mare și mai variată** — nu 25.000 statice, ci un sistem viu care crește constant prin generare AI + contribuții din comunitate, cu moderare și scoring de calitate.
- **Multiplayer online real** din prima versiune publică, nu doar local/solo.

### Ce păstrăm din conQUIZtador2 (funcționează bine, nu reinventăm roata)
- Conceptul de bază: răspunzi corect → cucerești teritoriu pe hartă.
- Două tipuri de întrebări: **grilă** (4 variante, ~12s) și **răspuns rapid numeric** (~10s, câștigă cea mai apropiată estimare).
- Moduri: rapid (puține runde) vs lung (multe runde), duel 1v1, partide publice și private cu roboți.
- Sistem de clasamente (global + sezonier), progres, statistici, personalizări cosmetice (avataruri, rame, bannere, skinuri de hartă).
- Anti-cheat / fair-play cu analiză automată a partidelor.

### Ce îmbunătățim / diferențiem
1. **UI/UX modern nativ** — nu WebView, hartă cu tranziții animate, micro-interacțiuni, design system propriu (vezi secțiunea 7).
2. **Bancă de întrebări extensibilă** — pipeline hibrid AI + comunitate + moderare, cu tagging pe categorie/dificultate/limbă, versionare și feedback continuu (like/dislike ca la original, dar folosit activ pentru re-antrenare/filtrare).
3. **Multiplayer real-time robust din start** — matchmaking pe skill (ELO-like), reconectare la deconectare, camere private cu cod, roboți configurabili.
4. **Mai multe categorii + niveluri de dificultate adaptive** — nu doar cultură generală generică, ci categorii granulare (istorie RO, geografie, sport, știință, film/muzică, actualitate etc.) cu dificultate calibrată per jucător.
5. **Infrastructură self-hosted, sub controlul studioului** (aliniat cu preferința de a rula infrastructură proprie), nu dependent 100% de un vendor cloud închis.

---

## 2. Public țintă & platforme

- Platformă principală: **Android** (piață România + diaspora, unde conQUIZtador2 e popular).
- Flutter permite portare ulterioară pe **iOS** fără rescriere majoră — păstrăm codul cross-platform de la început chiar dacă lansăm întâi doar pe Android.
- Limbă principală: **română**, arhitectură i18n pregătită pentru extindere (engleză etc.) mai târziu.

---

## 3. Stack tehnic & arhitectură

### 3.1 Mobil — Flutter
- **Flutter (stable channel)** + **Dart**.
- State management: **Riverpod** (scalabil, testabil, potrivit pentru fluxuri realtime de tip "match state").
- Navigare: **go_router**.
- Realtime: **socket_io_client** sau **WebSocket** nativ (`web_socket_channel`) pentru conectare la backend-ul de matchmaking/joc.
- Randare hartă/teritorii: **CustomPainter + animații Flutter** (Rive sau Lottie pentru micro-animații de cucerire teritoriu; SVG pentru hărți vectoriale editabile).
- Local cache/persistență: **Isar** sau **Drift** (SQLite) pentru cache de întrebări, profil offline, istoricul partidelor.
- Auth: **email/parolă + OAuth (Google)**, token JWT stocat securizat (`flutter_secure_storage`).
- Notificări push: **Firebase Cloud Messaging** (singurul serviciu Google folosit, doar pentru push — restul self-hosted).

### 3.2 Backend — self-hosted
- Runtime: **Node.js + NestJS** (TypeScript) — echilibru bun între productivitate și structură pentru un sistem cu multe module (auth, întrebări, matchmaking, moderare).
  - Alternativă discutabilă: Go, dacă se dorește performanță maximă pe partea de realtime; NestJS rămâne recomandarea implicită pentru viteza de dezvoltare inițială.
- Realtime/matchmaking: **Socket.IO** (server) + un serviciu dedicat de **matchmaking** (coadă + scoring ELO simplu) rulat separat pentru scalabilitate.
- Bază de date principală: **PostgreSQL** (utilizatori, întrebări, partide, statistici, cosmetice).
- Cache & stare de joc live: **Redis** (sesiuni de partidă active, coada de matchmaking, leaderboard-uri cu Sorted Sets).
- Storage fișiere (avataruri, imagini întrebări): **MinIO** (S3-compatible, self-hosted) sau S3 real dacă preferi cloud pentru asta.
- Job-uri asincrone (generare AI de întrebări în batch, moderare, recalcul leaderboard): **BullMQ** (peste Redis).
- Containerizare: **Docker + docker-compose** pentru dev, opțional **k3s/Docker Swarm** pentru producție self-hosted.
- Observabilitate: **Prometheus + Grafana** + logging structurat (Pino), aliniat cu preferința pentru infrastructură proprie monitorizată.

### 3.3 Arhitectură pe scurt

```
[Flutter App] --HTTPS REST (auth, profil, catalog întrebări, magazin)--> [NestJS API]
[Flutter App] --WebSocket (Socket.IO)--> [Match/Realtime Service] --Redis-- [Matchmaking Queue]
[NestJS API] --> [PostgreSQL] (date persistente)
[Match Service] --> [Redis] (stare live partidă) --> la final partidă --> [PostgreSQL] (rezultate, XP, ELO)
[Question Pipeline Worker] --AI API + moderare--> [PostgreSQL: question_bank] --> expus prin [NestJS API]
```

Monorepo recomandat:
```
/mobile        -> aplicația Flutter
/backend
  /api         -> NestJS REST (auth, profil, întrebări, magazin, social)
  /realtime    -> serviciu Socket.IO dedicat pentru partide live
  /workers     -> job-uri (generare AI întrebări, moderare, recalcul leaderboard)
/infra         -> docker-compose, configurări Postgres/Redis/MinIO, migrări
/docs          -> plan.md, init.md, agents.md, ADR-uri
```

---

## 4. Modele de date (schema simplificată)

**users**: id, username, email, password_hash, avatar_id, frame_id, created_at, elo_rating, xp, level, coins.

**questions**: id, type (`multiple_choice` | `numeric`), category_id, difficulty (1-5), text, options[] (dacă multiple_choice), correct_answer, source (`ai` | `community` | `curated`), status (`pending` | `approved` | `rejected` | `flagged`), like_count, dislike_count, times_asked, times_correct, language, created_by (nullable, dacă e din comunitate), reviewed_by (nullable), created_at.

**categories**: id, name, parent_id (pentru subcategorii), icon.

**matches**: id, mode (`classic` | `blitz` | `duo` | `private`), status, map_id, started_at, ended_at.

**match_players**: match_id, user_id, territories_won, score, result (`win`|`loss`|`draw`), elo_delta.

**match_events**: match_id, round_number, question_id, player_id, answer_given, is_correct, response_time_ms, territory_affected.

**cosmetics**: id, type (`avatar`|`frame`|`banner`|`map_skin`), name, rarity, price_coins, price_gems.

**user_inventory**: user_id, cosmetic_id, equipped (bool), acquired_at.

**question_reports**: id, question_id, user_id, reason, created_at — folosit pentru feedback "nu-mi place"/raportare, alimentează coada de moderare.

### 4.1 Extensii sociale și de progresie

Modelele pentru prietenie și chat, achievements și badge-uri, profil/avatar,
trepte de rang și monetizare **nu se dublează aici**. Sunt definite în
[`owner-plan.md`](owner-plan.md)
(secțiunile 2.9, 3.5, 4.10, 5.4 și 9.7).

Stare actuală a implementării: treptele de rang sunt calculate din `users.elo_rating`
ca **configurație statică în cod** (`backend/api/src/ranks/rank-tiers.ts`), nu ca
tabele `rank_tiers` / `user_rank` — vezi `docs/adr/0006-rank-tiers-and-leaderboard.md`.
Sezoanele, meciurile de plasare și decay-ul vor cere migrare proprie, în Faza 4.

---

## 5. Bancă de întrebări — strategie hibridă (AI + comunitate)

Obiectiv: să depășim clar cele ~25.000 de întrebări ale conQUIZtador2, cu **calitate controlată**, nu doar volum.

### 5.1 Pipeline de generare AI (bulk, pentru a porni cu o bază solidă)
1. Definim un **taxonomy de categorii/subcategorii** (istorie, geografie, știință, sport, film/muzică, literatură, actualitate, România specific, etc.) și niveluri de dificultate 1-5.
2. Job (`workers/generate-questions`) apelează un model AI cu prompt structurat per categorie/dificultate, cerând output JSON strict (întrebare, tip, variante, răspuns corect, sursă/explicație scurtă pentru verificare).
3. Fiecare întrebare AI intră cu `status = pending` și trece printr-un **pas de verificare automată** (deduplicare prin similaritate text, verificare format, verificare că răspunsul corect există printre variante) + **verificare manuală eșantion** (nu 100%, ci sampling ponderat pe categorii sensibile — istorie, actualitate).
4. Țintă inițială recomandată: **50.000+ întrebări** generate AI pentru lansare (de 2x conQUIZtador2), extensibil continuu.

### 5.2 Crowdsourcing din comunitate
1. În aplicație, utilizatorii cu un nivel/reputație minimă pot **propune întrebări** (formular simplu: tip, text, variante, categorie, dificultate percepută).
2. Întrebările propuse intră în **coada de moderare** (status `pending`) — moderatori (echipă + eventual voluntari de încredere) aprobă/resping/editează.
3. Sistem de **reputație pentru contributori**: contribuții aprobate → XP/coins bonus, contribuții respinse repetat → limitare temporară a dreptului de a propune.
4. Feedback continuu în joc (👍/👎 ca la original) **alimentează automat** coada de revizuire: întrebări cu prea multe 👎 sau rată de "incorect" anormal de mare (posibil formulare ambiguă) sunt scoase automat din rotație până la revizuire.

### 5.3 Guvernanță calitate
- Fiecare întrebare are `times_asked` / `times_correct` — permite calcul dinamic de dificultate reală (nu doar cea estimată la creare).
- Categorii sensibile (politică, religie, evenimente recente controversate) primesc **reguli de moderare mai stricte** sau sunt excluse din setul implicit.
- Limbaj: pipeline pregătit pentru RO acum, extensibil la alte limbi ulterior fără schimbare de schemă.

---

## 6. Moduri de joc (v1)

| Mod | Descriere |
|---|---|
| **Clasic** | Hartă cu teritorii, runde multiple, atac/apărare pe bază de răspunsuri corecte — ca "Războiul Clasic" din original. |
| **Blitz** | Variantă rapidă, mai puține runde, timpi de răspuns mai scurți. |
| **Duo (1v1)** | Duel direct, matchmaking pe ELO. |
| **Partidă privată** | Cameră cu cod/link, poți completa cu roboți, poți alege categoriile (ca "Separeu"). |
| **Solo/Antrenament** *(secundar, nu blochează MVP-ul multiplayer)* | Mod fără presiune, util pentru onboarding și pentru testarea băncii de întrebări offline. |

---

## 7. UI/UX — design modern

- **Design system propriu**: paletă principală + un accent de brand distinct (evităm clona vizuală a competitorului), tipografie modernă, componente reutilizabile (butoane, carduri de întrebare, bara de progres a rundei).
- **Temă dark + light**, cu dark ca implicit (potrivit pentru sesiuni de joc seara/pauze).
- **Harta de cucerire**: animații fluide la schimbarea culorii unui teritoriu (nu instant, ci o tranziție "conquest" — folosind Rive/Lottie pentru senzație premium).
- **Feedback pe răspuns**: haptics + animație scurtă (corect = puls verde/expansiune teritoriu; greșit = shake scurt), cronometru circular vizual (nu doar text) pentru presiunea timpului.
- **Onboarding rapid**: primele 2 partide sunt tutorial ghidat + roboți, nu ecrane statice de explicații.
- **Ecran de profil/statistici**: grafice simple de progres (acuratețe pe categorie, evoluție ELO), nu doar numere brute.
- Se recomandă consultarea skill-ului `frontend-design` la implementare pentru alegeri de tipografie/culoare care nu arată "generic".

---

## 8. Multiplayer & matchmaking

- Coadă de matchmaking bazată pe **ELO simplu** (start 1000, ±K per rezultat), separată pe mod de joc.
- **Reconectare**: dacă un jucător pierde conexiunea, partida îi păstrează locul ~60-90s (stare ținută în Redis) înainte de a-l înlocui cu bot sau a declara abandon.
- **Roboți (boți)** cu 2-3 niveluri de dificultate, folosiți pentru: completarea camerelor private, înlocuirea jucătorilor deconectați, mod antrenament.
- **Anti-cheat de bază pentru MVP**: limitare rezonabilă a timpului de răspuns per client + validare server-side a răspunsului (clientul nu decide niciodată singur cine a câștigat teritoriul), plus logging de pattern-uri suspecte (acuratețe 100% cu timp de răspuns constant sub prag uman) pentru revizuire manuală ulterioară — sistem de detecție automată mai avansat rămâne pentru o fază post-MVP.

---

## 9. Monetizare (pregătit, nu neapărat activ din prima zi)

- **Cosmetice**: avataruri, rame, bannere, skinuri de hartă — monedă in-app câștigată prin joc + monedă premium cumpărată.
- **Battle pass sezonier** (opțional, fază 2) — aliniat cu clasamentele sezoniere.
- Fără pay-to-win: monetizarea nu afectează niciodată dificultatea întrebărilor sau șansele de câștig.

---

## 10. Roadmap pe faze

> **Extensie:** sistemele sociale și de progresie (login avansat, chat cu trepte de
> încredere, achievements 1000+, customizare profil, 20+ trepte de rang, retenție și
> monetizare extinsă) sunt detaliate în
> [`owner-plan.md`](owner-plan.md), cu maparea lor pe fazele de mai jos în
> secțiunea 16 a acelui document. Nu le dubla aici.

### Faza 0 — Fundație (Săpt. 1-3)
- Setup monorepo, infra docker-compose (Postgres, Redis, MinIO), schema DB inițială + migrări.
- Auth de bază (email/parolă + Google), profil utilizator minimal.
- Taxonomy categorii + primul batch de întrebări generate AI (~5.000) pentru testare internă.

### Faza 1 — Core gameplay solo (Săpt. 4-7)
- Flutter: ecran de întrebare (grilă + numeric), cronometru, scor.
- Mod antrenament/solo funcțional end-to-end (client + API de întrebări), fără realtime încă.
- Prima variantă de hartă/teritorii (statică, fără animații complexe încă).

### Faza 2 — Multiplayer MVP (Săpt. 8-13)
- Serviciu realtime (Socket.IO) + matchmaking Redis.
- Mod Duo 1v1 complet funcțional online, cu reconectare de bază.
- Sincronizare rezultate în Postgres, calcul ELO, leaderboard simplu.
- Partide private cu cod + roboți.

### Faza 3 — Conținut & calitate (Săpt. 14-17, în paralel cu Faza 2 pe partea de întrebări)
- Pipeline crowdsourcing (propunere întrebări din app + coadă moderare).
- Extindere bancă la 50.000+ întrebări, tagging fin pe dificultate reală (din date de joc).
- Sistem de raportare/feedback pe întrebări conectat la moderare.

### Faza 4 — Polish UI/UX & mod Clasic complet (Săpt. 18-22)
- Animații de cucerire teritoriu (Rive/Lottie), tema dark/light finală, design system finalizat.
- Mod Clasic (hartă multi-teritoriu, nu doar duel) + Blitz.
- Cosmetice + magazin in-app (fără plăți reale încă, doar cu monedă câștigată în joc).

### Faza 5 — Beta închisă & hardening (Săpt. 23-26)
- Testare cu grup restrâns, monitorizare (Grafana/Prometheus), fix bug-uri de scalabilitate matchmaking.
- Anti-cheat de bază, rate limiting API.
- Pregătire listare Google Play (assets, politici de confidențialitate, formular date colectate).

### Faza 6 — Lansare publică & post-lansare
- Lansare Android (Google Play).
- Monitorizare activă, iterare pe feedback, plan pentru monetizare reală (achiziții in-app) și extindere iOS.

---

## 11. Riscuri & mitigări

| Risc | Mitigare |
|---|---|
| Volum mare de întrebări AI de calitate slabă | Sampling de verificare manuală + feedback loop automat care scoate din rotație întrebările slabe |
| Complexitate realtime (matchmaking, reconectare) subestimată | Izolată în serviciu dedicat (`/backend/realtime`), dezvoltată și testată separat de API-ul REST |
| Similaritate vizuală/legală cu conQUIZtador2 | Design system și denumiri proprii de la zero; ne inspirăm din mecanică (care e un gen consacrat — Triviador, Territorial IO of trivia), nu copiem assets/branding |
| Scalare infra self-hosted la creștere de userbase | Arhitectură containerizată de la început (docker-compose → k3s), servicii separate pe orizontală (API, realtime, workers) |
| Moderare comunitate — spam/abuz | Reputație contributor + rate limiting pe propuneri + coadă de moderare obligatorie înainte de publicare |

---

## 12. Metrici de succes (post-lansare)

- Retenție D1/D7/D30.
- Timp mediu de matchmaking (target inițial < 15s pentru Duo).
- % întrebări cu rating pozitiv (👍) peste un prag, urmărit pe categorie.
- Rata de creștere organică a băncii de întrebări din crowdsourcing (nr. propuneri aprobate/săptămână).

---

## Fișiere conexe

- `init.md` — pașii de bootstrap ai repo-ului pentru un agent AI de coding.
- `agents.md` — reguli de lucru pentru agenți AI (Codex/Claude Code) care implementează acest plan.
