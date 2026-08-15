# QuizRealm — aplicația mobilă

Joc de cultură generală cu cucerire de ținuturi. Aplicația Flutter din `plan.md` secțiunea 3.1.

## Ce se poate juca acum

Campanie solo, **complet offline**, fără backend și fără cont:

- **9 ținuturi** pe harta regatului, fiecare cu propriul pachet de întrebări curatoriate
  (`assets/questions/*.json`, 15 întrebări în română per ținut, fiecare cu explicație).
- **3 asalturi** per ținut: Avanpostul (5 întrebări / 15s), Cetatea (6 / 13s),
  Sala Tronului (7 / 11s), cu benzi de dificultate crescătoare.
- Întrebări **grilă** și **numerice**, cronometru circular, bonus de timp și multiplicator
  de serie până la ×3.
- **Stele** (3 = asalt perfect), **XP și niveluri**, progres salvat local pe dispozitiv.
- Ținuturile noi se deblochează cu stele; asaltul următor cere o stea în cel precedent.

### Duel online 1v1 (Faza 2)

- Matchmaking prin `backend/realtime`, partidă de **5 runde**, cu adversar real.
- Tabelă „tu contra adversar” cu scor și teritorii cumulate, cronometru per rundă.
- După fiecare rundă vezi răspunsul corect, ce a răspuns fiecare și în cât timp.
- Verdictul vine **exclusiv de la server**; clientul nu vede răspunsul corect înainte
  de a trimite și nu calculează scorul.
- Necesită cont (JWT la handshake). Campania offline rămâne fără cont.

Pentru a testa duelul de pe un singur dispozitiv, pornește un al doilea jucător:

```bash
cd backend/realtime
node scripts/sparring-partner.js --email=<cont2> --password=<parola>
```

## Rulare

```bash
flutter pub get

# Android (platforma-țintă)
flutter run -d <device-id>

# Desktop Windows, util în dezvoltare.
# Necesită „Developer Mode" activat în Windows (plugin-urile au nevoie de symlink-uri).
flutter run -d windows
```

Pentru fluxul online (cont, întrebări din API, duel), pornește stack-ul și
redirecționează ambele porturi către telefon:

```bash
cd infra && docker compose up -d          # Postgres, Redis (6380), MinIO
cd ../backend/api && npm run start        # API pe 3000
cd ../realtime && npm run start           # realtime pe 3001

adb reverse tcp:3000 tcp:3000
adb reverse tcp:3001 tcp:3001
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=REALTIME_BASE_URL=http://localhost:3001
```

## Verificări

```bash
flutter analyze
flutter test          # reguli de scor, progres, pachete de întrebări, controller, widget-uri, layout
flutter build apk --debug
```

Testele includ verificări de conținut: fiecare pachet livrat trebuie să aibă id-uri unice,
texte neduplicate, 4 variante distincte la grilă cu răspunsul corect printre ele și explicație
obligatorie. `test/data/pack_bundle_test.dart` joacă efectiv fiecare asalt din assets, deci o
declarație lipsă din `pubspec.yaml` cade la teste, nu pe telefon.

## Structură

```
lib/
├── core/
│   ├── network/      # client HTTP centralizat (singurul loc cu apeluri REST)
│   ├── providers/    # providere Riverpod
│   ├── theme/        # paletă și tipografie de joc
│   └── ui/           # design system: iconografie vectorială, panouri, butoane, fundal animat
├── data/
│   ├── auth/         # repository REST de autentificare
│   ├── pack/         # pachete curatoriate + sursă de rundă offline
│   ├── progress/     # progresul campaniei, salvat local
│   └── question/     # repository REST de întrebări (verdict server-side)
├── domain/
│   ├── battle/       # reguli de punctaj și abstracția `RoundSource`
│   ├── campaign/     # ținuturi, asalturi, progres
│   └── question/     # entitățile întrebării
└── features/
    ├── auth/         # cont opțional
    ├── battle/       # ecranul de asalt și rezultatul
    ├── map/          # harta regatului
    └── title/        # ecranul-titlu
```

Deciziile care se abat de la `plan.md` sunt documentate în `docs/adr/`, în special
`0004-offline-curated-campaign-pack.md`.

## Assets ilustrate

Ilustrațiile livrate de proprietar stau la rezoluție de producție în
`assets_src/game/` — folder **nedeclarat** în `pubspec.yaml`, deci în afara
bundle-ului. În aplicație intră doar varianta redimensionată din
`assets/game/`, generată cu:

```bash
dart run tool/optimize_assets.dart
```

Motivul: markerele sunt 1254², plăcile de meniu 2172×724, adică de 8-23× peste
dimensiunea la care sunt desenate. Livrate ca atare dădeau un APK de 264 MB;
după redimensionare, 84 MB (assets: 194 MB → 16 MB, calitate neschimbată la
densitate 3×). Când adaugi ilustrații noi, pune-le în `assets_src/` și rulează
scriptul — nu edita `assets/game/` manual.

**Flutter nu include subdirectoarele de assets recursiv**: fiecare folder nou
trebuie adăugat explicit în `pubspec.yaml`. `test/core/ui/game_assets_test.dart`
încarcă fiecare ilustrație prin bundle-ul real, deci o declarație uitată pică
în teste, nu pe telefon.

### Plăcile de meniu au textul pictat în imagine

`assets/game/Buttons/<limbă>/` conține butoanele ilustrate. Textul fiind parte
din artă, `ArtButton` revine automat la `GameButton` (etichetă din i18n) pentru
limbile fără set de plăci — vezi `ArtButton._illustratedLocales`.

## Build către serverul public

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://quizrealmapi.dohotstudio.com \
  --dart-define=REALTIME_BASE_URL=https://quizrealmws.dohotstudio.com
```
