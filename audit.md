# AUDIT.md — QuizRealm — Analiza completă a proiectului

**Data auditului:** 2026-08-15  
**Veriune:** 1.0  
**Responsabil:** Copilot AI  
**Status:** DRAFT — Identifică probleme și oportunități de îmbunătățire

---

## 1. EXECUTIVE SUMMARY

Proiectul QuizRealm este o aplicație mobilă Flutter cu backend Node.js/NestJS pentru jocuri de cultură generală cu multiplayer online. Implementarea cuprinde:

- ✅ **Complet**: Structura monorepo, backend API, serviciu realtime, banca de date, autentificare, sistem de rang
- ⚠️ **Parțial**: Fluxul multiplayer (doar duel single-round), banca de întrebări (doar 14 aprobate din ~5.000 cerute)
- ❌ **Lipsă**: Moduri de joc (Blitz, Clasic, Private), Anti-cheat, Chat, Prieteni, Cosmetice/Shop, Leaderboard real-time

**Prioritate critică imediată**: Extinderea băncii de întrebări la min. 500-1.000 aprobate pentru MVP viable. Fără o bancă suficientă, aplicația nu poate fi lansată chiar în beta privat.

---

## 2. PROBLEME CRITICE

### 2.1 📛 Banca de întrebări — BLOCKER pentru MVP

**Stare actuală:**
- 14 întrebări `APPROVED` (pachet curatoriat offline)
- 2 întrebări `PENDING` (generate AI, neaprobate)
- 0 întrebări generate din pipeline-ul de AI pe Postgres

**Plan inițial (plan.md §5.1):**
- 50.000+ întrebări generate AI pentru lansare
- Distribuție pe categorii și dificultăți 1-5
- Verificare automată + sampling manual

**Impact:** 
- Fluxul multiplayer online nu poate funcționa (API refuză să servească întrebări `PENDING` și `APPROVED` e gol)
- Solo gameplay merge doar cu pachete offline (hardcodate în aplicație)
- Faza 2 (multiplayer MVP) e blocat complet fără banca expandată

**Recomandare:**
1. Configură provider-ul AI (ChatGPT/Claude/Gemini) cu variabilă de mediu
2. Generează în batch: 100 întrebări per categorie × 10 categorii × 5 dificultăți = 5.000 de bază
3. Implementează pipeline automat de validare (format JSON, răspuns corect în variante, deduplicare)
4. Aprobă prin sampling manual: ~5-10% din fiecare subset de categorie + dificultate
5. Target: min. 500 aprobate înainte de testarea cu grup restrâns, min. 2.000-5.000 la lansare

---

### 2.2 🚫 Faza 0/Bootstrap — Incompletă

**Din `passed.md` — pași deschisi:**

| Pas | Stare | Blocker |
|---|---|---|
| Pasul 6 preflight (10 întrebări: 5 Biologie + 5 Istoria României) | 2 întrebări, nu 10 | ✅ |
| ~5.000 întrebări generate și distribuite | 0 generate | ✅ |
| 0 întrebări aprobate din generare | 0 | ✅ |
| Verificare DB/API pe bootstrap | Neexecutat | ✅ |
| Prim commit Git | Nu există | ⚠️ |

**Impact:** Definiția de "complet Bootstrap" nu e satisfăcută. Regula din `passed.md` zice clar că Faza 2 nu se começe pe baza excepției Pasului 6 — totuși, aceasta s-a ignorat în favoarea unei cereri explicite a proprietarului. **Documentul rămâne deschis intenționat**.

**Recomandare:**
- Finalizează chiar și cu o bancă redusă (min. 1.000 aprobate) pentru a marca bootstrap ca complet
- Reevaluează și bifează lista din `passed.md` după fiecare etapă

---

### 2.3 ⚠️ Repository — Fără commit history

**Stare actuală:**
- Fișierele sunt în `.git/` (repo inițializat)
- **Zero commits** pe ramura `main`
- Istoricul de progres pe 2026-08-15 se află doar în fișierele markdown

**Implicații:**
- Nicio versiune liberă/tag stabil
- Nicio urmărire a schimbărilor pe timp
- Imposibil de revert la o stare anterioară
- Colaborarea dezvoltatorilor e riscantă

**Recomandare:**
1. Fă un commit inițial după audit și bifă lista completă din `passed.md`
2. Setează o politică de commit: **fiecare completare de pas din `init.md` = un commit cu mesajul din `plan.md`**
3. Etiquetează `v0.1-bootstrap` după finalizarea completă a Pasului 6

---

## 3. PROBLEME IMPORTANTE

