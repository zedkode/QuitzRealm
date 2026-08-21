# Conținut și banca de întrebări — registru de task-uri

**Disciplină:** producția, verificarea și întreținerea conținutului de joc.
**Prefix ID:** `CNT-`
**Convenții:** [`00-README.md`](00-README.md)

Într-un joc de trivia, **banca de întrebări e produsul**. Codul e ambalajul.
Prima versiune a registrelor îi dădea șase task-uri tehnice, ceea ce era o
subestimare gravă: la 20 de categorii × 5 niveluri de dificultate × 2 limbi, cu
anti-repetiție serioasă, vorbim de zeci de mii de întrebări verificate.

Riscul dominant al proiectului nu e tehnic. E că un jucător vede aceeași
întrebare a treia oară într-o seară, sau una greșită factual, și nu se mai
întoarce. Niciun sistem de rang, sezon sau cosmetic nu compensează asta.

---

## Grupa A · Volumul necesar și de unde vine

#### CNT-001 · Calculul volumului-țintă
- **Status:** ⬜ De făcut
- **Descriere:** Câte întrebări sunt necesare, pe categorie, dificultate și limbă, ca un jucător intens să nu vadă o repetiție într-o lună.
- **Implementare corectă:** Se pornește de la fereastra de anti-repetiție și de la câte întrebări consumă o partidă. Un jucător care face 10 partide pe zi × 15 întrebări × 30 de zile vede 4.500 de întrebări pe lună. Cu 20 de categorii, ținta rezultă direct — și e mult mai mare decât pare la prima vedere. Cifra se calculează **înainte** de a începe producția, altfel se produce în direcția greșită.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Produce:** CNT-002, GD-003

#### CNT-002 · Pipeline de generare asistată
- **Status:** ⬜ De făcut
- **Descriere:** Generarea în masă a unei baze de pornire, pe categorie și dificultate.
- **Implementare corectă:** Generarea propune, **omul dispune** — nimic nu intră în joc fără trecere prin coada de revizuire. Fiecare întrebare generată vine cu sursa declarată, ca verificarea să fie posibilă. Lotul se produce pe categorie și dificultate, nu la întâmplare, ca acoperirea să fie uniformă. Se rulează pe limbă, nu se traduce mecanic din română.
- **Finalizat:** —
- **Sursă:** `plan.md` §5.1 (de la linia 133)
- **Commit:** —
- **Produce:** SRV-055, ADM-021

#### CNT-003 · Verificarea faptelor
- **Status:** 🟡 Parțial
- **Descriere:** O întrebare greșită factual costă mai mult decât zece întrebări lipsă. Trebuie un proces, nu o citire rapidă.
- **Implementare corectă:** Fiecare întrebare are `verification_source` completat cu o sursă verificabilă. Pachetul curatoriat existent a fost verificat de un agent pe surse oficiale, **nu de un recenzent uman** — starea asta e consemnată și trebuie remediată înainte de lansare pentru categoriile sensibile: istorie, geografie, știință. Un al doilea om verifică un eșantion aleatoriu din fiecare lot.
- **Finalizat:** —
- **Sursă:** `plan.md` §5.3 (de la linia 133)
- **Commit:** —
- **Produce:** ADM-018

#### CNT-004 · Guvernanța calității
- **Status:** ⬜ De făcut
- **Descriere:** Regulile scrise după care o întrebare e bună: formulare, ambiguitate, variante plauzibile, lungime, ton.
- **Implementare corectă:** Un ghid de stil pe care îl aplică și generarea, și revizorii umani, și contribuitorii din comunitate. Reguli concrete: variantele greșite trebuie să fie plauzibile, nu absurde; o întrebare nu are voie să conțină răspunsul în formulare; fără „care dintre următoarele NU este" la dificultăți mici. Ghidul e și criteriul de respingere din coada de revizuire, ca deciziile să fie consecvente între moderatori.
- **Finalizat:** —
- **Sursă:** `plan.md` §5.3 (de la linia 133)
- **Commit:** —
- **Produce:** ADM-017, CNT-002

