# Calitate și livrare — registru de task-uri

**Disciplină:** testare, verificare, procesul prin care codul ajunge la jucători.
**Prefix ID:** `QA-`
**Convenții:** [`00-README.md`](00-README.md)

Testele existau răspândite prin celelalte registre, fără o strategie care să
spună ce se testează, la ce nivel și ce blochează livrarea. Registrul ăsta o
scrie.

Starea de plecare e mai bună decât media: 134 de teste pe API trec, analiza și
testele blochează deja build-ul de Android, iar migrările sunt aditive. Ce
lipsește e acoperirea acolo unde greșelile costă cel mai mult — jocul în timp
real și fluxurile de la un capăt la altul.

---

## Grupa A · Strategia

#### QA-001 · Ce se testează și la ce nivel
- **Status:** ⬜ De făcut
- **Descriere:** Fără o regulă scrisă, testele se scriu unde e ușor, nu unde contează.
- **Implementare corectă:** Regula pe trei niveluri. **Unitar** pentru funcțiile pure care decid rezultate: punctaj, adiacență, tranziții de proprietate, trepte de încredere, scor de încredere, ELO — sunt ieftine și acolo greșelile sunt cele mai scumpe. **Integrare** pentru fiecare endpoint care schimbă date sau bani. **De la un capăt la altul** doar pentru cele patru-cinci parcurgeri critice, pentru că sunt lente și fragile. Nimic care ține de bani, rang sau cucerire nu se livrează fără test unitar.
- **Finalizat:** —
- **Sursă:** `agents.md`
- **Commit:** —
- **Produce:** QA-002, QA-005

#### QA-002 · Acoperirea zonelor cu risc mare
- **Status:** 🟡 Parțial
- **Descriere:** Nu contează procentul global, ci ce anume nu e acoperit.
- **Implementare corectă:** Lista zonelor unde o regresie e inacceptabilă: portofel și registru, aplicarea rezultatului pe hartă, calculul de rang, garda de acces la admin, validarea sesiunii pentru conturi suspendate, anonimizarea la ștergere. Fiecare are teste; o modificare acolo fără test nou se respinge la revizuire. `WalletService` și garda de admin au deja acoperire.
- **Finalizat:** —
- **Sursă:** `backend/api/src/admin/admin.guard.spec.ts`
- **Commit:** `4861e4a`
- **Produce:** QA-001

#### QA-003 · Testarea logicii de joc în timp real
- **Status:** 🟡 Parțial
- **Descriere:** Zona cu cele mai multe stări și cea mai greu de verificat manual.
- **Implementare corectă:** Rezolvarea bătăliei, eliminarea, punctajul, selecția de categorii și starea de teritoriu au deja teste. Ce lipsește: scenariile de **concurență și eșec** — doi jucători care răspund în aceeași milisecundă, un jucător care se deconectează la finalul rundei, o reconectare exact la expirarea ferestrei, doi atacatori pe același teritoriu. Acolo apar bug-urile care se văd ca „mi-a furat teritoriul".
- **Finalizat:** —
- **Sursă:** `backend/realtime/src/game/`
- **Commit:** —
- **Produce:** SRV-040

#### QA-004 · Teste vizuale de referință
- **Status:** 🟡 Parțial
- **Descriere:** Capturi de referință pentru stările ecranelor de joc.
- **Implementare corectă:** Stările duelului: activ, selectat, corect, greșit, așteptare, rezultat. Se generează **pe CI, pe Linux** — redarea fonturilor pe Windows produce diferențe sub un procent care nu sunt regresii. Regula, învățată deja: un test de referință care pică local dar trece pe CI **nu se regenerează**.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, sprintul recomandat
- **Commit:** —
- **Produce:** APP-044

#### QA-005 · Parcurgerile critice, testate cap-coadă
- **Status:** ⬜ De făcut
- **Descriere:** Cele câteva drumuri care nu au voie să se strice niciodată.
- **Implementare corectă:** Înregistrare cu alegerea țării și limbii; tutorialul cu bot până la capăt; un meci Clasic de la coadă până la rezultat și până la schimbarea hărții; reconectarea după întrerupere; cumpărarea unui cosmetic. Rulează pe **backend real** pornit în container, nu pe răspunsuri simulate — altfel testul trece și produsul cade.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** WEB-042, APP-045

---

## Grupa B · Verificări automate

#### QA-006 · Porțile din CI
- **Status:** 🟡 Parțial
- **Descriere:** Ce blochează un pull request.
- **Implementare corectă:** Analiză statică, teste, compilare pe toate cele patru componente, verificarea că tipurile generate din contract corespund celor comise, buget de mărime a bundle-ului, scanare de dependențe. Analiza și testele Flutter blochează deja. **Nimic marcat ca „continuă la eroare"** — o poartă care se poate ignora nu e poartă.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 4
- **Commit:** `faa8894`
- **Produce:** SRV-085, WEB-039

#### QA-007 · Separarea verificărilor de release
- **Status:** ⬜ De făcut
- **Descriere:** Azi orice împingere pe `main` poate produce un release public.
- **Implementare corectă:** Un flux de verificări la pull request și unul de release pornit **doar** de un tag explicit sau de o aprobare manuală. Versiunea crește controlat, nu la fiecare împingere. E și condiția ca mai mulți agenți să poată lucra în paralel fără să publice din greșeală.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 4
- **Commit:** —
- **Produce:** SRV-094, APP-047

