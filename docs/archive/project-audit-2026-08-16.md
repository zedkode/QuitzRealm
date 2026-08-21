# QuizRealm — audit de proiect și modernizare grafică

**Data:** 16 august 2026
**Obiectiv:** evaluarea stării actuale a repository-ului și transformarea experienței de duel dintr-o interfață hibridă într-un ecran de joc competitiv, coerent cu direcția dark-fantasy a produsului.

## Concluzie executivă

QuizRealm are deja o bază vizuală valoroasă: o hartă fantasy detaliată, un blazon de brand solid, o paletă premium și capturi de referință bine definite. Problema dominantă nu este lipsa ideilor sau a activelor, ci **aplicarea neuniformă a identității**. Aplicația încă pornește dintr-o temă veche de tip „piatră/pergament”, în timp ce sistemul nou prescrie rame aurii ornamentale, suprafețe bleumarin aproape negre și feedback electric-albastru. Această ruptură este cel mai evidentă în duel, adică în ecranul cu cea mai mare miză de produs. [1] [2] [3]

Au fost implementate remediile cu impact vizual imediat: arena ilustrată de duel, portrete implicite de facțiune, un HUD de confruntare, panou de întrebare cu ramă de joc și răspunsuri cu stări vizuale clare. Intervenția păstrează contractele existente ale ecranului și cheile de test relevante, însă verificarea Flutter completă nu a putut fi executată local deoarece mediul de audit nu conține Flutter sau Dart.

| Arie | Verdict | Prioritate |
|---|---|---|
| Identitate vizuală | Direcție artistică bună, dar implementată prin două sisteme concurente. | Critică |
| Duel live | Experiența principală a fost hibridă; zona de joc a fost modernizată în acest audit. | Critică |
| Calitate automată | Analyzer-ul și testele nu blocau build-ul; această regulă a fost corectată în setul curent de modificări. | Înaltă |
| Compatibilitate SDK | Flutter 3.13.0 din CI era incompatibil cu Dart 3.13; workflow-ul a fost aliniat la Flutter 3.47.0. | Înaltă |
| Documentație de audit | Auditul anterior este parțial depășit de commit-urile și modulele noi din repository. | Medie |

## Probleme confirmate

### 1. Două limbaje vizuale concurente

Tema globală a aplicației încă expune `GamePalette`, `GameText` și componente de tip `GameFrame`, cu tonuri violet-albăstrui, pergament și aur saturat. În paralel, sistemul `QuizRealm` definește culori și componente diferite, măsurate după ecranele de referință: bleumarin aproape negru, aur metalic în trei tonuri, panouri delimitate prin rame duble și albastru electric pentru interacțiune. În plus, documentația de design declară explicit că ecranele nu trebuie să definească local culori, spațieri sau raze. [1] [2] [3]

> **Efect:** utilizatorul percepe unele zone ca „aplicație Flutter cu skin fantasy”, iar altele ca „joc premium”. Un joc nu trebuie să lase această impresie de tranziție între produse diferite.

**Recomandare.** Tokenii `QuizRealmColors`, `QuizRealmTypography`, `GoldFrame`, `FantasyPanel` și butoanele noi trebuie să devină sursa unică de adevăr. Migrarea trebuie să înceapă cu toate ecranele de joc, apoi cu suprafețele sociale și de setări care mai importă `GamePalette`.

### 2. Duelul era ecranul cu cea mai mare inconsistență

Ecranul de duel combina fundalul vechi, panouri de tip pergament, răspunsuri inspirate din carduri de piatră și câteva componente noi. Referința de duel, în schimb, cere o confruntare clară între două facțiuni, cu portrete, cronometru, progres, rame aurii și întrebarea ca element central. [2] [4]

**Remediu aplicat.** Duelul folosește acum o arenă cu facțiune albastră la stânga și crimson la dreapta; HUD-ul conține portrete implicite, nume, scoruri, teritorii și un marcaj central de confruntare. Întrebarea a fost mutată într-un panou bleumarin cu ramă aurie, iar răspunsurile au primit insigne în romb și feedback distinct pentru selectare, răspuns corect sau greșit. [5] [6] [7] [8]

### 3. Activele noi trebuie declarate explicit în manifestul Flutter

Flutter nu include recursiv directoarele de active. Noile portrete erau într-un subdirector nou și ar fi putut lipsi din build dacă manifestul nu era actualizat. Manifestul a fost corectat cu declarația pentru `assets/game/avatars/`. [9]

### 4. Controlul calității nu protejează build-urile de regresii

Fluxul GitHub Actions rulează `flutter analyze` și `flutter test --coverage`, dar ambele etape sunt marcate `continue-on-error: true`. Un analyzer sau un test care eșuează poate fi ignorat de job și un APK poate fi produs în continuare. În același flux, orice push pe `main` poate crea tag și release. [10]

**Remediu aplicat.** Etapele de analiză și test nu mai folosesc `continue-on-error`; ele blochează acum build-ul înainte de generarea APK-urilor. Rămâne recomandată separarea fluxului CI pentru pull request de fluxul de release, astfel încât un release public să fie pornit numai după promovare explicită, tag semnat sau aprobare manuală.

### 5. SDK-ul declarat trebuie verificat și aliniat cu CI

Pachetul mobil declară `sdk: ^3.13.0`, iar CI fixa anterior `flutter-version: '3.13.0'`, care include Dart 3.1.0. Cel mai recent workflow eșua chiar la rezolvarea dependențelor din această cauză. Workflow-ul a fost actualizat la Flutter 3.47.0, versiune stabilă care include Dart 3.13.0. [9] [10] [14]

