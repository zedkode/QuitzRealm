# Registrele de task-uri QuizRealm

Patru registre, unul per componentă. Împreună acoperă tot ce mai are de construit
proiectul până la lansarea publică și după.

| Registru | Componentă | Prefix ID |
|---|---|---|
| [`01-server-core.md`](01-server-core.md) | Server core — `backend/api` + `backend/realtime` + date | `SRV-###` |
| [`02-admin-panel.md`](02-admin-panel.md) | Panoul de administrare | `ADM-###` |
| [`03-web-game.md`](03-web-game.md) | Platforma web — homepage, zona de joc, tot | `WEB-###` |
| [`04-app-game.md`](04-app-game.md) | Aplicația Flutter | `APP-###` |

Vederea strategică — faze, cronologie, decizii blocante, riscuri — rămâne în
[`../taskmaster.md`](../taskmaster.md). Registrele de aici sunt nivelul de execuție.
Lipsurile deja identificate în panou sunt detaliate în [`../needdesign.md`](../needdesign.md).

---

## Regula de aur: serverul e singura sursă de adevăr

Cele trei fronturi — panou, web, aplicație — **nu au logică proprie de joc, de
economie sau de progres**. Ele afișează ce spune serverul și trimit intenții.
Serverul validează, decide și scrie.

Consecința practică pentru orice task: dacă un task din `WEB-` sau `APP-`
calculează ceva ce contează (scor, cucerire, sold, rang, recompensă), task-ul e
greșit formulat și trebuie mutat în `SRV-`. Fronturile pot calcula doar lucruri
cosmetice și predicții optimiste care se corectează la răspunsul serverului.

De aceea fiecare task de front are un câmp **Depinde de** care trimite la
task-ul de server care îi dă datele. Un task de front fără dependență de server
declarată e ori pur vizual, ori incomplet.

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

Câmpurile **Finalizat** și **Commit** se completează la închiderea task-ului:
data în formatul `2026-08-21 · 14:30` și hash-ul scurt al commit-ului care l-a
livrat. Un task fără commit nu e închis, oricât de terminat pare.

`Depinde de` e al optulea câmp, adăugat peste cele cerute, pentru că fără el
patru registre separate nu pot coopera — e singurul loc unde se vede că un ecran
de aplicație așteaptă un endpoint care încă nu există.

### Statusuri

| Simbol | Înseamnă |
|---|---|
| ✅ Implementat | Livrat, testat, în producție. Are dată și commit. |
| 🟡 Parțial | Există o bucată utilizabilă, dar task-ul nu e satisfăcut integral. Ce lipsește e scris explicit. |
| ⬜ De făcut | Nimic încă. |
| 🔒 Blocat | Nu se poate începe. Motivul e o decizie (`D1`–`D5` din `taskmaster.md`) sau alt task, numit explicit. |

---

## Două reguli de arhitectură care traversează toate registrele

### 1. Multilingv din prima linie de cod

Nu e o funcție care se adaugă la final. Orice conținut văzut de un jucător —
întrebare, categorie, denumire de rang, text de realizare, notificare, mesaj de
eroare — are o limbă și nu se scrie niciodată direct în cod ca text în română.

Consecința pentru task-uri:

- Serverul nu întoarce niciodată text destinat afișării, ci **chei** plus
  parametri. Excepțiile sunt conținutul creat de utilizatori și întrebările,
  care au limbă proprie în baza de date.
- Fiecare tabel de conținut are ori `language_id`, ori un tabel de traduceri
  alăturat. Adăugarea limbii a treia trebuie să fie populare de date, **nu**
  migrare de schemă.
- Fronturile nu au niciun șir hardcodat. Web și aplicație folosesc același set
  de chei, ca o traducere să se scrie o singură dată.

Lansarea recomandată rămâne română + engleză (`owner-plan.md` §10.8), dar schema
suportă orice limbă din ziua unu.

### 2. Nu se șterge nimic

Serverul e arhiva permanentă a proiectului: conturi, parole (ca hash), meciuri,
răspunsuri, clasamente, tranzacții, acțiuni de moderare, sesiuni. Istoria e
imutabilă și crește; nu se rescrie și nu se curăță.

Trei consecințe concrete:

- Tabelele de istoric sunt **append-only**. Un rezultat de meci, o intrare de
  registru sau o linie de audit nu se actualizează niciodată după scriere.
- Ce pare „ștergere" în interfață e **retragere din circulație** — un steag
  `active` sau o dată de retragere, niciodată un `DELETE`. Un raport vechi
  trebuie să poată numi în continuare un obiect scos din magazin.
- Ce se schimbă păstrează starea anterioară. Un preț modificat nu rescrie
  achizițiile de ieri; un cont care își schimbă numele își păstrează istoricul
  sub identificatorul stabil.

**Tensiunea cu GDPR e reală și are o rezolvare, nu o excepție.** Dreptul la
ștergere obligă la eliminarea datelor personale la cerere. „Nu se șterge nimic"
și „se șterge la cerere" se împacă prin **anonimizare**: la o cerere de ștergere,
identificatorii personali (e-mail, nume, adrese, dispozitive) se elimină
definitiv, iar rândurile de istoric rămân legate de un cont anonim, cu
statisticile intacte. Un meci jucat rămâne un meci jucat; nu mai are nume.
Aceeași soluție e cerută explicit în `owner-plan.md` §13.2. Task-ul care o
implementează e **SRV-070** și e obligatoriu înainte de lansare.

---

## Ordinea de atac

Registrele nu se parcurg de sus în jos independent. Ordinea reală e dată de
fazele din `taskmaster.md`:

1. **SRV** grupele A–C (fundația de campanie, internaționalizare, istoric) —
   deblochează totul.
2. **SRV** grupa D (modul Clasic) împreună cu **APP** grupa C.
3. **ADM** peste modelele noi, în paralel cu orice.
4. **WEB** după ce contractul de joc e stabil.

Un task de front început înainte ca dependența lui de server să fie ✅ produce
cod care se rescrie.
