# Panoul de administrare — registru de task-uri

**Componentă:** `web/client/src/admin` peste endpointurile `/admin/*` din `backend/api`.
**Prefix ID:** `ADM-`
**Convenții:** [`00-README.md`](00-README.md)

Panoul e unealta de operare a jocului. Regula lui: **tot ce se poate face manual
în baza de date trebuie să se poată face din panou, cu urmă în audit** — și nimic
altceva. Panoul nu calculează nimic; citește ce spune serverul și trimite intenții.

Lipsurile deja identificate, cu migrarea și endpointurile necesare, sunt în
[`../needdesign.md`](../needdesign.md).

---

## Grupa A · Fundația panoului

#### ADM-001 · Cadrul panoului cu meniu pliabil
- **Status:** ✅ Implementat
- **Descriere:** Bara laterală cu toate cele 23 de secțiuni, bara de sus, cadru propriu separat de site-ul public.
- **Implementare corectă:** Secțiuni pliabile cu starea în `localStorage`; secțiunea paginii curente se deschide singură fără să șteargă alegerile manuale. Bara laterală și conținutul derulează independent — cu o singură bară de derulare, meniul dispare exact când îl cauți.
- **Finalizat:** 2026-08-17 · 01:15
- **Sursă:** `web/client/src/admin/AdminShell.tsx`
- **Commit:** `9eefa43`
- **Depinde de:** SRV-014

#### ADM-002 · Garda de acces pe roluri
- **Status:** ✅ Implementat
- **Descriere:** Cine intră în panou și ce rute poate atinge fiecare rol.
- **Implementare corectă:** `AdminGuard` verifică apartenența la rolurile de personal, apoi restricțiile per rută din `@AdminRoles(...)`, apoi respinge conturile suspendate. Fără rolul întors de `/users/me`, poarta refuza inclusiv administratorii reali.
- **Finalizat:** 2026-08-16
- **Sursă:** `backend/api/src/admin/admin.guard.ts`
- **Commit:** `f802915`
- **Depinde de:** SRV-014

#### ADM-003 · Tabloul de bord
- **Status:** ✅ Implementat
- **Descriere:** Vederea de ansamblu: jucători, conținut, economie, campanii, sănătatea sistemului.
- **Implementare corectă:** Șase indicatori cu sparkline, creșterea pe 30 de zile, coada de revizuire, harta campaniei, venit, economia de monede, alerte de moderare, sănătatea serviciilor, activitate recentă, acțiuni rapide. Panourile fără sursă de date întorc motivul, nu zero.
- **Finalizat:** 2026-08-17 · 00:45
- **Sursă:** `web/client/src/admin/Dashboard.tsx`
- **Commit:** `badf918`
- **Depinde de:** SRV-021

#### ADM-004 · Panoul, în mai multe limbi
- **Status:** ⬜ De făcut
- **Descriere:** Panoul are azi cadrul în engleză și explicațiile în română, amestecate. Trebuie să treacă prin același sistem de traduceri ca restul produsului.
- **Implementare corectă:** Toate șirurile din `web/client/src/admin` mută în fișiere de traducere, cu aceleași chei ca web-ul public unde textul e comun. Comutator de limbă în bara de sus, cu preferința salvată pe cont. Fără șiruri hardcodate — un administrator care nu vorbește româna trebuie să poată opera panoul.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 1
- **Commit:** —
- **Depinde de:** SRV-003, WEB-004

#### ADM-005 · Căutare globală
- **Status:** 🟡 Parțial
- **Descriere:** Câmpul de căutare din bara de sus arată bine dar nu caută nimic.
- **Implementare corectă:** Un endpoint unic care caută simultan în conturi, întrebări, meciuri și tranzacții, cu rezultate grupate pe tip și navigare de la tastatură. `Ctrl K` duce deja focusul în câmp; lipsește partea care caută.
- **Finalizat:** —
- **Sursă:** `web/client/src/admin/AdminShell.tsx`
- **Commit:** —
- **Depinde de:** SRV-085

#### ADM-006 · Pagini de secțiune cu stadiu de dezvoltare
- **Status:** ✅ Implementat
- **Descriere:** Fiecare rută din meniu duce undeva care spune ce va face ecranul și ce lipsește ca să existe.
- **Implementare corectă:** Descriere, listă de capabilități, stadiu (Funcțional, Parțial, Backend gata, Planificat) și blocajul explicit. Un link care duce undeva unde scrie ce urmează e mai util decât unul care duce nicăieri.
- **Finalizat:** 2026-08-17 · 00:50
- **Sursă:** `web/client/src/admin/PlaceholderPage.tsx`
- **Commit:** `badf918`
- **Depinde de:** ADM-001