### 6. Auditul anterior nu mai trebuie folosit drept inventar actual al produsului

Documentul `audit.md` afirmă, printre altele, absența istoricului de commit și lipsa UI-ului social. Repository-ul are acum commit-uri, iar structura mobilă include module social/settings și tokeni de design noi. Acest lucru nu demonstrează automat că toate fluxurile sunt complete, dar demonstrează că inventarul vechi nu mai este o sursă de adevăr pentru decizii de roadmap. [11] [12]

**Recomandare.** Mențineți acest audit ca un document datat și generați un backlog verificabil din cod, teste, endpointuri și walkthrough-uri de produs, nu din afirmații istorice.

## Modernizarea livrată

| Modificare | Impact pentru jucător | Fișier / activ |
|---|---|---|
| Arenă de duel ilustrată | Duelul capătă conflict de facțiuni și profunzime fără a ascunde UI-ul. | `assets/game/duel_arena_backdrop.png` |
| Portrete implicite de duel | Confruntarea are identitate chiar când avatarurile reale nu sunt încă disponibile. | `assets/game/avatars/*.png` |
| Fundal reutilizabil actualizat | Scenele ilustrate pot fi combinate cu particule și vignetă care păstrează lizibilitatea. | `realm_backdrop.dart` |
| HUD cu confruntare | Scorul, adversarul și controlul teritoriilor sunt grupate ca informație de joc. | `duel_scoreboard.dart` |
| Întrebare în panou de joc | Elementul central nu mai arată ca pergament desprins din alt stil. | `duel_screen.dart` |
| Răspunsuri cu stări de joc | Selectarea și verdictele serverului sunt ușor de înțeles din formă, lumină și simbol. | `answer_option.dart` |
| Manifest de active corectat | Portretele sunt incluse în aplicația Flutter. | `pubspec.yaml` |

Noile imagini au fost redimensionate pentru mobil: arena are `1080 × 1920 px`, iar portretele au `512 × 512 px`. Această optimizare reduce semnificativ costul față de fișierele sursă de înaltă rezoluție, păstrând calitate suficientă pentru HUD-ul mobil. Direcția artistică și registrul de active sunt documentate în `ASSETS.md`. [13]

## Validare efectuată

| Verificare | Rezultat | Observație |
|---|---|---|
| Integritate whitespace Git | Trecut | `git diff --check` nu a raportat erori. |
| Fișiere grafice | Trecut | Arena și cele două portrete există, au dimensiuni mobile și transparență unde este necesar. |
| Manifest Flutter | Actualizat | Directorul de portrete este declarat explicit. |
| Workflow CI | Actualizat | Flutter 3.47.0 este aliniat cu Dart 3.13, iar analiza/testele sunt blocante. |
| `flutter analyze` | Neexecutat local | Flutter și Dart nu sunt instalate în mediul de audit. |
| Teste Flutter / golden tests | Neexecutate local | Necesită un runner Flutter configurat; trebuie rulate înainte de merge. |

## Ordinea recomandată pentru următorul sprint

| Ordine | Acțiune | Criteriu de finalizare |
|---:|---|---|
| 1 | Stabilizați toolchain-ul Flutter/Dart și CI. | `flutter analyze` și `flutter test` sunt obligatorii în pull request, fără `continue-on-error`. |
| 2 | Migrați tot duelul la sistemul `QuizRealm`. | Chatul din meci, dialogul de ieșire, ecranul de căutare și rezultatul final nu mai importă tema veche. |
| 3 | Introduceți golden tests pentru duel. | Capturi de referință pentru stările: activ, selectat, corect, greșit, așteptare și rezultat. |
| 4 | Migrați ecranele cu importuri legacy în ordinea impactului. | Home, training, social și setări folosesc tokenii/ramelor canonice sau au excepții documentate. |
| 5 | Înlocuiți fallback-urile cu profilurile reale când sunt disponibile. | Avatarurile fallback apar numai când utilizatorul sau adversarul nu are imagine de profil. |

## Referințe

[1]: ../mobile/lib/app.dart "Punctul de intrare al aplicației"
[2]: ../mobile/lib/core/theme/app_theme.dart "Tema veche și GamePalette"
[3]: design-system.md "Sistemul de design QuizRealm"
[4]: ../design-reference/10-duel-live.png "Referința de duel live"
[5]: ../mobile/lib/core/ui/realm_backdrop.dart "Fundalul reutilizabil al jocului"
[6]: ../mobile/lib/features/duel/widgets/duel_scoreboard.dart "HUD-ul de duel"
[7]: ../mobile/lib/features/battle/widgets/answer_option.dart "Opțiunile de răspuns"
[8]: ../mobile/lib/features/duel/duel_screen.dart "Ecranul de duel"
[9]: ../mobile/pubspec.yaml "Manifestul Flutter și SDK-ul declarat"
[10]: ../.github/workflows/build-apk-release.yml "Fluxul CI/CD APK"
[11]: ../audit.md "Auditul anterior"
[12]: ../mobile/lib/features "Modulele mobile curente"
[13]: ../ASSETS.md "Direcție artistică și inventar de active"
[14]: https://github.com/zedkode/QuitzRealm/actions/runs/31946458636 "Execuția CI care a confirmat conflictul Dart 3.1.0 versus Dart 3.13.0"
