# Analiză și date de produs — registru de task-uri

**Disciplină:** ce se măsoară, cum se măsoară, cine se uită și ce decide.
**Prefix ID:** `DATA-`
**Convenții:** [`00-README.md`](00-README.md)

Registrele aveau agregate zilnice și panouri de afișare, dar nu aveau o
**taxonomie de evenimente** — lista fixă a ce se măsoară și cu ce nume. Fără ea,
fiecare ecran nou inventează propriile evenimente, iar peste șase luni nicio
întrebare nu mai poate fi răspunsă retroactiv.

Regula care traversează registrul: **datele nemăsurate azi nu se pot recupera
mâine.** Un tabel de agregate pornit în luna a treia nu poate spune nimic despre
primele două. De aceea o parte din task-urile de aici merită făcute înainte să
existe ecranele care le consumă.

---

## Grupa A · Fundația

#### DATA-001 · Taxonomia de evenimente
- **Status:** ⬜ De făcut
- **Descriere:** Lista închisă a evenimentelor de produs, cu nume stabil și proprietăți fixe.
- **Implementare corectă:** Convenție de numire `obiect.acțiune`: `match.started`, `match.finished`, `territory.captured`, `question.answered`, `purchase.completed`, `session.started`. Proprietăți obligatorii pe fiecare: momentul, contul, limba, țara, platforma, versiunea clientului. **Un eveniment nou se adaugă doar în lista asta**, altfel nu se poate emite. Numele nu se schimbă niciodată după prima folosire — se adaugă unul nou și se retrage cel vechi.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 2
- **Commit:** —
- **Produce:** SRV-023

#### DATA-002 · Emiterea evenimentelor, server-side
- **Status:** 🟡 Parțial
- **Descriere:** De unde vin datele. Nu de la client.
- **Implementare corectă:** Evenimentele se scriu de server, în aceeași tranzacție cu fapta — un eveniment nu are voie să existe fără fapt, nici invers. Clientul emite doar ce serverul nu poate ști: ce ecran a fost deschis, unde s-a oprit cineva într-o pâlnie, ce buton a fost apăsat. `domain_events` acoperă partea de server; partea de client lipsește complet.
- **Finalizat:** —
- **Sursă:** `SRV-023`
- **Commit:** —
- **Produce:** SRV-023, APP-051

#### DATA-003 · Pâlnii de conversie
- **Status:** ⬜ De făcut
- **Descriere:** Unde se pierd oamenii, pas cu pas.
- **Implementare corectă:** Trei pâlnii instrumentate de la început: **de la instalare la prima partidă terminată**, de la prima partidă la a doua zi, de la deschiderea magazinului la cumpărare. Fiecare pas e un eveniment din taxonomie. Fără instrumentarea de dinainte de lansare, prima lună — cea mai informativă — se pierde definitiv.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254)
- **Commit:** —
- **Produce:** GRW-001

#### DATA-004 · Metricile după care se ia o decizie
- **Status:** ⬜ De făcut
- **Descriere:** Cifrele care contează, separate de cele care doar arată bine.
- **Implementare corectă:** Un set mic, cu ținte scrise: retenție de zi 1, 7 și 30; partide pe jucător activ; timp de așteptare la matchmaking pe pool; rata de raportare a întrebărilor; proporția de jucători care termină un sezon. **Numărul total de conturi nu e o metrică de decizie** — crește mereu și nu spune nimic. Fiecare treaptă de lansare din GRW-015 are un prag numeric din setul ăsta.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254)
- **Commit:** —
- **Produce:** GRW-015

#### DATA-005 · Agregatele zilnice, pornite devreme
- **Status:** ⬜ De făcut
- **Descriere:** Fotografia zilnică a platformei, scrisă o dată și păstrată permanent.
- **Implementare corectă:** Activi, conturi noi, întorși, partide, întrebări răspunse, conturi semnalate, monede emise și cheltuite, venit — **defalcate pe limbă și țară**, altfel nu se poate răspunde la „cum merge poolul global față de cel românesc". Rândul unei zile încheiate nu se recalculează. **Merită pornit înainte de ecranele care îl folosesc**: o zi netrecută prin agregare e pierdută.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §9
- **Commit:** —
- **Produce:** SRV-021, ADM-058

---

## Grupa B · Întrebări la care trebuie să putem răspunde

#### DATA-006 · Cohorte și retenție
- **Status:** ⬜ De făcut
- **Descriere:** Câți dintre cei care au intrat într-o săptămână mai sunt după o zi, șapte, treizeci.
- **Implementare corectă:** Cohorte pe săptămâna de înregistrare, împărțite pe limbă, platformă și canal de intrare. **Se calculează retroactiv doar dacă evenimentele au fost înregistrate** de la început — de aici urgența lui DATA-005. Comparația între cohorte arată dacă o schimbare a ajutat sau a stricat, ceea ce o medie globală ascunde.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §9
- **Commit:** —
- **Produce:** ADM-059

