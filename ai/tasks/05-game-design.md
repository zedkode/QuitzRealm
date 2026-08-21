# Design de joc — registru de task-uri

**Disciplină:** mecanici, moduri, echilibrare, sisteme de progres.
**Prefix ID:** `GD-`
**Convenții:** [`00-README.md`](00-README.md)

Registrul ăsta lipsea complet din prima versiune, iar absența lui era cea mai
gravă: **21 de mecanici gândite în `owner-plan.md` §14 și §15 nu apăreau nicăieri**
în task-uri. Ele sunt exact ce diferențiază QuizRealm de un joc de trivia
obișnuit — restul registrelor construiau infrastructura unui produs generic.

Un task de aici nu se implementează direct. Produce o **specificație** — reguli,
cifre, cazuri limită — din care se scriu apoi task-uri în `SRV`, `WEB`, `APP` sau
`ADM`. Câmpul **Produce** spune unde ajunge.

Ordinea de prioritate e marcată explicit: nu toate cele 21 merită construite
înainte de lansare, iar câteva ar consuma luni pentru un câștig mic.

---

## Grupa A · Fundamentele care lipsesc

Fără astea, mecanicile de mai jos n-au pe ce se așeza.

#### GD-001 · Specificația economiei și curba de câștig
- **Status:** ⬜ De făcut
- **Descriere:** Cât câștigă un jucător pe partidă, cât costă lucrurile, cât durează până își permite ceva. Fără cifrele astea, magazinul e o listă de prețuri inventate.
- **Implementare corectă:** O foaie de calcul cu: monede pe partidă câștigată și pierdută, pe misiune, pe zi de serie; prețul fiecărei categorii de obiect; timpul-țintă până la primul cosmetic (recomandat: 3–5 zile de joc normal). Se simulează un jucător ocazional și unul intens pe 30 de zile. Regula fermă din `plan.md` §9: **fără pay-to-win** — monetizarea nu atinge niciodată dificultatea sau șansa de câștig.
- **Finalizat:** —
- **Sursă:** `plan.md` §9 (de la linia 189); `owner-plan.md` §9 (de la linia 395)
- **Commit:** —
- **Produce:** SRV-073, ADM-051, ADM-047
- **Prioritate:** Înainte de lansare

#### GD-002 · Ritmul unei partide, pe fiecare mod
- **Status:** ⬜ De făcut
- **Descriere:** Câte runde, câte secunde pe întrebare, cât durează o partidă cap-coadă, pe fiecare mod și număr de jucători.
- **Implementare corectă:** Clasic, Blitz, Duo, Privat, Antrenament, plus scalarea la 4–8 jucători. Ținta: Blitz sub 3 minute, Duo 4–6, Clasic 8–12. O partidă de 8 jucători nu poate dura de patru ori cât una de doi — se scalează numărul de runde, nu doar teritoriile. Se testează pe jucători reali, nu se calculează doar pe hârtie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.10 (de la linia 592)
- **Commit:** —
- **Produce:** SRV-036, ADM-024
- **Prioritate:** Înainte de lansare

#### GD-003 · Curba de dificultate și potrivirea întrebării cu jucătorul
- **Status:** ⬜ De făcut
- **Descriere:** Ce dificultate primește cine, și cum evoluează pe parcursul unei partide.
- **Implementare corectă:** Regula de amestec pe rundă (o partidă care începe greu alungă începătorii; una care rămâne ușoară plictisește veteranii). Skill rating pe categorie, separat de ELO general. Regula pentru teritoriile legendare din GD-004: „puțin mai grea" trebuie să însemne o cifră, nu o impresie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Produce:** SRV-054, SRV-053
- **Prioritate:** Înainte de lansare

---

## Grupa B · Straturi de strategie pe hartă

