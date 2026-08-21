# Aplicația Flutter — registru de task-uri

**Componentă:** `mobile/` (Flutter 3.47 / Dart 3.13).
**Prefix ID:** `APP-`
**Convenții:** [`00-README.md`](00-README.md)

Aplicația e clientul principal al jocului. E și cea mai avansată dintre cele trei
fronturi ca suprafață livrată — și, în același timp, cea care are cea mai mare
divergență față de plan: e construită azi în jurul unei campanii secvențiale pe
care `owner-plan.md` §7.3 o interzice explicit.

Decizia **D1** din [`../taskmaster.md`](../taskmaster.md) blochează o parte din
registru. Se ia în prima săptămână, altfel orice lucru la modul Clasic se face pe
lângă structura veche.

---

## Grupa A · Fundația

#### APP-001 · Toolchain aliniat cu CI
- **Status:** ✅ Implementat
- **Descriere:** Versiunea de Flutter din CI trebuie să includă Dart-ul declarat de pachet, altfel rezolvarea dependențelor cade înainte de orice compilare.
- **Implementare corectă:** Flutter 3.47.0 în workflow, care include Dart 3.13. Analiza și testele blochează build-ul; nu mai sunt marcate ca neblocante.
- **Finalizat:** 2026-08-16
- **Sursă:** `docs/project-audit-2026-08-16.md`, problema 5
- **Commit:** `faa8894`
- **Depinde de:** —

#### APP-002 · Dependențe Android fixate coerent
- **Status:** ✅ Implementat
- **Descriere:** O familie de pachete cu versiuni amestecate produce erori de „implementări lipsă" care nu apar la analiză.
- **Implementare corectă:** Toată familia `flutter_inappwebview` fixată pe aceeași linie de release; `flutter_secure_storage` pe versiunea pe care o suportă AGP-ul curent. Lecția: `flutter analyze` trece cu un graf de dependențe rupt, pentru că nu intră în pub-cache — validarea cere o compilare reală.
- **Finalizat:** 2026-08-16
- **Sursă:** `mobile/pubspec.yaml`
- **Commit:** `9a96fa2`
- **Depinde de:** APP-001

#### APP-003 · Modele generate din contractul serverului
- **Status:** ⬜ De făcut
- **Descriere:** Modelele de domeniu scrise de mână se dezacordă tăcut de server, iar simptomul apare ca un bug de joc.
- **Implementare corectă:** Modele Dart generate din OpenAPI și din definiția comună de evenimente Socket.IO. Generarea rulează în CI și cade dacă fișierele comise diferă. Aceleași contracte ca web-ul, dintr-o singură sursă.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 3
- **Commit:** —
- **Depinde de:** SRV-085, SRV-086

#### APP-004 · Internaționalizare completă
- **Status:** ⬜ De făcut
- **Descriere:** Fiecare șir vizibil trece prin traduceri, cu **aceleași chei ca web-ul** — o traducere se scrie o singură dată.
- **Implementare corectă:** Fișiere ARB per limbă, generate. Limba se ia din contul jucătorului, cu revenire la locale-ul sistemului. Formatarea datelor, orelor, numerelor și pluralelor prin `intl` — româna are trei forme de plural, iar concatenarea manuală le sparge. Suport pentru text care crește la traducere: germana ocupă cu 30% mai mult spațiu decât româna, iar butoanele trebuie să reziste.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 1
- **Commit:** —
- **Depinde de:** SRV-003, WEB-004

#### APP-005 · Un singur sistem de design
- **Status:** 🟡 Parțial
- **Descriere:** Auditul din 16 august a găsit **două limbaje vizuale concurente**: tema veche cu `GamePalette` și pergament, și sistemul `QuizRealm` cu bleumarin, aur metalic și albastru electric. Jucătorul percepe unele ecrane ca „aplicație Flutter cu skin" și altele ca „joc premium".
- **Implementare corectă:** Tokenii `QuizRealmColors`, `QuizRealmTypography`, `GoldFrame` și `FantasyPanel` devin sursa unică. Migrarea începe cu ecranele de joc, apoi social și setări. Niciun ecran nu mai definește culori, spațieri sau raze local. Duelul a fost deja migrat.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, problema 1
- **Commit:** `1122c17`
- **Depinde de:** —