---

## Grupa B · Jucători

#### ADM-007 · Lista completă de jucători
- **Status:** ✅ Implementat
- **Descriere:** Registrul de conturi cu filtre, sortare, paginare și acțiuni de disciplină.
- **Implementare corectă:** Listarea e în SQL parametrizat, cu `LEFT JOIN LATERAL` peste sesiuni: prezența nu e o coloană, iar un control de sortare care afișează „Last Online" dar ordonează după altceva e mai rău decât unul absent. Coloana de acțiuni rămâne lipită la dreapta.
- **Finalizat:** 2026-08-17 · 01:15
- **Sursă:** `web/client/src/admin/pages/PlayersPage.tsx`
- **Commit:** `9eefa43`
- **Depinde de:** SRV-010

#### ADM-008 · Panoul de detaliu al jucătorului
- **Status:** ✅ Implementat
- **Descriere:** Identitate, țară, rol, stare, scor de încredere, dispozitive, progres.
- **Implementare corectă:** Scorul de încredere afișează baza de calcul la hover — un indicator compus fără explicație e o cifră în care nu poți avea încredere. Dezvăluirea e-mailului e o acțiune separată, consemnată în audit.
- **Finalizat:** 2026-08-17 · 01:15
- **Sursă:** `web/client/src/admin/components/PlayerDetailPanel.tsx`
- **Commit:** `9eefa43`
- **Depinde de:** ADM-007

#### ADM-009 · Acțiuni în masă
- **Status:** ✅ Implementat
- **Descriere:** Suspendare, reactivare, revocare de sesiuni și resetare de parolă peste conturile bifate.
- **Implementare corectă:** Plafon de 100 de conturi pe cerere — o operație de disciplină nu se poate anula, iar o cerere mai mare e aproape sigur o greșeală de selecție. Propriul cont e sărit automat și raportat separat. Fiecare cont e tratat și raportat individual.
- **Finalizat:** 2026-08-17 · 01:15
- **Sursă:** `backend/api/src/admin/players.controller.ts`
- **Commit:** `9eefa43`
- **Depinde de:** ADM-007

#### ADM-010 · Roluri și permisiuni
- **Status:** ⬜ De făcut
- **Descriere:** Cine e administrator, moderator, editor de conținut sau suport, și ce deschide fiecare rol.
- **Implementare corectă:** Atribuirea rolului, restrânsă la `ADMIN`, cu audit obligatoriu. Un administrator **nu-și poate retrage propriul rol** — s-ar bloca afară din panou. Matricea rol × rută se generează din metadatele `@AdminRoles` prin `DiscoveryService`, nu se scrie de mână: o matrice scrisă manual se dezacordă de gardă la prima rută nouă. Verificare automată că nicio rută `/admin/*` nu rămâne fără gardă.
- **Finalizat:** —
- **Sursă:** `web/client/src/admin/navigation.ts`, secțiunea System
- **Commit:** —
- **Depinde de:** ADM-002

#### ADM-011 · Sancțiuni și suspendări
- **Status:** 🔒 Blocat pe SRV-016
- **Descriere:** Lista sancțiunilor active, cu motiv, termen și cine le-a aplicat.
- **Implementare corectă:** Aplicarea cere **motiv obligatoriu** dintr-o listă predefinită tradusă, cu câmp liber opțional. Un ban permanent și o suspendare cu termen sunt acțiuni distincte, nu același buton. Ridicarea scrie `lifted_at`, nu șterge rândul. Ecranul arată și istoricul complet de sancțiuni al contului, nu doar cele active.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §3
- **Commit:** —
- **Depinde de:** SRV-016

#### ADM-012 · Inventarul jucătorului
- **Status:** ⬜ De făcut
- **Descriere:** Ce deține un cont: cosmetice, powerups, monede, gems, cu istoricul lor.
- **Implementare corectă:** Citește `UserInventory`, `UserPowerup`, `ActivePowerup` și soldurile. Acordarea sau retragerea manuală trece **obligatoriu** prin `WalletService`, ca fiecare mișcare să aibă intrare în registru — o modificare directă a soldului ar rupe reconcilierea.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Players
- **Commit:** —
- **Depinde de:** SRV-073