#### GD-004 · Teritorii legendare
- **Status:** ⬜ De făcut
- **Descriere:** Câteva teritorii marcate distinct — o capitală, o minune istorică — care dau bonus mare de scor celui care le ține la final, dar cer o întrebare mai grea ca să fie cucerite.
- **Implementare corectă:** `legendary_territories(territory_id, map_id, bonus_type, bonus_value)`. Adaugă o decizie tactică reală: „merită riscul unui atac greu pentru bonusul de capitală?". Câte per hartă și cât de mare bonusul se stabilesc în GD-001 — prea mare face restul hărții irelevant. Distincție **vizuală** puternică, altfel strategia rămâne invizibilă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.1 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-034, APP-015, WEB-022
- **Prioritate:** Înainte de lansare — e cel mai ieftin strat de strategie din listă

#### GD-005 · Harta Vie — campanie mondială de guildă
- **Status:** ⬜ De făcut
- **Descriere:** O hartă mondială persistentă, separată de partide, pe care guildele luptă pentru regiuni pe durata unui sezon întreg. Controlul dă bonusuri pasive membrilor.
- **Implementare corectă:** Al doilea strat de cucerire, peste harta României din campania individuală. **Atenție:** două hărți persistente concurente pot deruta — trebuie clar că una e a jucătorului (județe, facțiuni) și alta a guildei (regiuni mondiale). Dacă distincția nu se poate face vizual în cinci secunde, se amână.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.4 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-070, SRV-072
- **Prioritate:** După lansare — depinde de guilde, care depind de o comunitate destul de mare

---

## Grupa C · Moduri noi de joc

#### GD-006 · Roata Cunoașterii
- **Status:** ⬜ De făcut
- **Descriere:** Înainte de fiecare rundă, o roată se învârte live pe ecran și alege categoria, vizibil simultan pentru toți.
- **Implementare corectă:** Element de spectacol tip game-show. Rezultatul roții e **decis de server** și trimis tuturor; animația e doar redare — altfel doi jucători pot vedea categorii diferite. Rupe rutina fără să atingă corectitudinea: roata e identică pentru toți din meci.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.3 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-036, APP-017
- **Prioritate:** Înainte de lansare — cost mic, impact mare asupra senzației de joc

#### GD-007 · Modul Detectiv — al treilea tip de întrebare
- **Status:** ⬜ De făcut
- **Descriere:** Indicii dezvăluite progresiv despre un subiect; răspunzi oricând, iar cu cât mai devreme, cu atât mai multe puncte.
- **Implementare corectă:** E singura idee din listă care schimbă **schema întrebărilor**: `questions.type` primește `DEDUCTION`, cu o listă ordonată de indicii. Funcție de punctaj descrescătoare cu numărul de indicii văzute. **Impact real asupra producției de conținut** — nu se poate genera cu același flux ca grila, deci intră și în registrul de conținut. Merită tocmai pentru că e o variație reală de format, nu o temă nouă peste formatul vechi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.9 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-050, CNT-012, APP-015
- **Prioritate:** Înainte de lansare, dacă banca de întrebări permite; altfel imediat după

#### GD-008 · Co-op împotriva unui Boss
- **Status:** ⬜ De făcut
- **Descriere:** 2–4 prieteni în echipă împotriva unui set de întrebări foarte grele, cu temă rotativă săptămânală.
- **Implementare corectă:** Mod **necompetitiv între jucători** — pentru cei care vor să joace împreună fără să se învingă reciproc. Conținut recurent ieftin: o temă nouă și un set de întrebări grele pe săptămână, fără cod nou. Scorul e colectiv, cu țintă și limită de timp.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.5 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-041, SRV-049, CNT-013
- **Prioritate:** După lansare, dar devreme — e cel mai bun raport conținut-recurent față de cod

