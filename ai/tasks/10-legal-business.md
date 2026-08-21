# Legal, conformitate și business — registru de task-uri

**Disciplină:** obligațiile care nu sunt cod, dar fără de care jocul nu se poate publica.
**Prefix ID:** `LEG-`
**Convenții:** [`00-README.md`](00-README.md)

Registrul ăsta lipsea complet. E cel mai puțin spectaculos din toate și cel mai
capabil să oprească o lansare în ultima zi: un magazin de aplicații nu discută,
respinge.

**Nu sunt avocat, iar registrul ăsta nu e consultanță juridică.** Task-urile
marcate cu `⚖️` cer verificare de la un specialist înainte de a fi considerate
închise. Restul sunt lucruri pe care le poți face singur, dar trebuie făcute.

---

## Grupa A · Datele personale

#### LEG-001 · Inventarul datelor colectate ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** Ce date personale ține sistemul, de ce, cât timp și cine le vede. Fără lista asta nu se poate scrie nici politica de confidențialitate, nici eticheta din magazin.
- **Implementare corectă:** Un tabel cu fiecare câmp personal: e-mail, dată de naștere, țară, adresă IP ca hash, etichetă de dispozitiv, jetoane push, conținut de chat. Pentru fiecare: temeiul, durata de păstrare și dacă pleacă spre un terț. Baza pentru LEG-002, LEG-003 și pentru eticheta de confidențialitate din magazine.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Produce:** LEG-002, APP-049

#### LEG-002 · Politica de confidențialitate ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** Documentul obligatoriu pentru orice listare în magazin și pentru orice colectare de date în UE.
- **Implementare corectă:** Scrisă pe baza inventarului real, nu copiată de la alt joc — o politică ce descrie altceva decât face produsul e mai rea decât una absentă. **În fiecare limbă în care se lansează.** Versionată, cu data intrării în vigoare, iar la schimbare majoră jucătorii confirmă la următoarea autentificare.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** WEB-011

#### LEG-003 · Ștergerea și portabilitatea ⚖️
- **Status:** 🔒 Blocat pe SRV-088
- **Descriere:** Dreptul la ștergere și cel la export sunt obligații legale, nu funcții opționale.
- **Implementare corectă:** Cererea se face **din aplicație**, nu prin e-mail către suport. Ștergerea se face prin anonimizare: identificatorii personali dispar, istoricul rămâne fără nume. Termenul de răspuns e o lună. Aceeași soluție e cerută explicit și în planul de admin panel — nu e o interpretare a mea.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682); `00-README.md`, regula 2
- **Commit:** —
- **Produce:** SRV-088, SRV-089, ADM-016

#### LEG-004 · Datele minorilor ⚖️
- **Status:** 🟡 Parțial
- **Descriere:** Pragul de 13 ani există în cod, dar regimul pentru minori cere mai mult decât o poartă la înregistrare.
- **Implementare corectă:** Capabilitățile restrânse pentru minori funcționează deja server-side — chat global doar pe reacții, indiferent de treaptă. Ce lipsește: consimțământul părintesc unde e cerut de legislația locală, limitele la colectarea de date și interdicția de a le arăta publicitate țintită. Pragul diferă între țări; se verifică pentru fiecare piață de lansare.
- **Finalizat:** —
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Produce:** LEG-006

#### LEG-005 · Termenii și regulile comunității
- **Status:** ⬜ De făcut
- **Descriere:** Ce are voie un jucător, ce nu, ce se întâmplă când încalcă.
- **Implementare corectă:** Motivele de sancțiune din panou trebuie să corespundă **exact** cu ce scrie în reguli — o suspendare pentru un motiv care nu apare în termeni e greu de susținut la o contestație. Traduse în fiecare limbă. Versionate.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §3
- **Commit:** —
- **Produce:** SRV-016, WEB-011

---

## Grupa B · Magazinele de aplicații

#### LEG-006 · Clasificarea de vârstă
- **Status:** ⬜ De făcut
- **Descriere:** Chestionarul care stabilește de la ce vârstă e listat jocul.
- **Implementare corectă:** Răspunsuri oneste. **Chatul liber între utilizatori ridică pragul** în majoritatea sistemelor de clasificare, indiferent de moderare — o declarație convenabilă descoperită ulterior duce la retragerea listării. Rezultatul se corelează cu pragul de vârstă din înregistrare.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** APP-049, LEG-004

#### LEG-007 · Eticheta de confidențialitate din magazin
- **Status:** ⬜ De făcut
- **Descriere:** Declarația despre ce date colectează aplicația, afișată public în listare.
- **Implementare corectă:** Trebuie să corespundă exact inventarului din LEG-001 și comportamentului real al aplicației, inclusiv al bibliotecilor terțe — o bibliotecă de raportare a erorilor care trimite mai mult decât crezi te pune în neconformitate fără să știi. Se reverifică la fiecare adăugare de dependență cu acces la rețea.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** LEG-001, APP-051

