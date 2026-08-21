# AGENTS.md — Reguli pentru agenți AI de coding (QuizRealm)

> Acest fișier ghidează orice agent AI (Claude Code, Codex sau altul) care lucrează în acest repo. Se citește **înainte** de orice task de implementare, alături de `ai/tasks/` (ce se lucrează), `plan.md` (viziune + arhitectură) și `init.md` (structură + bootstrap).

---

## 1. Sursele de adevăr

### 1.1 Regula zero: se lucrează **numai** din `ai/tasks/`

**Singura listă validă de lucru din proiect e `ai/tasks/`.** Cele douăsprezece
registre de acolo sunt ce se construiește; nimic altceva din depozit nu e listă
de sarcini.

Obligatoriu pentru orice agent, fără excepție:

1. **Înainte de a scrie o linie de cod**, task-ul la care lucrezi trebuie să
   existe într-un registru, cu ID-ul lui (`SRV-042`, `WEB-021`, `GD-007`…).
   Dacă nu există, se adaugă acolo întâi, cu toate câmpurile completate.
2. **Nu se începe un task blocat.** Statusul `🔒` numește motivul — o decizie
   (`D1`–`D5` din `ai/taskmaster.md`) sau alt task. Se rezolvă acela întâi.
3. **Nu se începe un task de front înainte ca dependența lui de server să fie
   `✅`.** Câmpul `Depinde de` există exact pentru asta. Codul scris peste un
   endpoint inexistent se rescrie.
4. **La final**, se completează în registru: `Status`, `Finalizat` (data și ora)
   și `Commit` (hash-ul scurt). *Un task fără commit nu e închis*, oricât de
   terminat pare.
5. **Mesajul de commit** menționează ID-ul task-ului.

Ordinea de citire la începutul oricărei sesiuni: `ai/tasks/00-README.md` →
registrul componentei tale → `ai/taskmaster.md` pentru context de fază.

### 1.2 Sursă de design (se citesc, nu se rescriu)

- `plan.md` = ce construim și de ce. Orice implementare trebuie să respecte deciziile de acolo (stack, schema de date, moduri de joc, faze).
- `owner-plan.md` = extensia detaliată: sisteme sociale, ranguri, turnee, internaționalizare, mecanici unice.
- `init.md` = structura de directoare și bootstrap-ul. Structura definită acolo e obligatorie, nu se reorganizează fără un ADR care justifică schimbarea.
- `docs/design-system.md` = tokenii vizuali. Niciun ecran nu definește local culori, spațieri sau raze.
- Dacă un task pare să contrazică `plan.md`, agentul **nu improvizează** — semnalează conflictul în output și propune fie ajustarea planului, fie a task-ului, înainte de a scrie cod.

---

## 2. Format de lucru pe task-uri

- Fiecare task are ID din `ai/tasks/` și e mapat la o fază din `ai/taskmaster.md`. Nu se sare peste faze.
- Task-urile mari se descompun în pași verificabili, fiecare cu un criteriu clar de "gata" (compilează, testele trec, endpoint-ul răspunde corect).
- La final de task, agentul rulează build/test local relevant **înainte** de a raporta task-ul ca terminat, apoi completează `Finalizat` și `Commit` în registru.
- Un task raportat ca terminat fără dovadă (build rulat, test trecut, endpoint verificat) se consideră nefăcut.

---

## 3. Structura proiectului — fiecare folder, doar ce e al lui

Regula: **o componentă livrabilă = un folder, care conține tot ce îi trebuie ei
și nimic ce aparține alteia.** Nu se amestecă.

| Folder | Componentă | Conține | Nu conține |
|---|---|---|---|
| `backend/api` | Server core — REST, date | Prisma, migrări, toate regulile de joc, economie, moderare | Nimic de interfață |
| `backend/realtime` | Server core — timp real | Socket.IO, motorul de partidă, matchmaking | Acces direct la baza de date (merge prin API) |
| `shared/` | Contract frontend | Clientul HTTP, sesiunea, tipurile comune | Endpointuri de admin, logică de joc |
| `web/` | Site public + zona de joc | Pagina de start, autentificare, joc, clasamente | Orice ține de panoul de administrare |
| `admin/` | Panoul de administrare | Ecranele de operare, tema proprie, endpointurile `/admin/*` | Cod al site-ului public |
| `mobile/` | Aplicația Flutter | Tot clientul Android/iOS | — |
| `infra/` | Găzduire | Compose, tunel, variabile de exemplu | Cod de aplicație |
| `ai/tasks/` | Ce se lucrează | Cele douăsprezece registre | — |

Trei consecințe pe care agenții le încalcă cel mai des:

- **Panoul de administrare nu locuiește în `web/`.** A stat acolo până în
  august 2026 și a fost mutat: bundle-ul lui de 338 kB ajungea la fiecare
  vizitator al paginii de start. Un import din `web/` în `admin/` sau invers e
  o greșeală; ce e cu adevărat comun urcă în `shared/`.