#### GD-009 · Ora Marelui Duel
- **Status:** ⬜ De făcut
- **Descriere:** La o oră fixă zilnică, toți jucătorii online dintr-un pool primesc **exact aceeași întrebare, exact simultan**.
- **Implementare corectă:** Diferă de Întrebarea Zilei prin sincronizare reală — creează senzația de eveniment colectiv, nu de activitate paralelă. **Cere testare de scalabilitate dedicată**: mii de conexiuni pe același canal de difuzare în aceeași secundă e un tipar de încărcare complet diferit de partidele individuale. Ora se alege pe fus orar de pool.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.2 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-093, SRV-063
- **Prioritate:** După lansare — riscul de scalabilitate nu merită asumat în prima lună

#### GD-010 · Battle Royale ca eveniment periodic
- **Status:** ⬜ De făcut
- **Descriere:** Loturi de 20–50 de jucători, hartă extinsă, eliminare progresivă cu timpi tot mai scurți. Eveniment de weekend, nu mod permanent.
- **Implementare corectă:** Activat din panou, nu mereu disponibil — complexitatea de echilibrare pentru loturi atât de mari nu justifică menținerea permanentă, dar ca eveniment periodic atrage atenție. Se construiește peste modul FFA, nu separat.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.11 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-041, SRV-063
- **Prioritate:** După lansare

#### GD-011 · Trivia Karaoke — mod vocal local
- **Status:** ⬜ De făcut
- **Descriere:** Răspunzi cu vocea, prin recunoaștere vocală, pentru joc local cu mai mulți oameni în jurul unui telefon.
- **Implementare corectă:** Recunoaștere **pe dispozitiv**, nu prin server — latența unui apel la server pe fiecare răspuns ar face modul nejucabil, iar costul ar fi absurd. Complet izolat de scor și rang: e un mod social offline, nu unul competitiv. Româna are suport bun de recunoaștere nativă pe Android; de verificat înainte de a promite.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.6 (de la linia 814)
- **Commit:** —
- **Produce:** APP-017
- **Prioritate:** După lansare — extinde publicul, dar nu e pe drumul critic

---

## Grupa D · Progres și obiecte

#### GD-012 · Cărți de cunoștințe
- **Status:** ⬜ De făcut
- **Descriere:** Power-up-uri consumabile câștigate prin joc — 50/50, timp extra, scor dublu — dintre care alegi două-trei înainte de o partidă.
- **Implementare corectă:** **Excluse complet din modurile clasate.** Competiția rangului rămâne pur pe cunoștințe; cărțile sunt pentru casual și partide private. Se câștigă prin joc, nu se cumpără — altfel devin pay-to-win, exact ce interzice planul. Modelul `Powerup` există deja și acoperă efectele; ce lipsește e mecanica de deck.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.2 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-074, APP-036
- **Prioritate:** Înainte de lansare

#### GD-013 · Arborele Cunoașterii
- **Status:** ⬜ De făcut
- **Descriere:** Un arbore vizual ramificat per categorie majoră, pe care îl urci deblocând subcategorii tot mai specifice.
- **Implementare corectă:** **Datele există deja** — skill rating per categorie. Stratul nou e exclusiv vizualizarea, deci costul e în interfață, nu în backend. Dă senzație de progres RPG tangibil, spre deosebire de un număr. Se poate livra ca ecran static generat din date, fără editor.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.5 (de la linia 814)
- **Commit:** —
- **Produce:** APP-032, WEB-018
- **Prioritate:** Înainte de lansare — costul e mic pentru cât progres face vizibil

#### GD-014 · Contracte de Cunoaștere
- **Status:** ⬜ De făcut
- **Descriere:** Provocări generate aleatoriu, cu recompense mari, condiții specifice și fereastră scurtă — „câștigă 3 meciuri consecutive fără să pierzi teritoriu, în următoarele 2 ore".
- **Implementare corectă:** Folosește **același motor de șabloane** ca misiunile și realizările; diferența e fereastra scurtă și generarea aleatorie la activare. Presiunea de timp e mecanica, deci expirarea trebuie să fie vizibilă permanent, nu ascunsă într-un meniu.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.4 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-059, APP-033
- **Prioritate:** Înainte de lansare — refolosește un motor deja necesar

