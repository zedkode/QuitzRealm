# AGENTS.md — Reguli pentru agenți AI de coding (QuizRealm)

> Acest fișier ghidează orice agent AI (Claude Code, Codex sau altul) care lucrează în acest repo. Se citește **înainte** de orice task de implementare, alături de `plan.md` (viziune + arhitectură) și `init.md` (bootstrap).

---

## 1. Sursele de adevăr

- `plan.md` = ce construim și de ce. Orice implementare trebuie să respecte deciziile de acolo (stack, schema de date, moduri de joc, faze).
- `init.md` = cum s-a pornit repo-ul. Structura de directoare definită acolo e obligatorie, nu se reorganizează fără un ADR care justifică schimbarea.
- Dacă un task pare să contrazică `plan.md`, agentul **nu improvizează** — semnalează conflictul în output și propune fie ajustarea planului, fie a task-ului, înainte de a scrie cod.

---

## 2. Format de lucru pe task-uri

- Fiecare task de implementare trebuie mapat la o fază din `plan.md` (secțiunea 10 — Roadmap). Nu se sare peste faze (ex: nu se implementează cosmetice/magazin înainte ca multiplayer-ul de bază din Faza 2 să fie funcțional).
- Task-urile mari se descompun în pași verificabili, fiecare cu un criteriu clar de "gata" (compilează, testele trec, endpoint-ul răspunde corect etc.) — în stilul checklist-urilor din `init.md`.
- La final de task, agentul rulează build/test local relevant înainte de a raporta task-ul ca terminat.

---

## 3. Convenții per componentă

### `mobile/` (Flutter)
- State management: **Riverpod** peste tot — nu amesteca cu Provider/BLoC în același modul.
- Un `feature/` = un domeniu funcțional (auth, question, match, profile, shop, leaderboard); nu pune logică de business în widget-uri — widget-urile citesc din providers.
- Toate apelurile de rețea (REST + WebSocket) trec prin `core/` (client HTTP/WS centralizat), niciun feature nu instanțiază propriul client HTTP.
- Text vizibil în UI: română ca limbă implicită, dar **toate string-urile trec prin sistemul de i18n** de la început (nu hardcoda text în widget), ca să nu coste o rescriere la extinderea pe alte limbi.
- Animațiile de cucerire teritoriu (Rive/Lottie) sunt izolate în widget-uri dedicate, ușor de înlocuit fără a atinge logica de joc.

### `backend/api` (NestJS)
- Un modul NestJS per domeniu (`auth`, `users`, `questions`, `categories`, `matches`, `cosmetics`, `reports`) — fără module "god object".
- Toată validarea de input la marginea API-ului (DTOs cu class-validator sau echivalent) — nu avea încredere în date venite din client, nici din serviciul `realtime`.
- Migrările de schemă sunt obligatorii pentru orice schimbare de model de date — niciodată schimbări manuale direct pe DB.
- Chei API / secrete: **niciodată hardcodate**, întotdeauna din variabile de mediu (vezi `infra/.env.example`).

### `backend/realtime`
- Server-ul e sursa unică de adevăr pentru rezultatul unei runde (cine a răspuns corect, cine cucerește teritoriul) — clientul Flutter doar afișează, nu decide.
- Orice stare de partidă live trăiește în Redis, nu în memoria procesului (pentru a permite restart/scalare orizontală fără a pierde partide active).
- Evenimentele Socket.IO (nume, payload) se documentează pe măsură ce se adaugă, într-un fișier `backend/realtime/EVENTS.md`.

### `backend/workers`
- Job-urile de generare AI de întrebări **validează strict formatul** înainte de a insera în DB (schema JSON așteptată, verificare că răspunsul corect e printre variante la grilă). Un output malformat se loghează și se respinge, nu se salvează parțial.
- Job-urile sunt idempotente pe cât posibil (rerularea unui job nu trebuie să dubleze date).

---

## 4. Calitatea băncii de întrebări — reguli obligatorii pentru orice cod care o atinge

- Nicio întrebare nu intră direct în rotația de joc cu `status = pending` — trebuie `approved` (fie prin verificare manuală eșantion pentru AI, fie prin moderator pentru cele din comunitate).
- Deduplicare: înainte de inserare, verifică similaritate text cu întrebări existente în aceeași categorie (evită să umpli banca cu variații triviale ale aceleiași întrebări).
- Feedback-ul din joc (👍/👎, rată de răspuns corect anormală) trebuie conectat la un flag automat de revizuire — nu lăsa întrebări problematice să circule nesupravegheate doar pentru că au trecut inițial de moderare.

---

## 5. Securitate & date

- Parole: hash cu algoritm modern (bcrypt/argon2), niciodată plaintext, niciodată în loguri.
- JWT: expirare rezonabilă + refresh token, invalidare la logout.
- Rate limiting obligatoriu pe: login, propunere întrebări din comunitate, endpointuri de matchmaking.
- Orice date primite de la client (răspunsuri, propuneri de întrebări, profil) sunt tratate ca **neîncrezute** până validate server-side.

---

## 6. Testare

- Backend: teste unitare pentru logica de scor/ELO și pentru validarea întrebărilor generate AI (acestea sunt cele mai predispuse la bug-uri costisitoare — un bug în calculul scorului sau în validarea răspunsului corect afectează direct corectitudinea jocului).
- `realtime`: cel puțin un test de integrare care simulează o partidă `duo` completă (conectare → matchmaking → rundă → rezultat → persistare).
- Flutter: teste de widget pentru ecranul de întrebare (grilă + numeric) — cronometrul și starea de răspuns corect/greșit sunt zone predispuse la regresii vizuale.

---

## 7. Ce NU face un agent fără să întrebe

- Nu schimbă alegerea de stack tehnic din `plan.md` (Flutter, NestJS, Postgres, Redis) fără să discute explicit motivul.
- Nu adaugă monetizare cu bani reali (plăți efective) fără confirmare explicită — cosmeticele cu monedă câștigată în joc sunt ok din Faza 4, dar integrarea de plăți reale e o decizie separată.
- Nu introduce dependențe de servicii cloud închise suplimentare (dincolo de FCM pentru push, deja acceptat în plan) fără să semnaleze abaterea de la principiul "self-hosted" din `plan.md`.
- Nu copiază texte, assets sau denumiri din conQUIZtador2 sau alt joc existent — mecanica de gen (cucerire teritorii prin trivia) e un gen consacrat, dar identitatea vizuală/brand trebuie să fie 100% originală.

---

## 8. Raportare progres

La final de sesiune de lucru, agentul rezumă:
- ce task(uri) din ce fază de `plan.md` au fost atinse,
- ce checklist-uri din `init.md` (sau echivalentul lor pentru faze ulterioare) sunt acum bifate,
- orice abatere de la plan + ADR-ul asociat, dacă există.
