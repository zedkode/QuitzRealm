# Artă, sunet și mișcare — registru de task-uri

**Disciplină:** producția de active vizuale și sonore, animație, identitate.
**Prefix ID:** `ART-`
**Convenții:** [`00-README.md`](00-README.md)

Registrul ăsta lipsea complet. Consecința cea mai vizibilă: **jocul n-are sunet
deloc** — nicio referință la audio în tot depozitul. Un joc de trivia fără
feedback sonor la răspuns corect sau greșit se simte ca un formular.

A doua consecință: `ASSET_GAPS.md` inventaria activele lipsă, dar nimic nu le
transforma în muncă programată. Inventarul rămâne acolo, ca listă vie; registrul
ăsta îi dă ordine, priorități și termene.

Regula moștenită și păstrată: până apare activul real, ecranul folosește un
substituent **vizibil ca substituent** — niciodată o iconiță de sistem pusă pe
furiș în locul lui, pentru că atunci golul nu se mai vede și nu se mai umple.

---

## Grupa A · Identitate vizuală

#### ART-001 · Unificarea celor două limbaje vizuale
- **Status:** 🟡 Parțial
- **Descriere:** Aplicația are azi două sisteme concurente: tema veche cu pergament și violet, și sistemul QuizRealm cu bleumarin, aur metalic și albastru electric. Jucătorul simte unele ecrane ca „aplicație cu skin" și altele ca „joc".
- **Implementare corectă:** Tokenii din `docs/design-system.md` devin sursa unică. Migrarea începe cu ecranele de joc, apoi social și setări. Duelul a fost deja migrat. Fiecare ecran migrat primește o captură de referință, ca regresia să se vadă.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 1
- **Commit:** `1122c17`
- **Produce:** APP-005, WEB-005

#### ART-002 · Inventarul de active existente
- **Status:** ✅ Implementat
- **Descriere:** Ce există deja și se poate refolosi, ca să nu se producă de două ori.
- **Implementare corectă:** Blazon, 20 de iconițe de categorie, 20 de iconițe de resurse, 10 cufere, 10 insigne de rang, insigne de realizări, harta regatului, markere de hartă, plăci de buton, arena de duel, portrete implicite.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `ASSETS.md`
- **Commit:** —
- **Produce:** —

#### ART-003 · Activele lipsă din capturile de referință
- **Status:** 🟡 Parțial
- **Descriere:** Elemente prezente în capturile aprobate care n-au corespondent în `mobile/assets/`.
- **Implementare corectă:** Inventarul din `ASSET_GAPS.md` se transformă în comenzi de producție, ordonate după ecranele de pe drumul critic: întâi meciul, apoi campania, apoi social. Fiecare activ livrat la rezoluția afișată plus una dublă, nu la rezoluția sursă — arena de duel a fost redimensionată la 1080×1920, portretele la 512×512, iar regula rămâne.
- **Finalizat:** —
- **Sursă:** `ASSET_GAPS.md`
- **Commit:** —
- **Produce:** APP-005

#### ART-004 · Harta României, ca activ vizual
- **Status:** ⬜ De făcut
- **Descriere:** Harta campaniei apare în trei locuri — panou, web, aplicație — și trebuie să arate identic în toate.
- **Implementare corectă:** Desenată **din aceleași coordonate** servite de backend, nu ca imagine separată per platformă. Stări vizuale per teritoriu: liber, deținut de fiecare facțiune, contestat, legendar, atacabil. Cinci stări × trei facțiuni trebuie să se distingă și pentru un daltonist — culoarea singură nu ajunge, e nevoie și de tipar sau contur.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 1
- **Commit:** —
- **Produce:** SRV-028, APP-024, WEB-028

#### ART-005 · Blazoane și culori de facțiune
- **Status:** ⬜ De făcut
- **Descriere:** Trei facțiuni au nevoie de identitate distinctă: culoare, blazon, ton.
- **Implementare corectă:** Culorile trebuie să funcționeze **pe hartă, la dimensiune mică**, unde un județ are câțiva pixeli. Se testează pe harta reală înainte de a fi aprobate, nu pe un fundal alb.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.5 (de la linia 272)
- **Commit:** —
- **Produce:** SRV-027

---

## Grupa B · Sunet — de la zero

#### ART-006 · Direcția sonoră
- **Status:** ⬜ De făcut
- **Descriere:** Cum sună QuizRealm. Nu există nimic azi.
- **Implementare corectă:** Un document scurt care fixează registrul: dark-fantasy cu accente de ceremonie, nu arcade. Se decide devreme, pentru că fiecare efect produs după se raportează la el. Referințe concrete, nu adjective.
- **Finalizat:** —
- **Sursă:** `docs/design-system.md`
- **Commit:** —
- **Produce:** ART-007, ART-008

#### ART-007 · Efecte sonore de joc
- **Status:** ⬜ De făcut
- **Descriere:** Setul minim fără de care partida se simte moartă.
- **Implementare corectă:** Răspuns corect, răspuns greșit, cronometru în ultimele secunde, teritoriu cucerit, teritoriu pierdut, început de rundă, victorie, înfrângere, eliminare. **Sunetul de răspuns corect e cel mai important din tot jocul** — se aude de sute de ori pe sesiune și trebuie să rămână plăcut la a suta oară, nu doar la prima. Fișiere scurte, comprimate, preîncărcate.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Produce:** APP-015, WEB-022