### 3.1 🎮 Funcționalitate Multiplayer — Limitată

**Ce funcționează:**
- ✅ Duel Duo 1v1 pe una sau mai multe runde (Faza 2 acceptată)
- ✅ Matchmaking FIFO simplu pe Redis
- ✅ Validare server-side a răspunsurilor

**Ce lipsește (Faza 2/3):**
- ❌ Mod Clasic (hartă, teritorii, atac/apărare) — plan.md §6
- ❌ Mod Blitz (varianta rapidă, timpi scurți) — plan.md §6
- ❌ Partidă privată cu cod/link — plan.md §6
- ❌ Solo/Antrenament cu roboți — plan.md §6
- ❌ Reconectare cu păstrare de loc (60-90s) — **Acceptată în ADR0007, NU implementată**
- ❌ Roboți configurabili (3 niveluri dificultate) — plan.md §8
- ❌ Anti-cheat avansat (logging pattern-uri suspecte) — plan.md §8

**Impact:** MVP-ul e parțial. Doar duel pur 1v1 e playable online.

**Recomandare:** 
- Prioritizează Reconectare (ADR0007) — e o problemă critică pe mobil
- Apoi roboți simplători pentru solo/private
- Mod Clasic și Blitz pot veni în Faza 3

---

### 3.2 💬 Sistem de Chat — Schema doar, fără logică

**Ce există:**
- ✅ Schema Prisma completă: `Message`, `Conversation`, `ConversationParticipant`, `ChatReport`
- ✅ Modele și relații

**Ce lipsește:**
- ❌ Serviciu/controller la backend API
- ❌ Trepte de încredere (T0-T5+) — docs/features-social-progression.md §2.5 detaliază, dar cod = 0
- ❌ Rate limiting per trust tier
- ❌ Moderare și rapoarte
- ❌ Client Socket.IO pentru chat realtime
- ❌ UI Flutter pentru conversații

**Impact:** Sistemul social nu e funcțional. Chat-ul global, prieteni și DM-uri sunt 100% blocate.

**Recomandare:**
- Implementează serviciu Chat la API (POST/GET conversații, trimite mesaj, lista prieteni)
- Trepte de încredere: ușor — denormalizează `correctAnswers` din `users` și derivă treaptă din SQL
- Socket.IO pentru realtime pe `/chat` namespace

---

### 3.3 👥 Sistem de prietenie și blocări — Schema doar, fără logică

**Ce există:**
- ✅ Schema: `Friendship`, `UserBlock`, `UserPrivacySettings`

**Ce lipsează:**
- ❌ Serviciu de prietenie (cerere, accept, refuz, blocare)
- ❌ UI Flutter pentru lista de prieteni
- ❌ Privacy settings (chat din necunoscuți, vizibilitate profil)

**Impact:** Faza 3 e complet blocată; chat de prieteni nu funcționează fără asta.

---

### 3.4 🏆 Leaderboard real-time — Partial

**Ce există (ADR0006):**
- ✅ Trepte de rang statice pe cod (22 trepte fixe)
- ✅ Endpoint public `GET /leaderboard`
- ✅ Clasament citit din Postgres (sursa de adevăr)

**Ce lipsește:**
- ❌ Recalcul leaderboard automatizat din job workers (se citește din DB la fiecare cerere)
- ❌ Leaderboard per rang/diviziune
- ❌ Leaderboard de prieteni
- ❌ Sezoane, promocii, decay-ul ELO — acestea sunt Faza 4
- ❌ Recompense per rang

**Impact:** Leaderboard funcționează dar nu e optimizat și rămâne incomplete social.

---

### 3.5 📱 Aplicație Flutter — Limitată la Solo offline

**Ce funcționează:**
- ✅ Campaign solo offline (9 ținuturi × 15 întrebări)
- ✅ Sistem local de progres (stele, XP, nivel)
- ✅ Interfață de joc cu design modern
- ✅ Randare hartă cu animații

**Ce lipsește:**
- ❌ Client multiplayer realtime (Duel UI nu e complet)
- ❌ Sistem de conturi/profil (cont e opțional, game state local)
- ❌ Chat UI
- ❌ UI Prieteni și blocări
- ❌ Leaderboard UI
- ❌ Magazin/cosmetice
- ❌ Notificații push
- ❌ Platform Windows (ADR0004 zice că e adusă devreme, dar "Windows runner" pare incomplet)

**Impact:** Aplicația e demo offline, nu e legată la backend pentru multiplayer.

---

## 4. PROBLEME DE COD ȘI CALITATE

