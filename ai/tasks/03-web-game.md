# Platforma web — registru de task-uri

**Componentă:** `web/client` (React + Vite) servit de `web/server`.
**Prefix ID:** `WEB-`
**Convenții:** [`00-README.md`](00-README.md)

Decizia proprietarului din 21 august: **web-ul e complet jucabil**, la fel ca
aplicația. Nu e un site de prezentare cu o demonstrație, ci al doilea client de
joc complet. Costul e permanent — fiecare regulă nouă se implementează de două
ori — și de aceea primul task din registru e contractul comun, nu un ecran.

Site-ul are trei zone care nu se amestecă: **zona publică** (pagina de start,
prezentare, legal), **zona de joc** (autentificat, jucabil) și **panoul de
administrare** (registru separat, [`02-admin-panel.md`](02-admin-panel.md)).

---

## Grupa A · Fundația

#### WEB-001 · Tipuri generate din contractul serverului
- **Status:** ⬜ De făcut
- **Descriere:** Azi `web/client/src/lib/territory.ts` oglindește manual regulile serverului. Două copii ale aceleiași reguli se dezacordă tăcut, iar simptomul apare ca un bug de joc, nu ca o eroare de compilare.
- **Implementare corectă:** Tipurile pentru REST se generează din OpenAPI, cele pentru Socket.IO din definiția comună de evenimente. Generarea rulează în CI și cade dacă fișierele comise diferă. Niciun tip de domeniu scris de mână în `web/`.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 3
- **Commit:** —
- **Depinde de:** SRV-085, SRV-086

#### WEB-002 · Client REST cu reîmprospătarea sesiunii
- **Status:** ✅ Implementat
- **Descriere:** Un singur loc prin care trec toate cererile, cu reînnoirea automată a tokenului expirat.
- **Implementare corectă:** La `401` se încearcă o singură reîmprospătare, apoi se reia cererea; dacă și aceea cade, sesiunea se curăță. Fără reîncercare în buclă.
- **Finalizat:** 2026-08-16
- **Sursă:** `web/client/src/lib/quizrealm.ts`
- **Commit:** `f8be6f4`
- **Depinde de:** SRV-010

#### WEB-003 · Client Socket.IO pe namespace-ul corect
- **Status:** 🟡 Parțial
- **Descriere:** Conexiunea la `/game` există; lipsesc evenimentele de meci.
- **Implementare corectă:** Namespace-ul `/game` e obligatoriu — fără el handshake-ul cade cu „Invalid namespace" și pagina rămâne pe „offline". Reconectare cu reluarea stării, coadă de evenimente pe durata întreruperii, indicator vizibil de stare a conexiunii.
- **Finalizat:** 2026-08-16
- **Sursă:** `web/client/src/lib/quizrealm.ts`
- **Commit:** `27dad1d`
- **Depinde de:** SRV-086, SRV-040

#### WEB-004 · Internaționalizarea interfeței
- **Status:** ⬜ De făcut
- **Descriere:** Niciun șir hardcodat. Web-ul și aplicația folosesc **același set de chei**, ca o traducere să se scrie o singură dată.
- **Implementare corectă:** Bibliotecă de i18n cu încărcare leneșă per limbă, chei identice cu cele din aplicație. Comutator de limbă în antet, cu preferința salvată pe cont pentru utilizatorii autentificați și în `localStorage` pentru vizitatori. Formatarea datelor, orelor și numerelor prin `Intl`, niciodată manual. Rutele publice au prefix de limbă (`/ro/`, `/en/`) pentru indexare corectă; zona de joc nu are nevoie.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 1
- **Commit:** —
- **Depinde de:** SRV-003, SRV-004

#### WEB-005 · Sistemul de design, aplicat
- **Status:** 🟡 Parțial
- **Descriere:** Tokenii de culoare, tipografie și spațiere din `docs/design-system.md` sunt sursa unică; ecranele nu definesc culori local.
- **Implementare corectă:** Paleta bleumarin aproape negru, aur metalic în trei tonuri, albastru electric pentru interacțiune. Componente reutilizabile: panou cu ramă, buton, card de întrebare, bară de rundă. Panoul de administrare are deja tema lui coerentă; zona publică și cea de joc trebuie aliniate la aceiași tokeni.
- **Finalizat:** —
- **Sursă:** `docs/design-system.md`
- **Commit:** —
- **Depinde de:** —