#### APP-006 · Client de rețea cu reîmprospătare și reîncercare
- **Status:** ✅ Implementat
- **Descriere:** Un singur loc prin care trec cererile, cu reînnoirea tokenului expirat.
- **Implementare corectă:** Access de 15 minute, refresh de 30 de zile, rotație. Token-ul se păstrează în stocare securizată, niciodată în preferințe simple.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-010

#### APP-007 · Client de timp real cu reconectare
- **Status:** 🟡 Parțial
- **Descriere:** Conexiunea la `/game` funcționează pentru duel; lipsește reluarea stării după întrerupere.
- **Implementare corectă:** Pe mobil întreruperea e regula, nu excepția: trecere de la Wi-Fi la date, aplicație în fundal, apel primit. Reconectare cu reluarea stării partidei, coadă de evenimente pe durata întreruperii și indicator vizibil. Aplicația trimisă în fundal în timpul unei partide trebuie să reia din runda curentă la revenire, nu să repornească.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180)
- **Commit:** —
- **Depinde de:** SRV-040, SRV-086

#### APP-008 · Adrese de server ca parametri de compilare
- **Status:** ✅ Implementat
- **Descriere:** Un APK de release care arată spre `10.0.2.2` e inutilizabil, iar greșeala nu se vede până nu-l instalează cineva.
- **Implementare corectă:** `API_BASE_URL` și `REALTIME_BASE_URL` transmise prin `--dart-define` la build, verificate în `libapp.so` înainte de publicare.
- **Finalizat:** 2026-08-16
- **Sursă:** `.github/workflows/build-apk-release.yml`
- **Commit:** `faa8894`
- **Depinde de:** —

---

## Grupa B · Cont și onboarding

#### APP-009 · Autentificare completă
- **Status:** ✅ Implementat
- **Descriere:** E-mail și parolă, Google, invitat, al doilea factor, resetare de parolă.
- **Implementare corectă:** Google prin browserul de sistem, nu webview — cerință a politicilor și mai sigur. Captcha la înregistrare. Conversia contului de invitat se face o singură dată și migrează doar progres necompetitiv.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### APP-010 · Alegerea țării și a limbii
- **Status:** ⬜ De făcut
- **Descriere:** Ecran dedicat imediat după crearea contului, înainte de prima partidă.
- **Implementare corectă:** Listă căutabilă de țări, cu sugestie din locale-ul telefonului — **confirmată explicit**, niciodată impusă. Limba se sugerează din țară dar rămâne alegerea jucătorului. Se explică pe loc ce înseamnă alegerea pentru matchmaking și clasament, și că schimbarea are cooldown.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.2 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-002

#### APP-011 · Tutorial ghidat cu boți
- **Status:** ⬜ De făcut
- **Descriere:** Primele două partide sunt un tutorial jucat, nu ecrane statice de explicații.
- **Implementare corectă:** Prima partidă împotriva unui bot ușor, cu îndrumare contextuală care apare la momentul potrivit și dispare după. A doua introduce cucerirea de teritoriu. Se poate sări, dar nu e ascuns. E cea mai importantă fereastră de retenție din tot produsul: un jucător care nu înțelege mecanica în primele două minute nu se mai întoarce.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Depinde de:** SRV-039