#### QA-008 · Verificarea migrărilor înainte de producție
- **Status:** ⬜ De făcut
- **Descriere:** O migrare se testează pe date care seamănă cu cele reale, nu pe o bază goală.
- **Implementare corectă:** Rulare pe mediul de testare, cu volum comparabil, cu măsurarea duratei. O migrare care ține tabelul de meciuri blocat câteva minute e o oprire de serviciu, iar la o bază goală nu se vede. Se verifică și că se poate da înapoi.
- **Finalizat:** —
- **Sursă:** `backend/api/prisma/migrations/`
- **Commit:** —
- **Produce:** INF-005, INF-008

#### QA-009 · Actualizarea dependențelor, controlat
- **Status:** 🟡 Parțial
- **Descriere:** Lecția din august: o actualizare poate rupe build-ul de Android fără ca analiza să pice.
- **Implementare corectă:** Actualizări în loturi mici, cu **compilare reală**, nu doar analiză — `flutter analyze` trece cu un graf de dependențe rupt, pentru că nu intră în pub-cache. Familiile de pachete se actualizează împreună, pe aceeași linie de release. Actualizările de securitate au prioritate și termen.
- **Finalizat:** —
- **Sursă:** `mobile/pubspec.yaml`
- **Commit:** `c4963f4`
- **Produce:** INF-011

#### QA-010 · Testarea corectitudinii competitive
- **Status:** ⬜ De făcut
- **Descriere:** Verificarea că un client modificat nu poate câștiga.
- **Implementare corectă:** Teste care încearcă activ să înșele: răspuns trimis după expirarea timpului, răspuns la o întrebare care nu e a rundei curente, două răspunsuri la aceeași rundă, rezultat auto-raportat, cerere de cucerire fără meci. **Toate trebuie respinse de server**, iar testul îl dovedește. E singura garanție că validarea server-side chiar e completă.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180)
- **Commit:** —
- **Produce:** SRV-047, INF-013

#### QA-011 · Verificarea stării înainte de implementare
- **Status:** ⬜ De făcut
- **Descriere:** Un build plecat de pe cod vechi s-a întâmplat deja, cu trei agenți pe același `main`.
- **Implementare corectă:** Verificare automată care refuză implementarea dacă versiunea locală nu e cea de pe `origin/main`. Ieftin, previne exact greșeala produsă.
- **Finalizat:** —
- **Sursă:** `ai/taskmaster.md`, riscuri
- **Commit:** —
- **Produce:** INF-018

---

## Grupa C · Verificare manuală

#### QA-012 · Testare pe dispozitive reale
- **Status:** ⬜ De făcut
- **Descriere:** Emulatorul nu arată nici ce consumă bateria, nici cum se simte pe un telefon slab.
- **Implementare corectă:** Cel puțin trei dispozitive: unul de gamă mică cu Android vechi, unul mediu, unul recent. Se verifică ritmul de redare în timpul unei partide, consumul de baterie pe o sesiune de 20 de minute și comportamentul la trecerea de la Wi-Fi la date mobile. Publicul țintă nu are toată lumea telefon nou.
- **Finalizat:** —
- **Sursă:** `plan.md` §2 (de la linia 45)
- **Commit:** —
- **Produce:** APP-041

#### QA-013 · Verificarea traducerilor în context
- **Status:** ⬜ De făcut
- **Descriere:** O traducere corectă pe o listă de chei poate fi greșită pe ecran.
- **Implementare corectă:** Parcurgerea completă a aplicației și a site-ului în fiecare limbă, căutând: text tăiat, buton crescut peste margine, plural greșit, dată în formatul altei limbi, cheie netradusă rămasă vizibilă. **Româna are trei forme de plural**, iar concatenarea manuală le sparge. Se face înainte de activarea unei limbi pentru jucători.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Produce:** CNT-006

#### QA-014 · Verificarea echilibrului cu jucători reali
- **Status:** ⬜ De făcut
- **Descriere:** Cifrele din foaia de calcul a economiei nu supraviețuiesc contactului cu jucătorii.
- **Implementare corectă:** O sesiune de joc cu oameni care nu au construit produsul, urmărind: cât durează o partidă în realitate, dacă înțeleg cucerirea fără explicații, dacă recompensele par corecte, unde se plictisesc. Se face **înainte** de beta închisă, cu cinci-zece persoane; problemele grave de design apar la primele trei.
- **Finalizat:** —
- **Sursă:** `GD-001`, `GD-002`
- **Commit:** —
- **Produce:** GD-001, GD-002

#### QA-015 · Lista de verificare înainte de fiecare release
- **Status:** ⬜ De făcut
- **Descriere:** Aceleași lucruri se uită de fiecare dată.
- **Implementare corectă:** O listă scurtă, parcursă de fiecare dată: adresele de server din build sunt cele de producție, versiunea a crescut, migrările au rulat pe testare, notele de versiune sunt scrise și traduse, copia de siguranță de dinaintea implementării există, canalul de comunitate e anunțat. Verificarea adreselor din build a prins deja un release cu adrese de dezvoltare.
- **Finalizat:** —
- **Sursă:** `.github/workflows/build-apk-release.yml`
- **Commit:** `faa8894`
- **Produce:** APP-008

#### QA-016 · Procedura de revenire la versiunea anterioară
- **Status:** ⬜ De făcut
- **Descriere:** Ce se face când un release stricat e deja la jucători.
- **Implementare corectă:** Pentru server: revenirea la imaginea anterioară, testată în avans, nu improvizată. Pentru aplicație **nu există revenire** — o versiune publicată nu se poate retrage de pe telefoanele oamenilor, se poate doar publica una nouă, iar aprobarea durează. De aici regula: comutatoarele de funcționalitate sunt mai importante pe client decât pe server, pentru că sunt singura cale de a opri ceva stricat fără un release nou.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Feature Flags
- **Commit:** —
- **Produce:** SRV-092, APP-050