#### WEB-006 · Rutare și cadre separate
- **Status:** ✅ Implementat
- **Descriere:** Zona publică, zona de joc și panoul au cadre diferite și nu se împrumută antetul.
- **Implementare corectă:** Panoul ocolește antetul public — altfel ar fura din înălțimea utilă a tabloului de bord. Rutele necunoscute duc la o pagină de „negăsit" cu drum înapoi, nu la pagina de start.
- **Finalizat:** 2026-08-17
- **Sursă:** `web/client/src/App.tsx`
- **Commit:** `badf918`
- **Depinde de:** —

---

## Grupa B · Zona publică

#### WEB-007 · Pagina de start
- **Status:** 🟡 Parțial
- **Descriere:** Prima pagină pe care o vede cineva care n-a auzit de joc. Trebuie să explice în cinci secunde ce e QuizRealm și să ducă la înregistrare.
- **Implementare corectă:** Secțiune de deschidere cu propunerea de valoare — cunoașterea devine teritoriu — și un buton clar de intrare. Sub ea: cum se joacă în trei pași, modurile disponibile, harta campaniei curente **cu date reale** (e cel mai bun argument de vânzare al jocului), clasamentul de top, cifre reale de comunitate. Fără valori fixe rămase din schela inițială. Conținutul vine din CMS, pe limbă.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Content / CMS
- **Commit:** —
- **Depinde de:** SRV-031, ADM-056

#### WEB-008 · Pagina „cum se joacă"
- **Status:** ⬜ De făcut
- **Descriere:** Regulile jocului, modurile, sistemul de cucerire, rangurile — pentru cineva care decide dacă merită să încerce.
- **Implementare corectă:** O secțiune per mod, cu o ilustrare a mecanicii de cucerire. Conținut editabil din CMS, pe limbă, ca să nu ceară redeploy la fiecare schimbare de reguli.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** ADM-056

#### WEB-009 · Noutăți și note de versiune
- **Status:** ⬜ De făcut
- **Descriere:** Ce s-a schimbat, ce evenimente sunt în curs, ce sezon rulează.
- **Implementare corectă:** Listă paginată cu articole din CMS, pe limbă, cu fixare în capul listei. Notele de versiune se leagă de versiunea publicată a aplicației. Flux RSS — costă puțin și ajută indexarea.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Content / CMS
- **Commit:** —
- **Depinde de:** ADM-056

#### WEB-010 · Întrebări frecvente și suport
- **Status:** ⬜ De făcut
- **Descriere:** Răspunsurile la ce întreabă lumea și calea către un om când nu e suficient.
- **Implementare corectă:** Grupate pe teme, cu căutare, din CMS. Formular de contact care creează un tichet, cu contextul contului atașat automat când utilizatorul e autentificat — un raport fără context e o conversație de trei mesaje înainte să înceapă.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Content / CMS
- **Commit:** —
- **Depinde de:** ADM-056

#### WEB-011 · Pagini legale
- **Status:** ⬜ De făcut
- **Descriere:** Politica de confidențialitate, termenii, politica de cookie-uri, regulile comunității.
- **Implementare corectă:** Versionate, cu data intrării în vigoare vizibilă și arhiva versiunilor anterioare accesibilă. La o schimbare majoră, jucătorii confirmă la următoarea autentificare. **Obligatorii înainte de lansare** și înainte de orice listare în magazine.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** ADM-056

#### WEB-012 · Clasamente publice
- **Status:** 🟡 Parțial
- **Descriere:** Cei mai buni jucători, vizibili și fără cont — argument de intrare și motiv de mândrie.
- **Implementare corectă:** Comutare rapidă între **Țara mea**, **Global** și **Prieteni**, ca la ligile din Duolingo. Clasamentul de țară e implicit pentru limbile locale; poolul global pentru engleză. Valorile fixe rămase din schelă se înlocuiesc cu date reale.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.4 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-045