#### ADM-013 · Tranzacțiile unui cont
- **Status:** ⬜ De făcut
- **Descriere:** Toate mișcările de valoare ale unui singur jucător, într-un singur loc.
- **Implementare corectă:** Achizițiile cu bani reali și starea lor, plus fiecare intrare din registrul de monedă cu motiv și actor. `/admin/store/users/:id/ledger` răspunde deja; lipsește vizualizarea. Include reconcilierea sold-față-de-registru, ca o discrepanță să se vadă imediat.
- **Finalizat:** —
- **Sursă:** `backend/api/src/store/admin-store.controller.ts`
- **Commit:** —
- **Depinde de:** SRV-073

#### ADM-014 · Conturi semnalate automat
- **Status:** 🔒 Blocat pe SRV-047
- **Descriere:** Coada de revizuire pentru tiparele prinse de detecția automată.
- **Implementare corectă:** Lista conturilor semnalate, cu **dovada** care a produs semnalul — cadența de răspuns, acuratețea, conturile legate — nu doar un scor. Moderatorul confirmă sau respinge, iar decizia lui alimentează pragurile. Semnalarea nu sancționează singură.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Depinde de:** SRV-047

#### ADM-015 · Note pe cont
- **Status:** 🔒 Blocat pe SRV-017
- **Descriere:** Observații interne ale moderatorilor, editabile, fixabile.
- **Implementare corectă:** Secțiune proprie în panoul de detaliu, separată vizual de audit — un moderator trebuie să vadă din prima ce e opinie și ce e consemnare.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §2
- **Commit:** —
- **Depinde de:** SRV-017

#### ADM-016 · Ștergerea și anonimizarea contului
- **Status:** 🔒 Blocat pe SRV-088
- **Descriere:** Executarea unei cereri de ștergere, cu perioadă de grație și posibilitate de anulare.
- **Implementare corectă:** Confirmare în doi pași care cere tastarea username-ului. Arată explicit **ce se elimină definitiv și ce rămâne anonimizat**, ca administratorul să nu creadă că șterge istoricul de meciuri. Perioada de grație e vizibilă și anulabilă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Depinde de:** SRV-088

---

## Grupa C · Întrebări

#### ADM-017 · Coada de revizuire
- **Status:** ✅ Implementat
- **Descriere:** Întrebările trimise de jucători, în așteptarea deciziei.
- **Implementare corectă:** Aprobare sau respingere cu efect imediat în joc, cu textul complet și variantele vizibile înainte de decizie.
- **Finalizat:** 2026-08-16
- **Sursă:** `web/client/src/admin/pages/QuestionReviewPage.tsx`
- **Commit:** `9763e54`
- **Depinde de:** SRV-051

#### ADM-018 · Lista completă de întrebări
- **Status:** ⬜ De făcut
- **Descriere:** Banca întreagă, filtrabilă după limbă, stare, categorie, dificultate și sursă.
- **Implementare corectă:** Filtrul de **limbă e primul**, nu ultimul: la două limbi banca se dublează, iar o listă neîmpărțită pe limbă devine inutilizabilă. Editare în loc, retragere din circulație fără ștergere. Arată dificultatea declarată alături de cea observată.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Depinde de:** SRV-005

#### ADM-019 · Formular de creare
- **Status:** 🔒 Blocat pe SRV-052
- **Descriere:** Adăugarea unei întrebări din panou, publicată direct ca aprobată.
- **Implementare corectă:** Grilă sau răspuns numeric, cu validarea variantelor și marcarea răspunsului corect. **Limba și categoria sunt obligatorii** — legătura directă cu sistemul internațional, nu un adaos ulterior. Previzualizare exact cum o va vedea jucătorul.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.3 (de la linia 682)
- **Commit:** —
- **Depinde de:** SRV-052

#### ADM-020 · Întrebări raportate
- **Status:** ⬜ De făcut
- **Descriere:** Semnalările jucătorilor că o întrebare e greșită sau nepotrivită.
- **Implementare corectă:** Rapoartele **grupate pe întrebare**, nu listate individual — zece rapoarte pe aceeași întrebare sunt un singur caz. Corectare pe loc sau retragere, cu închiderea tuturor rapoartelor legate.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Depinde de:** SRV-050

