# Mediul de dezvoltare local

Tot ce ai nevoie ca să rulezi QuizRealm pe calculatorul tău, fără să atingi
producția. Migrările, datele de test și experimentele stau aici.

> **Fișierul local e `infra/docker-compose.yml`. Producția e
> `infra/docker-compose.prod.yml` și rulează pe VPS.** Toate comenzile din
> `package.json` trimit `-f` explicit către cel local, tocmai ca o operație
> distructivă să nu poată nimeri fișierul greșit.

---

## Pregătire, o singură dată

```bash
cp infra/.env.example infra/.env     # completează valorile
pnpm install                          # dependențele frontend
npm install --prefix backend/api
npm install --prefix backend/realtime
```

Ai nevoie de Docker Desktop, Node 22+ și, pentru aplicația mobilă, Flutter 3.47.

**Porturile nu se aleg la întâmplare.** Fișierul de exemplu folosește 5433
pentru Postgres și 6380 pentru Redis, pentru că pe Windows rulează des un
`redis-server` ca serviciu pe 6379 și un Postgres instalat pe 5432. Dacă
schimbi portul, schimbă-l și în `DATABASE_URL` sau `REDIS_URL` — sunt două
locuri, iar nepotrivirea dă o eroare de conectare greu de citit.

---

## Modul 1 — recomandat pentru lucrul zilnic

Serviciile cu stare în Docker, aplicațiile native.

```bash
pnpm dev:data        # Postgres, Redis, MinIO
pnpm dev:migrate     # aplică migrările pe baza locală
```

Apoi, în terminale separate:

```bash
pnpm dev:api         # http://localhost:3000
pnpm dev:realtime    # http://localhost:3001
pnpm dev:web         # http://localhost:5173
pnpm dev:admin       # http://localhost:5174
```

**De ce nu totul în Docker, implicit.** Pe Windows, urmărirea fișierelor printr-un
bind mount e lentă și scapă schimbări. `nest --watch` și Vite HMR rulate nativ
răspund instant; în container, aceeași salvare poate dura secunde sau poate să nu
declanșeze nimic. Serviciile cu stare n-au problema asta — nu urmăresc fișiere.

---

## Modul 2 — totul în Docker

Pentru verificarea că stiva se comportă ca în producție, înainte de implementare.

```bash
pnpm dev:full        # construiește și pornește tot
pnpm dev:ps          # ce rulează
pnpm dev:logs        # jurnale, în flux
```

| Serviciu | Adresă |
|---|---|
| Site public | http://localhost:8080 |
| Panou de administrare | http://localhost:8080/admin/ |
| API | http://localhost:3000 |
| Realtime | http://localhost:3001 |
| Consolă MinIO | http://localhost:9001 |

E aceeași imagine care ajunge pe VPS, cu aceeași împărțire: site public la `/`,
panou la `/admin`, dintr-un singur proces.

## Două capcane, întâlnite la prima pornire

**Cele două moduri nu pot rula simultan.** Ambele folosesc porturile 3000 și
3001, pentru că e același serviciu. Dacă ai pornit `pnpm dev:api` nativ și apoi
dai `pnpm dev:full`, Docker cade cu „ports are not available". Oprește-le pe cele
native întâi. Nici n-ar avea sens să ruleze amândouă: două API-uri pe aceeași
bază, cu stare de sesiune diferită.

**API-ul nu pornește fără chei Google.** Strategia de autentificare Google se
construiește la pornire și le cere prin `getOrThrow`, chiar dacă nu le folosește
nimeni local. Compose-ul local trimite valori de rezervă ca aplicația să pornească
— dar înseamnă că **autentificarea cu Google nu funcționează local** fără chei
reale în `infra/.env`. E-mail plus parolă funcționează normal.

---

## Date de test

```bash
pnpm dev:seed        # cele 53 de categorii
```

Pachetul curatoriat de întrebări se rulează separat, întâi în gol:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env \
  --profile migrate run --rm --entrypoint sh migrate \
  -c "npx ts-node prisma/seed-curated-solo-questions.ts"
```

Adaugă `--confirm-reviewed` la sfârșit ca să scrie efectiv. Fără el, doar
raportează ce ar face — dorit: un seed de conținut care scrie din prima e greu
de verificat.

---

## Comenzi de întreținere

| Comandă | Ce face |
|---|---|
| `pnpm dev:down` | Oprește tot, **păstrează** datele |
| `pnpm dev:reset` | Oprește tot și **șterge volumele** — bază curată |
| `pnpm dev:ps` | Ce rulează acum |
| `pnpm dev:logs` | Jurnalele, în flux |

`dev:reset` distruge baza locală. E în regulă, pentru asta există — dar rulează
`dev:migrate` și `dev:seed` după, altfel aplicația pornește pe gol.

---

## Migrări — de ce contează că sunt locale

O migrare se scrie și se probează **aici**, niciodată direct pe producție.
Fluxul:

```bash
cd backend/api
npx prisma migrate dev --name descrie_ce_face    # creează și aplică local
npx prisma generate                               # regenerează clientul
npm test                                          # testele trebuie să treacă
```

Regulile din `agents.md`: migrările sunt **strict aditive**, cu clauze de
existență. O migrare cu efect distructiv se face în doi pași separați de un
release, ca versiunea veche a codului să funcționeze în continuare între ei.

Verifică și **durata**. Pe o bază locală aproape goală orice migrare pare
instantanee; pe una cu istoric real, un `ALTER TABLE` pe tabelul de meciuri poate
ține câteva minute cu tabelul blocat — adică o oprire de serviciu. Când baza
locală are prea puține rânduri ca să spună ceva, generează volum înainte de a
măsura.

---

## Ce nu face mediul local

Cinstit, ca să nu te bazezi pe el mai mult decât merită:

- **Nu are datele reale** și nici nu trebuie să le aibă. Dacă e nevoie de volum,
  se generează — o copie a producției pe laptop e o scurgere de date personale
  care așteaptă să se întâmple.
- **Nu are tunelul Cloudflare**, deci nu poate reproduce nimic legat de anteturi
  de proxy sau de originile permise așa cum le vede producția.
- **Nu trimite e-mailuri.** `MAIL_TRANSPORT=console` scrie mesajul în jurnal;
  linkul de verificare sau de resetare se copiază de acolo.
- **Nu are captcha.** `CAPTCHA_REQUIRED=false` local, `true` în producție — deci
  fluxul de înregistrare are un pas în plus pe VPS.

---

## Legătura cu VPS-ul

VPS-ul e **partajat cu alte trei proiecte**. Nu se experimentează acolo.

Regulile, repetate pentru că o greșeală acolo costă: niciodată
`docker compose down -v`, niciodată `docker system prune -a`, niciodată
`docker compose down` fără `-f docker-compose.prod.yml`, iar `infra/.env.prod` se
generează pe server o singură dată și nu părăsește mașina.

Procedura de implementare e în [`deploy-vps.md`](deploy-vps.md). Se urcă doar ce
a trecut local întâi.
