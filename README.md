# QuizRealm 🎮

> **Joc mobil de cultură generală + strategie de cucerire de teritorii**  
> Multiplayer online real-time, cu interfață modernă și bancă de întrebări expansibilă.

[![Build APK & Release](https://github.com/zedkode/quitzrealm/actions/workflows/build-apk-release.yml/badge.svg)](https://github.com/zedkode/quitzrealm/actions)
[![Version](https://img.shields.io/badge/version-1.3.2-blue.svg)](https://github.com/zedkode/quitzrealm/releases)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Copyright](https://img.shields.io/badge/copyright-DohotStudio-blue.svg)](LICENSE)
[![Flutter](https://img.shields.io/badge/Flutter-3.13+-02569B?logo=flutter)](https://flutter.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org)

---

## 📋 Cuprins

- [Viziune](#viziune)
- [Caracteristici](#caracteristici)
- [Stack Tehnologic](#stack-tehnologic)
- [Setup Local](#setup-local)
- [Structura Proiectului](#structura-proiectului)
- [Moduri de Joc](#moduri-de-joc)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Audit & Probleme](#audit--probleme)

---

## 🎯 Viziune

QuizRealm e o reinterpretare modernă a conQUIZtador2, cu:

- **Interfață nativă Flutter** — animații fluide, hartă interactivă, dark/light theme
- **Multiplayer online real-time** — duel 1v1, matchmaking pe skill (ELO)
- **Bancă de întrebări extensibilă** — 50.000+ întrebări generate AI + crowdsourced, distribuite pe categorii și dificultăți
- **Sistem social robust** — prieteni, chat cu trepte de încredere, leaderboard global
- **Self-hosted friendly** — infrastructură proprie (PostgreSQL, Redis, MinIO), nu dependent de vendor cloud
- **Cross-platform** — Android MVP, iOS/Windows posibile

**Lansare țintă:** Q3 2026 (grupa beta) → Q4 2026 (public)

---

## ✨ Caracteristici

### Gameplay
- ✅ Campaign solo offline cu 9 ținuturi × 15 întrebări curatoriate
- ✅ Duel online 1v1 cu runde multiple (Duo mode)
- ✅ Sistem de scor și ELO pe bază de răspunsuri corecte și timp
- ✅ Două tipuri de întrebări: grilă (4 variante) și răspuns numeric
- 🔄 Mod Blitz, Mod Clasic (cu hartă teritorii) — în curs de implementare

### Social & Progression
- ✅ Autentificare email/parolă + Google OAuth
- ✅ Sistem de rang cu 22 trepte (Bronze I → Legendă)
- ✅ Leaderboard global cu ELO ranking
- 🔄 Chat global, DM-uri, sistem de prietenie — în curs

### Calitate
- ✅ 59 teste unitare Flutter
- ✅ Coverage analiză cod
- ✅ Build APK automat cu GitHub Actions
- ✅ Validare server-side a răspunsurilor (anti-cheat de bază)

---

## 🛠️ Stack Tehnologic

### Mobile
| Componenta | Tehnologie | Versiune |
|---|---|---|
| Framework | Flutter | 3.13+ |
| Limbaj | Dart | 3.1+ |
| State Management | Riverpod | 2.6.1 |
| Navigare | go_router | 17.5.0 |
| Realtime | Socket.IO Client | 3.1.6 |
| Bază locală | Drift/SQLite | 2.34.3 |
| Storage securizat | flutter_secure_storage | 10.0.0 |
| HTTP | http | 1.6.0 |

### Backend
| Componenta | Tehnologie | Versiune |
|---|---|---|
| Runtime | Node.js | 20+ LTS |
| Framework | NestJS | 11.0+ |
| Limbaj | TypeScript | 5.0+ |
| ORM | Prisma | 7.9+ |
| Bază Date | PostgreSQL | 18.6+ |
| Cache/Queue | Redis | 8.8+ |
| Realtime | Socket.IO | 4.8+ |
| Job Queue | BullMQ | 6.1+ |
| Storage | MinIO | 2025-09 |

### DevOps
| Componenta | Tehnologie |
|---|---|
| Containerizare | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | Pino (structured) |

---

## 🚀 Setup Local

### Prerechizite

```bash
# Verifică versiunile
flutter --version   # 3.13+
node --version      # 20+ LTS
docker --version    # latest
git --version       # 2.x
```

### 1️⃣ Clone Repository

```bash
git clone https://github.com/zedkode/quitzrealm.git
cd quitzrealm
```

### 2️⃣ Setup Infrastructure (PostgreSQL, Redis, MinIO)

```bash
cd infra

# Creează .env din template
cp .env.example .env

# Pornește serviciile
docker-compose up -d

# Verifică starea
docker-compose ps
```

**Servicii disponibile:**
- PostgreSQL: `localhost:5432` (user: `quizrealm`, password: din `.env`)
- Redis: `localhost:6380` (port configurat în `.env`)
- MinIO Console: `http://localhost:9001` (user/password din `.env`)

### 3️⃣ Setup Backend API

```bash
cd backend/api

# Instalează dependențe
npm install

# Setup Prisma
npm run prisma:generate
npm run prisma:migrate:dev

# Seed taxonomy inițial
npm run prisma:seed
npm run prisma:seed:verify

# Pornește dev server
npm run start:dev
# API la http://localhost:3000
```

### 4️⃣ Setup Backend Realtime

```bash
cd backend/realtime

# Instalează dependențe
npm install

# Pornește dev server
npm run start:dev
# Socket.IO la ws://localhost:3001
```

### 5️⃣ Setup Backend Workers

```bash
cd backend/workers

# Instalează dependențe
npm install

# Pornește dev server
npm run start:dev
# Job processor rulează pe Redis
```

### 6️⃣ Setup Mobile App

```bash
cd mobile

# Instalează dependențe
flutter pub get

# Rulează pe emulator/device
flutter run

# Build debug APK
flutter build apk --debug

# Build release APK
flutter build apk --release
```

---

## 📁 Structura Proiectului

```
quizrealm/
├── README.md                          # Acest fișier
├── audit.md                           # Audit complet al proiectului
├── plan.md                            # Planul detaliat (viziune, stack, modele date)
├── init.md                            # Pași bootstrap și inițializare
├── passed.md                          # Pași completați și rămași
├── agents.md                          # Ghid pentru AI agents
│
├── mobile/                            # Aplicația Flutter
│   ├── lib/
│   │   ├── main.dart                  # Entry point
│   │   ├── app.dart                   # Material app config
│   │   ├── core/                      # Utilități, UI, networking
│   │   ├── data/                      # Repositories, datasources
│   │   ├── domain/                    # Entities, usecases
│   │   └── features/                  # Ecrane și widgets
│   ├── assets/questions/              # Pachete offline de întrebări
│   ├── test/                          # Teste unitare
│   ├── android/                       # Config build Android
│   ├── windows/                       # Config build Windows (dev)
│   └── pubspec.yaml                   # Dependențe Flutter
│
├── backend/
│   ├── api/                           # NestJS REST API
│   │   ├── src/
│   │   │   ├── app.module.ts          # Root module
│   │   │   ├── main.ts                # Entry point
│   │   │   ├── auth/                  # Login, JWT, OAuth
│   │   │   ├── users/                 # Profil, statistici
│   │   │   ├── questions/             # CRUD întrebări
│   │   │   ├── matches/               # Istoric partide
│   │   │   ├── ranks/                 # Trepte rang
│   │   │   ├── leaderboard/           # Clasament
│   │   │   ├── chat/                  # Messaging (in progress)
│   │   │   ├── social/                # Prieteni, blocări (in progress)
│   │   │   └── cosmetics/             # Magazin (planificat)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Definiție bază date
│   │   │   ├── seed.ts                # Seed taxonomy
│   │   │   └── migrations/            # Migrări versionate
│   │   └── package.json               # Dependențe Node.js
│   │
│   ├── realtime/                      # NestJS Socket.IO
│   │   ├── src/
│   │   │   ├── game/                  # Game state, match logic
│   │   │   ├── auth/                  # JWT validation
│   │   │   ├── redis/                 # Redis client
│   │   │   └── api-client/            # HTTP client la API
│   │   ├── EVENTS.md                  # Contract Socket.IO
│   │   └── package.json
│   │
│   └── workers/                       # BullMQ job processor
│       ├── src/
│       │   ├── jobs/                  # Definiții job-uri
│       │   ├── questions/             # Generare + validare AI
│       │   ├── cli/                   # CLI tools
│       │   └── prisma/                # Database shared
│       └── package.json
│
├── infra/                             # Infrastructure & DevOps
│   ├── docker-compose.yml             # Postgres, Redis, MinIO
│   ├── docker-compose.prod.yml        # Production config
│   ├── .env.example                   # Template variabile mediu
│   ├── generate-prod-env.sh           # Script setup producție
│   └── cloudflared/                   # Cloudflare tunnel config
│
├── docs/                              # Documentație
│   ├── plan.md → plan.md (link rădăcină)
│   ├── init.md → init.md (link rădăcină)
│   ├── features-social-progression.md # Chat, prieteni, achievements
│   ├── deploy-vps.md                  # Deploy self-hosted
│   └── adr/                           # Architecture Decision Records
│       ├── 0001-use-prisma-for-postgresql.md
│       ├── 0002-realtime-duo-event-contract.md
│       ├── 0003-defer-question-bootstrap-for-mobile-prototype.md
│       ├── 0004-offline-curated-campaign-pack.md
│       ├── 0005-duo-multiplayer-in-app.md
│       ├── 0006-rank-tiers-and-leaderboard.md
│       ├── 0007-match-reconnection.md
│       └── 0008-identity-and-sessions.md
│
└── .github/
    └── workflows/
        └── build-apk-release.yml      # CI/CD: Build + Release
```

---

## 🎮 Moduri de Joc

### 1. Solo Campaign (✅ Implemented)
- 9 ținuturi, câte 15 întrebări
- Progres local (stele per ținut, XP, nivel)
- Offline complet — nu cere backend

### 2. Duel Duo 1v1 (✅ Core implemented)
- Matchmaking pe ELO simplu
- Runde multiple (default 5)
- Server-side verdict pe răspunsuri
- ELO recalculat la final

### 3. Blitz (🔄 Planificat)
- Variantă rapidă, mai puține runde
- Timpi mai scurți pe răspunsuri

### 4. Mod Clasic (🔄 Planificat)
- Hartă cu teritorii
- Atac/apărare pe răspunsuri corecte
- 3-4 runde competitive

### 5. Partidă Privată (🔄 Planificat)
- Camera cu cod/link
- Poți completa cu roboți
- Alegi categoriile

---

## 📊 Roadmap

### Faza 0 — Bootstrap (2026-08-15)
- [x] Structură monorepo
- [x] Backend API + Realtime + Workers
- [x] Flutter app offline
- [x] Schema bază date
- [x] Autentificare
- [x] Audit complet
- [ ] Banca de ~5.000 întrebări (BLOCKER)
- [ ] Git commit history

### Faza 1 — MVP Multiplayer (2026-09-15)
- [ ] Duel Duo complet (cu reconectare)
- [ ] Leaderboard real-time
- [ ] ELO + sistem rang
- [ ] Logging + Monitoring
- [ ] E2E tests

### Faza 2 — Social MVP (2026-10-15)
- [ ] Chat (global + DM)
- [ ] Sistem prieteni
- [ ] Profil avansat
- [ ] Notificări push

### Faza 3 — Gameplay Extended (2026-11-15)
- [ ] Blitz mode
- [ ] Mod Clasic
- [ ] Partidă privată
- [ ] Roboți configurabili
- [ ] Anti-cheat avansat

### Faza 4 — Retenție & Monetizare (2026-12-15)
- [ ] Cosmetice + magazin
- [ ] Achievements + badges
- [ ] Sezoane
- [ ] Battle pass

### Public Beta (2027-01-01)
- [ ] Soft launch

---

## 🐛 Audit & Probleme Cunoscute

Consultă [audit.md](audit.md) pentru analiza completă a proiectului, inclusiv:

### 🔴 Blockers Critici
1. **Banca de întrebări** — Doar 14 aprobate, trebuie ~500-2.000 pentru MVP
2. **Reconectare** — Acceptată în design (ADR0007) dar not implemented
3. **Git history** — Repo inițializat dar fără commits (acum fixat)

### ⚠️ Probleme Importante
- Chat: schema doar, fără logică
- Prieteni: neimplementat
- Leaderboard: parțial (recalcul real-time lipsă)
- Logging: Prometheus menționat dar absent

### ✅ Ce Funcționează Bine
- Backend API solid
- Socket.IO realtime (duel)
- Flutter app (solo offline)
- Sistem rang și ELO

---

## 🛠️ Comenzi Utile

### Backend

```bash
# Setup database
cd backend/api
npm run prisma:migrate:dev
npm run prisma:seed

# Generate questions
npm run questions:curated

# Run tests
npm run test
npm run test:cov

# Lint & format
npm run lint
npm run format
```

### Mobile

```bash
cd mobile

# Run on emulator
flutter run

# Build & test
flutter test
flutter test --coverage

# Build APK
flutter build apk --debug      # Debug
flutter build apk --release    # Release (signed with debug key)

# Format & analyze
dart format .
flutter analyze
```

### Docker

```bash
cd infra

# Start all services
docker-compose up -d

# Logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop
docker-compose down
```

---

## 🤝 Contributing

Procedura de contribuție:

1. **Fork** repository
2. **Creează branch** pentru feature: `git checkout -b feature/coolstuff`
3. **Commit changes**: `git commit -m "feat: implement cool feature"`
4. **Push** to branch: `git push origin feature/coolstuff`
5. **Deschide Pull Request** cu descriere detaliată

### Stiluri & Convenții

- **Commits**: Semantic Versioning: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- **Branches**: `feature/`, `bugfix/`, `docs/`, `refactor/`
- **Code**: Dart/TypeScript strict mode, `flutter analyze` & `eslint` trebuie să treacă
- **Tests**: Min. 70% coverage pe logic critică

---

## 📦 Releases

Releases sunt generate automat la fiecare push pe `main` via GitHub Actions:

1. **APK Debug** — testing & debugging
2. **APK Release** — producție (signed cu debug key, upgrade la production key înainte de store)
3. **Git Tag** — semantic version
4. **Changelog** — commit history

Descarcă din [GitHub Releases](https://github.com/zedkode/quitzrealm/releases)

---

## 📝 Documentație Detaliată

- [**plan.md**](plan.md) — Planul complet (viziune, stack, modele date, roadmap)
- [**init.md**](init.md) — Pași bootstrap și inițializare
- [**passed.md**](passed.md) — Status completare și rămași
- [**audit.md**](audit.md) — Audit complet cu probleme și recomandări
- [**docs/features-social-progression.md**](docs/features-social-progression.md) — Chat, prieteni, achievements
- [**docs/deploy-vps.md**](docs/deploy-vps.md) — Deploy pe VPS propriu
- [**docs/adr/**](docs/adr/) — Architecture Decision Records (8 ADR-uri)

---

## 📄 License

**Proprietary License** — © 2024-2026 **DohotStudio**. All Rights Reserved.

This software is proprietary and confidential. Unauthorized access, copying, 
modification, distribution, or use is strictly prohibited.

👉 [Read Full License](LICENSE)

### Legal Notice

- ✋ **No distribution** — Orice distribuire fără permisiune e interzisă
- 🔒 **Proprietary code** — Codul sursă e confidențial și protejat
- ⚖️ **All rights reserved** — Toate drepturile asupra proprietății intelectuale aparțin DohotStudio
- 📞 **Contact pentru licență** — Pentru utilizare comercială/comercială, contactați DohotStudio

---

## 📞 Contact

**Studio:** DohotStudio  
**Email:** contact@dohotstudio.com  
**GitHub:** [@zedkode](https://github.com/zedkode)  
**License Inquiries:** Contactați studio pentru detalii despre licență

---

## 🎖️ Crédite

Inspirație din:
- **conQUIZtador2** — gameplay clasic (teritorii, duel, scor)
- **Discord** — design social (chat, trepte, prieteni)
- **League of Legends** — sistem rang și seasonal
- **Duolingo** — progres și retenție
- **Chess.com** — ELO rating

---

**Construit cu ❤️ de Dohot Studio**  
**QuizRealm v1.3.2 — 2026**

Last updated: 2026-08-15