#### ADM-021 · Import și export
- **Status:** 🔒 Blocat pe SRV-055
- **Descriere:** Popularea băncii pe limbi noi și extragerea pentru corectură.
- **Implementare corectă:** Previzualizare înainte de scriere, raport de erori pe rând, detectarea duplicatelor. Un lot cu erori nu intră parțial.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Depinde de:** SRV-055

#### ADM-022 · Categorii
- **Status:** ⬜ De făcut
- **Descriere:** Cele 20 de categorii, cu traduceri, ordine și acoperire.
- **Implementare corectă:** Editarea numelui **pe limbă**, nu un singur nume. Arată câte întrebări are fiecare categorie pe fiecare limbă și dificultate — golurile de acoperire sunt cea mai utilă informație din tot ecranul. Dezactivare fără ștergere.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-003, SRV-005

#### ADM-023 · Analiza băncii de întrebări
- **Status:** ⬜ De făcut
- **Descriere:** Cum se comportă întrebările în joc, nu pe hârtie.
- **Implementare corectă:** Rata reală de răspuns corect față de dificultatea declarată, timpul mediu, întrebările nefolosite niciodată și cele suprafolosite. Semnalează întrebările unde declaratul și observatul diverg mult.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Depinde de:** SRV-054

---

## Grupa D · Conținut de joc

#### ADM-024 · Configurația modurilor de joc
- **Status:** 🔒 Blocat pe SRV-036
- **Descriere:** Numărul de runde, timpul pe întrebare, punctajul și numărul de teritorii, per mod.
- **Implementare corectă:** Citește și scrie `match_mode_config`, ca echilibrarea unui mod să nu ceară redeploy. Previzualizare a efectului asupra duratei estimate a partidei înainte de salvare.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** SRV-036

#### ADM-025 · Trepte de rang
- **Status:** 🔒 Blocat pe SRV-045
- **Descriere:** Cele 24 de trepte, cu praguri de ELO, denumiri traduse și insigne.
- **Implementare corectă:** Editarea pragurilor cu verificarea că intervalele nu se suprapun și nu lasă goluri — un ELO care nu cade în nicio treaptă e un cont fără rang. Denumirile sunt chei de traducere.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.1 (de la linia 228)
- **Commit:** —
- **Depinde de:** SRV-045

#### ADM-026 · Curba de nivel de cont
- **Status:** ⬜ De făcut
- **Descriere:** Pragurile de XP și ce se deblochează la fiecare nivel de cont.
- **Implementare corectă:** Editare cu previzualizarea curbei și a timpului estimat până la fiecare prag. Terminologia obligatorie: **„Nivel de cont"**, niciodată „nivel" simplu.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.3 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-056

#### ADM-027 · Realizări și insigne
- **Status:** ⬜ De făcut
- **Descriere:** Catalogul de realizări, cu condiție, raritate și recompensă.
- **Implementare corectă:** Editarea **șabloanelor**, nu a instanțelor — un șablon generează sute de realizări. Arată câți jucători au deblocat fiecare realizare și raritatea recalculată din procentul real.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §3 (de la linia 129)
- **Commit:** —
- **Depinde de:** SRV-057

#### ADM-028 · Cosmetice și avataruri
- **Status:** ⬜ De făcut
- **Descriere:** Tot ce e decorativ: avataruri, rame, bannere, skinuri de hartă, titluri.
- **Implementare corectă:** Creare pe tipul din `CosmeticType`, cu raritate, mod de obținere și previzualizare. Retragere din vânzare fără ștergere: jucătorii care le-au cumpărat trebuie să le poată folosi în continuare.
- **Finalizat:** —
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Depinde de:** SRV-076

---

## Grupa E · Campanie

#### ADM-029 · Sezoane
- **Status:** 🔒 Blocat pe SRV-027
- **Descriere:** Crearea, programarea, pornirea și închiderea unui sezon de cucerire.
- **Implementare corectă:** Interval, reguli de teritoriu, facțiuni și recompense într-un singur flux. Un sezon nu se poate suprapune cu altul. Închiderea declanșează calculul clasamentelor și livrarea premiilor, cu previzualizarea a ce se va acorda **înainte** de confirmare.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-027, SRV-033

#### ADM-030 · Harta României, în panou
- **Status:** 🔒 Blocat pe SRV-029
- **Descriere:** Starea fiecărui teritoriu, cine îl deține, cât mai are până cade.
- **Implementare corectă:** Aceeași hartă desenată din `counties.centroid`, ca panoul, web-ul și aplicația să arate identic. Intervenție manuală pe un teritoriu — cu motiv obligatoriu și audit, pentru că e o rescriere a rezultatului jocului. Istoricul stăpânirii, reconstituit din `territory_events`.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-029

