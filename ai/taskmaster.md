# Taskmaster — ce mai avem de construit

**Data:** 21 august 2026
**Surse normative:** `plan.md` §0, §6, §8, §10 și `owner-plan.md` §5, §7.3, §9, §11.
**Documente conexe:** `ai/needdesign.md` (lipsuri din panoul de admin), `docs/structura-joc.md` (divergența de structură), `docs/project-audit-2026-08-16.md`.

> **Acesta e nivelul strategic** — faze, cronologie, decizii blocante, riscuri.
> Nivelul de execuție, cu fiecare task în parte, stă în cele patru registre din
> [`ai/tasks/`](tasks/00-README.md): server core, panou de administrare,
> platforma web și aplicația. Statusul unui task se ține acolo, nu aici.

Direcția a fost stabilită de proprietar pe 21 august 2026:

| Întrebare | Răspuns |
|---|---|
| Prima prioritate | Sistemul de campanie (sezoane, județe, facțiuni, teritorii persistente) |
| Orizont | Lansare publică în 3–6 luni |
| Platforma web | Complet jucabilă, la fel ca aplicația |
| Bani reali | Amânat — întâi jocul |

Estimarea totală: **~24 de săptămâni**, la ritmul actual, cu mai mulți agenți lucrând simultan.

---

## Decizii care blochează lucrul

Fiecare schimbă modele de date. Luate târziu, se plătesc în migrări și cod rescris.

### D1 — Ce se întâmplă cu campania secvențială din aplicație? *(blochează Faza 1)*

Aplicația mobilă e construită azi în jurul unei campanii de 9 ținuturi deblocate pe rând, cu stele
per etapă (`mobile/lib/domain/campaign/realm_chapter.dart`). `owner-plan.md` §7.3 spune explicit că
QuizRealm „nu are și nu va avea o campanie de nivele parcurse secvențial”. Capturile de design
aprobate (`design-reference/02-home-dashboard.png`, `07-campaign.png`) conțin totuși o secțiune
„Campanie”. Cele trei nu pot fi toate adevărate.

- **A** — campania dispare, harta devine tabla modului Clasic.
- **B** — campania rămâne ca mod solo, iar §7.3 se modifică explicit.
- **C** — devine „Antrenament pe categorii”, cu progres prin deblocare de categorii, fără hartă secvențială.

**Recomandare: C.** Satisface și senzația de progres din capturi, și regula din plan, și folosește
cele 20 de categorii deja populate. **Atenție:** stelele și progresul salvate pe telefoanele
jucătorilor actuali se pierd la orice variantă în afară de B.

Deschisă din 16 august 2026 (`docs/structura-joc.md` §4).

### D2 — Un sezon înseamnă o singură hartă a țării, pentru toți? *(blochează Faza 0)*

O singură hartă înseamnă că o cucerire contează pentru toată lumea. La mii de jucători simultani,
un județ își schimbă stăpânul de zeci de ori pe minut și senzația de proprietate dispare.

**Recomandare:** o singură hartă națională pe sezon, cu **prag de rezistență per județ** — un
teritoriu nu cade la primul meci câștigat, ci după acumulare de puncte de facțiune. Pragul face
harta stabilă fără instanțe separate și e un simplu câmp în model.

### D3 — Ce meciuri mișcă harta? *(blochează Faza 1)*

Dacă orice meci contribuie, Duo și Blitz devin ocolișuri mai rapide și modul Clasic își pierde
rostul.

**Recomandare:** doar modul **Clasic** schimbă proprietatea unui județ. Celelalte moduri dau puncte
de facțiune, care contează la clasamentul de sezon și la recompense, dar nu ating harta.

### D4 — Câte facțiuni și cum intri într-una? *(blochează Faza 0)*

**Recomandare:** trei facțiuni, atribuite automat la intrarea în sezon pe criteriul echilibrului
numeric, blocate până la finalul sezonului. Alegerea liberă produce o facțiune dominantă în prima
săptămână, iar din acel moment sezonul e decis.

### D5 — Meciurile jucate din browser contează la clasament? *(blochează Faza 3)*

Serverul decide deja fiecare răspuns, scor și cucerire; clientul nu stabilește niciodată
câștigătorul. Riscul real e că automatizarea unui client e mai la îndemână în browser.

**Recomandare:** da, cu aceleași reguli. În schimb, pragul minim de timp de răspuns și jurnalul de
tipare suspecte din Faza 2 trebuie livrate **înainte** ca web-ul să devină jucabil.

---

## Ce există deja și nu se reconstruiește

