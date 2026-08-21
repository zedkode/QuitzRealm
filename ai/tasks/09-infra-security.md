# Infrastructură și securitate — registru de task-uri

**Disciplină:** găzduire, scalare, cost, securitate, continuitate.
**Prefix ID:** `INF-`
**Convenții:** [`00-README.md`](00-README.md)

Registrul ăsta lipsea, iar lipsa lui ascundea un fapt simplu: **stiva rulează
azi pe un singur VPS partajat cu alte trei proiecte**, cu Postgres, Redis, API,
realtime și web pe aceeași mașină. E o configurație perfect potrivită pentru
dezvoltare și complet nepotrivită pentru o lansare publică.

Nimic din registru nu adaugă funcții. Fără el, funcțiile din celelalte registre
cad la primul vârf de trafic sau, mai rău, pierd date.

---

## Grupa A · Starea actuală și limitele ei

#### INF-001 · Inventarul stivei curente
- **Status:** ✅ Implementat
- **Descriere:** Ce rulează, unde și cum se pornește.
- **Implementare corectă:** Cinci containere într-un proiect Compose izolat, pe rețea proprie, expuse doar prin tunel Cloudflare. Migrările rulează la pornire. Documentat, cu regulile de siguranță: niciodată `down -v`, niciodată `prune -a`, niciodată `down` fără fișierul de producție, iar `.env.prod` nu părăsește serverul.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Produce:** —

#### INF-002 · Pragul până la care ține configurația actuală
- **Status:** ⬜ De făcut
- **Descriere:** Câți jucători simultani suportă mașina de acum, înainte să aflăm din experiență.
- **Implementare corectă:** Se măsoară cu testul de încărcare, nu se estimează. Se urmăresc trei limite separat: conexiuni Socket.IO simultane, memoria Redis ocupată de partidele active, și conexiunile la Postgres. **Prima care cedează nu e neapărat procesorul** — la un joc în timp real, de obicei e memoria stării de partidă. Rezultatul e cifra care declanșează INF-003.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** SRV-093

#### INF-003 · Planul de separare a serviciilor
- **Status:** ⬜ De făcut
- **Descriere:** Ce se mută primul de pe mașina comună când traficul crește.
- **Implementare corectă:** Ordinea: întâi **baza de date** pe o instanță proprie, cu copii de siguranță independente — e singura componentă a cărei pierdere nu se poate repara. Apoi `realtime`, care are alt profil de încărcare decât API-ul. Web-ul și API-ul rămân împreună cel mai mult. Planul se scrie acum, se execută la prag; improvizat sub presiune, se fac greșeli.
- **Finalizat:** —
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Produce:** INF-004

#### INF-004 · Bugetul lunar și pragurile de cost
- **Status:** ⬜ De făcut
- **Descriere:** Cât costă infrastructura la 1.000, 10.000 și 100.000 de jucători activi lunar.
- **Implementare corectă:** Trei scenarii cu cifre reale de la furnizor. Costul per jucător activ trebuie să fie cunoscut **înainte** de a decide dacă și cum se monetizează — altfel un joc de succes devine o pierdere lunară. Include lățimea de bandă, stocarea copiilor de siguranță și, când se activează, comisionul magazinelor.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, secțiunea Monetizare
- **Commit:** —
- **Produce:** LEG-010

#### INF-005 · Mediu de dezvoltare local, separat de producție
- **Status:** ✅ Implementat
- **Descriere:** Stivă completă pe calculatorul propriu, ca migrările și experimentele să nu atingă producția.
- **Implementare corectă:** Două moduri, din același `infra/docker-compose.yml`. Implicit, doar serviciile cu stare în Docker și aplicațiile native — pe Windows, urmărirea fișierelor prin bind mount e lentă și scapă schimbări, iar `nest --watch` și Vite HMR native răspund instant. Profilul `full` rulează tot în Docker, cu aceeași imagine care ajunge pe VPS, pentru verificarea de dinaintea implementării. Comenzile din `package.json` trimit `-f` explicit către fișierul local, ca o operație distructivă să nu poată nimeri producția. **Datele reale nu se copiază niciodată** local — dacă e nevoie de volum, se generează. Procedura completă în `docs/dev-local.md`.
- **Finalizat:** 2026-08-21 · 19:05
- **Sursă:** `docs/dev-local.md`
- **Commit:** —
- **Produce:** QA-008