#### DATA-007 · Sănătatea băncii de întrebări
- **Status:** ⬜ De făcut
- **Descriere:** Dacă banca ține pasul cu jucătorii.
- **Implementare corectă:** Rata de repetiție reală per jucător — **cea mai importantă cifră a produsului**, pentru că repetiția e principalul motiv de abandon la un joc de trivia. Plus: întrebări nefolosite niciodată, întrebări suprafolosite, dificultate observată față de cea declarată, rata de raportare pe categorie. Alertă când repetiția depășește un prag pe o categorie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Produce:** CNT-005, SRV-054

#### DATA-008 · Sănătatea competiției
- **Status:** ⬜ De făcut
- **Descriere:** Dacă meciurile sunt echilibrate și dacă rangul înseamnă ceva.
- **Implementare corectă:** Distribuția rangurilor, proporția de meciuri decise la mare diferență, timpul de așteptare pe pool și pe oră, rata de abandon la mijlocul partidei. O distribuție de rang care se adună toată la mijloc înseamnă că pragurile sunt greșite; prea multe meciuri dezechilibrate înseamnă că poolul e prea mic sau potrivirea prea largă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.2 (de la linia 228)
- **Commit:** —
- **Produce:** ADM-041, SRV-045

#### DATA-009 · Cererea pentru limbi neacoperite
- **Status:** ⬜ De făcut
- **Descriere:** Cifra pe baza căreia se decide a treia limbă.
- **Implementare corectă:** Câți jucători au ales o limbă fără bancă și au fost direcționați spre poolul global, pe limbă. **Se măsoară din ziua unu**, chiar dacă decizia vine peste un an — altfel extinderea se face pe intuiție. Planul cere explicit extindere pe cerere reală, nu speculativă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.8 (de la linia 462)
- **Commit:** —
- **Produce:** CNT-010

#### DATA-010 · Sănătatea economiei
- **Status:** ⬜ De făcut
- **Descriere:** Dacă se emit mai multe monede decât se consumă.
- **Implementare corectă:** Emisiune față de consum pe interval, sold mediu pe jucător activ, distribuția soldurilor, clasamentul surselor și al consumatorilor după motivul din registru. O emisiune care depășește constant consumul e inflație: prețurile din magazin devin irelevante, iar mecanica de recompensă își pierde sensul. Se vede aici cu luni înainte să se vadă în joc.
- **Finalizat:** —
- **Sursă:** `GD-001`
- **Commit:** —
- **Produce:** ADM-051, GD-001

#### DATA-011 · Sănătatea moderării
- **Status:** ⬜ De făcut
- **Descriere:** Dacă moderarea ține pasul și dacă e consecventă.
- **Implementare corectă:** Timpul median până la rezolvarea unui raport, coada restantă, proporția de rapoarte confirmate față de respinse, rata de contestații acceptate. **O rată mare de contestații acceptate arată o problemă de criterii**, nu de moderatori. Se urmărește pe moderator, dar pentru instruire, nu pentru clasament.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Produce:** ADM-042, GRW-010

---

## Grupa C · Instrumente și disciplină

#### DATA-012 · Unde se interoghează datele
- **Status:** ⬜ De făcut
- **Descriere:** Interogările de analiză nu au voie să ruleze pe baza care servește jocul.
- **Implementare corectă:** La început e suficientă o **replică de citire** sau interogările rulate pe agregate, nu pe tabelele brute. O interogare de analiză peste tot istoricul de răspunsuri poate încetini o partidă în curs. Când volumul crește, se separă complet.
- **Finalizat:** —
- **Sursă:** `INF-003`
- **Commit:** —
- **Produce:** INF-003

#### DATA-013 · Experimente comparative
- **Status:** ⬜ De făcut
- **Descriere:** Cum se decide dacă o schimbare a ajutat, în loc de a se presupune.
- **Implementare corectă:** Se construiește peste steagurile de funcționalitate, care au deja activare pe procent din jucători. Un experiment are ipoteză, metrică principală aleasă **înainte**, durată minimă și un singur lucru schimbat. Fără metrica declarată dinainte, se găsește mereu o cifră care arată bine. Merită doar la decizii mari: tutorial, curbă de economie, prima experiență.
- **Finalizat:** —
- **Sursă:** `SRV-092`
- **Commit:** —
- **Produce:** SRV-092

#### DATA-014 · Confidențialitatea în analiză
- **Status:** ⬜ De făcut
- **Descriere:** Analiza n-are voie să devină un al doilea loc unde se acumulează date personale.
- **Implementare corectă:** Evenimentele de produs poartă **identificatorul contului, nu e-mailul sau numele**. Rapoartele lucrează pe agregate. Anonimizarea unui cont la cerere trebuie să se propage și în datele de analiză, altfel ștergerea e incompletă și declarația din politica de confidențialitate devine falsă.
- **Finalizat:** —
- **Sursă:** `LEG-003`
- **Commit:** —
- **Produce:** SRV-088, LEG-001

#### DATA-015 · Raportul săptămânal
- **Status:** ⬜ De făcut
- **Descriere:** Un singur loc unde se vede, o dată pe săptămână, dacă produsul merge bine.
- **Implementare corectă:** Metricile de decizie din DATA-004, cu comparație față de săptămâna anterioară și o notă despre ce s-a schimbat. **Scurt** — un raport lung nu se citește, iar unul necitit nu schimbă nimic. Generat automat, cu concluzia scrisă de un om.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254)
- **Commit:** —
- **Produce:** ADM-058