#### GD-015 · Insignă de sezon vie
- **Status:** ⬜ De făcut
- **Descriere:** Un cosmetic care evoluează vizual pe parcursul sezonului: crește, se luminează, capătă detalii cu fiecare victorie majoră.
- **Implementare corectă:** **Serie fixă de 5–10 etape vizuale**, nu generare dinamică — altfel costul de artă explodează. Fiecare etapă e un asset separat, iar pragurile de trecere se stabilesc odată cu GD-001. Dă un motiv de a rămâne activ tot sezonul, vizibil pentru ceilalți.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.3 (de la linia 814)
- **Commit:** —
- **Produce:** ART-014, SRV-076
- **Prioritate:** Înainte de lansare

#### GD-016 · Muzeul Personal
- **Status:** ⬜ De făcut
- **Descriere:** Un spațiu izometric explorabil în care jucătorul își aranjează trofeele, vizitabil de prieteni.
- **Implementare corectă:** Nu o listă de showcase, ci un loc. **Costul de interfață e mare** — editorul de plasare izometric e partea grea, nu datele, care există. Candidat clar de fază târzie. Dacă se face vreodată, se face după ce există destule cosmetice cât să merite expuse.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.1 (de la linia 814)
- **Commit:** —
- **Produce:** APP-031
- **Prioritate:** Mult după lansare — cel mai scump raport cost/beneficiu din listă

---

## Grupa E · Social și comunitate

#### GD-017 · Provocare cu miză între prieteni
- **Status:** ⬜ De făcut
- **Descriere:** Înainte de un duel amical, oricare dintre cei doi poate propune o miză în monedă din joc; câștigătorul ia totul.
- **Implementare corectă:** **Doar monedă moale, niciodată gems sau bani reali** — altfel devine pariu, cu tot ce implică legal (vezi `10-legal-business.md`). Miza se acceptă explicit de amândoi înainte de start și e vizibilă tot meciul. Mișcarea trece prin registru, ca orice transfer de valoare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.6 (de la linia 743)
- **Commit:** —
- **Produce:** SRV-061, SRV-073, LEG-008
- **Prioritate:** După lansare

#### GD-018 · Program Mentor-Discipol
- **Status:** ⬜ De făcut
- **Descriere:** Jucătorii cu rang înalt se înscriu ca mentori; sistemul îi potrivește cu jucători noi care cer un mentor.
- **Implementare corectă:** Potrivire pe limbă, țară și disponibilitate orară. Recompensele sunt legate de **progresul real al discipolului** — urcarea lui de trepte de încredere sau atingerea unui prag de rang. Altfel mentorii se înscriu pasiv și nu investesc timp. E și cel mai bun instrument de retenție pentru jucătorii noi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.7 (de la linia 743)
- **Commit:** —
- **Produce:** GRW-011, SRV-067
- **Prioritate:** După lansare, când există destui jucători avansați

#### GD-019 · Liga Familiei
- **Status:** ⬜ De făcut
- **Descriere:** Un cerc mic, de 6–8 membri, cu clasament privat și provocări blânde — pentru joc între generații, nu între jucători de skill apropiat.
- **Implementare corectă:** **Cea mai ieftină idee din tot registrul** — refolosește structura de guildă cu un tip nou de grup mic, fără cerințe de skill la intrare. Completează golul dintre „prieten unu la unu" și „guildă mare, competitivă". Fără matchmaking pe rang înăuntru: bunicul și nepotul trebuie să poată juca împreună.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.10 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-070
- **Prioritate:** Înainte de lansare — cost aproape zero peste guilde