#### INF-019 · Pornire fără credențiale externe
- **Status:** ⬜ De făcut
- **Descriere:** API-ul nu pornește fără `GOOGLE_CLIENT_ID`, chiar dacă nimeni nu folosește autentificarea Google local.
- **Implementare corectă:** Strategia Google se construiește la pornire și cere cheile prin `getOrThrow`. Mediul local le trimite valori de rezervă ca aplicația să pornească, dar e un pansament: **strategiile de autentificare externe trebuie să se înregistreze doar când sunt configurate**, iar absența lor să fie un jurnal, nu o oprire. Un mediu nou care cere chei de la un furnizor terț ca să compileze e o barieră inutilă pentru orice agent sau colaborator nou. Aceeași regulă pentru orice furnizor adăugat ulterior — push, plăți, urmărirea erorilor.
- **Finalizat:** —
- **Sursă:** `docs/dev-local.md`, secțiunea de capcane
- **Commit:** —
- **Produce:** INF-005

---

## Grupa B · Continuitate

#### INF-006 · Copii de siguranță cu restaurare verificată
- **Status:** 🟡 Parțial
- **Descriere:** O copie netestată nu e o copie de siguranță.
- **Implementare corectă:** Dump zilnic, păstrat **în afara VPS-ului** — o copie pe aceeași mașină nu protejează de pierderea mașinii. Restaurare automată lunară într-o bază temporară, cu verificarea numărului de rânduri din tabelele critice. Alertă dacă ultima restaurare reușită trece de 35 de zile. Data ultimei restaurări verificate se vede în panou.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Backups
- **Commit:** —
- **Produce:** SRV-026, ADM-064

#### INF-007 · Procedura de refacere după dezastru
- **Status:** ⬜ De făcut
- **Descriere:** Ce se face, în ce ordine, dacă mașina dispare complet.
- **Implementare corectă:** Un document cu pașii, testat cel puțin o dată pe o mașină nouă. Ținta de timp până la revenire și cea de date pierdute acceptabile, scrise explicit. Include ce se comunică jucătorilor și pe ce canal. Se scrie **acum**, cât nu e presiune.
- **Finalizat:** —
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Produce:** INF-006

#### INF-008 · Migrări reversibile
- **Status:** 🟡 Parțial
- **Descriere:** O migrare care nu se poate da înapoi transformă o greșeală într-o oprire lungă.
- **Implementare corectă:** Migrările sunt deja strict aditive, cu clauze de existență — practica bună se păstrează. Ce lipsește: fiecare migrare cu efect distructiv se face în doi pași separați de un release, ca vechiul cod să funcționeze în continuare între ei. Se testează pe o copie a producției înainte.
- **Finalizat:** —
- **Sursă:** `backend/api/prisma/migrations/`
- **Commit:** `4861e4a`
- **Produce:** INF-005

#### INF-009 · Mod de mentenanță
- **Status:** ⬜ De făcut
- **Descriere:** Oprirea controlată, cu mesaj, în loc de erori de rețea.
- **Implementare corectă:** Comutator care afișează un mesaj tradus pe toate cele trei fronturi, cu excepție pentru conturile de personal ca să se poată verifica înainte de reluare. Partidele în curs se lasă să se termine, nu se taie — un jucător deconectat la mijlocul unei partide clasate pierde un meci pe nedrept.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea System
- **Commit:** —
- **Produce:** SRV-092, ADM-062

---

## Grupa C · Securitate

#### INF-010 · Gestionarea secretelor
- **Status:** 🟡 Parțial
- **Descriere:** Unde stau cheile, cine le vede, când se schimbă.
- **Implementare corectă:** `.env.prod` se generează pe server o singură dată și nu părăsește mașina; arhiva de sincronizare exclude fișierele de mediu — regula e deja aplicată. Ce lipsește: un **calendar de rotație** pentru cheia de semnare a tokenurilor, cheia internă între servicii și cheile de furnizori, plus procedura de rotație fără deconectarea tuturor jucătorilor.
- **Finalizat:** —
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Produce:** ADM-061

#### INF-011 · Scanarea dependențelor
- **Status:** ⬜ De făcut
- **Descriere:** Proiectul are sute de dependențe indirecte pe patru ecosisteme: Node, Flutter, Docker, GitHub Actions.
- **Implementare corectă:** Scanare automată la fiecare pull request, care **blochează** la vulnerabilități critice. Actualizări de securitate aplicate în cel mult o săptămână. Lecția din august se păstrează: o actualizare de dependență poate rupe build-ul de Android fără să pice analiza, deci fiecare actualizare cere o compilare reală.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 4
- **Commit:** —
- **Produce:** QA-009