#### ADM-031 · Județe și vecinătăți
- **Status:** 🔒 Blocat pe SRV-028
- **Descriere:** Cele 42 de unități, cu vecinii și valoarea lor.
- **Implementare corectă:** Editarea adiacenței cu **verificarea simetriei** — dacă A e vecin cu B, B trebuie să fie vecin cu A, altfel harta are treceri într-un singur sens. Verificare că graful e conectat: un județ izolat nu poate fi atacat niciodată.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-028

#### ADM-032 · Facțiuni
- **Status:** 🔒 Blocat pe SRV-027
- **Descriere:** Taberele sezonului, cu nume, culoare, blazon și echilibru.
- **Implementare corectă:** Arată numărul de membri activi per facțiune și dezechilibrul curent. Ajustarea manuală a repartizării e posibilă, dar consemnată — e o intervenție în corectitudinea competiției.
- **Finalizat:** —
- **Sursă:** `taskmaster.md` D4
- **Commit:** —
- **Depinde de:** SRV-027

#### ADM-033 · Istoricul campaniilor
- **Status:** 🔒 Blocat pe SRV-033
- **Descriere:** Sezoanele încheiate și cum s-au terminat.
- **Implementare corectă:** Harta finală înghețată a fiecărui sezon, câștigătorii, comparație între sezoane. Nu se recalculează niciodată dintr-un instantaneu.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-033

---

## Grupa F · Provocări, evenimente, live ops

#### ADM-034 · Constructor de provocări
- **Status:** 🔒 Blocat pe SRV-059
- **Descriere:** Compunerea unei provocări din condiții, cu recompensă și interval.
- **Implementare corectă:** Condiții combinate peste șabloanele existente, cu **previzualizare pe date reale**: câți jucători ar fi îndeplinit-o săptămâna trecută. O provocare imposibilă sau trivială se vede înainte de publicare, nu după.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.2 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-059

#### ADM-035 · Calendar de evenimente
- **Status:** 🔒 Blocat pe SRV-063
- **Descriere:** Ce rulează, ce urmează, ce s-a terminat.
- **Implementare corectă:** Vedere lunară cu **detectarea suprapunerilor** — două evenimente cu multiplicatori care se cumulează pot da recompense de zeci de ori mai mari decât s-a intenționat. Mutare prin tragere, cu recalcularea conflictelor.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-063

#### ADM-036 · Oprire de urgență și suprascrieri
- **Status:** 🔒 Blocat pe SRV-063
- **Descriere:** Oprirea imediată a unui eveniment configurat greșit, fără redeploy.
- **Implementare corectă:** Efect în câteva secunde. Suprascrierile de configurație au **expirare obligatorie** — o valoare temporară fără termen devine permanentă și nimeni nu-și mai amintește de ce e acolo. Fiecare suprascriere arată cine a pus-o și de ce.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Live Ops
- **Commit:** —
- **Depinde de:** SRV-063, SRV-092

#### ADM-037 · Turnee
- **Status:** 🔒 Blocat pe SRV-071
- **Descriere:** Programarea turneelor individuale și de guildă, cu urmărirea desfășurării.
- **Implementare corectă:** Bracket vizibil live, clasament de arenă, împerecherea guildelor. Anularea unui turneu început restituie taxele de intrare — prin registru, nu prin modificarea soldurilor.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-071

---

## Grupa G · Meciuri

#### ADM-038 · Partide în desfășurare
- **Status:** ⬜ De făcut
- **Descriere:** Ce se joacă acum, cu cine și pe ce hartă.
- **Implementare corectă:** Lista partidelor active cu runda curentă. Încheierea forțată a unei partide blocate, cu motiv și audit — folosită când un bug lasă o partidă suspendată și jucătorii nu-și pot recupera locul.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Matches
- **Commit:** —
- **Depinde de:** SRV-019

#### ADM-039 · Istoricul partidelor
- **Status:** ⬜ De făcut
- **Descriere:** Toate meciurile încheiate, cu rezultat și participanți.
- **Implementare corectă:** Filtrare pe mod, dată, jucător, limbă și țară. Datele există integral în `matches` și `match_players`.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Matches
- **Commit:** —
- **Depinde de:** SRV-019