#### GD-020 · Program Poliglot
- **Status:** ⬜ De făcut
- **Descriere:** Jucători de încredere care vorbesc două sau mai multe limbi traduc și adaptează cultural întrebări către o limbă nouă.
- **Implementare corectă:** Deschis de la treapta T4 în sus. Contribuțiile trec prin **aceeași coadă de moderare** ca întrebările din comunitate, cu insignă distinctă pe profil. Transformă extinderea lingvistică dintr-un cost intern într-un efort de comunitate — e mecanismul care face multilingvismul sustenabil dincolo de două limbi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.10 (de la linia 743)
- **Commit:** —
- **Produce:** CNT-009, ADM-055
- **Prioritate:** Când se adaugă a treia limbă

#### GD-021 · Testament Digital
- **Status:** ⬜ De făcut
- **Descriere:** La o pauză lungă anunțată voluntar, jucătorul poate lăsa moștenire o parte din cosmetice și monede unui prieten sau guildei.
- **Implementare corectă:** **Exclude gems și orice cumpărat cu bani reali** — altfel devine o portiță de ocolire a magazinului și un vector de fraudă. Doar monede din joc și cosmetice câștigate. Confirmare explicită, ireversibilă. Transformă o retragere într-un gest social vizibil, nu într-o dispariție tăcută.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.8 (de la linia 814)
- **Commit:** —
- **Produce:** SRV-073, LEG-008
- **Prioritate:** După lansare

---

## Grupa F · Conținut generat automat și partajare

#### GD-022 · Cronica Personală
- **Status:** ⬜ De făcut
- **Descriere:** La finalul fiecărui sezon, un card vizual de recapitulare: cele mai bune victorii, categoria ta cea mai bună, cea mai lungă serie, evoluția rangului.
- **Implementare corectă:** Mecanica „Spotify Wrapped" — extrem de eficientă pentru distribuire organică. Cardul se generează **server-side ca imagine**, ca să arate identic oriunde e partajat. Plus un „acum un an" ocazional, care aduce continuitate. Datele există deja în statisticile cumulate.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.8 (de la linia 743)
- **Commit:** —
- **Produce:** GRW-006, SRV-022
- **Prioritate:** Înainte de primul final de sezon — e momentul în care are sens

#### GD-023 · Replay cinematic
- **Status:** ⬜ De făcut
- **Descriere:** Pentru partidele spectaculoase — reveniri mari, locul 1 dintr-un lot de 8, finaluri la departajare — un clip scurt generat automat din momentele cheie.
- **Implementare corectă:** Diferă de Cronica Personală prin faptul că e per meci, imediat, „la cald". Se generează din `match_events`, care conține deja tot ce trebuie. **Definiția de „spectaculos" trebuie să fie strictă** — dacă se generează pentru orice meci, nu mai partajează nimeni nimic.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.9 (de la linia 743)
- **Commit:** —
- **Produce:** GRW-007, SRV-020
- **Prioritate:** După lansare

#### GD-024 · Widget pe ecranul de acasă
- **Status:** ⬜ De făcut
- **Descriere:** Widget nativ Android cu seria curentă, Întrebarea Zilei în așteptare și memento de misiune.
- **Implementare corectă:** Prezență pasivă constantă, mai puțin agresivă decât o notificare. **Raportul cost/retenție e cel mai bun din tot registrul** — implementare ieftină prin platform channels, impact disproporționat. De prioritizat devreme, nu lăsat la final.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §15.7 (de la linia 814)
- **Commit:** —
- **Produce:** APP-038
- **Prioritate:** Înainte de lansare

#### GD-025 · Predicție pe partide urmărite
- **Status:** ⬜ De făcut
- **Descriere:** Spectatorii unei partide pariază pe monedă din joc cine va câștiga.
- **Implementare corectă:** Doar monedă moale. Predicția se închide după primele runde, ca să nu poată fi făcută pe rezultat aproape sigur. Dă un motiv de a rămâne în modul spectator după eliminare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.6 (de la linia 364)
- **Commit:** —
- **Produce:** SRV-043, LEG-008
- **Prioritate:** După lansare