- **`shared/` nu e o ladă de vechituri.** Intră acolo doar ce folosesc *și*
  web-ul, *și* panoul. Un tip folosit de unul singur rămâne la el.
- **Fronturile n-au logică proprie de joc.** Dacă un fișier din `web/`,
  `admin/` sau `mobile/` calculează scor, cucerire, sold sau rang, e în locul
  greșit — calculul aparține serverului.

---

## 4. Versionare — obligatorie pentru fiecare componentă

Fiecare componentă livrabilă are **număr de versiune propriu, semantic**, în
locul canonic al ecosistemului ei:

| Componentă | Unde |
|---|---|
| `backend/api`, `backend/realtime` | `package.json` → `version` |
| `shared/`, `web/`, `admin/` | `package.json` → `version` |
| `mobile/` | `pubspec.yaml` → `version` (cu numărul de build după `+`) |

Reguli:

- **Se verifică automat**: `node scripts/check-versions.mjs` rulează în CI și
  oprește build-ul dacă o componentă n-are versiune sau are una care nu e semver.
- **Se crește la fiecare livrare** care ajunge la utilizatori: `patch` pentru
  remedieri, `minor` pentru funcții noi, `major` pentru schimbări care rup
  compatibilitatea contractului cu clienții.
- **Versiunea trebuie să fie vizibilă în produs**, nu doar în manifest: panoul o
  arată în subsolul barei laterale, serverul o întoarce la verificarea de
  sănătate, aplicația o arată în setări. O versiune pe care operatorul n-o poate
  citi nu ajută la nimic când un jucător raportează o problemă.
- **Versiunea de release a aplicației se schimbă doar odată cu un tag**, nu la
  fiecare împingere pe `main`.

Motivul regulii: fără ea nu se poate spune ce versiune de client vorbește cu ce
versiune de server, iar un raport de eroare devine imposibil de localizat în
timp. E și baza pentru versiunea minimă acceptată de client (`SRV-092`, `APP-050`).

---

## 5. Dependențe — se stă pe versiunile curente

Regula: **ultima versiune stabilă, pentru tot ce există deja și pentru tot ce se
adaugă.** Un proiect care nu-și verifică dependențele adună avertismente,
rămâne în urmă la corecții de securitate, iar salturile devin cu atât mai
dureroase cu cât se amână mai mult.

Regula are însă o formă care funcționează și una care rupe build-ul. Proiectul a
fost oprit de două ori în august 2026 tocmai de „ultima versiune" aplicată
mecanic, așa că forma corectă e:

> **Mereu curent, verificat cu o compilare reală, și fixat doar unde e dovedit
> incompatibil — cu motiv scris și dată de revizuire.**

### 5.1 Ce face un agent

1. **Verifică înainte de a începe**, nu după: `node scripts/check-updates.mjs`
   raportează ce a rămas în urmă pe toate cele patru ecosisteme deodată — pnpm
   pentru workspace-ul frontend, npm pentru cele două servere, pub pentru Flutter.
2. **Actualizează în loturi mici**, nu tot deodată. Un lot = pachetele înrudite.
   După fiecare lot, o verificare reală: `tsc --noEmit`, testele, și **o
   compilare** pentru partea mobilă.
3. **Nu introduce niciodată o dependință nouă la o versiune veche.** Un pachet
   adăugat azi se adaugă la ultima versiune stabilă.
4. **Nu lasă avertismente în urmă.** Un avertisment de analizor, de compilator
   sau de build ori se repară, ori primește o excepție scrisă cu motiv. Zece
   avertismente tolerate înseamnă că al unsprezecelea, cel real, nu se mai vede.
5. **Actualizările de securitate au prioritate și termen**: cel mult o săptămână.

### 5.2 Capcanele dovedite pe proiectul ăsta

Trei lecții plătite deja, care nu se reînvață:

- **`flutter analyze` trece cu un graf de dependențe rupt**, pentru că nu intră
  în pub-cache. Singura dovadă că o actualizare Flutter e bună e o compilare
  reală. O familie de pachete care implementează același `platform_interface` se
  mută **integral, dintr-o dată** — un amestec stabil/beta pică cu „missing
  implementations".
- **Cea mai nouă versiune poate cere un SDK pe care lanțul de build nu-l
  suportă.** `flutter_secure_storage 11` cere compileSdk 37; AGP 9.1.0 merge
  până la 36. Aici „ultima versiune" nu e o opțiune, e o oprire de build.
- **Un salt major poate rupe altceva decât pachetul actualizat.** TypeScript 7 a
  eliminat `baseUrl`, iar fără el `@types/jest` nu mai e descoperit: toate cele
  16 suite de teste ale API-ului cad. Pachetele frontend sunt deja pe 7.0.2,
  pentru că folosesc vitest — deci blocajul e al jest-ului, nu al TypeScript-ului.

### 5.3 Cum se fixează o versiune, când chiar trebuie

