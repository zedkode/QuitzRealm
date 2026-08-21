# Registrele de task-uri QuizRealm

Douăsprezece registre. Împreună sunt **singura listă validă** de ce mai are de
construit proiectul. Orice altceva din depozit e ori sursă de design, ori
procedură de operare, ori arhivă — niciunul nu e listă de lucru.

---

## Cele două axe

Registrele nu se împart într-un singur fel, pentru că munca nu e de un singur fel.

**Registrele de implementare** răspund la *cine scrie codul*. Un task de aici e o
bucată de cod într-o componentă anume.

| Registru | Componentă | Prefix |
|---|---|---|
| [`01-server-core.md`](01-server-core.md) | `backend/api` + `backend/realtime` + date | `SRV-` |
| [`02-admin-panel.md`](02-admin-panel.md) | Panoul de administrare | `ADM-` |
| [`03-web-game.md`](03-web-game.md) | Platforma web — homepage, zonă de joc, tot | `WEB-` |
| [`04-app-game.md`](04-app-game.md) | Aplicația Flutter | `APP-` |

**Registrele de disciplină** răspund la *ce trebuie să existe*. Un task de aici
produce o specificație, un conținut, un activ sau o decizie — și **generează**
task-uri în cele patru de mai sus. Câmpul `Produce` spune unde ajunge.

| Registru | Disciplină | Prefix |
|---|---|---|
| [`05-game-design.md`](05-game-design.md) | Mecanici, moduri, echilibrare | `GD-` |
| [`06-content-pipeline.md`](06-content-pipeline.md) | Banca de întrebări, localizare de conținut | `CNT-` |
| [`07-art-audio.md`](07-art-audio.md) | Artă, sunet, mișcare | `ART-` |
| [`08-growth-community.md`](08-growth-community.md) | Achiziție, retenție, comunitate | `GRW-` |
| [`09-infra-security.md`](09-infra-security.md) | Găzduire, scalare, cost, securitate | `INF-` |
| [`10-legal-business.md`](10-legal-business.md) | Legal, conformitate, business | `LEG-` |
| [`11-quality-release.md`](11-quality-release.md) | Testare, verificare, livrare | `QA-` |
| [`12-analytics-data.md`](12-analytics-data.md) | Ce se măsoară și ce decide | `DATA-` |

Vederea strategică — faze, cronologie, cele cinci decizii blocante, riscuri —
rămâne în [`../taskmaster.md`](../taskmaster.md). Lipsurile deja identificate în
panou, cu migrarea și endpointurile necesare, în [`../needdesign.md`](../needdesign.md).

---

## Regula de aur: serverul e singura sursă de adevăr

Cele trei fronturi — panou, web, aplicație — **nu au logică proprie de joc, de
economie sau de progres**. Ele afișează ce spune serverul și trimit intenții.
Serverul validează, decide și scrie.

Consecința practică: dacă un task din `WEB-` sau `APP-` calculează ceva ce
contează — scor, cucerire, sold, rang, recompensă — task-ul e greșit formulat și
se mută în `SRV-`. Fronturile pot calcula doar lucruri cosmetice și predicții
optimiste care se corectează la răspunsul serverului.

De aceea fiecare task de front declară dependența de server. Un task de front
fără ea e ori pur vizual, ori incomplet.

---

## Formatul unui task

```markdown
#### SRV-001 · Numele task-ului
- **Status:** ⬜ De făcut
- **Descriere:** Ce face și de ce e nevoie de el.
- **Implementare corectă:** Cum trebuie făcut, concret — tabele, fișiere, reguli,
  capcane cunoscute.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.3 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-004, SRV-012
```

**Finalizat** și **Commit** se completează la închidere: data ca `2026-08-21 · 14:30`
și hash-ul scurt al commit-ului. Un task fără commit nu e închis, oricât de
terminat pare.

Registrele de disciplină folosesc `Produce` în loc de `Depinde de`, plus un câmp
`Prioritate` acolo unde nu tot ce e listat merită făcut înainte de lansare.

### Statusuri

| Simbol | Înseamnă |
|---|---|
| ✅ Implementat | Livrat, testat, în producție. Are dată și commit. |
| 🟡 Parțial | Există o bucată utilizabilă. Ce lipsește e scris explicit. |
| ⬜ De făcut | Nimic încă. |
| 🔒 Blocat | Nu se poate începe. Motivul e o decizie (`D1`–`D5`) sau alt task, numit. |

`⚖️` pe un task înseamnă că cere verificare de la un specialist înainte de a fi
considerat închis. Apare doar în registrul legal.

---

## Trei reguli care traversează toate registrele

### 1. Multilingv din prima linie de cod