### 4.1 🔧 Backend — Documentație Generică

**Problema:** README fișierele din `backend/api`, `backend/realtime`, `backend/workers` sunt template-uri NestJS default, nu documente specifice proiectului.

**Exemple:**
- "Project setup" > "npm install" (standard)
- Nu menționează cum să porți docker-compose
- Nu menționează dependența Redis/Postgres
- Nu listează environmentals necesare

**Impact:** Onboarding nouilor developeri e greu. Trebuie să citească `init.md` și `plan.md` în loc de README.

**Recomandare:**
1. Rescrie `backend/api/README.md`:
   - Setup: docker-compose up
   - Env: `cp .env.example .env`
   - Migrate: `npm run prisma:migrate:dev`
   - Seed: `npm run prisma:seed`
   - Tipuri endpointuri disponibile
2. Rescrie `backend/realtime/README.md`: Socket.IO, conectare, game flow
3. Rescrie `backend/workers/README.md`: BullMQ, joburi disponibile, cum să ruli manual

---

### 4.2 🪵 Logging și Monitoring — Neintegrat

**Stare:**
- ✅ Prometheus + Grafana definiți în `plan.md` §3.2
- ❌ Zero integrare în cod (nu se găsesc `@nestjs/metrics` sau similare)
- ❌ Logging structurat (Pino) menționat dar nu implementat
- ❌ Observabilitate zero în realtime

**Impact:** În producție nu vei ști ce se întâmplă. Debuggingul fără loguri e posibil dar dureros.

**Recomandare:**
1. Integrează `@nestjs/throttler` + Prometheus metrics
2. Adaugă Pino logger la toți serviciile
3. Creează grafice Grafana pentru: request rate, latență, errori, conexiuni Socket.IO

---

### 4.3 🔐 Securitate — Parțial reverizată

**Ce e bine:**
- ✅ Hashing parolă (argon2)
- ✅ JWT cu exp time
- ✅ Validare email-uri la înregistrare (se menționează)
- ✅ Rate limiting la API (Throttler)
- ✅ IP-ul sesiunii stocat ca HMAC (ADR0008)

**Preocupări:**
- ⚠️ CORS — Nu e clar dacă e configurat. Care origin e permis pentru Flutter app?
- ⚠️ HTTPS — Nu e forțat în `docker-compose` (e de așteptat, doar dev, dar producția?)
- ⚠️ TOTP/2FA — Menționat în plan dar nu implementat (recomandat pentru conturi premium)
- ⚠️ Token refresh — Rotație + detecție rejucare (ADR0008) pare corect dar nu s-a testat
- ⚠️ SQL injection — Prisma și ORM-uri sunt protected by default dar validare de input e minimă

**Recomandare:**
1. Test token refresh cu recovery din server crash
2. Adaugă TOTP pentru conturi cu rank ridicat
3. Documentează politică CORS în backend `.env.example`
4. E2E pe fluxul de înregistrare/login

---

### 4.4 ❌ Teste — Incomplete

**Stare:**
- ✅ 59 teste în Flutter (test output din `init.md`)
- ✅ Coverage pe: reguli scor, progres, pachete întrebări, controller, UI
- ❌ Backend: nu sunt pe radar menționați teste în detail
- ❌ E2E: nu sunt

**Impact:** Regresioane nedetectate, special la score calc și ELO.

**Recomandare:**
1. Backend: min. 70% coverage, prioritare logica de scor/ELO/validare răspunsuri
2. E2E: flow complet auth → matchmaking → duel → scor salvat
3. CI/CD: test pe fiecare push

---

### 4.5 📋 .gitignore — Incomplete

**Problema:** Fișiere sensibile pot fi commitate accidental.

**Verificare:** Confirmă că `.env`, `*.env.local`, `node_modules/`, build artifacts sunt în `.gitignore`.

**Recomandare:** Adaugă la rădăcina repo:
```
.env
.env.local
.env.*.local
node_modules/
dist/
build/
.DS_Store
*.log
```

---

## 5. PROBLEME DE INFRASTRUCTURĂ

### 5.1 🐳 Docker Compose — Necomplet

**Ce e bine:**
- ✅ Postgres, Redis, MinIO definite
- ✅ Volumes persistente
- ✅ Health checks
- ✅ MinIO init container

**Ce lipsește:**
- ❌ Backend API service (docker-compose run-ul)
- ❌ Realtime service
- ❌ Workers service
- ❌ Dockerfile pentru fiecare (doar template-uri listează în structură)
- ❌ Environment variables — `.env.example` e menționat dar nu listat