#### WEB-013 · Profil public de jucător
- **Status:** ⬜ De făcut
- **Descriere:** O pagină pe care un jucător o poate arăta altcuiva: rang, realizări, statistici, sezoane.
- **Implementare corectă:** Rută `/players/:username` peste endpointul existent, cu respectarea setărilor de confidențialitate ale contului — un profil ascuns rămâne ascuns și pentru vizitatori neautentificați. Rezolvă și butonul „View Profile" din panou, care azi doar desfășoară un bloc local.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §13
- **Commit:** —
- **Depinde de:** SRV-022

#### WEB-014 · Pagină de descărcare a aplicației
- **Status:** ⬜ De făcut
- **Descriere:** Legătura către magazinele de aplicații, cu detectarea platformei.
- **Implementare corectă:** Detectare de platformă pentru butonul principal, cu ambele variante vizibile. Legături directe către APK-ul de pe GitHub cât timp nu există listare în magazin, cu avertizarea explicită că e instalare din afara magazinului.
- **Finalizat:** —
- **Sursă:** `.github/workflows/build-apk-release.yml`
- **Commit:** —
- **Depinde de:** —

---

## Grupa C · Cont și onboarding

#### WEB-015 · Înregistrare și autentificare
- **Status:** ✅ Implementat
- **Descriere:** Cont nou, autentificare cu parolă sau Google, al doilea factor.
- **Implementare corectă:** Captcha la înregistrare, validare de vârstă, mesaje de eroare care spun ce s-a întâmplat și cum se repară.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `web/client/src/pages/Auth.tsx`
- **Commit:** `321bb53`
- **Depinde de:** SRV-006

#### WEB-016 · Alegerea țării și a limbii
- **Status:** ⬜ De făcut
- **Descriere:** Ecran dedicat imediat după crearea contului, înainte de prima partidă.
- **Implementare corectă:** Listă de țări căutabilă, cu sugestie din locale-ul browserului — **niciodată impusă automat**, jucătorul confirmă explicit. Limba se sugerează din țară, dar rămâne alegerea lui: un român poate alege engleza pentru poolul global. Se explică pe loc consecința alegerii asupra matchmaking-ului și clasamentului, plus cooldown-ul la schimbare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.2 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-002

#### WEB-017 · Setări de cont
- **Status:** ⬜ De făcut
- **Descriere:** Profil, confidențialitate, securitate, limbă, notificări, sesiuni.
- **Implementare corectă:** Schimbarea numelui de afișare, a țării și a limbii **cu cooldown-ul afișat clar** înainte de confirmare. Lista sesiunilor active cu revocare individuală. Configurarea 2FA. Cererea de export de date și cea de ștergere a contului, cu explicația a ce se elimină și ce rămâne anonimizat.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.2 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-002, SRV-088, SRV-089

#### WEB-018 · Profilul propriu
- **Status:** 🟡 Parțial
- **Descriere:** Rangul, nivelul de cont, statisticile, realizările, istoricul de meciuri.
- **Implementare corectă:** Grafice simple de progres — acuratețe pe categorie, evoluția rangului — nu doar numere brute. Istoricul de meciuri paginat, cu acces la reconstituirea fiecăruia. Valorile fixe rămase din schelă se înlocuiesc.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Depinde de:** SRV-022, SRV-045

---

## Grupa D · Zona de joc

#### WEB-019 · Lobby și alegerea modului
- **Status:** ⬜ De făcut
- **Descriere:** Punctul din care începe orice partidă. „Joacă" duce aici, nu direct în duel.
- **Implementare corectă:** Cele cinci moduri ca alegeri distincte, cu descriere scurtă și durată estimată. Modul Clasic e evidențiat: e miezul jocului. Arată sezonul curent, facțiunea jucătorului și județul disputabil la care are acces.
- **Finalizat:** —
- **Sursă:** `docs/archive/structura-joc.md` §3, punctul 3 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-035