#### INF-012 · Suprafața de atac, revizuită
- **Status:** ⬜ De făcut
- **Descriere:** Ce e expus public și ce ar trebui să fie.
- **Implementare corectă:** Doar trei nume publice trec prin tunel: web, API, realtime. Nimic altceva nu are voie să asculte pe interfața publică — baza de date și Redis rămân pe rețeaua internă. Verificare periodică din exterior că regula chiar se aplică, nu doar că așa e configurat.
- **Finalizat:** —
- **Sursă:** `infra/cloudflared/ingress.example.yml`
- **Commit:** —
- **Produce:** SRV-087

#### INF-013 · Testare de securitate înainte de lansare
- **Status:** ⬜ De făcut
- **Descriere:** O verificare independentă a punctelor unde se pierd bani, date sau conturi.
- **Implementare corectă:** Concentrată pe: autentificare și rotația sesiunilor, escaladarea către rolurile de admin, manipularea rezultatelor de meci, fluxul de achiziție, accesul la datele altor jucători. **Se face înainte de lansare, nu după primul incident.** Fiecare constatare devine task, cu termen.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** QA-010

#### INF-014 · Protecție împotriva abuzului la scară
- **Status:** 🟡 Parțial
- **Descriere:** Limitarea de rată există pe autentificare. Restul API-ului nu e protejat uniform.
- **Implementare corectă:** Limite per cont și per adresă pe endpointurile costisitoare: căutare, clasamente, listări de admin. Protecție împotriva creării automate de conturi — există deja fereastra de 24 de ore pe combinația de adresă și client. Limitele se pot ajusta din configurație, fără redeploy, pentru că valoarea corectă se află abia sub trafic real.
- **Finalizat:** —
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Produce:** SRV-092

#### INF-015 · Jurnale fără date personale
- **Status:** ⬜ De făcut
- **Descriere:** Un jurnal care conține e-mailuri sau tokenuri devine el însuși o problemă de confidențialitate.
- **Implementare corectă:** Regula de redactare din jurnalul de audit se extinde la toate jurnalele. Adresele IP se păstrează ca hash, cum se face deja pe sesiuni. Perioadă de păstrare limitată pentru jurnalele tehnice — spre deosebire de istoricul de joc, ele **nu** intră sub regula „nu se șterge nimic".
- **Finalizat:** —
- **Sursă:** `backend/api/src/admin/audit.service.ts`
- **Commit:** `4861e4a`
- **Produce:** SRV-091, LEG-004

---

## Grupa D · Operare

#### INF-016 · Alerte care ajung la un om
- **Status:** ⬜ De făcut
- **Descriere:** Monitorizarea care nu trezește pe nimeni nu e monitorizare.
- **Implementare corectă:** Alertă pe canal real la: serviciu căzut, rată de eroare peste prag, latența bazei peste prag, coadă de joburi blocată, spațiu pe disc sub prag. **Puține și serioase** — o alertă care se aprinde zilnic e ignorată în două săptămâni. Fiecare alertă are o procedură scrisă de ce se face când se aprinde.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Monitoring
- **Commit:** —
- **Produce:** SRV-091

#### INF-017 · Implementare fără întrerupere
- **Status:** 🟡 Parțial
- **Descriere:** Fiecare actualizare taie azi conexiunile în timp real.
- **Implementare corectă:** Pentru API se poate face prin pornirea noii versiuni înainte de oprirea celei vechi. Pentru `realtime` e mai greu: clienții trebuie să se reconecteze, deci fereastra de reconectare din joc devine și mecanismul de actualizare. Actualizările se programează la ore cu trafic mic, măsurate, nu presupuse.
- **Finalizat:** —
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Produce:** SRV-040

#### INF-018 · Coordonarea mai multor agenți pe același depozit
- **Status:** 🟡 Parțial
- **Descriere:** Trei agenți împing în paralel pe `main`. S-a întâmplat deja ca un build să plece de pe cod vechi.
- **Implementare corectă:** `git fetch` obligatoriu înainte de orice build sau implementare — regula e consemnată și respectată. Ce lipsește: verificare automată care refuză o implementare dacă versiunea locală nu e cea de pe `origin/main`. Ieftin de făcut, previne exact greșeala care s-a produs.
- **Finalizat:** —
- **Sursă:** `ai/taskmaster.md`, riscuri
- **Commit:** —
- **Produce:** QA-011