#### CNT-005 · Acoperirea pe categorii și dificultăți
- **Status:** ⬜ De făcut
- **Descriere:** Raportul care arată golurile: ce categorie are prea puține întrebări grele, ce limbă rămâne în urmă.
- **Implementare corectă:** Matrice categorie × dificultate × limbă, cu ținta din CNT-001 și starea reală. E documentul după care se decide ce se produce săptămâna următoare. Un gol la dificultatea 5 într-o categorie populară se vede aici înainte să-l vadă jucătorii.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Produce:** ADM-022, ADM-023

---

## Grupa B · Localizare de conținut

#### CNT-006 · Traducerea interfeței, nu doar a întrebărilor
- **Status:** ⬜ De făcut
- **Descriere:** Toate cheile de traducere din produs, completate în fiecare limbă activă.
- **Implementare corectă:** Traducerea se face **în context**, nu pe o listă de chei — „Play" înseamnă altceva pe un buton decât într-un titlu. Panoul de traduceri arată unde apare fiecare cheie. O limbă nu se activează pentru jucători până când acoperirea nu e completă; parțial tradusă e mai rău decât netradusă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Produce:** ADM-055, WEB-004, APP-004

#### CNT-007 · Adaptare culturală, nu traducere literală
- **Status:** ⬜ De făcut
- **Descriere:** O întrebare despre un cântăreț român n-are sens în poolul global, chiar tradusă perfect.
- **Implementare corectă:** Categoria „România specific" se generalizează la „[Țară] specific" per pool, iar pentru poolul global devine „cultură generală internațională". Întrebările marcate ca specifice unei culturi **nu se traduc automat** în alte limbi. Regula intră în ghidul de stil.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Produce:** CNT-004

#### CNT-008 · Banca în engleză
- **Status:** ⬜ De făcut
- **Descriere:** A doua limbă de lansare, care deservește poolul global.
- **Implementare corectă:** Se produce independent, nu prin traducerea băncii românești — un pool global are alte referințe culturale. Volumul-țintă e cel puțin egal cu cel românesc, pentru că poolul global e potențial mai mare. Fără ea, orice jucător care alege engleza intră într-un joc gol.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.8 (de la linia 462)
- **Commit:** —
- **Produce:** CNT-005

#### CNT-009 · Contribuții de traducere din comunitate
- **Status:** ⬜ De făcut
- **Descriere:** Jucătorii de încredere care vorbesc două limbi traduc și adaptează întrebări către o limbă nouă.
- **Implementare corectă:** Deschis de la treapta T4. Trece prin aceeași coadă de moderare ca întrebările din comunitate. E singurul mecanism care face extinderea dincolo de două limbi sustenabilă — altfel fiecare limbă nouă e un cost intern complet.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.10 (de la linia 743)
- **Commit:** —
- **Produce:** GD-020, ADM-055

#### CNT-010 · Criteriul de adăugare a unei limbi noi
- **Status:** ⬜ De făcut
- **Descriere:** Când se adaugă a treia limbă și pe ce bază.
- **Implementare corectă:** **Pe cerere reală, nu speculativ**: câți jucători au ales o limbă neacoperită și au fost direcționați către poolul global. Cifra se măsoară din ziua unu, chiar dacă decizia vine peste un an. Recomandarea fermă din plan: nu se lansează cu mai mult de două limbi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.8 (de la linia 462)
- **Commit:** —
- **Produce:** DATA-009

---

## Grupa C · Formate noi și conținut recurent

#### CNT-011 · Întrebări numerice
- **Status:** 🟡 Parțial
- **Descriere:** Al doilea format, unde răspunsul e un număr și câștigă cine se apropie cel mai mult.
- **Implementare corectă:** Tipul există în schemă. Ce lipsește e conținutul dedicat și regula de punctaj pe apropiere — o întrebare numerică fără toleranță definită e nejucabilă. Formatul e valoros tocmai pentru că nu se poate ghici din patru variante.
- **Finalizat:** —
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Produce:** GD-003