#### GD-026 · Provocare comunitară de sezon
- **Status:** ⬜ De făcut
- **Descriere:** Un obiectiv colectiv al întregii comunități pe durata unui sezon — „un milion de întrebări corecte" — cu recompensă pentru toți la atingere.
- **Implementare corectă:** Progres vizibil permanent, actualizat des. Ținta se calibrează pe populația reală: una atinsă în trei zile nu motivează, una neatinsă demoralizează. Se recalculează pentru fiecare sezon în funcție de câți jucători sunt.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.5 (de la linia 364)
- **Commit:** —
- **Produce:** SRV-063, SRV-021
- **Prioritate:** Al doilea sezon

#### GD-027 · Album de cunoștințe
- **Status:** ⬜ De făcut
- **Descriere:** Colecție tematică de piese obținute prin joc, completabilă pe sezon.
- **Implementare corectă:** Piesele se obțin din activitate, **nu se cumpără direct** — altfel colecția devine un articol de magazin și își pierde rostul de motiv de joc. Duplicatele se pot schimba între prieteni, ceea ce creează interacțiune socială fără să ceară sisteme noi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.4 (de la linia 364)
- **Commit:** —
- **Produce:** SRV-065
- **Prioritate:** După lansare

---

## Grupa G · Echilibrare continuă

#### GD-028 · Sistemul de rivalitate
- **Status:** ⬜ De făcut
- **Descriere:** Adversarul întâlnit cel mai des devine „nemesis", cu bilanț direct urmărit și afișat la reîntâlnire.
- **Implementare corectă:** Se derivă din istoric, fără tabel nou. Afișarea la reîntâlnire în lobby e tot ce trebuie ca să producă tensiune — nu are nevoie de mecanică proprie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.3 (de la linia 364)
- **Commit:** —
- **Produce:** SRV-062
- **Prioritate:** Înainte de lansare — aproape gratuit

#### GD-029 · Alianțe temporare în partidele mari
- **Status:** ⬜ De făcut
- **Descriere:** În lobby-urile de 6–8, doi jucători pot conveni o încetare temporară a ostilităților.
- **Implementare corectă:** Mecanică avansată, de după lansare. Riscul e coordonarea în afara jocului pentru a elimina un jucător puternic — trebuie limitată în durată și făcută vizibilă tuturor, nu secretă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.5 (de la linia 592)
- **Commit:** —
- **Produce:** SRV-041
- **Prioritate:** Mult după lansare

#### GD-030 · Mod pe echipe
- **Status:** ⬜ De făcut
- **Descriere:** La 4, 6 sau 8 jucători, lobby-ul se împarte în perechi sau triouri cu teritorii adiacente și clasament de echipă separat.
- **Implementare corectă:** Echipele nu se pot ataca reciproc; teritoriile lor combinate contează la scorul final. Se lansează **după** FFA-ul de bază, nu odată cu el.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.4 (de la linia 592)
- **Commit:** —
- **Produce:** SRV-041
- **Prioritate:** După lansare

#### GD-031 · Calendarul de conținut sezonier
- **Status:** ⬜ De făcut
- **Descriere:** Ce eveniment rulează în fiecare săptămână dintr-un sezon, planificat dinainte, nu improvizat.
- **Implementare corectă:** Un sezon de trei luni are nevoie de aproximativ 12 momente: teme de Boss săptămânal, un eveniment mare la mijloc, un final. Se planifică **înainte de începerea sezonului**, cu conținutul produs în avans. Un joc live fără calendar devine tăcut după două săptămâni, iar tăcerea alungă jucătorii mai sigur decât un bug.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7 (de la linia 326)
- **Commit:** —
- **Produce:** CNT-013, ADM-035
- **Prioritate:** Înainte de primul sezon