#### APP-012 · Setări de cont
- **Status:** 🟡 Parțial
- **Descriere:** Profil, confidențialitate, securitate, limbă, notificări, sesiuni.
- **Implementare corectă:** Ecranul de sesiuni cu revocare individuală există deja. Lipsesc: schimbarea țării și limbii cu cooldown afișat, preferințele de notificări pe categorie, cererea de export de date și cea de ștergere a contului cu explicația a ce rămâne anonimizat.
- **Finalizat:** —
- **Sursă:** `docs/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-002, SRV-088

---

## Grupa C · Zona de joc

#### APP-013 · Retragerea campaniei secvențiale
- **Status:** 🔒 Blocat pe D1
- **Descriere:** Cele 9 ținuturi deblocate pe rând, cu stele per etapă, contrazic direct `owner-plan.md` §7.3. Harta e folosită ca meniu de nivele în loc de tablă de meci.
- **Implementare corectă:** Depinde de varianta aleasă la D1. Recomandarea e **C**: campania devine „Antrenament pe categorii", cu progres prin deblocare de categorii, fără hartă secvențială. **Atenție la migrare:** stelele și progresul salvate pe telefoanele jucătorilor actuali se pierd la orice variantă în afară de B — trebuie anunțat în aplicație înainte, nu descoperit după actualizare. Fișiere atinse: `domain/campaign/`, `features/map/world_map_screen.dart`, `features/battle/`.
- **Finalizat:** —
- **Sursă:** `docs/structura-joc.md` §4 (de la linia 87)
- **Commit:** —
- **Depinde de:** —

#### APP-014 · Ecran de alegere a modului
- **Status:** ⬜ De făcut
- **Descriere:** „Joacă" duce la alegerea modului, nu direct în duel.
- **Implementare corectă:** Cele cinci moduri cu descriere scurtă și durată estimată; Clasicul evidențiat ca miez al jocului. Arată sezonul curent, facțiunea și județul la care ai acces. Terminologia: **„Nivel de cont"**, niciodată „nivel" simplu.
- **Finalizat:** —
- **Sursă:** `docs/structura-joc.md` §3, punctul 3 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-035

#### APP-015 · Modul Clasic, cu harta ca tablă de joc
- **Status:** 🔒 Blocat pe SRV-035
- **Descriere:** Miezul jocului: răspunzi corect, cucerești teritoriu, harta țării se schimbă pentru toți.
- **Implementare corectă:** Harta există deja, desenată și funcțională — trebuie mutată din rolul de meniu în cel de tablă de meci. Animație de **cucerire**, o tranziție de culoare cu sens, nu o schimbare instantanee. Cronometru circular, nu text. Feedback haptic la răspuns corect și greșit.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Depinde de:** SRV-032, SRV-035, APP-013

#### APP-016 · Duelul
- **Status:** ✅ Implementat
- **Descriere:** Confruntarea 1v1, cu arenă, HUD și feedback pe răspuns.
- **Implementare corectă:** Arenă cu facțiune albastră și crimson, portrete, scoruri, teritorii, marcaj central. Întrebarea într-un panou cu ramă aurie; răspunsurile cu stări vizuale distincte pentru selectat, corect și greșit.
- **Finalizat:** 2026-08-16
- **Sursă:** `mobile/lib/features/duel/duel_screen.dart`
- **Commit:** `1122c17`
- **Depinde de:** SRV-037

#### APP-017 · Blitz și partidă privată
- **Status:** ⬜ De făcut
- **Descriere:** Modul rapid și camera cu cod.
- **Implementare corectă:** Blitz-ul trebuie să **se simtă** diferit, nu doar să aibă alți parametri: cronometru mai agresiv, ritm vizual mai strâns. Camera privată: cod copiabil, partajare prin sistemul de share al telefonului, alegerea numărului de locuri, completare cu boți, alegerea categoriilor.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.4 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-036, SRV-038

#### APP-018 · Selecția de categorii
- **Status:** ⬜ De făcut
- **Descriere:** Alegerea categoriilor preferate înainte de meci.
- **Implementare corectă:** Selecție multiplă cu explicația că se joacă pe intersecția preferințelor și că se revine la „toate" când intersecția e goală. Serverul e gata; lipsește doar interfața.
- **Finalizat:** —
- **Sursă:** `docs/structura-joc.md` §3, punctul 4 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-042

#### APP-019 · Antrenament pe categorii
- **Status:** 🟡 Parțial
- **Descriere:** Modul solo, fără presiune. Preia rolul actual al campaniei.
- **Implementare corectă:** `CategoryRoundSource` există deja, cu deduplicare între categorii care se suprapun. Lipsește ecranul propriu, desprins de campanie. Fără ELO, fără impact pe hartă.
- **Finalizat:** —
- **Sursă:** `docs/structura-joc.md` §3, punctul 2 (de la linia 64)
- **Commit:** —
- **Depinde de:** SRV-053, APP-013

#### APP-020 · Coada de matchmaking
- **Status:** 🟡 Parțial
- **Descriere:** Ce vede jucătorul cât așteaptă.
- **Implementare corectă:** Timp de așteptare, poolul în care caută, iar la lărgirea căutării **o întrebare explicită**, nu o extindere tăcută. Ecranul de căutare trebuie migrat la sistemul de design nou.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.3 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-044

#### APP-021 · Partide cu mulți jucători și spectator
- **Status:** ⬜ De făcut
- **Descriere:** Lobby-uri de 4–8 jucători, cu urmărire după eliminare.
- **Implementare corectă:** Harta și HUD-ul scalate: opt jucători pe un ecran de telefon cer o altă ierarhie vizuală decât doi. Clasament live compact. Recompensele pe loc final, vizibile din timpul partidei — la opt jucători, șansa de victorie e mică, iar fără recompensă pe loc modul nu reține.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.2, §12.6 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-041, SRV-043

#### APP-022 · Rezultatul partidei
- **Status:** 🟡 Parțial
- **Descriere:** Ce s-a câștigat și ce s-a schimbat pe hartă.
- **Implementare corectă:** Defalcare de rang, XP, monede, progres de provocări și efectul asupra județului. Ecranul de rezultat trebuie migrat la sistemul de design nou. Revanșă și întoarcere în lobby.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, sprintul recomandat
- **Commit:** —
- **Depinde de:** SRV-032, SRV-045

#### APP-023 · Chat în meci
- **Status:** 🟡 Parțial
- **Descriere:** Comunicarea în timpul partidei, cu aceleași reguli de încredere ca restul chatului.
- **Implementare corectă:** Reacții presetate pentru treptele mici și pentru minori; text liber de la treapta care îl permite. Trebuie migrat la sistemul de design nou.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, sprintul recomandat
- **Commit:** —
- **Depinde de:** SRV-068

---

## Grupa D · Campanie și social

#### APP-024 · Ecranul de campanie
- **Status:** 🔒 Blocat pe SRV-031
- **Descriere:** Harta țării între partide: cine ce deține, unde poți ataca, cum stă facțiunea ta.
- **Implementare corectă:** Desenată din aceleași coordonate ca web-ul și panoul. Teritoriile atacabile, distincte vizual. Actualizare la revenirea în ecran, nu doar la pornirea aplicației. Înlocuiește harta de campanie secvențială.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 1
- **Commit:** —
- **Depinde de:** SRV-031, APP-013

#### APP-025 · Clasamentul de sezon
- **Status:** ⬜ De făcut
- **Descriere:** Poziția facțiunilor, timpul rămas, contribuția personală.
- **Implementare corectă:** Contribuția ta lângă totalul colectiv, ca efortul individual să fie vizibil într-un total mare. Previzualizarea recompenselor la poziția curentă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.5 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-033

#### APP-026 · Clasamente pe niveluri
- **Status:** 🟡 Parțial
- **Descriere:** Țara mea, Global, Prieteni — cu comutare rapidă.
- **Implementare corectă:** Clasamentul de țară e implicit pentru limbile locale; poolul global pentru engleză. Poziția proprie e mereu vizibilă, chiar când e departe de vârf — un clasament în care nu te găsești nu motivează.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.4 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-045

#### APP-027 · Prieteni, prezență, sugestii
- **Status:** ✅ Implementat
- **Descriere:** Hub social cu cereri, prezență și sugestii din partide recente.
- **Implementare corectă:** Blocarea rupe prietenia și oprește comunicarea în ambele sensuri. Sugestiile cer consimțământ bilateral.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/owner-plan-progress.md` §2
- **Commit:** `af4835a`
- **Depinde de:** SRV-067