Autentificare completă (e-mail, Google, invitat, 2FA, captcha, rate limiting, age gate, sesiuni
revocabile) · chat cu trepte de încredere T0–T8, antispam, shadow-ban, blocare · teritorii în meci
(`territory-map.ts`, `territory-state.ts`, `battle-resolution.ts`, `elimination.ts`, `scoring.ts`,
toate cu teste) · bancă de întrebări cu 20 de categorii, trimitere din comunitate, coadă de
revizuire · magazin și portofel (`Powerup`, `GemPack`, `Purchase`, `CurrencyLedger`,
`WalletService`) · panou de admin cu gardă pe roluri, audit, tablou de bord, All Players, moderare
chat, revizuire întrebări · infrastructură Docker pe VPS cu tunel Cloudflare și APK din CI ·
achievements cu progres validat server-side, badge-uri, showcase · social cu prieteni, prezență,
sugestii.

---

## Faza 0 — Fundația campaniei · săptămânile 1–4

**Depinde de:** D2, D4. **Deblochează:** Fazele 1, 4, 5. **Atinge:** `backend/api`.

Modelele care lipsesc cu totul. Nimic nu se schimbă încă pentru jucător, dar fără ele jumătate din
panoul de admin rămâne gol și modul Clasic n-are pe ce să scrie.

- [ ] Modele Prisma: `Season`, `Faction`, `County`, `Territory`, `FactionMembership`,
      `SeasonParticipant`, `TerritoryEvent`. Migrare strict aditivă.
- [ ] Seed cu cele 41 de județe plus București, cu **vecinătățile reale** — adiacența decide ce poți
      ataca; fără ea nu există reguli de front.
- [ ] Pragul de rezistență per teritoriu și acumularea de puncte de facțiune (din D2).
- [ ] `CampaignService`: intrare în sezon, atribuire de facțiune echilibrată **în tranzacție**
      (altfel două cereri simultane dezechilibrează), starea hărții.
- [ ] `GET /campaign/current`, `GET /campaign/map`, `POST /campaign/join`. Harta se citește des:
      răspuns cache-uit în Redis, invalidat la schimbare de proprietate.
- [ ] Ecrane de admin: Seasons, Romania Map, Counties, Factions (rutele există deja în meniu).
- [ ] Teste pentru adiacență, tranziții de proprietate, echilibrarea facțiunilor — funcții pure,
      testabile fără bază de date, ca în `territory-state.spec.ts`.

**Gata când:** un administrator creează un sezon din panou, harta are 42 de teritorii cu vecinătăți
corecte, un jucător intră în sezon și primește o facțiune, iar `GET /campaign/map` întoarce
proprietatea reală.

---

## Faza 1 — Modul Clasic · săptămânile 5–9

**Depinde de:** Faza 0, D1, D3. **Atinge:** `backend/realtime`, `mobile`. **Cea mai riscantă fază.**

Bucla pe care e construit tot produsul: răspunzi corect, cucerești teritoriu, harta țării se schimbă
pentru toți. Logica de meci există; lipsește legătura cu harta persistentă și interfața.

- [ ] Modul `classic` în matchmaking, cu miza legată de un județ real. Enum-ul are deja valoarea;
      `matchmaking.service.ts` trebuie extins.
- [ ] La finalul meciului, aplicarea rezultatului pe harta persistentă **într-o tranzacție** — o
      cucerire aplicată pe jumătate e mai rea decât una neaplicată.
- [ ] Ecran de alegere a modului: „Joacă” duce la moduri, nu direct în duel (`mobile/lib/features/play/`).
- [ ] Ecranul de meci Clasic cu harta ca tablă de joc, cu animații de cucerire (`plan.md` §7 cere
      tranziție, nu schimbare instantanee de culoare).
- [ ] Selecția de categorii înainte de meci — **serverul e gata**: `agreeOnCategories` face
      intersecția, `matchmaking:join` acceptă `categoryCodes`. Lipsește doar interfața.
- [ ] Retragerea sau conversia campaniei secvențiale (**blocat pe D1**).
- [ ] Ecranul de campanie: harta țării, cine ce deține, poziția facțiunii tale.

**Gata când:** doi jucători se bat pe un județ real într-un meci Clasic, iar la final harta națională
arată noul stăpân pentru toată lumea, inclusiv în panoul de admin.

---

## Faza 2 — Restul modurilor și robustețea · săptămânile 10–13

**Depinde de:** Faza 1. **Deblochează:** Faza 3. **Atinge:** `backend/realtime`, `mobile`.