**Impact:** `docker-compose up` nu pornește full stack. Trebuie să rulezi manual npm run start:dev pe fiecare.

**Recomandare:**
1. Completează `docker-compose.yml` cu API, realtime, workers
2. Creează `Dockerfile` în fiecare backend folder (ARGs pentru stage build)
3. Creează `.env.example` complet cu TOATE variabilele necesare

---

### 5.2 🔌 MinIO — Configurat dar ne-testat

**Stare:**
- ✅ Container în compose
- ✅ Init bucket
- ❌ Nu se vede dacă backend o folosește pentru avataruri/imagini

**Recomandare:** Confirm că API are cod care upladă avataruri/imagini pe MinIO și downloadează.

---

### 5.3 📊 Prometheus + Grafana — Menționat dar absenți

**Plan:** §3.2 zice că folosim Prometheus + Grafana.

**Realitate:** Nu sunt în docker-compose. 

**Recomandare:** Adaugă:
```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./infra/prometheus.yml:/etc/prometheus/prometheus.yml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
```

---

## 6. PROBLEME DE ARHITECTURĂ

### 6.1 📚 Backend — Responsabilități Amestecate

**Preocupări:**

1. **API vs Realtime**: Unde trăiesc datele jocului în timp real?
   - API: stateless REST, persistă la Postgres
   - Realtime: stateful Socket.IO, păstrează partida în Redis
   - ❓ Cine e responsabil de validare: API sau Realtime?

2. **Workers**: Prea mic. Doar 2 job-uri (generate-questions, recalculate-leaderboard) dar nu sunt conectate la API în modul explicit.

**Recomandare:**
- Clar: Realtime e responsabil de logica partidei în timp real; API e stateless pentru profil/auth/istoric
- Extinde workers: moderare chat, update leaderboard, decay ELO sezonier
- Documentează în `docs/architecture.md` fluxul datelor

---

### 6.2 🗄️ Database — Cuplare Tight la Prisma

**Preocupări:**
- Prisma e ORM specific. Dacă peste 2 ani vrei să migrezi la TypeORM, e dureros.
- Schema e grande (100+ coloane), posibil over-engineered. De ex. `displayName` și `username` pentru fiecare user e elegant dar și complex.

**Recomandare:** 
- Nu schimba acum (Prisma e bun).
- Creează layer de repository pentru logica DB-specific, să nu fii dependent de Prisma în servicii.

---

## 7. PROBLEME DE DOCUMENTAȚIE

### 7.1 📄 Fișiere Manuale Lipsă

**Ce lipsește:**

| Fișier | Scopul | Prioritate |
|---|---|---|
| `docs/architecture.md` | Diagram flux date, responsabilități | 🔴 |
| `docs/deployment.md` | Cum să desfășor pe VPS | 🔴 |
| `docs/environment.md` | Toate variabilele de mediu explicitate | 🔴 |
| `docs/security.md` | Audit secret management, CORS, auth | 🟡 |
| `docs/performance.md` | Benchmarks, caching strategy | 🟡 |
| `docs/troubleshooting.md` | Probleme comune și soluții | 🟡 |

**Recomandare:** Scrie minim (Deploy, Environment, Architecture) înainte de a-l plasa altora.

---

### 7.2 📖 Owner Plan & Plan-ToBe — Fișiere Lipsă

**Stare:** Fișierele `owner-plan.md` și `plan-tobe.md` menționate în structură nu sunt accesibile.

**Verificare:** Sunt ele în repo dar nu show-up în tree, sau sunt cu adevărat lipsă?

**Recomandare:** Confirmă starea. Dacă lipsesc, recreează din backlog explicit al proprietarului.

---

## 8. PROBLEME DE TESTING ȘI QA

### 8.1 🧪 Test Coverage — Incert

**Flutter:** 59 teste, bine.  
**Backend API:** ?  
**Realtime:** ?  
**Workers:** ?  

**Recomandare:** Raportuiești coverage per package. Target min. 70% logic críticală (scoring, validation, auth).

---

### 8.2 ✅ Checklist Bootstrap — Necompletă

Din `init.md`:
- [ ] Pas 6 preflight 10 întrebări
- [ ] ~5.000 generate
- [ ] Verificare manuală și aprobări
- [ ] Verificare DB/API bootstrap
- [ ] Commit git inițial

**Recomandare:** După audit, rehash cu proprietar și bifez adevărate pași.

---

## 9. OPORTUNITĂȚI DE OPTIMIZARE

### 9.1 🚀 Performance