#### ART-008 · Muzică
- **Status:** ⬜ De făcut
- **Descriere:** Fundal pentru meniuri, pentru meci și pentru momentele de tensiune.
- **Implementare corectă:** Bucle scurte care nu obosesc; intensitate care crește în ultimele runde. **Oprită implicit sau la volum mic** — mulți joacă în locuri publice, iar o aplicație care pornește cu muzică tare se dezinstalează. Setare separată pentru muzică și efecte.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Produce:** APP-036

#### ART-009 · Sunet și accesibilitate
- **Status:** ⬜ De făcut
- **Descriere:** Jocul trebuie să fie complet jucabil fără sunet.
- **Implementare corectă:** Nicio informație transmisă **exclusiv** prin sunet. Feedback haptic pe telefon ca al doilea canal la răspuns corect și greșit. Respectarea modului silențios al sistemului.
- **Finalizat:** —
- **Sursă:** `docs/design-system.md`
- **Commit:** —
- **Produce:** APP-043, WEB-038

---

## Grupa C · Mișcare

#### ART-010 · Animația de cucerire
- **Status:** ⬜ De făcut
- **Descriere:** Momentul în care un teritoriu își schimbă stăpânul — cel mai important moment vizual din joc.
- **Implementare corectă:** O **tranziție cu sens**, nu o schimbare instantanee de culoare: teritoriul se umple dinspre marginea atacatorului, cu un puls scurt. Durata sub o secundă, altfel ritmul partidei se rupe. Respectă preferința de mișcare redusă, caz în care schimbarea e instantanee dar cu un contur care marchează ce s-a schimbat.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Produce:** APP-015, WEB-022

#### ART-011 · Feedback la răspuns
- **Status:** 🟡 Parțial
- **Descriere:** Ce se întâmplă vizual în momentul în care apeși un răspuns.
- **Implementare corectă:** Stare de selectat imediat, apoi verdictul serverului: puls verde și expansiune la corect, tremurat scurt la greșit. Selectarea trebuie să fie **instantanee la atingere**, înainte de răspunsul serverului — altfel butonul pare mort pe o conexiune lentă. Opțiunile de răspuns au deja stări distincte în duel.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, modernizarea livrată
- **Commit:** `1122c17`
- **Produce:** APP-015

#### ART-012 · Cronometru circular
- **Status:** ⬜ De făcut
- **Descriere:** Presiunea timpului se citește dintr-un cerc care se golește, nu dintr-un număr.
- **Implementare corectă:** Cerc care se golește, cu schimbare de culoare și ritm în ultimele trei secunde. Numărul rămâne, dar secundar. Sincronizat cu **ceasul serverului**, nu cu cel local — un client cu ora greșită n-are voie să vadă alt timp rămas.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Produce:** APP-015, WEB-022

#### ART-013 · Ecranul de rezultat
- **Status:** ⬜ De făcut
- **Descriere:** Momentul de răsplată: ce ai câștigat, cum s-a schimbat harta, ce rang ai acum.
- **Implementare corectă:** Dezvăluire în trepte, nu tot deodată — scorul, apoi recompensele, apoi schimbarea de rang. Promovarea de rang merită o secvență proprie: e evenimentul cel mai rar și cel mai dorit. Se poate sări, pentru cine joacă zece partide la rând.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.2 (de la linia 228)
- **Commit:** —
- **Produce:** APP-022, WEB-026

#### ART-014 · Insigna de sezon, în etape vizuale
- **Status:** 🔒 Blocat pe GD-015
- **Descriere:** Cosmeticul care evoluează pe parcursul sezonului.
- **Implementare corectă:** **Serie fixă de 5–10 variante**, nu animație continuă sau generare dinamică — altfel costul de artă crește nelimitat cu fiecare sezon.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.3 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-076

---

## Grupa D · Producție și livrare

#### ART-015 · Pipeline de active
- **Status:** ⬜ De făcut
- **Descriere:** Cum ajunge un fișier de la desen la aplicație, fără să umfle build-ul.
- **Implementare corectă:** Sursă la rezoluție mare păstrată în afara depozitului de cod; în depozit intră doar variantele optimizate. Comprimare automată la build. Flutter **nu include recursiv** directoarele de active — fiecare director nou trebuie declarat explicit în manifest, iar omisiunea produce un activ lipsă doar în build-ul de release. Verificare automată că fiecare activ referit în cod există.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 3
- **Commit:** `1122c17`
- **Produce:** APP-041

#### ART-016 · Materiale pentru magazinele de aplicații
- **Status:** ⬜ De făcut
- **Descriere:** Pictogramă, capturi, imagine de prezentare, video scurt — în fiecare limbă.
- **Implementare corectă:** Capturile trebuie să arate **jocul real**, nu machete: magazinele resping listările înșelătoare. Pictograma se testează la 48×48 px, dimensiunea la care o vede lumea în listă. Materialele în română și engleză; o listare doar în română nu apare în căutările din alte țări.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** APP-049

#### ART-017 · Materiale de partajare
- **Status:** ⬜ De făcut
- **Descriere:** Cum arată un rezultat de partidă sau o cronică de sezon când e postat în altă parte.
- **Implementare corectă:** Șabloane de imagine generate **server-side**, ca să arate identic indiferent de unde se partajează. Marca jocului prezentă dar discretă. E cel mai ieftin canal de creștere organică din tot produsul, iar o imagine urâtă îl anulează.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.8 (de la linia 743)
- **Commit:** —
- **Produce:** GD-022, GRW-006