#### CNT-012 · Conținut pentru modul Detectiv
- **Status:** 🔒 Blocat pe GD-007
- **Descriere:** Al treilea format: indicii ordonate de la vag la evident, despre un subiect.
- **Implementare corectă:** Fiecare intrare are 4–6 indicii, ordonate strict de la general la specific. **Nu se poate genera cu același flux ca grila** — cere un tip de scriere diferit și verificare că indiciile chiar restrâng progresiv. Producția e mai lentă, deci se pornește devreme dacă modul intră la lansare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.9 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-050

#### CNT-013 · Conținut recurent săptămânal
- **Status:** ⬜ De făcut
- **Descriere:** Setul de întrebări grele pentru Boss-ul săptămânal și temele de eveniment.
- **Implementare corectă:** O temă și un set nou pe săptămână, produse în avans, cu **cel puțin patru săptămâni de rezervă** — un joc live care rămâne fără conținut se vede imediat. Temele se planifică în calendarul de sezon, nu se improvizează vineri.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.5 (de la linia 743)
- **Commit:** —
- **Produce:** GD-008, GD-031

#### CNT-014 · Întrebarea zilei și Ora Marelui Duel
- **Status:** ⬜ De făcut
- **Descriere:** Selecția manuală sau automată a întrebărilor pentru cele două momente colective zilnice.
- **Implementare corectă:** Alese **dinainte**, nu la cerere, pe fiecare limbă. Trebuie să fie întrebări bune — sunt cele mai văzute din tot jocul, iar una slabă e văzută de toți în aceeași zi. Rezervă de cel puțin 30 de zile.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.1, §15.2
- **Commit:** —
- **Produce:** SRV-060, GD-009

---

## Grupa D · Întreținere

#### CNT-015 · Ciclul de viață al unei întrebări
- **Status:** ⬜ De făcut
- **Descriere:** Ce se întâmplă cu o întrebare după ce intră în joc: se folosește, se raportează, se corectează, se retrage.
- **Implementare corectă:** O întrebare retrasă **nu se șterge** — meciurile vechi trebuie să o poată numi în continuare. Corectarea unei întrebări deja jucate nu rescrie rezultatele trecute. Întrebările cu rată de răspuns corect sub un prag intră automat în revizuire: fie sunt greșite, fie sunt prost formulate.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 2
- **Commit:** —
- **Produce:** ADM-020, SRV-054

#### CNT-016 · Tratarea rapoartelor de la jucători
- **Status:** ⬜ De făcut
- **Descriere:** Cine se uită la întrebările raportate și în cât timp.
- **Implementare corectă:** Ținta: orice întrebare cu trei rapoarte independente e revizuită în 48 de ore. Rapoartele **grupate pe întrebare**, nu tratate individual. Jucătorul care a raportat corect primește o confirmare — e cel mai ieftin mod de a încuraja raportarea de calitate.
- **Finalizat:** —
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Produce:** ADM-020

#### CNT-017 · Curățarea duplicatelor
- **Status:** ⬜ De făcut
- **Descriere:** La zeci de mii de întrebări din surse multiple, duplicatele apar inevitabil.
- **Implementare corectă:** Detectare prin similaritate de text la import și periodic peste banca existentă. Două întrebări cu aceeași idee formulată diferit sunt tot duplicat pentru jucător — nu e suficientă potrivirea exactă.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Produce:** SRV-055

#### CNT-018 · Moderarea contribuțiilor la scară
- **Status:** ⬜ De făcut
- **Descriere:** Coada de revizuire funcționează la zece trimiteri pe zi. La o mie nu.
- **Implementare corectă:** Prioritizare după reputația contribuitorului, respingere automată a celor care încalcă reguli formale verificabile (lipsă de sursă, variante duplicate), și un al doilea nivel de revizori recrutați din comunitate de la treapta T5 în sus. Se pregătește **înainte** de a fi nevoie, nu după ce coada are trei mii de intrări.
- **Finalizat:** —
- **Sursă:** `plan.md` §5.2 (de la linia 133)
- **Commit:** —
- **Produce:** ADM-017, GRW-010