#### LEG-008 · Miza, pariul și premiile ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** Trei mecanici din registrul de design ating zona jocurilor de noroc: provocarea cu miză, predicția pe partide urmărite și turneele cu premii reale.
- **Implementare corectă:** **Regula de siguranță:** miza și predicția rămân strict pe monedă din joc, care nu se poate cumpăra cu bani reali și nu se poate converti înapoi în bani. Atât timp cât lanțul bani → monedă → premiu e rupt în ambele capete, nu e pariu. Turneele cu **premii în bani sau vouchere** sunt altă discuție și cer verificare per piață — planul o semnalează deja ca precauție, iar aici devine blocaj explicit: nu se activează fără aviz. La fel, orice mecanică de tip cufăr cu conținut aleatoriu cumpărat cu bani reali e reglementată în mai multe țări.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.5 (de la linia 272); `owner-plan.md` §14.6 (de la linia 743)
- **Commit:** —
- **Produce:** GD-017, GD-025, GD-021

#### LEG-009 · Politica de facturare din magazine ⚖️
- **Status:** 🔒 Blocat — monetizare amânată
- **Descriere:** Bunurile digitale consumate în aplicație trebuie să treacă prin facturarea magazinelor. Stripe nu e permis acolo.
- **Implementare corectă:** Google Play Billing și Apple IAP pentru aplicație; Stripe rămâne valabil doar pentru web. **Trimiterea jucătorilor din aplicație către plata externă e interzisă** de ambele magazine și se sancționează cu retragerea listării — dacă web-ul vinde mai ieftin, aplicația nu are voie să spună asta. Comision 15–30%. Politica de restituire trebuie scrisă înainte de prima vânzare, nu la prima cerere.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, secțiunea Monetizare
- **Commit:** —
- **Produce:** SRV-078, APP-037

---

## Grupa C · Business

#### LEG-010 · Forma juridică ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** Cine încasează banii și cine răspunde pentru produs.
- **Implementare corectă:** Necesară **înainte** de contul de dezvoltator plătit și înainte de orice încasare. Determină regimul de TVA pe vânzări digitale în UE, care e diferit de cel pe servicii obișnuite. Costul de administrare intră în bugetul din INF-004.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, secțiunea Monetizare
- **Commit:** —
- **Produce:** LEG-009

#### LEG-011 · Conturile de dezvoltator
- **Status:** ⬜ De făcut
- **Descriere:** Google Play Console și, dacă se lansează pe iOS, Apple Developer.
- **Implementare corectă:** Play cere o taxă unică; Apple, una anuală. **Verificarea identității durează** — se pornește cu săptămâni înainte de data țintă de lansare, nu în ultima săptămână. Conturile se creează pe entitatea juridică, nu pe persoană, dacă există firmă: mutarea ulterioară a unei aplicații între conturi e greoaie.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** APP-048, LEG-010

#### LEG-012 · Proprietatea asupra conținutului
- **Status:** 🟡 Parțial
- **Descriere:** Cine deține întrebările, activele grafice și contribuțiile jucătorilor.
- **Implementare corectă:** Notificarea de proprietate există în depozit. Ce lipsește: clauza din termeni prin care contribuitorii acordă licență asupra întrebărilor trimise — fără ea, o întrebare din comunitate rămâne a autorului, iar retragerea lui ar obliga la ștergerea conținutului. La fel pentru traducerile din programul Poliglot. Licențele activelor grafice și sonore cumpărate se păstrează, cu dovada dreptului de folosire comercială.
- **Finalizat:** —
- **Sursă:** `PROPRIETARY_NOTICE.md`; `plan.md` §5.2 (de la linia 133)
- **Commit:** —
- **Produce:** LEG-005, CNT-009

#### LEG-013 · Drepturi asupra întrebărilor generate ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** O bancă produsă cu asistență automată ridică întrebări de proveniență.
- **Implementare corectă:** Fiecare întrebare are sursa declarată în `verification_source` — practica e deja în schemă și devine și o apărare. Faptele nu se pot proteja prin drept de autor, dar **formularea da**: o întrebare nu trebuie să reproducă textual o formulare dintr-o sursă protejată. Regula intră în ghidul de stil.
- **Finalizat:** —
- **Sursă:** `plan.md` §5.1 (de la linia 133)
- **Commit:** —
- **Produce:** CNT-004, CNT-003

#### LEG-014 · Marca și numele
- **Status:** ⬜ De făcut
- **Descriere:** „QuizRealm" trebuie să fie liber de folosit în piețele de lansare.
- **Implementare corectă:** Verificare de marcă înainte de a investi în identitate vizuală și în listare. **Numele de domeniu curent conține o greșeală de scriere** — `quitzrealm` cu t, față de `quizrealm` în API — ceea ce e acceptabil pentru un panou intern, dar nu pentru adresa publică a jocului. De rezolvat înainte de a comunica adresa în afară.
- **Finalizat:** —
- **Sursă:** `infra/cloudflared/ingress.example.yml`
- **Commit:** —
- **Produce:** GRW-014

#### LEG-015 · Registrul de incidente de securitate ⚖️
- **Status:** ⬜ De făcut
- **Descriere:** O scurgere de date personale trebuie notificată autorității în 72 de ore.
- **Implementare corectă:** O procedură scurtă scrisă înainte: cine constată, cine decide dacă e notificabil, ce se comunică jucătorilor și în cât timp. Termenul de 72 de ore curge de la momentul aflării, nu de la cel al remedierii — fără procedură pregătită, se pierde pe ezitare.
- **Finalizat:** —
- **Sursă:** `docs/account-recovery-runbook.md`
- **Commit:** —
- **Produce:** INF-013