#### ADM-040 · Reconstituirea unei partide
- **Status:** ⬜ De făcut
- **Descriere:** Rundă cu rundă, cu fiecare răspuns și timpul lui — unealta principală la verificarea unui raport de trișare.
- **Implementare corectă:** Redare din `match_events`, cu timpii de răspuns evidențiați când ies din intervalul uman. Legătură directă din coada de conturi semnalate.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Matches
- **Commit:** —
- **Depinde de:** SRV-020

#### ADM-041 · Sănătatea matchmaking-ului
- **Status:** 🔒 Blocat pe SRV-044
- **Descriere:** Cât se așteaptă, pe ce pool, și unde cozile sunt prea subțiri.
- **Implementare corectă:** Timp mediu de așteptare **per pool** (limbă × țară) — media globală ascunde exact problema pe care o cauți: un pool mic la ore de noapte. Ajustarea pragurilor de lărgire fără redeploy.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.3 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-044

---

## Grupa H · Moderare

#### ADM-042 · Moderarea chatului
- **Status:** ✅ Implementat
- **Descriere:** Mesajele raportate și decizia asupra lor.
- **Implementare corectă:** Coadă cu prioritate, rezolvare cu motiv, mut temporar sau shadow-ban pentru autor.
- **Finalizat:** 2026-08-16
- **Sursă:** `web/client/src/admin/pages/ChatModerationPage.tsx`
- **Commit:** `9763e54`
- **Depinde de:** SRV-079

#### ADM-043 · Contestații
- **Status:** 🔒 Blocat pe SRV-081
- **Descriere:** Cererile de reexaminare ale jucătorilor sancționați.
- **Implementare corectă:** Textul contestației lângă **sancțiunea la care se referă** și istoricul complet al contului. Acceptare sau respingere cu motiv scris, comunicat jucătorului prin cutia poștală.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §3
- **Commit:** —
- **Depinde de:** SRV-081, SRV-082

#### ADM-044 · Abateri de limbă în camerele publice
- **Status:** 🔒 Blocat pe SRV-069
- **Descriere:** Cazurile prinse de detecția automată de limbă.
- **Implementare corectă:** Lista cu limba detectată, limba camerei și scorul de încredere. Ajustarea pragului de încredere din panou: prea jos produce fals-pozitive pe mesaje scurte, prea sus lasă camera să se amestece. Repetițiile duc la mute **în camera respectivă**, nu la nivel de cont.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.6 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-069

#### ADM-045 · Nume ofensatoare
- **Status:** ⬜ De făcut
- **Descriere:** Verificarea numelor de cont și de guildă la creare și la schimbare.
- **Implementare corectă:** Listă de tipare pe limbă, cu coadă de revizuire pentru cazurile incerte. Redenumirea forțată e o acțiune de moderare, cu audit, iar jucătorul e anunțat de ce.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Moderation
- **Commit:** —
- **Depinde de:** SRV-016

---

## Grupa I · Economie, magazin, prăvălie

#### ADM-046 · Powerups
- **Status:** ⬜ De făcut
- **Descriere:** Obiectele care schimbă desfășurarea unei partide.
- **Implementare corectă:** Creare pe efectul din enum, cu mărime, durată și prețuri. CRUD-ul complet răspunde deja pe `/admin/store/powerups`; lipsește ecranul.
- **Finalizat:** —
- **Sursă:** `backend/api/src/store/admin-store.controller.ts`
- **Commit:** —
- **Depinde de:** SRV-074

#### ADM-047 · Pachete de gems și produse
- **Status:** ⬜ De făcut
- **Descriere:** Ce se vinde pe bani reali.
- **Implementare corectă:** Preț în cea mai mică unitate a monedei, cu previzualizarea sumei afișate jucătorului **pe fiecare monedă suportată**. Retragere din vânzare fără ștergere. CRUD-ul există pe `/admin/store/gem-packs`.
- **Finalizat:** —
- **Sursă:** `backend/api/src/store/admin-store.controller.ts`
- **Commit:** —
- **Depinde de:** SRV-075

#### ADM-048 · Analistul financiar
- **Status:** ⬜ De făcut
- **Descriere:** Cât s-a încasat, de la cine, pe ce, cu ce tendință.
- **Implementare corectă:** Venit pe zi, săptămână și lună, cu grafic; produsele care aduc cei mai mulți bani; rata de conversie de la inițiere la plată; venit per jucător plătitor. `/admin/finance/summary` și seria de venit răspund deja. Sumele rămân în cea mai mică unitate până la afișare.
- **Finalizat:** —
- **Sursă:** `backend/api/src/store/admin-finance.controller.ts`
- **Commit:** —
- **Depinde de:** SRV-075