- [ ] **Blitz** — mai puține runde, timpi scurți. E o configurație de mod, nu un motor nou.
- [ ] **Partidă privată** — cameră cu cod, link de invitație, alegerea categoriilor, completare cu
      boți („Separeu” din `owner-plan.md`).
- [ ] **Boți** cu trei niveluri de dificultate: o singură implementare, trei consumatori (camere
      private, deconectări, antrenament).
- [ ] **Reconectare** — locul se păstrează 60–90 s în Redis înainte de abandon (`plan.md` §8).
      Fără asta, o pierdere de semnal e o înfrângere.
- [ ] **Anti-cheat de bază** — prag minim de timp de răspuns, jurnal de tipare suspecte. Trebuie
      livrat înainte de Faza 3 (vezi D5).
- [ ] **Antrenament pe categorii** ca mod solo. `CategoryRoundSource` există deja, cu deduplicare
      între categorii care se suprapun.
- [ ] **Anti-repetiție a întrebărilor** per jucător (`owner-plan.md` §11) — nu după lansare.
- [ ] **Onboarding** — primele două partide sunt tutorial ghidat cu boți, nu ecrane de explicații.

**Gata când:** toate cele cinci moduri sunt jucabile, o deconectare de 60 s nu pierde partida, iar un
client care răspunde mai repede decât uman apare într-un raport.

---

## Faza 3 — Web-ul devine client de joc · săptămânile 12–17

**Depinde de:** Faza 2, D5. **Atinge:** `web/client`. Poate merge în paralel cu Faza 4.

Costul permanent al alegerii „web complet jucabil”: fiecare funcție nouă de joc se face de două ori.

- [ ] **Contract comun de joc, într-un singur loc.** Azi `web/client/src/lib/territory.ts` oglindește
      manual serverul — două copii care se pot dezacorda tăcut.
- [ ] Client Socket.IO complet pe `/game`: matchmaking, runde, reconectare. Conexiunea există;
      lipsesc evenimentele de meci.
- [ ] Ecran de moduri, meci Clasic cu hartă, duel, cameră privată în browser
      (`web/client/src/pages/Game.tsx` e azi demonstrativ).
- [ ] Ecranul de campanie și clasamentul de sezon pe web, pe aceleași endpointuri.
- [ ] Înlocuirea valorilor fixe rămase din `Home`, `Leaderboard`, `Profile`.
- [ ] Layout de la 1280 px până la laptop mic.

**Gata când:** un jucător intră pe site, joacă un meci Clasic împotriva cuiva de pe telefon, iar
rezultatul e identic indiferent de client.

---

## Faza 4 — Progresie și retenție · săptămânile 15–19

**Depinde de:** Faza 0. **Atinge:** `backend/api`, `mobile`, `web`.

- [ ] **Trepte de rang**, minim 20, cu praguri și recompense de promovare (`owner-plan.md` §5).
      Azi există doar `eloRating` brut.
- [ ] **Provocări** zilnice, săptămânale, de sezon + constructorul din admin (`Challenge`,
      `ChallengeProgress`).
- [ ] **Evenimente** cu interval, multiplicatori temporari, oprire de urgență. Secțiunea Live Ops
      din admin depinde integral de asta.
- [ ] **Pachete de recompense** refolosibile și livrare în masă. Acordarea individuală prin
      `WalletService` funcționează deja.
- [ ] **Cutie poștală** în joc și notificări push (cere un furnizor configurat).
- [ ] **Tabel de agregate zilnice** — fără el, D1/D7/D30 nu se pot calcula retroactiv. Merită pornit
      devreme, chiar din Faza 0.
- [ ] Extinderea catalogului de achievements către familiile care cer metrici noi
      (`docs/owner-plan-progress.md` §3 marchează exact ce lipsește).

**Gata când:** un jucător care intră a doua zi găsește o provocare nouă, vede cât mai are până la
rangul următor și primește ceva pentru că s-a întors.

---

## Faza 5 — Panoul de admin, complet · săptămânile 13–21, în paralel

**Depinde de:** Fazele 0, 4. **Atinge:** `web/client/src/admin`. **Referință:** `ai/needdesign.md`.

- [ ] Modelul `Sanction` — motiv, durată, cine a ridicat-o, legătură cu contestația. Azi există un
      singur câmp, `users.banned_at`: un ban și o suspendare sunt același lucru.
- [ ] Modelul `PlayerNote`, separat de audit. Auditul e probă imuabilă; o notă e editabilă.
- [ ] Restul secțiunii Players: Roles & Permissions, Bans, Inventory, Transactions.
- [ ] Questions: listă cu filtre, creare care publică direct aprobat, rapoarte, categorii, import în
      masă. `POST /questions` există, dar e pentru comunitate, cu limită de 10/oră.