Nu o funcție adăugată la final. Orice text văzut de un jucător — întrebare,
categorie, rang, realizare, notificare, eroare — are o limbă și nu se scrie
niciodată direct în cod ca șir în română.

- Serverul întoarce **chei plus parametri**, nu text gata format. Excepțiile sunt
  conținutul scris de utilizatori și întrebările, care au limbă proprie în bază.
- Fiecare tabel de conținut are `language_id` sau un tabel de traduceri alături.
  Adăugarea limbii a treia trebuie să fie populare de date, **nu** migrare.
- Web și aplicație folosesc **același set de chei**, ca o traducere să se scrie o
  singură dată.

Lansarea rămâne română + engleză; schema suportă orice limbă din ziua unu.

### 2. Nu se șterge nimic

Serverul e arhiva permanentă: conturi, parole ca hash, meciuri, răspunsuri,
clasamente, tranzacții, acțiuni de moderare. Istoria e imutabilă și crește.

- Tabelele de istoric sunt **append-only**, impuse prin trigger, nu prin convenție.
- „Ștergere" în interfață înseamnă **retragere din circulație** — un steag, nu un
  `DELETE`. Un raport vechi trebuie să poată numi un obiect scos din magazin.
- Ce se schimbă păstrează starea anterioară: un preț modificat nu rescrie
  achizițiile de ieri.

**Tensiunea cu dreptul la ștergere e reală și are o rezolvare, nu o excepție.**
La o cerere de ștergere, identificatorii personali dispar definitiv, iar rândurile
de istoric rămân legate de un cont anonim, cu statisticile intacte. Un meci jucat
rămâne un meci jucat; nu mai are nume. Task-ul e **SRV-088**, obligatoriu înainte
de lansare.

### 3. Fără pay-to-win

Monetizarea nu atinge niciodată dificultatea întrebărilor, șansa de câștig sau
rezultatul unui meci clasat. Cărțile de power-up se câștigă prin joc și sunt
**excluse din modurile clasate**. Miza între prieteni și predicțiile pe partide
rămân strict pe monedă din joc, care nu se cumpără cu bani reali — altfel devin
pariu, cu tot ce implică legal.

---

## Ordinea de atac

Registrele nu se parcurg independent, de sus în jos. Ordinea reală:

1. **Decizia D1** din `taskmaster.md` — blochează patru task-uri de aplicație și
   orice lucru serios la modul Clasic.
2. **SRV** grupele A–C (internaționalizare, identitate, istoric) și **DATA-005**
   — agregatele zilnice se pornesc devreme, pentru că o zi nemăsurată e pierdută
   definitiv.
3. **GD-001, GD-002, GD-003** — economia, ritmul și dificultatea. Fără cifrele
   astea, magazinul și progresul se construiesc pe presupuneri.
4. **SRV** grupa D (campanie) împreună cu **CNT-001** — volumul de întrebări
   necesar se calculează înainte de a începe producția.
5. **SRV** grupa E (modul Clasic) cu **APP** grupa C.
6. **ADM** peste modelele noi, în paralel cu orice.
7. **WEB** după ce contractul de joc e stabil.
8. **LEG** și **INF** pornesc devreme și rulează continuu — keystore-ul, forma
   juridică și conturile de dezvoltator au termene de așteptare care nu se
   comprimă în ultima săptămână.

Un task de front început înainte ca dependența lui de server să fie ✅ produce cod
care se rescrie.

---

## Ce mai există în depozit și ce rol are

Nimic din lista de mai jos nu e listă de lucru. Registrele sunt.

**Sursă de design** — de ce arată produsul așa. Registrele le citează de peste o
sută de ori; se citesc, nu se modifică fără decizie explicită:
`plan.md`, `owner-plan.md`, `init.md`, `agents.md`, `docs/design-system.md`.

**Procedură de operare** — cum se face ceva, pas cu pas:
`docs/deploy-vps.md`, `docs/account-recovery-runbook.md`,
`docs/github-actions-workflow.md`, `docs/adr/`.

**Inventar viu:** `ASSETS.md` (ce active există), `ASSET_GAPS.md` (ce lipsește).

**Coordonare între agenți:** `memory-ai.md` — jurnalul de predare între Claude,
Codex și ceilalți.

**Arhivă** — analize datate, păstrate ca dovadă pentru task-urile care le citează,
nu ca stare curentă: `docs/archive/`.

Au fost șterse ca depășite, cu conținutul preluat în registre: `audit.md`,
`passed.md`, `CLAUDE_HANDOFF.md` și `docs/features-social-progression.md` —
ultimul era o versiune mai veche și mai scurtă a lui `owner-plan.md`, cu același
titlu.
