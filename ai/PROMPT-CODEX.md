# Prompt de pornire pentru Codex

Se copiază integral într-un chat nou. Se actualizează secțiunea „De unde începi"
pe măsură ce task-urile se închid.

---

Lucrezi la **QuizRealm** — un joc de trivia cu cucerire de teritorii pe harta
României. Monorepo: `backend/api` (NestJS + Prisma + PostgreSQL) și
`backend/realtime` (Socket.IO + Redis) ca server core, `web/` (site public + zonă
de joc), `admin/` (panou de administrare), `mobile/` (Flutter). Stiva rulează în
producție pe un VPS, prin tunel Cloudflare.

## Ordinea în care citești, înainte de orice

1. **`ai/tasks/00-README.md`** — convențiile și harta celor douăsprezece registre.
2. **`agents.md`** — regulile obligatorii. Citește-l integral, nu pe sărite.
3. **`ai/tasks/01-server-core.md`** — registrul în care vei lucra.
4. **`memory-ai.md`** — ce au făcut ceilalți agenți și unde lucrează acum.
5. `plan.md` și `owner-plan.md` — de ce arată produsul așa. Se citesc la nevoie,
   pe secțiuni; task-urile trimit la secțiunea potrivită.

## Sursele de adevăr

| Ce vrei să afli | Unde |
|---|---|
| **Ce se construiește** | `ai/tasks/` — douăsprezece registre, 402 task-uri. **Singura listă validă de lucru.** |
| În ce ordine, ce blochează ce | `ai/taskmaster.md` — faze, cronologie, deciziile D1–D5 |
| Regulile de lucru | `agents.md` |
| Structura de foldere | `init.md` §1 |
| De ce e produsul așa | `plan.md` (viziune, arhitectură, moduri) și `owner-plan.md` (sisteme sociale, ranguri, turnee, internaționalizare, mecanici unice) |
| Cum arată | `docs/design-system.md` |
| Cum se implementează | `docs/deploy-vps.md` |
| Lipsuri cunoscute din panou | `ai/needdesign.md` |
| Versiuni ținute pe loc și de ce | `scripts/dependency-pins.json` |

Analizele datate din `docs/archive/` sunt dovezi pentru task-uri, **nu** stare
curentă. Nu lucra după ele.

## Regulile nenegociabile

1. **Nu scrii cod fără ID de task.** Dacă lucrarea nu are task într-un registru,
   îl adaugi acolo întâi, cu toate câmpurile completate.
2. **Serverul e singura sursă de adevăr.** Fronturile afișează și trimit
   intenții. Dacă un fișier din `web/`, `admin/` sau `mobile/` calculează scor,
   cucerire, sold sau rang, e în locul greșit.
3. **Multilingv din prima linie.** Serverul întoarce **chei plus parametri**, nu
   text de afișat. Niciun șir hardcodat în română. Adăugarea limbii a treia
   trebuie să fie populare de date, nu migrare de schemă.
4. **Nu se șterge nimic.** Istoricul e append-only. „Ștergere" în interfață
   înseamnă retragere din circulație — un steag, nu un `DELETE`. La cererea de
   ștergere a unui cont se anonimizează: identificatorii personali dispar,
   rândurile de istoric rămân.
5. **Fără pay-to-win.** Monetizarea nu atinge dificultatea, șansa de câștig sau
   rezultatul unui meci clasat.
6. **Ultima versiune stabilă**, verificată cu o compilare reală. Excepțiile se
   înregistrează în `scripts/dependency-pins.json` cu motiv și dată de revizuire.
   Detalii în `agents.md` §5.
7. **Fiecare componentă are versiune semantică.** `node scripts/check-versions.mjs`
   o verifică și rulează în CI.

## De unde începi

Ordinea de atac din `00-README.md` pune internaționalizarea prima, pentru că
orice tabel de conținut creat înaintea ei va trebui migrat după. **Lanțul tău,
în ordine:**

| Task | Ce e | Stare |
|---|---|---|
| ~~`SRV-001`~~ | Tabelele `languages` și `countries` | ✅ livrat de Codex, 21.08 |
| ~~`SRV-003`~~ | Catalogul de traduceri în baza de date (`translations`) | ✅ local, commit `e55d080` |
| `SRV-004` | Contractul de răspuns localizat — interceptor + erori ca `{ code, messageKey, params }` | ⬜ |
| `SRV-002` | Limba și țara pe cont, cu cooldown de 60–90 zile | 🟡 |
| `SRV-005` | Banca de întrebări pe limbă, cu fallback anunțat | 🟡 |

Toate cinci sunt **deblocate** — nu depind de nicio decizie deschisă. Sunt
backend curat, deci nu se ciocnesc cu lucrul de pe fronturi.