#### ADM-049 · Registrul de monedă și acordarea manuală
- **Status:** ⬜ De făcut
- **Descriere:** Fiecare mișcare de monedă și posibilitatea de a acorda sau retrage.
- **Implementare corectă:** Filtrare pe monedă, motiv și interval; export pentru contabilitate. Acordarea trece prin `WalletService` cu motiv obligatoriu. Reconcilierea sold-față-de-registru rulează la cerere și raportează diferențele — o diferență e un bug, nu o rotunjire.
- **Finalizat:** —
- **Sursă:** `backend/api/src/store/admin-store.controller.ts`
- **Commit:** —
- **Depinde de:** SRV-073

#### ADM-050 · Restituiri
- **Status:** ⬜ De făcut
- **Descriere:** Anularea unei achiziții, cu retragerea a ceea ce s-a livrat.
- **Implementare corectă:** Retragerea gems se face **prin registru**, cu motiv `REFUND`, nu prin scăderea directă a soldului. Dacă jucătorul a cheltuit deja gems-ul restituit, soldul poate deveni negativ — comportamentul trebuie decis explicit și afișat, nu ascuns.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Store
- **Commit:** —
- **Depinde de:** SRV-073

#### ADM-051 · Sănătatea economiei
- **Status:** ⬜ De făcut
- **Descriere:** Cât se emite, cât se consumă, cât stă în circulație.
- **Implementare corectă:** Emisiune față de consum pe interval, clasamentul surselor și al consumatorilor după `LedgerReason`, soldul mediu pe jucător activ. O emisiune care depășește constant consumul e inflație și se vede aici înainte să se vadă în magazin.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Economy
- **Commit:** —
- **Depinde de:** SRV-073, SRV-021

#### ADM-052 · Rotația magazinului
- **Status:** 🔒 Blocat pe SRV-077
- **Descriere:** Ce apare azi, ce urmează mâine, rotație forțată.
- **Implementare corectă:** Previzualizarea zilei următoare înainte de publicare și revenirea la programare după o rotație manuală.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Shop
- **Commit:** —
- **Depinde de:** SRV-077

---

## Grupa J · Recompense, conținut editorial, notificări

#### ADM-053 · Constructor de pachete de recompense
- **Status:** 🔒 Blocat pe SRV-064
- **Descriere:** Compunerea unui pachet refolosibil de monede, obiecte și cosmetice.
- **Implementare corectă:** Salvare ca șablon, cu previzualizarea exactă a ce primește jucătorul. Folosit de provocări, sezoane, turnee și despăgubiri — o singură compunere, mai mulți consumatori.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Rewards
- **Commit:** —
- **Depinde de:** SRV-064

#### ADM-054 · Despăgubiri în masă
- **Status:** 🔒 Blocat pe SRV-064
- **Descriere:** Acordarea unui pachet tuturor jucătorilor afectați de un incident.
- **Implementare corectă:** Selecția după interval de incident, mod de joc sau regiune, cu **numărul exact de destinatari afișat înainte de confirmare**. Livrarea e idempotentă: o reluare după eșec parțial nu dublează recompensa. Raport de livrare cu eșecurile enumerate.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §14
- **Commit:** —
- **Depinde de:** SRV-064

#### ADM-055 · Traduceri
- **Status:** 🔒 Blocat pe SRV-003
- **Descriere:** Textele produsului, pe limbă și pe cheie, editabile fără redeploy.
- **Implementare corectă:** Editare pe cheie cu toate limbile una lângă alta, ca traducătorul să vadă contextul. **Cheile netraduse într-o limbă, evidențiate** — e informația principală a ecranului. Import și export pentru lucrul cu traducători externi. Arată unde apare fiecare cheie în produs.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-003

#### ADM-056 · Conținut editorial
- **Status:** ⬜ De făcut
- **Descriere:** Pagina de start, bannere, noutăți, note de versiune, întrebări frecvente, reguli.
- **Implementare corectă:** Toate cu versiuni și publicare programată, **pe limbă**. Regulile cer confirmarea citirii de către jucători la schimbare majoră. Previzualizare exact cum apare pe web și în aplicație, care au layout diferit.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Content / CMS
- **Commit:** —
- **Depinde de:** SRV-003