#### WEB-020 · Coada de matchmaking
- **Status:** ⬜ De făcut
- **Descriere:** Ce vede jucătorul cât așteaptă un adversar.
- **Implementare corectă:** Timp de așteptare, poolul în care caută (limbă și țară) și, la lărgirea căutării, **o întrebare explicită**, nu o extindere tăcută. Anulare oricând. La cozi lungi, sugestia de a juca antrenament între timp.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.3 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-044

#### WEB-021 · Selecția de categorii
- **Status:** ⬜ De făcut
- **Descriere:** Jucătorul își alege categoriile preferate înainte de meci.
- **Implementare corectă:** Selecție multiplă, cu explicația că se joacă pe **intersecția** preferințelor ambilor jucători și că se revine la „toate" când intersecția e goală. Serverul e gata de mult; lipsește doar interfața.
- **Finalizat:** —
- **Sursă:** `docs/archive/structura-joc.md` §3, punctul 4 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-042

#### WEB-022 · Ecranul de meci Clasic
- **Status:** 🟡 Parțial
- **Descriere:** Harta ca tablă de joc, cu teritorii cucerite în timp real.
- **Implementare corectă:** Ecranul de battle a fost reconstruit pe starea reală de meci și desenează graful de teritorii primit de la server. Ce lipsește: legătura cu județul disputat din campanie și animația de cucerire — o tranziție, nu o schimbare instantanee de culoare. Cronometru circular, nu doar text.
- **Finalizat:** 2026-08-16
- **Sursă:** `web/client/src/pages/Game.tsx`
- **Commit:** `f8be6f4`
- **Depinde de:** SRV-032, SRV-035

#### WEB-023 · Duel, Blitz și partidă privată
- **Status:** ⬜ De făcut
- **Descriere:** Celelalte moduri, în browser.
- **Implementare corectă:** Duelul refolosește ecranul de meci cu HUD de confruntare. Blitz-ul diferă doar prin ritm și trebuie să **arate** asta — cronometru mai agresiv. Partida privată are ecran de cameră cu cod copiabil, link de invitație, locuri și completare cu boți.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** SRV-036, SRV-038

#### WEB-024 · Antrenament pe categorii
- **Status:** ⬜ De făcut
- **Descriere:** Modul solo, fără presiune, pentru onboarding și pentru testarea băncii.
- **Implementare corectă:** Alegi una sau mai multe categorii și joci o rundă. Fără ELO, fără impact pe hartă. E și modul în care un vizitator poate încerca jocul înainte să-și facă cont.
- **Finalizat:** —
- **Sursă:** `docs/archive/structura-joc.md` §3, punctul 2 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-053

#### WEB-025 · Partide cu mulți jucători și mod spectator
- **Status:** ⬜ De făcut
- **Descriere:** Lobby-uri de 4–8 jucători, cu urmărirea partidei după eliminare.
- **Implementare corectă:** Harta scalată cu numărul de jucători, clasament live în lateral, recompense pe loc final vizibile din timpul partidei. Spectatorul primește fluxul cu întârziere deliberată, ca să nu poată transmite răspunsuri.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-041, SRV-043

#### WEB-026 · Rezultatul partidei
- **Status:** ⬜ De făcut
- **Descriere:** Ce s-a câștigat: rang, XP, monede, progres de provocări, efectul pe hartă.
- **Implementare corectă:** Defalcare clară, cu **schimbarea de rang și efectul asupra județului evidențiate** — sunt motivele pentru care jucătorul a jucat. Buton de revanșă și de întoarcere în lobby. Legătură către reconstituirea partidei.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.6 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-032, SRV-045

#### WEB-027 · Reconectarea în partidă
- **Status:** ⬜ De făcut
- **Descriere:** O filă închisă din greșeală sau o pierdere de rețea nu trebuie să însemne înfrângere.
- **Implementare corectă:** La reîncărcarea paginii, dacă există o partidă activă, jucătorul e dus înapoi în ea automat. Indicator vizibil de reconectare cu timpul rămas din fereastră. În browser scenariul e mult mai frecvent decât pe telefon.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180)
- **Commit:** —
- **Depinde de:** SRV-040, WEB-003

---

## Grupa E · Campanie și social