- Cache leaderboard în Redis (Sorted Set, update pe fiecare meci)
- Paginate API responses (leaderboard, istoric partide)
- Compresie JWT + gzip responses
- Lazy load întrebări în Flutter

### 9.2 💾 Data

- Archive partide vechi (> 1 an) în S3/backup
- Vacuum Postgres periodic
- Prune Redis sessions de nevoit

### 9.3 🔄 Realtime

- Batch answers în-memory pe server, commit la finalul rundei, nu per jucător
- Detectare deconectare mai rapidă (heartbeat per 5s)

---

## 10. RECOMANDĂRI — PLAN DE ACȚIUNE

### FAZĂ 0 — Urgent (Săptămâna 1-2)

1. **Banca de întrebări** (blocker)
   - [ ] Config AI provider
   - [ ] Generează 5.000 întrebări
   - [ ] Aprobă 500+
   - [ ] Testează fluxul online

2. **Git history**
   - [ ] Commit inițial cu cuvântul-cheie "bootstrap"
   - [ ] Tag `v0.1-bootstrap`

3. **Documentație**
   - [ ] `docs/environment.md` — toate .env
   - [ ] `docs/deployment.md` — VPS, docker-compose production

### FAZĂ 1 — Important (Săptămâna 2-4)

4. **Reconectare** (ADR0007 — implementare)
   - [ ] Pauză partidă în Redis
   - [ ] `DuelPhase.reconnecting` în Flutter
   - [ ] Test: cădere rețea 30s, reconectare în 10s

5. **Logging**
   - [ ] Pino logger la API
   - [ ] Prometheus metrics
   - [ ] Grafana dashboards

6. **Backend README**
   - [ ] API, Realtime, Workers — documentații specifice

### FAZĂ 2 — Îmbunătățire (Săptămâna 4-6)

7. **Chat** (Trepte de încredere T0-T5)
   - [ ] Serviciu chat
   - [ ] Socket.IO namespace
   - [ ] UI Flutter básic

8. **Prieteni**
   - [ ] Serviciu cereri prietenie
   - [ ] UI list

9. **Teste Backend**
   - [ ] 70% coverage pe logic critică

### FAZĂ 3 — Viitoare (Post-MVP)

- Roboți + Blitz mode
- Mod Clasic (hartă teritorii)
- Sezoane + decay ELO
- Achievements + badges
- Monetizare (cosmetice)

---

## 11. VERIFICĂRI PE CARE LE-AI PUTEA FACE IMEDIAT

1. **Firebase Cloud Messaging** — E configurat? Ce key?
2. **Email provider (Resend)** — E configurat? Key present?
3. **AI provider (ChatGPT/Gemini/Claude)** — Care e ales? Key present?
4. **Database state** — Curent user, corect ELO, sessions lucru?
5. **Socket.IO handshake** — JWT validation funcționează?
6. **Mobile app** — Conectare la backend realtime merge?

---

## 12. REZUMAT FINAL

| Categorie | Status | Impact |
|---|---|---|
| **Arhitectură** | ✅ Solid | MVP e posibil cu expansiuni mici |
| **Backend API** | ✅ Solid | Controllers și servicii OK |
| **Realtime** | ⚠️ Parțial | Doar duel single-round; reconectare pending |
| **Mobile** | ⚠️ Parțial | Solo OK; multiplayer UI incomplete |
| **Banca de întrebări** | 🔴 BLOCKER | 14 aprobate din 5.000 cerute |
| **Chat/Social** | ❌ Absent | Schema doar; logică = 0 |
| **Cosmetice/Shop** | ❌ Absent | Plan.md §9; implementare viitoare |
| **Documentation** | ⚠️ Slabă | Bună în plan.md/init.md; slabă în cod |
| **Testing** | ⚠️ Parțial | Flutter OK; backend unclear |
| **Logging/Monitoring** | ❌ Absent | Prometheus + Grafana menționați dar missing |
| **Git History** | ❌ Absent | Fără commits; tracability zero |

**Verdict:** Proiectul are fundații solide și e pe drum corect, dar **nu e gata pentru producție**. MVP-ul (duel multiplayer + 500+ întrebări aprobate) e 4-6 săptămâni departe cu efort normal. Actualizarea următorului proprietar va fi:

> "Banca de întrebări e blocantul #1. După ce e 500+ aprobată, testează end-to-end (auth → match → result → ELO update). Apoi add reconectare și chat simplu. Social features și cosmetice vin după."

---

**Audit completat de:** GitHub Copilot  
**Modelul utilizat:** Claude Haiku 4.5  
**Recomandare:** Revizuiești cu proprietar înainte de sprint-ul următor.