**Separat și urgent:** `SRV-021` împreună cu `DATA-005` — agregatele zilnice.
Motivul e că o zi netrecută prin agregare e pierdută definitiv; cu cât se pornesc
mai devreme, cu atât retenția pe cohorte devine calculabilă mai devreme. Se pot
face independent de lanțul de mai sus.

**Nu începe** `SRV-027`, `SRV-029`, `SRV-032` sau nimic din campanie: sunt
blocate pe deciziile D2, D3 și D4, care nu sunt luate încă.

## Lucrezi local, nu pe VPS

**Tot ce faci rulează pe mașina ta.** Producția nu se atinge; implementarea o
face proprietarul, după ce lucrarea a trecut local.

```bash
pnpm dev:data        # Postgres, Redis, MinIO în Docker
pnpm dev:migrate     # aplică migrările pe baza locală
pnpm dev:api         # API nativ, cu reîncărcare la salvare
```

Pentru verificarea că stiva se comportă ca în producție: `pnpm dev:full`
(tot în Docker). Cele două moduri **nu pot rula simultan** — folosesc aceleași
porturi.

Procedura completă, datele de test și capcanele: **`docs/dev-local.md`**.

Migrările se scriu și se probează local, niciodată direct pe producție:

```bash
cd backend/api
npx prisma migrate dev --name descrie_ce_face
npx prisma generate
npm test
```

Migrările sunt **strict aditive**, cu clauze de existență. Una cu efect
distructiv se face în doi pași separați de un release.

---

## Cum închizi un task

1. Verifică real: `npx tsc --noEmit` și `npx jest` în pachetul atins. Pentru
   Flutter, **o compilare**, nu doar `flutter analyze`.
2. Completează în registru: `Status`, `Finalizat` (dată și oră), `Commit` (hash
   scurt). *Un task fără commit nu e închis.*
3. Menționează ID-ul task-ului în mesajul de commit.
4. Adaugă o intrare datată în `memory-ai.md`: obiectiv, fișiere schimbate,
   verificări făcute, rezultat, blocaje, următorul pas.

## Capcane plătite deja pe depozitul ăsta

- **Mai mulți agenți împing pe același `main`.** `git fetch` **înainte** de orice
  build sau implementare. S-a întâmplat deja ca un build să plece de pe cod vechi.
- **`flutter analyze` trece cu un graf de dependențe rupt** — nu intră în
  pub-cache. Dovada că o actualizare Flutter e bună e o compilare reală.
- **Testele golden pică local pe Windows și trec pe CI** (sub 1% diferență, doar
  pe glife). **Nu le regenera.**
- **Migrările sunt strict aditive**, cu clauze de existență. O migrare cu efect
  distructiv se face în doi pași separați de un release.
- **Prisma: enum-urile au valori cu majuscule în client și minuscule în baza de
  date** (prin `@map`). La SQL brut se compară cu valoarea din bază.
- **TypeScript rămâne pe 5.x pe cele două servere** — vezi
  `scripts/dependency-pins.json`. Nu-l urca.

## VPS — nu-l atingi

**Nu implementezi tu.** Lucrezi local, iar proprietarul urcă pe VPS ce a trecut.

Dacă totuși ajungi acolo dintr-un motiv anume: VPS-ul e **partajat cu alte trei
proiecte**. Limitează orice operație la stiva
`quizrealm-*` și nu atinge `alvenqis-operator-*`, `sharedhouse-production-*` sau
`vaultwarden`.

- Niciodată `docker compose down -v` și niciodată `docker system prune -a`.
- Niciodată `docker compose down` fără `-f docker-compose.prod.yml`.
- `infra/.env.prod` se generează pe server o singură dată și **nu părăsește
  mașina**. Arhiva de sincronizare exclude `.env`.
- Procedura completă e în `docs/deploy-vps.md`. Urmeaz-o exact — imaginea web se
  construiește din **rădăcina** depozitului, nu din `web/`.

## Ce nu faci fără să întrebi

- Nu lua deciziile D1–D5 în locul proprietarului. Dacă un task le atinge,
  oprește-te și semnalează.
- Nu reorganiza structura de foldere fără un ADR care o justifică.
- Nu schimba nimic din `plan.md` sau `owner-plan.md` — sunt normative.
- Nu publica un release și nu crea tag-uri.
- Dacă un task pare să contrazică `plan.md`, **nu improviza**: semnalează
  conflictul și propune fie ajustarea planului, fie a task-ului.

Începe cu `SRV-003`. Confirmă-mi întâi ce ai înțeles că trebuie făcut și cum
plănuiești să verifici, apoi scrie cod.