- [ ] Store, Shop, Economy peste endpointurile care **răspund deja**: `/admin/store/powerups`,
      `/gem-packs`, `/ledger`, `/admin/finance/*`.
- [ ] Vizualizatorul de audit, administratorii, matricea rol × rută, securitate.
- [ ] Trimiterea de mesaje către jucători prin conversații de tip sistem — nu prin DM obișnuit,
      care poate fi blocat sau filtrat de regulile de chat.

**Gata când:** nicio rută din meniu nu mai duce la pagina „urmează”, iar tot ce se poate face manual
în baza de date se poate face din panou, cu urmă în audit.

---

## Faza 6 — Lansarea · săptămânile 20–24

**Depinde de:** toate. Keystore-ul și politicile trebuie începute devreme.

- [ ] **Keystore de release propriu.** APK-ul se semnează azi cu cheia de debug. Google Play nu
      acceptă asta, iar cheia **nu se poate schimba după prima publicare**.
- [ ] Separarea CI: verificări la pull request, release doar la tag explicit. Azi orice push pe
      `main` poate produce un release public.
- [ ] Politică de confidențialitate, termeni, conformitate GDPR, flux de ștergere a contului.
- [ ] Cont Google Play Console, listare, capturi, clasificare de vârstă.
- [ ] Monitorizare: urmărirea erorilor, alerte de disponibilitate, **restaurare de backup
      verificată** — o copie netestată nu e o copie de siguranță.
- [ ] Test de încărcare pe matchmaking și realtime înainte de beta deschisă.
- [ ] Unificarea sistemului de design în aplicație — auditul din 16 august găsește două limbaje
      vizuale concurente (`GamePalette` vechi și tokenii `QuizRealm`).
- [ ] Beta închisă, apoi deschisă, cu un canal de feedback.

**Gata când:** aplicația e în Google Play, semnată cu cheia proprie, iar un jucător nou poate
instala, juca și cuceri un teritoriu fără să întâlnească un ecran gol.

---

## Monetizarea — amânat, dar pregătit

Modelele există și așteaptă: `GemPack`, `Purchase`, `CurrencyLedger`, `WalletService`. Magazinul
rămâne pe monede câștigate în joc.

De știut de pe acum, pentru că schimbă arhitectura la activare: **Google Play și App Store obligă ca
bunurile digitale consumate în aplicație să treacă prin sistemele lor de facturare**, nu prin Stripe.
Magazinul e proiectat azi pentru Stripe, corect pentru web, dar înseamnă **două integrări**, nu una.
Comision 15–30%. Mai sunt necesare firmă, cont de dezvoltator și politici de restituire.

---

## Riscuri

| Risc | Mitigare |
|---|---|
| Faza 1 e cea mai grea și e devreme — atinge realtime, harta persistentă și mobilul simultan | Se livrează întâi pe boți și un singur județ, nu direct pe harta completă |
| Doi clienți de joc întreținuți în paralel se pot dezacorda tăcut | Contract de joc într-un singur loc, cu teste care rulează pe ambii clienți |
| Harta goală la lansare — un sezon cu 30 de jucători arată pustiu | Primul sezon pornește pe o hartă mai mică, câteva regiuni, și se extinde cu numărul de jucători |
| Decizia D1 amânată — orice lucru la Clasic se face pe lângă campania veche | Se decide în prima săptămână, înainte de Faza 1 |
| Mai mulți agenți pe același `main` (s-a întâmplat deja: build de pe cod vechi) | `git fetch` înainte de orice build sau deploy; faze care ating fișiere diferite |
| Banca de întrebări nu ține pasul — repetiția alungă jucătorii | Anti-repetiție per jucător intră în Faza 2, nu după lansare |

---

## Definiția de „gata de lansat”

Nu o listă de funcții, ci o parcurgere care merge cap-coadă, fără ecran gol și fără intervenție
manuală în baza de date:

1. Un jucător nou instalează, își face cont și trece prin tutorialul cu boți.
2. Intră în sezonul curent și primește o facțiune.
3. Joacă un meci Clasic împotriva unui om real, pierde conexiunea 30 s și revine în partidă.
4. Câștigă și vede județul schimbând stăpânul pe harta țării.
5. Se întoarce a doua zi la o provocare nouă și la o recompensă pentru serie.
6. Raportează un mesaj din chat; raportul apare în panou și poate fi rezolvat.
7. Deschide site-ul pe laptop, se autentifică cu același cont și continuă.
8. Cere ștergerea contului și o primește, complet.