#### ADM-057 · Campanii de notificări
- **Status:** 🔒 Blocat pe SRV-084
- **Descriere:** Trimiteri push și în cutia poștală, către toți sau către un segment.
- **Implementare corectă:** Segmentare, programare, previzualizare **în fiecare limbă** înainte de trimitere. Un test către propriul cont e obligatoriu înainte de trimiterea în masă. Raport de livrare și rată de citire. Anulare până în momentul plecării.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Notifications
- **Commit:** —
- **Depinde de:** SRV-084

---

## Grupa K · Analiză, sistem, unelte

#### ADM-058 · Analiza jucătorilor
- **Status:** ⬜ De făcut
- **Descriere:** Cine joacă, cât de des, de unde, pe ce platformă.
- **Implementare corectă:** Activi zilnic și lunar, conturi noi, distribuție pe țară, limbă, platformă și nivel. Toate din agregatele zilnice, nu din numărători în timp real peste tot istoricul.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §9
- **Commit:** —
- **Depinde de:** SRV-021

#### ADM-059 · Retenție pe cohorte
- **Status:** 🔒 Blocat pe SRV-021
- **Descriere:** Câți jucători se întorc după o zi, o săptămână, o lună.
- **Implementare corectă:** Cohorte pe săptămâna de înregistrare, cu D1, D7 și D30, împărțite pe limbă și pe canal de instalare. Arată **unde** se pierd jucătorii, nu doar câți: la ce ecran s-a oprit ultima sesiune.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §9
- **Commit:** —
- **Depinde de:** SRV-021

#### ADM-060 · Vizualizatorul de audit
- **Status:** ⬜ De făcut
- **Descriere:** Urma fiecărei acțiuni făcute din panou.
- **Implementare corectă:** Cine, ce, când, de la ce adresă, cu ce a trimis — cu secretele deja curățate la scriere. Filtrare pe actor, acțiune, cont-țintă și interval. Export. `/admin/finance/audit` întoarce deja jurnalul.
- **Finalizat:** —
- **Sursă:** `backend/api/src/admin/audit.service.ts`
- **Commit:** —
- **Depinde de:** SRV-024

#### ADM-061 · Securitate și administratori
- **Status:** ⬜ De făcut
- **Descriere:** Conturile cu rol, sesiunile lor active și regulile de acces.
- **Implementare corectă:** Lista personalului cu ultima activitate, revocarea sesiunilor de personal, **obligativitatea 2FA pentru orice cont cu rol** — aplicată de server, nu doar afișată. Originile permise și limitele de rată, vizibile într-un singur loc.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea System
- **Commit:** —
- **Depinde de:** SRV-009, ADM-010

#### ADM-062 · Setări generale și mod de mentenanță
- **Status:** 🔒 Blocat pe SRV-092
- **Descriere:** Configurația globală, inclusiv oprirea controlată a jocului.
- **Implementare corectă:** Mod de mentenanță cu mesaj tradus afișat pe toate cele trei fronturi și cu excepție pentru conturile de personal, ca să se poată verifica înainte de reluare. Versiunea minimă de client acceptată, cu mesaj de actualizare, nu cu eroare.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea System
- **Commit:** —
- **Depinde de:** SRV-092

#### ADM-063 · Steaguri de funcționalitate
- **Status:** 🔒 Blocat pe SRV-092
- **Descriere:** Pornirea și oprirea funcțiilor, inclusiv pentru un procent de jucători.
- **Implementare corectă:** Comutator pe funcție, activare graduală, istoricul comutărilor cu autor. Necesare pentru lansarea treptată a modului Clasic și a web-ului jucabil.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Feature Flags
- **Commit:** —
- **Depinde de:** SRV-092

#### ADM-064 · Joburi, jurnale, copii de siguranță, monitorizare
- **Status:** 🟡 Parțial
- **Descriere:** Cele patru unelte de operare din secțiunea System Tools.
- **Implementare corectă:** Joburi cu ultima rulare și pornire manuală; jurnale filtrabile pe serviciu și nivel, cu legătura către cererea care a produs eroarea; copii de siguranță cu **data ultimei restaurări verificate**, nu doar a ultimei copii; monitorizare cu latență reală per serviciu. Latența bazei de date se măsoară deja; restul lipsesc.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunile System Tools
- **Commit:** —
- **Depinde de:** SRV-090, SRV-091, SRV-026