#### WEB-028 · Harta campaniei
- **Status:** ⬜ De făcut
- **Descriere:** Harta țării cu cine ce deține, poziția facțiunii tale, unde poți ataca.
- **Implementare corectă:** Desenată din aceleași coordonate ca panoul și aplicația, dintr-o singură sursă. Teritoriile atacabile se disting vizual de restul. Actualizare în timp real la schimbarea proprietății — e ecranul care dă sens sezonului între partide.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 1
- **Commit:** —
- **Depinde de:** SRV-031

#### WEB-029 · Clasamentul de sezon și facțiuni
- **Status:** ⬜ De făcut
- **Descriere:** Cum stau facțiunile, cât mai are sezonul, ce ai contribuit tu.
- **Implementare corectă:** Contribuția personală lângă cea colectivă — un jucător trebuie să vadă că efortul lui contează într-un total de sute de mii. Numărătoare inversă până la închidere și previzualizarea recompenselor la poziția curentă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.5 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-031, SRV-033

#### WEB-030 · Prieteni și prezență
- **Status:** ⬜ De făcut
- **Descriere:** Lista de prieteni, cine e online, cereri și sugestii.
- **Implementare corectă:** Invitație directă la o partidă privată din listă. Prezența respectă setările de confidențialitate — cine a ales să apară offline rămâne offline.
- **Finalizat:** —
- **Sursă:** `docs/archive/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** SRV-067

#### WEB-031 · Chat
- **Status:** ⬜ De făcut
- **Descriere:** Camera globală pe limbă, conversațiile cu prietenii, mesajele private.
- **Implementare corectă:** Treapta de încredere și ce deblochează, afișate explicit — un jucător care nu poate scrie trebuie să afle de ce și ce-i lipsește. Mesajul de îndrumare la scrierea în altă limbă decât cea a camerei apare **doar autorului**. Raportarea unui mesaj în două clicuri.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.6 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-069, WEB-003

#### WEB-032 · Guilde
- **Status:** 🔒 Blocat pe SRV-070
- **Descriere:** Crearea, căutarea și administrarea unei guilde, plus războaiele ei.
- **Implementare corectă:** Listă de membri cu contribuție, chat de guildă, starea războiului curent și poziția în ligă. Rolurile de lider și ofițer determină ce se poate face.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.4 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-070, SRV-072

#### WEB-033 · Turnee
- **Status:** 🔒 Blocat pe SRV-071
- **Descriere:** Înscrierea, bracket-ul live și clasamentul de arenă.
- **Implementare corectă:** Bracket-ul e vizibil și după eliminare — creează motiv de urmărire. Reamintire înainte de startul turneului pentru cei înscriși.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.2 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-071

#### WEB-034 · Realizări și colecții
- **Status:** ⬜ De făcut
- **Descriere:** Sala realizărilor, cu progres, raritate, insigne și album.
- **Implementare corectă:** Raritatea afișată ca procent real de jucători care au deblocat, nu ca etichetă fixă. Editorul de showcase pentru profil.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §3 (de la linia 129)
- **Commit:** —
- **Depinde de:** SRV-057

#### WEB-035 · Misiuni, serie și întrebarea zilei
- **Status:** ⬜ De făcut
- **Descriere:** Motivele de întoarcere, adunate într-un singur loc vizibil de pe pagina de intrare.
- **Implementare corectă:** Misiunile zilnice cu progres, seria de logare cu perioada de grație rămasă, întrebarea zilei cu rezultat partajabil. **Nu într-un meniu ascuns** — dacă nu se văd la intrare, nu produc retenție.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.1–§7.2, §8.1 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-058, SRV-059, SRV-060

#### WEB-036 · Magazin
- **Status:** ⬜ De făcut
- **Descriere:** Cosmetice și powerups pe monede din joc; pachete de gems pe bani reali, când se activează.
- **Implementare corectă:** Rotația zilnică cu numărătoare inversă, previzualizarea cosmeticului pe propriul avatar înainte de cumpărare. Prețurile vin de la server, niciodată din client. Partea cu bani reali rămâne ascunsă cât timp monetizarea e amânată.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §9 (de la linia 395)
- **Commit:** —
- **Depinde de:** SRV-076, SRV-077

---

## Grupa F · Calitate

#### WEB-037 · Layout de la telefon la desktop
- **Status:** 🟡 Parțial
- **Descriere:** Jocul nu se joacă doar pe monitorul de dezvoltare.
- **Implementare corectă:** Zona de joc funcțională de la 1024 px în sus, zona publică de la 360 px. Ecranul de meci trebuie să fie jucabil pe un laptop mic fără derulare — o hartă tăiată face partida imposibilă. Panoul de admin are deja o lățime minimă gândită; restul nu.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 3
- **Commit:** —
- **Depinde de:** WEB-005

#### WEB-038 · Accesibilitate
- **Status:** ⬜ De făcut
- **Descriere:** Navigare de la tastatură, contrast suficient, etichete corecte.
- **Implementare corectă:** Toate acțiunile de joc accesibile de la tastatură, inclusiv alegerea răspunsului prin taste numerice — e și mai rapid pentru jucătorii buni. Contrast verificat pe tema închisă. Respectarea `prefers-reduced-motion` la animațiile de cucerire.
- **Finalizat:** —
- **Sursă:** `docs/design-system.md`
- **Commit:** —
- **Depinde de:** WEB-005

#### WEB-039 · Performanță și împărțirea bundle-ului
- **Status:** ⬜ De făcut
- **Descriere:** Bundle-ul trece deja de 500 kB, cu avertisment la fiecare build.
- **Implementare corectă:** Împărțire pe rute: panoul de administrare **nu** trebuie livrat vizitatorilor paginii de start. Încărcare leneșă pentru zona de joc și pentru fișierele de limbă. Buget de performanță verificat în CI, care cade la depășire.
- **Finalizat:** —
- **Sursă:** ieșirea `pnpm build`
- **Commit:** —
- **Depinde de:** —

#### WEB-040 · Indexare și partajare
- **Status:** ⬜ De făcut
- **Descriere:** Paginile publice trebuie găsite în căutare și să arate bine când sunt partajate.
- **Implementare corectă:** Titluri și descrieri per pagină și per limbă, etichete Open Graph cu imagine generată pentru profiluri și rezultate de sezon, `sitemap.xml` cu variantele de limbă, `hreflang` corect. Zona de joc și panoul rămân neindexate.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 1
- **Commit:** —
- **Depinde de:** WEB-004

#### WEB-041 · Aplicație web instalabilă
- **Status:** ⬜ De făcut
- **Descriere:** Web-ul jucabil merită să poată fi instalat pe desktop, cu pornire rapidă.
- **Implementare corectă:** Manifest, iconițe, service worker care cache-uiește doar resursele statice — **niciodată răspunsuri de joc**, care ar putea fi servite învechite exact în timpul unei partide. Ecran de offline care explică, nu unul gol.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 3
- **Commit:** —
- **Depinde de:** WEB-039

#### WEB-042 · Teste pe fluxurile critice
- **Status:** ⬜ De făcut
- **Descriere:** Patru parcurgeri care nu au voie să se strice niciodată.
- **Implementare corectă:** Teste automate de la un capăt la altul pentru: înregistrare cu alegerea țării și limbii; intrarea în coadă și jucarea unui meci Clasic până la rezultat; reconectarea după închiderea filei; cumpărarea unui cosmetic. Rulează în CI pe fiecare pull request, împotriva unui backend real pornit în container.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** WEB-022, WEB-027

#### WEB-043 · Mod de mentenanță și versiune minimă
- **Status:** ⬜ De făcut
- **Descriere:** Ce vede un jucător când serverul e oprit controlat sau clientul lui e prea vechi.
- **Implementare corectă:** Pagină de mentenanță cu mesaj tradus și, dacă se știe, momentul estimat al reluării. La client prea vechi, un mesaj de reîmprospătare, nu o eroare. Conturile de personal trec de mentenanță ca să poată verifica înainte de reluare.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea System
- **Commit:** —
- **Depinde de:** SRV-092, ADM-062
