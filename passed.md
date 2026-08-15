# QuizRealm — pași amânați intenționat

**Actualizat:** 2026-08-14  
**Decizie:** la cererea explicită a proprietarului proiectului, dezvoltarea continuă temporar cu `init.md` Pasul 7 / `plan.md` Faza 1, înainte de finalizarea Pasului 6.

Acest fișier nu bifează și nu ascunde pașii incompleți. El este lista obligatorie de revenire înainte ca Faza 0 sau bootstrap-ul să poată fi declarate complete.

## De reluat din Pasul 6 — banca de întrebări

- [ ] Rulează și validează manual preflight-ul complet de 10 întrebări: 5 Biologie + 5 Istoria României, cu generator și verificator suficient de corecte și rapide.
  - Situație la amânare: există 2 întrebări reale de Biologie, ambele `PENDING`; preflight-ul nu este complet.
- [ ] Rulează orchestratorul cu un provider AI real până la aproximativ 5.000 de întrebări distribuite pe categorii și dificultăți.
  - Situație la amânare: sunt 2 întrebări generate, nu aproximativ 5.000.
- [~] Eșantionează și verifică manual întrebările, apoi marchează ca `APPROVED` numai întrebările confirmate.
  - Situație la amânare: sunt 0 întrebări aprobate; întrebările `PENDING` nu au voie să intre în gameplay.
  - **2026-08-15:** banca are acum **14 întrebări `APPROVED`**, toate din pachetul
    `CURATED` cu surse oficiale (NASA, NOAA, NHLBI, NHGRI, portalul UE). Fiecare a fost
    verificată factual de agent înainte de rulare cu `--confirm-reviewed`; aceasta **nu
    înlocuiește** o revizuire umană a surselor. Cele 2 întrebări generate AI rămân
    `PENDING` și în afara jocului.
- [ ] Reverifică în `init.md` criteriul de bootstrap „taxonomy + ~5.000 întrebări de test în DB” și bifează-l numai după verificarea bazei de date.

## De reluat din mediul local

- [x] Elimină ambiguitatea Redis pe portul `6379`. **Rezolvat 2026-08-15:** Redis-ul
  containerizat este publicat pe `6380` (`infra/.env` → `REDIS_PORT=6380`), iar
  `backend/realtime/.env` folosește `redis://localhost:6380/0`. Serviciul Windows de pe
  `6379` rămâne neatins și nu mai poate fi confundat cu cel al proiectului.
- [ ] Creează primul commit Git de bază după ce starea proiectului este revizuită.
  - Situație la amânare: ramura `main` nu are încă niciun commit, iar fișierele proiectului sunt neînregistrate.

## Reguli până la revenire

- Aplicația mobilă trebuie să afișeze o stare onestă dacă API-ul nu livrează întrebări `APPROVED`; nu folosește întrebări mock în fluxul runtime.
- Pasul 6, Faza 0 și definiția de gata pentru bootstrap rămân incomplete.
- ~~Nu se începe Faza 2 (multiplayer în aplicația Flutter) pe baza acestei excepții.~~
  **Depășit la 2026-08-15**, prin cerere explicită a proprietarului („continuă cu ce
  urmează în `plan.md`”). Faza 2 a început cu duelul Duo pe runde multiple; vezi
  `docs/adr/0005-duo-multiplayer-in-app.md`. Regula originală rămâne valabilă ca
  principiu: excepția de la Pasul 6 singură nu justifica începerea Fazei 2.

## Actualizare 2026-08-15 — campanie offline curatoriată

La cererea explicită a proprietarului („vreau să pot juca acum”), campania solo se joacă din
pachete de întrebări **scrise și verificate manual**, livrate ca assets în aplicație
(`mobile/assets/questions/*.json`, 9 ținuturi × 15 întrebări, fiecare cu explicație). Vezi
`docs/adr/0004-offline-curated-campaign-pack.md`.

Ce **nu** schimbă asta:

- Punctele deschise de mai sus rămân deschise, inclusiv „~5.000 de întrebări în DB”.
- Fluxul online continuă să ceară `APPROVED` din backend și verdict server-side; ecranul arată
  în continuare o stare onestă când banca aprobată e goală.
- Pachetele offline nu sunt întrebări mock: sunt conținut curatoriat, validat la fiecare rulare
  de teste (răspuns corect prezent între variante, explicație obligatorie, fără duplicate).

## Ordinea concretă de revenire

1. Rezolvă configurația Redis locală.
2. Finalizează preflight-ul 5 + 5 și verificarea manuală.
3. Rulează batch-ul de aproximativ 5.000.
4. Aprobă numai eșantionul verificat.
5. Rulează verificările DB/API și actualizează checklist-ul din `init.md`.