Un pin e o excepție de la regulă, deci se plătește cu documentație. Se
înregistrează în **`scripts/dependency-pins.json`**, cu:

- pachetul, ecosistemul și unde se aplică,
- versiunea la care e ținut și cea de la care e blocat,
- **motivul verificabil** — ce anume se rupe, nu „nu merge",
- **data de revizuire**,
- condiția care îl deblochează.

`check-updates.mjs` citește registrul și semnalează pin-urile expirate. O dată de
revizuire pe care n-o verifică nimeni e o dată decorativă. Manifestele npm și pub
nu suportă comentarii, de aceea motivele stau într-un singur loc, nu împrăștiate.

Un pin fără intrare în registru se consideră greșeală și se scoate.

### 5.4 Ce blochează build-ul și ce nu

| Verificare | În CI | De ce |
|---|---|---|
| Vulnerabilități (`pnpm audit`, nivel înalt) | **blochează** | O vulnerabilitate cunoscută nu se livrează. |
| Versiuni componente (`check-versions.mjs`) | **blochează** | Regula din §4. |
| Dependențe în urmă (`check-updates.mjs`) | raport, nu blochează | Ar cădea în ziua în care orice dependință publică o versiune nouă. Un semnal care se aprinde zilnic e un semnal pe care nimeni nu-l mai citește. |

Raportul de actualizări rulează programat, nu la fiecare împingere, și produce
task-uri în `ai/tasks/`, nu build-uri roșii.

### 5.5 Prospețimea nu înseamnă „publicat acum trei minute"

`pnpm-workspace.yaml` are `minimumReleaseAge`, o întârziere înainte ca o versiune
proaspăt publicată să fie adoptată. Nu e o frână împotriva actualizărilor, ci
apărarea împotriva compromiterilor de lanț de aprovizionare: pachetele infectate
sunt de obicei depistate și retrase în primele ore. Valoarea e de câteva zile, nu
zero — diferența dintre „ultima versiune" și „ultima versiune care a apucat să
fie verificată de cineva".

---

## 6. Convenții per componentă

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

## 7. Calitatea băncii de întrebări — reguli obligatorii pentru orice cod care o atinge

- Nicio întrebare nu intră direct în rotația de joc cu `status = pending` — trebuie `approved` (fie prin verificare manuală eșantion pentru AI, fie prin moderator pentru cele din comunitate).
- Deduplicare: înainte de inserare, verifică similaritate text cu întrebări existente în aceeași categorie (evită să umpli banca cu variații triviale ale aceleiași întrebări).
- Feedback-ul din joc (👍/👎, rată de răspuns corect anormală) trebuie conectat la un flag automat de revizuire — nu lăsa întrebări problematice să circule nesupravegheate doar pentru că au trecut inițial de moderare.

---

## 8. Securitate & date

- Parole: hash cu algoritm modern (bcrypt/argon2), niciodată plaintext, niciodată în loguri.
- JWT: expirare rezonabilă + refresh token, invalidare la logout.
- Rate limiting obligatoriu pe: login, propunere întrebări din comunitate, endpointuri de matchmaking.
- Orice date primite de la client (răspunsuri, propuneri de întrebări, profil) sunt tratate ca **neîncrezute** până validate server-side.

---

## 9. Testare

- Backend: teste unitare pentru logica de scor/ELO și pentru validarea întrebărilor generate AI (acestea sunt cele mai predispuse la bug-uri costisitoare — un bug în calculul scorului sau în validarea răspunsului corect afectează direct corectitudinea jocului).
- `realtime`: cel puțin un test de integrare care simulează o partidă `duo` completă (conectare → matchmaking → rundă → rezultat → persistare).
- Flutter: teste de widget pentru ecranul de întrebare (grilă + numeric) — cronometrul și starea de răspuns corect/greșit sunt zone predispuse la regresii vizuale.

---

## 10. Ce NU face un agent fără să întrebe

- Nu schimbă alegerea de stack tehnic din `plan.md` (Flutter, NestJS, Postgres, Redis) fără să discute explicit motivul.
- Nu adaugă monetizare cu bani reali (plăți efective) fără confirmare explicită — cosmeticele cu monedă câștigată în joc sunt ok din Faza 4, dar integrarea de plăți reale e o decizie separată.
- Nu introduce dependențe de servicii cloud închise suplimentare (dincolo de FCM pentru push, deja acceptat în plan) fără să semnaleze abaterea de la principiul "self-hosted" din `plan.md`.
- Nu copiază texte, assets sau denumiri din conQUIZtador2 sau alt joc existent — mecanica de gen (cucerire teritorii prin trivia) e un gen consacrat, dar identitatea vizuală/brand trebuie să fie 100% originală.

---

## 11. Raportare progres

La final de sesiune de lucru, agentul rezumă:
- ce task(uri) din ce fază de `plan.md` au fost atinse,
- ce checklist-uri din `init.md` (sau echivalentul lor pentru faze ulterioare) sunt acum bifate,
- orice abatere de la plan + ADR-ul asociat, dacă există.