#### APP-028 · Chat global, de prieteni și privat
- **Status:** ✅ Implementat
- **Descriere:** Cele trei suprafețe de conversație, cu inbox de cereri pentru primul mesaj de la un necunoscut.
- **Implementare corectă:** Livrare live prin Socket.IO, istoric paginat pentru conversațiile persistente, efemer pentru global.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** SRV-066

#### APP-029 · Mesajul de limbă greșită în camera publică
- **Status:** 🔒 Blocat pe SRV-069
- **Descriere:** Când scrii în altă limbă decât cea a camerei, primești o îndrumare, nu o pedeapsă.
- **Implementare corectă:** Mesaj de sistem **vizibil doar autorului**, cu textul original păstrat în câmp ca să poată fi rescris, nu șters. Nu e o sancțiune la prima abatere.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.6 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-069

#### APP-030 · Guilde și turnee
- **Status:** 🔒 Blocat pe SRV-070
- **Descriere:** Apartenența la o guildă, războaiele ei, înscrierea la turnee.
- **Implementare corectă:** Lista de membri cu contribuție, chat de guildă, starea războiului, poziția în ligă. Bracket-ul de turneu vizibil și după eliminare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-070, SRV-071

---

## Grupa E · Progres, retenție, magazin

#### APP-031 · Realizări și Sala Prestigiului
- **Status:** ✅ Implementat
- **Descriere:** Progres, raritate, insigne echipabile, showcase de profil.
- **Implementare corectă:** Trei sloturi de insigne validate server-side; până la șase realizări în showcase. Raritatea vine recalculată din procentul real de deblocări.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/owner-plan-progress.md` §3
- **Commit:** `4257de5`
- **Depinde de:** SRV-057

#### APP-032 · Rang și nivel de cont
- **Status:** ⬜ De făcut
- **Descriere:** Cele 24 de trepte, meciurile de plasare, progresul până la treapta următoare.
- **Implementare corectă:** Se afișează **rangul și diviziunea, nu ELO-ul brut** — reduce presiunea numărului exact. Insigna de rang lângă avatar în toate contextele: profil, lobby, meci. Nivelul de cont e separat vizual de rang și se numește mereu „Nivel de cont".
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.2–§5.3 (de la linia 228)
- **Commit:** —
- **Depinde de:** SRV-045

#### APP-033 · Misiuni, serie de logare, întrebarea zilei
- **Status:** ⬜ De făcut
- **Descriere:** Motivele de întoarcere zilnică, vizibile de pe primul ecran.
- **Implementare corectă:** Misiunile cu progres, seria cu perioada de grație rămasă, întrebarea zilei cu rezultat partajabil prin sistemul de share al telefonului. **Pe ecranul de intrare, nu într-un meniu** — dacă nu se văd, nu produc retenție.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.1–§7.2, §8.1 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-058, SRV-059, SRV-060

#### APP-034 · Provocare asincronă și rivalitate
- **Status:** ⬜ De făcut
- **Descriere:** Trimiți unui prieten un set de întrebări; el joacă când poate. Adversarul cel mai frecvent devine rival.
- **Implementare corectă:** Invitația se trimite prin sistemul de share, deci funcționează și către cineva care n-are încă aplicația — cea mai ieftină cale de creștere din tot produsul. Bilanțul cu rivalul se arată la reîntâlnire în lobby.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.2–§8.3 (de la linia 364)
- **Commit:** —
- **Depinde de:** SRV-061, SRV-062

#### APP-035 · Cutia poștală
- **Status:** ⬜ De făcut
- **Descriere:** Mesaje de la sistem și de la administrație, cu recompense atașate.
- **Implementare corectă:** Filă separată pentru conversațiile de tip sistem, **fără câmp de răspuns** până când există o coadă de suport. Recompensa se revendică o singură dată. Textele vin ca chei traduse.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §1
- **Commit:** —
- **Depinde de:** SRV-082, SRV-083

#### APP-036 · Magazin și inventar
- **Status:** 🟡 Parțial
- **Descriere:** Cosmetice și powerups pe monede din joc; pachete de gems când monetizarea se activează.
- **Implementare corectă:** Rotația zilnică cu numărătoare inversă; previzualizarea cosmeticului **pe propriul avatar** înainte de cumpărare. Prețurile vin de la server. Partea cu bani reali rămâne ascunsă cât timp monetizarea e amânată — un magazin cu prețuri inactive e mai rău decât unul absent.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §9 (de la linia 395)
- **Commit:** —
- **Depinde de:** SRV-076, SRV-077

#### APP-037 · Achiziții prin magazinele de aplicații
- **Status:** 🔒 Blocat — monetizare amânată
- **Descriere:** Bunurile digitale consumate în aplicație trebuie să treacă prin Google Play Billing și Apple IAP.
- **Implementare corectă:** Clientul inițiază achiziția prin biblioteca magazinului; **chitanța se verifică server-side**, direct la Google sau Apple. Gems nu se acordă niciodată pe baza a ce raportează clientul. Restaurarea achizițiilor pe un dispozitiv nou e obligatorie de politici.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, secțiunea Monetizare
- **Commit:** —
- **Depinde de:** SRV-078

---

## Grupa F · Specific mobil

#### APP-038 · Notificări push
- **Status:** ⬜ De făcut
- **Descriere:** Reamintiri de serie, tura ta la un duel asincron, început de turneu, sfârșit de sezon.
- **Implementare corectă:** Permisiunea se cere **în context**, după ce jucătorul a văzut o dată ce ratează, nu la prima pornire — cerută prea devreme, e refuzată și nu se mai poate cere. Preferințe pe categorie. Apăsarea deschide direct ecranul potrivit, nu pagina de start.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Notifications
- **Commit:** —
- **Depinde de:** SRV-084

#### APP-039 · Legături profunde
- **Status:** ⬜ De făcut
- **Descriere:** Un link de invitație la o cameră privată sau la o provocare trebuie să deschidă direct ecranul respectiv.
- **Implementare corectă:** Legături de aplicație pe Android și universale pe iOS, cu revenire la pagina web când aplicația nu e instalată — și cu preluarea invitației după instalare, altfel fluxul de invitare se rupe exact la utilizatorii noi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.4 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-038, WEB-014

#### APP-040 · Comportament în fundal și la întrerupere
- **Status:** ⬜ De făcut
- **Descriere:** Un apel primit în timpul unei partide nu trebuie să însemne înfrângere.
- **Implementare corectă:** La trecerea în fundal, conexiunea se menține cât permite sistemul, apoi se intră în fereastra de reconectare. La revenire, reluare din runda curentă. Cronometrul rundei rămâne al serverului — o aplicație în fundal nu are voie să câștige timp.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180)
- **Commit:** —
- **Depinde de:** SRV-040, APP-007

#### APP-041 · Consum de baterie și date
- **Status:** ⬜ De făcut
- **Descriere:** Un joc de trivia nu are voie să consume ca un joc 3D.
- **Implementare corectă:** Fără reîmprospătări periodice când aplicația nu e în prim-plan. Imaginile la rezoluția afișată, nu la cea sursă. Măsurare pe un dispozitiv real de gamă mică, nu pe emulator — bugetul de date pe partidă trebuie să rămână sub câteva sute de kiloocteți.
- **Finalizat:** —
- **Sursă:** `plan.md` §2 (de la linia 45)
- **Commit:** —
- **Depinde de:** —

#### APP-042 · Comportament fără rețea
- **Status:** ⬜ De făcut
- **Descriere:** Ce se întâmplă când semnalul dispare complet.
- **Implementare corectă:** Ecran care explică și reîncearcă singur, nu o eroare goală. Antrenamentul poate rula pe un set de întrebări descărcat dinainte; **modurile competitive nu**, pentru că rezultatul trebuie validat server-side. Distincția trebuie să fie clară pentru jucător.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** SRV-053

#### APP-043 · Accesibilitate
- **Status:** ⬜ De făcut
- **Descriere:** Cititor de ecran, contrast, dimensiune de text, mișcare redusă.
- **Implementare corectă:** Etichete semantice pe controalele de joc. Interfața trebuie să reziste la text mărit de sistem — butoanele de răspuns sunt primele care se rup. Respectarea preferinței de mișcare redusă la animațiile de cucerire.
- **Finalizat:** —
- **Sursă:** `docs/design-system.md`
- **Commit:** —
- **Depinde de:** APP-005

---

## Grupa G · Calitate și lansare

#### APP-044 · Teste golden pentru ecranele de joc
- **Status:** 🟡 Parțial
- **Descriere:** Capturi de referință pentru stările duelului: activ, selectat, corect, greșit, așteptare, rezultat.
- **Implementare corectă:** Golden-urile se generează **pe CI, pe Linux**, niciodată local pe Windows: redarea fonturilor diferă și produce diferențe de sub un procent care nu sunt regresii reale. Un golden care pică local dar trece pe CI nu se regenerează.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, sprintul recomandat
- **Commit:** —
- **Depinde de:** APP-005

#### APP-045 · Teste de integrare pe fluxurile critice
- **Status:** ⬜ De făcut
- **Descriere:** Patru parcurgeri care nu au voie să se strice.
- **Implementare corectă:** Înregistrare cu alegerea țării și limbii; tutorialul cu bot până la capăt; un meci Clasic până la rezultat; reconectarea după trecerea în fundal. Rulează pe CI împotriva unui backend real pornit în container.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** APP-015

#### APP-046 · Keystore de release propriu
- **Status:** ⬜ De făcut
- **Descriere:** APK-ul se semnează azi cu cheia de debug. Google Play nu acceptă asta.
- **Implementare corectă:** Keystore generat și păstrat în afara depozitului, cu parola în secretele CI și o copie de siguranță în afara mașinii. **Cheia nu se poate schimba după prima publicare** — o pierdere înseamnă o aplicație nouă, cu zero instalări. E blocajul cel mai tăcut din tot registrul: nu se vede până în ziua publicării.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, problema 4
- **Commit:** —
- **Depinde de:** —

#### APP-047 · Release doar la tag explicit
- **Status:** ⬜ De făcut
- **Descriere:** Azi orice push pe `main` poate crea un tag și un release public.
- **Implementare corectă:** Verificările rulează la pull request; release-ul pornește doar de la un tag semnat sau o aprobare manuală. Versiunea și numărul de build cresc controlat, nu la fiecare împingere.
- **Finalizat:** —
- **Sursă:** `docs/project-audit-2026-08-16.md`, problema 4
- **Commit:** —
- **Depinde de:** SRV-094

#### APP-048 · Bundle pentru Play și build iOS
- **Status:** ⬜ De făcut
- **Descriere:** Play Store cere Android App Bundle, nu APK. iOS n-a fost niciodată compilat.
- **Implementare corectă:** Build de `.aab` pe lângă APK-ul de distribuire directă. Pentru iOS: cont de dezvoltator, profiluri de semnare, prima compilare — de făcut **devreme**, pentru că descoperă probleme de dependențe care pe Android nu apar.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** APP-046

#### APP-049 · Listarea în magazine
- **Status:** ⬜ De făcut
- **Descriere:** Descriere, capturi, clasificare de vârstă, etichete de confidențialitate.
- **Implementare corectă:** Toate materialele **în fiecare limbă suportată** — o listare doar în română nu se vede în căutările din alte țări. Chestionarul de clasificare cere răspunsuri oneste despre chatul dintre utilizatori, care ridică pragul de vârstă. Eticheta de confidențialitate trebuie să corespundă exact datelor colectate.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** WEB-011, APP-048

#### APP-050 · Actualizare forțată și versiune minimă
- **Status:** ⬜ De făcut
- **Descriere:** Un client vechi care nu mai înțelege contractul serverului trebuie oprit cu un mesaj, nu lăsat să se comporte ciudat.
- **Implementare corectă:** Serverul întoarce versiunea minimă acceptată; sub ea, ecran de actualizare cu legătură directă către magazin, fără posibilitate de ocolire. Peste ea dar sub cea curentă, o sugestie care se poate amâna.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea System
- **Commit:** —
- **Depinde de:** SRV-092

#### APP-051 · Urmărirea erorilor din producție
- **Status:** ⬜ De făcut
- **Descriere:** O eroare pe telefonul unui jucător nu ajunge nicăieri azi.
- **Implementare corectă:** Raportare de erori cu urma stivei și versiunea, **fără date personale în raport**. Gruparea pe tip și alertă la o creștere bruscă după un release. Consimțământul se cere la prima pornire, cu explicație.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** SRV-091

#### APP-052 · Beta închisă, apoi deschisă
- **Status:** ⬜ De făcut
- **Descriere:** Ultima etapă înainte de lansarea publică.
- **Implementare corectă:** Canal închis pe Play cu un grup restrâns, cu un drum de feedback vizibil în aplicație. Se trece la beta deschisă doar după ce testul de încărcare pe matchmaking a trecut și după ce restaurarea unei copii de siguranță a fost verificată.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** SRV-093, SRV-026, APP-049
