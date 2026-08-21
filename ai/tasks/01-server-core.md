# Server core — registru de task-uri

**Componentă:** `backend/api` (NestJS + Prisma + PostgreSQL), `backend/realtime`
(NestJS + Socket.IO + Redis), schema de date.
**Prefix ID:** `SRV-`
**Convenții:** [`00-README.md`](00-README.md)

Serverul e singura sursă de adevăr din proiect. Ține conturile, parolele ca hash,
fiecare meci jucat, fiecare răspuns dat, clasamentele, tranzacțiile și acțiunile
de administrare — permanent, fără ștergere. Cele trei fronturi afișează ce spune
el și nu decid nimic ce contează.

---

## Grupa A · Internaționalizare și date de referință

Prima grupă din registru, nu ultima. Orice tabel de conținut creat înainte de A
va trebui migrat după.

#### SRV-001 · Tabelele de limbi și țări
- **Status:** 🟡 Parțial — implementat și verificat local; lipsește aplicarea controlată în producție.
- **Descriere:** Registrul de limbi și țări suportate, cu marcajul poolului global. Baza pentru matchmaking regional, clasamente, camere de chat și banca de întrebări.
- **Implementare corectă:** `languages(id, iso_code unique, name_key, is_global_pool, active)` și `countries(id, iso_alpha2 unique, name_key, default_language_id, active)`. `name_key` e o cheie de traducere, nu un nume în română — numele țării se traduce ca orice alt text. `is_global_pool` e `true` doar pentru engleză la lansare. Seed idempotent cu toate țările ISO-3166 și limbile active. Fără `DELETE`: o limbă retrasă primește `active = false`.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.7 (de la linia 462)
- **Commit:** `36dba77`
- **Depinde de:** —

#### SRV-002 · Limba și țara pe cont, cu cooldown
- **Status:** 🟡 Parțial
- **Descriere:** Fiecare cont are o țară (identitate de clasament) și o limbă (bancă de întrebări și cameră de chat), două alegeri distincte, schimbabile rar.
- **Implementare corectă:** `users.country_code` și `users.region_changed_at` există deja. Lipsesc `users.language_id`, legătura către `countries`, și aplicarea cooldown-ului de 60–90 de zile la schimbare. Alegerea se confirmă explicit de jucător la onboarding — sugerată din locale-ul dispozitivului sau IP, **niciodată impusă tăcut**. La schimbarea care afectează clasamentul se declanșează recalibrarea din SRV-045, nu transfer 1:1 al rangului.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.1–§10.2 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-001

#### SRV-003 · Catalogul de traduceri, în baza de date
- **Status:** ⬜ De făcut
- **Descriere:** Textele care nu sunt cod — nume de categorii, ranguri, realizări, recompense, notificări, motive de sancțiune — trăiesc în baza de date, pe limbă, editabile din panou fără redeploy.
- **Implementare corectă:** `translations(key, language_id, value, updated_at, updated_by)` cu cheie compusă `(key, language_id)`. Cheile urmează o convenție ierarhică stabilă: `rank.oracle.name`, `sanction.reason.cheating`. Serverul întoarce **chei plus parametri** către fronturi, nu text gata format, cu excepția conținutului scris de utilizatori. Cheia lipsă într-o limbă cade pe engleză și se raportează în ADM-055, nu se afișează cheia brută jucătorului.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-001

#### SRV-004 · Contractul de răspuns localizat
- **Status:** ⬜ De făcut
- **Descriere:** O regulă unică prin care orice endpoint știe în ce limbă răspunde și ce întoarce ca text.
- **Implementare corectă:** Un interceptor NestJS citește limba în ordinea: preferința contului → antetul `Accept-Language` → engleză. O pune pe cerere ca `request.locale`. Erorile devin `{ code, messageKey, params }`, niciodată un șir în română. Regula se testează cu un test care parcurge toate rutele și cade dacă vreuna întoarce text liber destinat afișării.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 1
- **Commit:** —
- **Depinde de:** SRV-003

#### SRV-005 · Banca de întrebări pe limbă, cu fallback anunțat
- **Status:** 🟡 Parțial
- **Descriere:** Fiecare întrebare aparține unei limbi. Un jucător cu o limbă încă neacoperită e direcționat vizibil spre poolul global, nu tăcut.
- **Implementare corectă:** `questions.language` există ca `VarChar(10)`; se migrează la `language_id` cu cheie străină spre `languages`. Categoriile primesc traduceri prin SRV-003. Categoria „România specific" se generalizează la „[Țară] specific", iar pentru poolul global devine „cultură generală internațională". Când o limbă are sub un prag configurabil de întrebări aprobate per categorie, API-ul întoarce un semnal explicit de fallback pe care fronturile îl afișează ca mesaj, nu ca schimbare silențioasă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.5 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-001, SRV-003

---

## Grupa B · Identitate, conturi, securitate

#### SRV-006 · Autentificare cu e-mail și parolă
- **Status:** ✅ Implementat
- **Descriere:** Înregistrare și autentificare cu parolă, hash Argon2, fără parole în clar nicăieri.
- **Implementare corectă:** Argon2id, DTO-uri validate, răspuns uniform anti-enumerare la e-mail inexistent.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** —

#### SRV-007 · Google OAuth cu schimb single-use
- **Status:** ✅ Implementat
- **Descriere:** Autentificare prin Google, cu cod de schimb consumabil o singură dată pentru clientul mobil.
- **Implementare corectă:** Guard OAuth pe server, validare `state`, cod de schimb cu durată scurtă; clientul deschide browserul de sistem, nu un webview.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-008 · Mod invitat cu o singură conversie
- **Status:** ✅ Implementat
- **Descriere:** Joc fără cont, cu migrarea progresului la înregistrare, o singură dată.
- **Implementare corectă:** `GuestMigration` marchează conversia idempotent; se migrează doar progres necompetitiv, niciodată ELO sau rang.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-009 · 2FA TOTP cu coduri de recuperare
- **Status:** ✅ Implementat
- **Descriere:** Al doilea factor opțional, obligatoriu pentru conturile cu rol de personal.
- **Implementare corectă:** Secret criptat AES-GCM, coduri de recuperare ca hash Argon2, provocare de 5 minute. Obligativitatea pentru personal se aplică în ADM-058.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-010 · Sesiuni revocabile per dispozitiv
- **Status:** ✅ Implementat
- **Descriere:** Access de 15 minute, refresh de 30 de zile, cu rotație și detecție de replay.
- **Implementare corectă:** `user_sessions` cu hash de refresh, etichetă de dispozitiv, hash de IP. Reutilizarea unui token rotit revocă întregul lanț.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-011 · Platforma sesiunii, ca enum
- **Status:** ⬜ De făcut
- **Descriere:** Serverul trebuie să știe dacă o sesiune vine de pe Android, iOS sau web — pentru filtrare în panou, pentru statistici și pentru anti-abuz.
- **Implementare corectă:** `user_sessions.platform` ca enum `ANDROID | IOS | WEB | UNKNOWN`, completat din antetul clientului la autentificare, **nu ghicit din `device_label`** care e text liber. Deblochează filtrul de platformă din panou.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §6
- **Commit:** —
- **Depinde de:** SRV-010

#### SRV-012 · Limitare de rată și captcha
- **Status:** ✅ Implementat
- **Descriere:** Protecție împotriva creării automate de conturi și a atacurilor pe endpointuri sensibile.
- **Implementare corectă:** Throttler pe register/login, Turnstile verificat server-side, fereastră de 24 h pe combinația HMAC de IP plus etichetă de client.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-013 · Age gate și capabilități de minor
- **Status:** ✅ Implementat
- **Descriere:** Prag minim de 13 ani, cu restricții derivate server-side pentru conturile de minori.
- **Implementare corectă:** `birth_date` ca dată, fără oră. Minorii rămân pe reacții în chatul global indiferent de treapta de încredere.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Depinde de:** SRV-006

#### SRV-014 · Rolul contului întors de `/users/me`
- **Status:** ✅ Implementat
- **Descriere:** Fără rol în răspuns, niciun front nu putea decide dacă arată intrarea în panou.
- **Implementare corectă:** `role` inclus în selecția din `getProfile`, tipat ca enum Prisma cu majuscule pe fronturi.
- **Finalizat:** 2026-08-16
- **Sursă:** `ai/needdesign.md`, secțiunea de limite
- **Commit:** `f802915`
- **Depinde de:** SRV-006

#### SRV-015 · Suspendarea aplicată la validarea tokenului
- **Status:** ✅ Implementat
- **Descriere:** Un cont suspendat trebuie respins la fiecare cerere, nu doar la afișarea butonului de ban.
- **Implementare corectă:** `validateAccessUser` selectează `banned_at` și aruncă `ForbiddenException`; același test la finalizarea autentificării, ca să acopere și calea Google.
- **Finalizat:** 2026-08-16
- **Sursă:** `ai/needdesign.md` §3
- **Commit:** `4861e4a`
- **Depinde de:** SRV-010

#### SRV-016 · Modelul de sancțiuni, cu motiv și durată
- **Status:** ⬜ De făcut
- **Descriere:** Azi există un singur câmp, `users.banned_at`. Un ban și o suspendare sunt același lucru, fără motiv, fără termen și fără legătură cu o contestație.
- **Implementare corectă:** `sanctions(id, user_id, actor_id, kind, reason_key, reason_note, expires_at, lifted_at, lifted_by, created_at)` cu `kind` enum `SUSPENSION | BAN | CHAT_MUTE | SHADOW_BAN`. Motivul se alege dintr-o listă predefinită tradusă (`sanction.reason.*`), cu câmp liber opțional. `users.banned_at` rămâne ca sold denormalizat pentru citirea rapidă din validarea tokenului, dar adevărul e în `sanctions`. Tabel append-only: ridicarea unei sancțiuni scrie `lifted_at`, nu șterge rândul. Aplicarea unei sancțiuni revocă automat sesiunile active.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §3; `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Depinde de:** SRV-010, SRV-003

#### SRV-017 · Note interne pe cont
- **Status:** ⬜ De făcut
- **Descriere:** Observații ale moderatorilor despre un cont, editabile, separate de jurnalul de audit.
- **Implementare corectă:** `player_notes(id, user_id, author_id, body, pinned, created_at, updated_at)`. **Nu se pun în audit**: auditul e consemnare imuabilă a ce s-a întâmplat, o notă e o opinie editabilă. Amestecate, prima își pierde valoarea de probă.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §2
- **Commit:** —
- **Depinde de:** —

#### SRV-018 · Recuperare de cont prin suport
- **Status:** 🟡 Parțial
- **Descriere:** Procedura prin care un jucător care și-a pierdut accesul și al doilea factor își recuperează contul.
- **Implementare corectă:** Runbook-ul există în `docs/account-recovery-runbook.md`: tichet, dovezi independente, protecție de 72 h, revocarea sesiunilor, resetare controlată a 2FA. Lipsește execuția din panou — ecranul care leagă tichetul de acțiunile reale, cu audit.
- **Finalizat:** —
- **Sursă:** `docs/account-recovery-runbook.md`
- **Commit:** —
- **Depinde de:** SRV-009, ADM-011

---

## Grupa C · Istoric permanent, statistici, retenție de date

Grupa care face din server o arhivă, nu o cache. Nimic de aici nu se șterge.

#### SRV-019 · Istoricul de meciuri, append-only
- **Status:** 🟡 Parțial
- **Descriere:** Fiecare partidă jucată rămâne în baza de date pentru totdeauna, cu participanții, rezultatul și fiecare răspuns.
- **Implementare corectă:** `matches`, `match_players`, `match_events` există. Se adaugă regula explicită: după ce un meci primește `ended_at`, rândurile lui nu se mai actualizează niciodată. Se impune prin trigger PostgreSQL care respinge `UPDATE` pe meciuri încheiate, nu doar prin convenție — o convenție se încalcă tăcut la primul hotfix.
- **Finalizat:** —
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Depinde de:** —

#### SRV-020 · Momentul propriu al fiecărui răspuns
- **Status:** ⬜ De făcut
- **Descriere:** `match_events` nu are moment propriu; răspunsurile se datează azi după începutul partidei, ceea ce face imposibilă orice analiză de ritm.
- **Implementare corectă:** `match_events.answered_at` completat de server la primirea răspunsului, plus `response_time_ms` deja prezent. Fără el, „câte întrebări s-au răspuns marți la ora 20" e o aproximare, iar detecția de trișare pe cadență nu are pe ce să lucreze.
- **Finalizat:** —
- **Sursă:** `backend/api/src/admin/overview.service.ts`, comentariul din `dailySeries`
- **Commit:** —
- **Depinde de:** SRV-019

#### SRV-021 · Agregate zilnice, calculate o dată
- **Status:** ⬜ De făcut
- **Descriere:** Fotografia zilnică a platformei, scrisă o dată și păstrată pentru totdeauna. Fără ea, retenția pe cohorte nu se poate calcula retroactiv niciodată.
- **Implementare corectă:** `daily_stats(day PK, active_players, new_players, returning_players, matches_played, questions_answered, flagged_accounts, premium_players, coins_minted, coins_spent, revenue_cents)` scris de o sarcină programată la miezul nopții, per limbă și per țară acolo unde are sens. Rândul unei zile încheiate nu se recalculează. Merită pornit **acum**, chiar înainte să existe ecranele care îl folosesc: o zi netrecută prin agregare e pierdută definitiv.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §9
- **Commit:** —
- **Depinde de:** SRV-019

#### SRV-022 · Statistici cumulate per jucător
- **Status:** 🟡 Parțial
- **Descriere:** Profilul unui jucător trebuie să răspundă instant la „câte partide, ce acuratețe, pe ce categorii, ce evoluție" — fără să numere de fiecare dată milioane de rânduri.
- **Implementare corectă:** `user_stats(user_id, matches_played, matches_won, questions_answered, questions_correct, best_streak, current_streak, total_playtime_seconds, updated_at)` plus `user_category_stats(user_id, category_id, answered, correct)` pentru acuratețea pe categorie. Se actualizează în aceeași tranzacție cu persistarea meciului, ca soldul să nu poată devia de la istoric. `users.correct_answers` există deja și devine un câmp din acest tabel. Un job de reconciliere lunar compară soldul cu `match_events` și raportează diferențele.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254); `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Depinde de:** SRV-019, SRV-021

#### SRV-023 · Jurnal de evenimente de domeniu
- **Status:** ⬜ De făcut
- **Descriere:** Un flux append-only cu tot ce s-a întâmplat semnificativ în sistem, dincolo de tabelele de stare: cont creat, sezon început, teritoriu cucerit, rang promovat, sancțiune aplicată.
- **Implementare corectă:** `domain_events(id, occurred_at, kind, actor_user_id, subject_type, subject_id, payload jsonb, language_id)` cu index pe `(kind, occurred_at)`. E sursa fluxurilor de activitate din panou și baza oricărei analize viitoare la care nu ne-am gândit încă. Scris în aceeași tranzacție cu acțiunea, ca un eveniment să nu poată exista fără fapt și invers.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 2
- **Commit:** —
- **Depinde de:** —

#### SRV-024 · Jurnalul de audit al administrării
- **Status:** ✅ Implementat
- **Descriere:** Urma fiecărei acțiuni făcute din panou: cine, ce, când, de la ce adresă, cu ce a trimis.
- **Implementare corectă:** `admin_audit_log` cu redactarea câmpurilor sensibile înainte de scriere; serviciul nu aruncă niciodată, ca o defecțiune de jurnal să nu anuleze o acțiune deja executată. IP extras din `x-forwarded-for`, corect în spatele tunelului Cloudflare.
- **Finalizat:** 2026-08-16
- **Sursă:** `ai/needdesign.md`, secțiunea de limite
- **Commit:** `4861e4a`
- **Depinde de:** —

#### SRV-025 · Politica de retenție și arhivare
- **Status:** ⬜ De făcut
- **Descriere:** Istoricul crește la nesfârșit. Trebuie să crească fără să încetinească interogările curente.
- **Implementare corectă:** Partiționare pe lună pentru `match_events` și `domain_events`, cele două tabele care cresc cel mai repede. Partițiile vechi rămân accesibile, dar ies din calea interogărilor de zi cu zi. **Nimic nu se șterge la arhivare** — se mută, cel mult, pe stocare mai ieftină. Documentat, cu procedura de citire dintr-o partiție arhivată.
- **Finalizat:** —
- **Sursă:** `00-README.md`, regula 2
- **Commit:** —
- **Depinde de:** SRV-019, SRV-023

#### SRV-026 · Copii de siguranță cu restaurare verificată
- **Status:** 🟡 Parțial
- **Descriere:** O copie de siguranță netestată nu e o copie de siguranță.
- **Implementare corectă:** Dump zilnic al bazei, păstrat în afara VPS-ului. Lunar, o restaurare automată într-o bază temporară, cu verificarea numărului de rânduri din tabelele critice, raportată în panou. Alertă dacă ultima restaurare reușită e mai veche de 35 de zile.
- **Finalizat:** —
- **Sursă:** `docs/deploy-vps.md`
- **Commit:** —
- **Depinde de:** —

---

## Grupa D · Campanie, sezoane, teritorii persistente

Miezul jocului. Nimic din grupa asta nu există azi.

#### SRV-027 · Modelele de sezon și facțiune
- **Status:** 🔒 Blocat pe D2, D4
- **Descriere:** Sezonul e unitatea de timp a competiției de cucerire; facțiunea e tabăra în care intră jucătorul pe durata lui.
- **Implementare corectă:** `seasons(id, name_key, starts_at, ends_at, state, soft_reset_applied)` și `factions(id, season_id, name_key, colour, emblem_asset)`. `season_participants(season_id, user_id, faction_id, joined_at, contribution_points)` cu cheie compusă. Numele sunt chei de traducere. Facțiunea se atribuie automat, echilibrat numeric, **într-o tranzacție cu blocare** — două cereri simultane care citesc același număr de membri dezechilibrează tabăra. Blocată pe sezon: nu se schimbă până la închidere.
- **Finalizat:** —
- **Sursă:** `taskmaster.md` D2, D4
- **Commit:** —
- **Depinde de:** SRV-001, SRV-003

#### SRV-028 · Județele și vecinătățile lor
- **Status:** ⬜ De făcut
- **Descriere:** Cele 41 de județe plus București, cu adiacența reală. Fără adiacență nu există reguli de front și cucerirea devine aleatoare.
- **Implementare corectă:** `counties(id, code, name_key, region_key, centroid_x, centroid_y)` și `county_adjacency(county_id, neighbour_id)` — pereche simetrică, scrisă în ambele sensuri, cu un test care verifică simetria. Seed idempotent, verificabil: suma vecinătăților trebuie să fie pară. Coordonatele centroidului servesc desenării hărții pe toate cele trei fronturi, dintr-o singură sursă.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-003

#### SRV-029 · Proprietatea teritoriilor și pragul de rezistență
- **Status:** 🔒 Blocat pe D2
- **Descriere:** Cine deține fiecare județ în sezonul curent și cât mai are până cade.
- **Implementare corectă:** `territories(season_id, county_id, owner_faction_id, resistance, updated_at)`. Un teritoriu nu-și schimbă stăpânul la primul meci câștigat: victoriile scad `resistance`, iar la zero proprietatea trece la facțiunea atacatoare și pragul se resetează. Pragul face harta stabilă fără instanțe separate de sezon. Fiecare schimbare scrie în `territory_events`, append-only, ca istoria hărții să fie reconstituibilă zi cu zi.
- **Finalizat:** —
- **Sursă:** `taskmaster.md` D2
- **Commit:** —
- **Depinde de:** SRV-027, SRV-028

#### SRV-030 · Serviciul de campanie și starea hărții
- **Status:** ⬜ De făcut
- **Descriere:** Intrarea într-un sezon, atribuirea facțiunii, citirea hărții curente.
- **Implementare corectă:** `CampaignService` cu `joinSeason`, `currentMap`, `standings`. Harta se citește de zeci de ori mai des decât se scrie: răspuns cache-uit în Redis, invalidat la fiecare schimbare de proprietate, niciodată la interval fix — un interval face harta să mintă pentru câteva secunde exact când e mai interesantă.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-029

#### SRV-031 · Endpointurile publice de campanie
- **Status:** ⬜ De făcut
- **Descriere:** Ce consumă cele trei fronturi ca să deseneze harta și poziția jucătorului.
- **Implementare corectă:** `GET /campaign/current` (sezon, timp rămas, facțiunea mea), `GET /campaign/map` (toate teritoriile cu proprietar și rezistență), `GET /campaign/standings` (clasamentul facțiunilor), `POST /campaign/join`. Toate cu ETag, ca fronturile să nu retransmită harta neschimbată.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 0
- **Commit:** —
- **Depinde de:** SRV-030

#### SRV-032 · Aplicarea rezultatului de meci pe hartă
- **Status:** 🔒 Blocat pe D3
- **Descriere:** Legătura dintre o partidă câștigată și harta țării. Momentul în care jocul devine campanie.
- **Implementare corectă:** La încheierea unui meci Clasic, într-o **singură tranzacție**: se scade rezistența județului disputat, se acordă puncte de contribuție participanților, se scrie `territory_event` și `domain_event`, iar dacă rezistența a ajuns la zero, se schimbă proprietarul. O cucerire aplicată pe jumătate e mai rea decât una neaplicată. Doar modul Clasic mișcă harta; celelalte moduri dau doar puncte de facțiune (decizia D3).
- **Finalizat:** —
- **Sursă:** `taskmaster.md` D3
- **Commit:** —
- **Depinde de:** SRV-029, SRV-035

#### SRV-033 · Închiderea sezonului și recompensele
- **Status:** ⬜ De făcut
- **Descriere:** Un sezon se termină, se stabilește facțiunea câștigătoare, se acordă premiile și se pregătește următorul.
- **Implementare corectă:** Sarcină programată care trece sezonul în `CLOSED`, îngheață harta finală într-un instantaneu permanent, calculează clasamentele și acordă recompensele prin livrarea în masă din SRV-064. Soft reset de rang (SRV-045) se aplică la deschiderea următorului, nu la închiderea celui vechi, ca jucătorii să-și vadă rezultatul înainte de recalibrare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.2 (de la linia 228)
- **Commit:** —
- **Depinde de:** SRV-029, SRV-064

---

## Grupa E · Motor de joc și moduri

#### SRV-034 · Harta hexagonală de meci și starea de proprietate
- **Status:** ✅ Implementat
- **Descriere:** Tabla unei partide, cu teritorii, baze și proprietate care se schimbă rundă cu rundă.
- **Implementare corectă:** `territory-map.ts` generează harta imuabilă pe durata partidei; `territory-state.ts` ține proprietatea separat, ca o salvare de stare să nu rescrie geometria la fiecare răspuns. Ambele cu teste.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `backend/realtime/src/game/territory-state.ts`
- **Commit:** —
- **Depinde de:** —

#### SRV-035 · Modul Clasic, cu miză pe un județ real
- **Status:** ⬜ De făcut
- **Descriere:** Modul care dă sens întregului joc: se joacă pentru un județ de pe harta națională.
- **Implementare corectă:** Valoarea `CLASSIC` există în enum. Se adaugă alegerea județului disputat la formarea partidei — un județ de la frontul facțiunii, adiacent unui teritoriu deja deținut, ca atacurile să nu poată sări peste hartă. Meciul folosește motorul existent; noutatea e miza și aplicarea rezultatului din SRV-032.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** SRV-028, SRV-034

#### SRV-036 · Modul Blitz
- **Status:** ⬜ De făcut
- **Descriere:** Variantă rapidă: mai puține runde, timpi mai scurți.
- **Implementare corectă:** O configurație de mod, nu un motor nou. `match_mode_config(mode, rounds, seconds_per_question, territories)` în baza de date, citită la formarea partidei — ca modurile să poată fi echilibrate din panou fără redeploy.
- **Finalizat:** —
- **Sursă:** `plan.md` §6 (de la linia 156)
- **Commit:** —
- **Depinde de:** SRV-034

#### SRV-037 · Duel 1v1 cu ELO
- **Status:** ✅ Implementat
- **Descriere:** Duelul direct, cu potrivire pe ELO.
- **Implementare corectă:** Matchmaking pe coadă Redis, rezolvare server-side a fiecărei runde, persistarea rezultatului.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `backend/realtime/src/game/matchmaking.service.ts`
- **Commit:** —
- **Depinde de:** SRV-034

#### SRV-038 · Partidă privată cu cod și link
- **Status:** ⬜ De făcut
- **Descriere:** Cameră găzduită de un jucător, cu invitație prin cod sau link, număr configurabil de locuri și alegerea categoriilor.
- **Implementare corectă:** `private_rooms(id, code unique, host_user_id, mode, target_players, bot_difficulty, category_codes, state, created_at, expires_at)`. Codul e scurt, fără caractere ambigue. **Camerele private nu sunt restricționate de regiune** — e alegerea explicită a jucătorilor, nu matchmaking automat. Sloturile rămase se completează cu boți la cererea gazdei.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.4 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-039, SRV-042

#### SRV-039 · Boți cu trei niveluri de dificultate
- **Status:** ⬜ De făcut
- **Descriere:** O singură implementare, trei consumatori: camere private, înlocuirea deconectaților, antrenament și tutorial.
- **Implementare corectă:** Botul răspunde cu o probabilitate de corectitudine și o distribuție de timp de răspuns calibrate pe nivel, **cu variație** — un bot care răspunde mereu în exact 3,0 secunde e imediat recunoscut. Rulează în `backend/realtime`, în același flux ca un jucător real, ca să nu existe o a doua cale de rezolvare a rundei care se poate dezacorda.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180)
- **Commit:** —
- **Depinde de:** SRV-034

#### SRV-040 · Reconectare cu păstrarea locului
- **Status:** ⬜ De făcut
- **Descriere:** O pierdere de semnal de câteva zeci de secunde nu trebuie să însemne înfrângere.
- **Implementare corectă:** La deconectare, locul se păstrează 60–90 s în Redis, cu starea completă a partidei. Reconectarea în fereastră reia din runda curentă. După expirare, locul se predă unui bot sau se declară abandon, în funcție de mod. Fereastra e mai lungă la partidele cu mulți jucători, unde o înlocuire strică echilibrul mai tare.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180); `owner-plan.md` §12.9 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-034

#### SRV-041 · Partide de la 4 la 8 jucători, free-for-all
- **Status:** ⬜ De făcut
- **Descriere:** Modurile cu mulți jucători, cu hartă scalată și recompense pe loc final.
- **Implementare corectă:** Harta și numărul de teritorii scalează cu numărul de jucători; structura pe două faze (cucerire, apoi bătălie) se generalizează la N. Recompensele sunt scalate pe **loc final**, nu binar victorie/înfrângere — locul 4 dintr-un lobby de 8 primește ceva vizibil, altfel modurile mari nu rețin. Rangul folosește plasamentul, nu victoria (SRV-046).
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.2–§12.6 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-034, SRV-040

#### SRV-042 · Selecția de categorii per meci
- **Status:** ✅ Implementat
- **Descriere:** Jucătorii își exprimă preferințele de categorii, iar serverul face intersecția.
- **Implementare corectă:** `agreeOnCategories` intersectează preferințele, cu revenire la „toate" când intersecția e goală; `matchmaking:join` acceptă `categoryCodes`. **Serverul e gata; lipsesc doar interfețele** (WEB-021, APP-018).
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/structura-joc.md` §3, punctul 4 (de la linia 64)
- **Commit:** —
- **Depinde de:** —

#### SRV-043 · Mod spectator
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător eliminat dintr-o partidă cu mulți jucători poate urmări restul, în loc să închidă aplicația.
- **Implementare corectă:** Abonare read-only la fluxul partidei, fără dreptul de a trimite răspunsuri. Întârziere deliberată de câteva secunde, ca spectatorul să nu poată transmite răspunsuri unui participant.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.6 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-041

---

## Grupa F · Matchmaking, regiuni, anti-cheat

#### SRV-044 · Cozi de matchmaking partiționate pe limbă și țară
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător român joacă cu români; unul care alege engleza intră în poolul global, indiferent de țară.
- **Implementare corectă:** Cheia cozii Redis existente primește `language_id` plus `country_id`, sau doar `language_id` când limba are `is_global_pool`. **Nu un sistem nou** — doar o cheie de partiționare în coada deja planificată. Lărgire progresivă: după 20–30 s fără meci, căutarea se extinde la țări vecine cu aceeași limbă sau se oferă explicit poolul global, **cu acordul vizibil al jucătorului**, niciodată tăcut.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.3 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-002

#### SRV-045 · Ranguri, ELO ascuns și meciuri de plasare
- **Status:** ⬜ De făcut
- **Descriere:** 24 de trepte, de la Novice la Legendă. ELO-ul e baza de calcul, dar jucătorul vede rangul, nu numărul.
- **Implementare corectă:** `rank_tiers(id, major_rank, division, name_key, elo_min, elo_max, icon_asset)` și `user_ranks(user_id, season_id, current_elo, current_tier_id, peak_tier_id, placement_matches_completed)`. 5–10 meciuri de plasare la primul acces ranked, cu K-factor mai mare la început. Promovare și retrogradare pe o serie scurtă de confirmare, nu pe un singur meci. Decay doar de la Oracol în sus. Soft reset la început de sezon, niciodată la zero. „Legendă" e dinamic, doar top 100 global, recalculat live.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §5.1–§5.4 (de la linia 228)
- **Commit:** —
- **Depinde de:** SRV-022, SRV-027

#### SRV-046 · Rang pe plasament pentru partidele cu mulți jucători
- **Status:** ⬜ De făcut
- **Descriere:** Într-un lobby de 8, locul 3 nu e o înfrângere. ELO-ul binar nu se poate aplica.
- **Implementare corectă:** Câștigul sau pierderea de ELO se calculează din plasamentul final raportat la ELO-ul mediu al lobby-ului, nu din victorie/înfrângere. Locul din prima jumătate câștigă, cel din a doua pierde, proporțional cu distanța față de așteptare.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.8 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-041, SRV-045

#### SRV-047 · Anti-cheat de bază
- **Status:** ⬜ De făcut
- **Descriere:** Validarea e deja server-side. Ce lipsește e detecția tiparelor imposibile.
- **Implementare corectă:** Prag minim de timp de răspuns sub care un răspuns e imposibil uman, aplicat server-side. Jurnal de tipare suspecte: acuratețe aproape perfectă cu deviație de timp foarte mică, serii de răspunsuri sub prag, aceleași tipare pe conturi legate prin dispozitiv. Nu sancționează automat — semnalează pentru revizuire în ADM-014. **Trebuie livrat înainte ca web-ul să devină jucabil** (decizia D5), pentru că automatizarea unui client de browser e mult mai la îndemână.
- **Finalizat:** —
- **Sursă:** `plan.md` §8 (de la linia 180); `taskmaster.md` D5
- **Commit:** —
- **Depinde de:** SRV-020

#### SRV-048 · Detecție de sandbagging
- **Status:** ⬜ De făcut
- **Descriere:** Jucători puternici care pierd intenționat ca să intre într-un turneu la un prag inferior.
- **Implementare corectă:** Semnal automat pe discrepanța mare dintre skill-ul istoric și rezultatele recente dinaintea unei înscrieri la turneu. Semnalează, nu blochează — un jucător poate avea o săptămână proastă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.6 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-045, SRV-055

#### SRV-049 · Grup organizat pentru matchmaking
- **Status:** ⬜ De făcut
- **Descriere:** Doi sau mai mulți prieteni intră împreună în coada publică.
- **Implementare corectă:** `parties(id, leader_user_id, created_at)` și membrii; coada primește grupul ca o singură unitate, cu ELO-ul mediu ridicat ușor față de media brută — un grup coordonat are un avantaj real față de jucători solitari de același nivel.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §12.13 (de la linia 592)
- **Commit:** —
- **Depinde de:** SRV-044

---

## Grupa G · Banca de întrebări

#### SRV-050 · Modelul de întrebări și categorii
- **Status:** ✅ Implementat
- **Descriere:** Grilă și numeric, cu dificultate, sursă, stare de revizuire și statistici de folosire.
- **Implementare corectă:** `questions` cu `type`, `difficulty` 1–5, `source`, `status`, `times_asked`, `times_correct`; 20 de categorii populate.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Depinde de:** —

#### SRV-051 · Trimitere din comunitate cu coadă de revizuire
- **Status:** ✅ Implementat
- **Descriere:** Jucătorii propun întrebări; nimic nu intră în joc fără aprobare.
- **Implementare corectă:** `POST /questions` cu limită de 10 pe oră, stare `PENDING`, aprobare din panou.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `plan.md` §5.2 (de la linia 133)
- **Commit:** —
- **Depinde de:** SRV-050

#### SRV-052 · Endpoint de creare din panou, publicat direct
- **Status:** ⬜ De făcut
- **Descriere:** Un administrator care adaugă o întrebare nu trebuie să treacă prin coada comunității și nici prin limita de 10 pe oră.
- **Implementare corectă:** `POST /admin/questions`, restrâns la `ADMIN` și `CONTENT_EDITOR`, publică direct cu `status = APPROVED` și `source = CURATED`, cu limbă și categorie **obligatorii**. Scrie în audit.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Depinde de:** SRV-005, SRV-024

#### SRV-053 · Anti-repetiție per jucător
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător care vede aceeași întrebare de trei ori într-o seară nu se mai întoarce.
- **Implementare corectă:** `user_question_history(user_id, question_id, last_seen_at, times_seen)` consultat la alegerea întrebărilor, cu o fereastră de excludere configurabilă. La bancă epuizată pe o categorie, se lărgește fereastra progresiv în loc să se blocheze. Selecția rămâne server-side; clientul nu află niciodată ce urmează.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Depinde de:** SRV-050

#### SRV-054 · Dificultate reală, calculată din joc
- **Status:** ⬜ De făcut
- **Descriere:** Dificultatea declarată de autor e o presupunere. Cea reală se vede din rata de răspuns corect.
- **Implementare corectă:** Recalcularea periodică a unui scor de dificultate observată din `times_asked` și `times_correct`, ponderat pe nivelul jucătorilor care au primit-o. Când observatul se abate mult de la declarat, întrebarea se semnalează pentru revizuire. Selecția folosește dificultatea observată acolo unde există destule răspunsuri.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §11 (de la linia 529)
- **Commit:** —
- **Depinde de:** SRV-022, SRV-050

#### SRV-055 · Importul în masă al întrebărilor
- **Status:** ⬜ De făcut
- **Descriere:** Popularea băncii pe limbi noi nu se poate face una câte una.
- **Implementare corectă:** Încărcare CSV sau JSON cu previzualizare, raport de erori **pe rând** și detectarea duplicatelor înainte de scriere. Importul e tranzacțional per lot: un lot cu erori nu intră parțial. Limba și categoria sunt obligatorii pe fiecare rând.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Questions
- **Commit:** —
- **Depinde de:** SRV-052

---

## Grupa H · Progresie și retenție

#### SRV-056 · Nivel de cont și XP online
- **Status:** 🟡 Parțial
- **Descriere:** Indicator de progres al contului din **orice** activitate online, distinct de rangul competitiv. Nu e progres prin conținut secvențial.
- **Implementare corectă:** `users.xp` și `users.level` există. Lipsesc curba de XP configurabilă și deblocările la praguri. Terminologia e obligatorie peste tot în interfețe: **„Nivel de cont"** sau „Nivel online", niciodată „nivel" simplu. XP se acordă și pentru participare, nu doar pentru victorie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.3 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-022

#### SRV-057 · Achievements cu progres validat server-side
- **Status:** 🟡 Parțial
- **Descriere:** Șabloane parametrizate care generează sute de realizări fără listare manuală.
- **Implementare corectă:** `achievement_templates`, `achievements`, `user_achievements` există; `recordValidatedMatch` acordă progres în aceeași tranzacție cu persistarea meciului, deci clientul nu poate acorda nimic. **Ce lipsește:** extinderea catalogului către familiile care cer metrici noi — categorii, acuratețe, serie, viteză, social, cosmetice, evenimente, meta. Fiecare familie cere întâi sursa ei server-side.
- **Finalizat:** —
- **Sursă:** `docs/archive/owner-plan-progress.md` §3
- **Commit:** —
- **Depinde de:** SRV-022

#### SRV-058 · Recompense zilnice și serie de logare
- **Status:** ⬜ De făcut
- **Descriere:** Calendar de recompense care cresc cu seria de zile consecutive.
- **Implementare corectă:** `login_streaks(user_id, current_streak, best_streak, last_claimed_on, grace_used_this_month)`. Praguri mari la 7, 30 și 100 de zile. **Perioadă de grație**: o zi de protecție pe lună, ca o zi ratată din motive reale să nu șteargă o serie de trei luni. Ziua se calculează în fusul orar al jucătorului, altfel jucătorii din alte fusuri pierd serii pe nedrept.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.1 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-002

#### SRV-059 · Misiuni zilnice și săptămânale
- **Status:** ⬜ De făcut
- **Descriere:** 3–5 misiuni zilnice și 1–2 săptămânale, rotite automat.
- **Implementare corectă:** Refolosește sistemul de șabloane parametrizate de la achievements — nu conținut unic per misiune. `quests(id, template_id, params, scope, starts_at, ends_at)` și `user_quest_progress`. Rotația e o sarcină programată, cu misiuni alese ca să acopere moduri diferite, nu trei variante ale aceluiași lucru.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.2 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-057

#### SRV-060 · Întrebarea zilei
- **Status:** ⬜ De făcut
- **Descriere:** O întrebare pe zi, aceeași pentru toți jucătorii dintr-o limbă, cu rezultat partajabil.
- **Implementare corectă:** `daily_questions(day, language_id, question_id)` ales dinainte, nu la cerere. Un jucător răspunde o singură dată; rezultatul se poate partaja fără a dezvălui răspunsul corect. E mecanica cea mai ieftină de retenție din tot registrul.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.1 (de la linia 364)
- **Commit:** —
- **Depinde de:** SRV-005

#### SRV-061 · Provocare asincronă către un prieten
- **Status:** ⬜ De făcut
- **Descriere:** Trimiți unui prieten un set de întrebări; el joacă când poate, iar rezultatele se compară.
- **Implementare corectă:** `async_duels(id, challenger_id, opponent_id, question_ids, challenger_score, opponent_score, expires_at, state)`. Setul de întrebări e fixat la creare, identic pentru amândoi. Expiră după câteva zile. Nu afectează ELO — e o mecanică socială, nu competitivă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.2 (de la linia 364)
- **Commit:** —
- **Depinde de:** SRV-053, SRV-067

#### SRV-062 · Rivalitate
- **Status:** ⬜ De făcut
- **Descriere:** Adversarul cu care te-ai întâlnit cel mai des devine „nemesis", cu scor direct urmărit.
- **Implementare corectă:** Derivat din istoricul de meciuri, nu un tabel de relații nou: perechea cu cele mai multe întâlniri recente, cu bilanțul direct. Se afișează la reîntâlnire în lobby.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.3 (de la linia 364)
- **Commit:** —
- **Depinde de:** SRV-019

#### SRV-063 · Evenimente și multiplicatori temporari
- **Status:** ⬜ De făcut
- **Descriere:** Ferestre de timp cu reguli speciale: XP dublu, categorie tematică, recompense sporite.
- **Implementare corectă:** `events(id, name_key, kind, starts_at, ends_at, params jsonb, state)`. Multiplicatorii se aplică **server-side la acordare**, niciodată calculați de client. Oprire de urgență imediată din panou, cu efect în câteva secunde — un eveniment greșit configurat trebuie să poată fi oprit fără redeploy.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7 (de la linia 326)
- **Commit:** —
- **Depinde de:** SRV-003

#### SRV-064 · Pachete de recompense și livrare în masă
- **Status:** 🟡 Parțial
- **Descriere:** O compunere refolosibilă de monede, obiecte și cosmetice, livrabilă unui jucător sau unui segment întreg.
- **Implementare corectă:** `reward_bundles(id, name_key, contents jsonb)` plus un flux de livrare care trece **obligatoriu** prin `WalletService` pentru partea de monedă, ca fiecare acordare să aibă intrare în registru. Livrarea în masă e idempotentă pe `(bundle_id, user_id, reason_ref)`: o reluare după eșec nu dublează recompensa. Acordarea individuală funcționează deja.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §14
- **Commit:** —
- **Depinde de:** SRV-072

#### SRV-065 · Album de cunoștințe
- **Status:** ⬜ De făcut
- **Descriere:** Colecție tematică de piese obținute prin joc, completabilă pe sezon.
- **Implementare corectă:** `collections`, `collection_items`, `user_collection_items`. Piesele se obțin din activitate, nu se cumpără direct, ca să rămână un motiv de joc și nu un articol de magazin.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.4 (de la linia 364)
- **Commit:** —
- **Depinde de:** SRV-057

---

## Grupa I · Social, chat, guilde

#### SRV-066 · Chat global, de prieteni și privat
- **Status:** ✅ Implementat
- **Descriere:** Trei suprafețe de conversație, cu reguli diferite de acces.
- **Implementare corectă:** Global efemer în Redis cu istoric de 24 h; conversații de prieteni persistente; DM cu cerere de mesaj la primul contact. Livrare prin Socket.IO.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** —

#### SRV-067 · Prieteni, prezență și sugestii
- **Status:** ✅ Implementat
- **Descriere:** Cerere, acceptare, refuz, blocare, prezență pentru prieteni, sugestii din partide recente.
- **Implementare corectă:** Blocarea rupe prietenia, ascunde conversațiile și oprește comunicarea în ambele sensuri, inclusiv la livrarea în timp real. Sugestiile cer consimțământ bilateral.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** SRV-066

#### SRV-068 · Trepte de încredere T0–T8
- **Status:** ✅ Implementat
- **Descriere:** Accesul la chat crește cu contribuția reală la joc, nu cu vechimea contului.
- **Implementare corectă:** Praguri server-side de la 0 la 100.000 de răspunsuri corecte; minorii rămân pe reacții în global indiferent de treaptă. Clientul afișează progresul primit de la API, nu-l calculează.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `backend/api/src/chat/trust-tier.ts`
- **Commit:** —
- **Depinde de:** SRV-022

#### SRV-069 · Camere de chat pe limbă cu detecție automată
- **Status:** ⬜ De făcut
- **Descriere:** Fiecare cameră publică are o limbă atribuită. Cine scrie în altă limbă primește o îndrumare, nu o pedeapsă.
- **Implementare corectă:** `chat_rooms.language_id` și detecție lingvistică **server-side** în `backend/realtime` — client-side ar putea fi ocolită. Prag de încredere ridicat, cu excepții automate pentru mesaje scurte, emoji, nume proprii și numere, care sunt ambigue lingvistic. Prima abatere: mesaj de sistem vizibil doar autorului. Abaterile repetate intră în moderarea obișnuită, cu mute în camera respectivă, **nu la nivel de cont**. Camerele de prieteni și DM-urile sunt exceptate complet — sunt conversații private între oameni care au consimțit reciproc. `language_violations` păstrează fiecare caz pentru revizuire.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.6 (de la linia 462)
- **Commit:** —
- **Depinde de:** SRV-001, SRV-066

#### SRV-070 · Guilde
- **Status:** ⬜ De făcut
- **Descriere:** Grupuri permanente de jucători, folosite atât social cât și pentru turnee de guildă.
- **Implementare corectă:** `guilds(id, name, tag unique, emblem_id, leader_user_id, created_at)` și `guild_members(guild_id, user_id, role, joined_at, contribution_score)`. Se implementează **o singură dată** și se folosește și de chat, și de turnee — două entități separate s-ar dezacorda. Un membru care pleacă în mijlocul unui război nu-și transferă contribuția la noua guildă.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.7, §7.4 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-067

---

## Grupa J · Turnee

#### SRV-071 · Turnee individuale, bracket și arenă
- **Status:** ⬜ De făcut
- **Descriere:** Două formate: eliminare directă și clasament pe fereastră fixă de timp.
- **Implementare corectă:** `tournaments(id, type, format, name_key, starts_at, ends_at, entry_rank_min, entry_fee, state)` și `tournament_participants`. **Reutilizează motorul de partidă existent** — turneul e un strat de programare, scor și recompense peste partidele obișnuite, nu un joc separat. Formatul arenă nu elimină pe nimeni: scor cumulat pe 48 h, accesibil jucătorilor ocazionali.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.2–§6.3 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-045

#### SRV-072 · Războaie de guildă și ligă
- **Status:** ⬜ De făcut
- **Descriere:** Competiție colectivă între două guilde de nivel apropiat, pe scor cumulat.
- **Implementare corectă:** `guild_wars` și `guild_league_standings`. Fiecare partidă jucată de un membru în fereastra de război contribuie **automat** la scor — fără o acțiune separată de „atac". Potrivirea guildelor rulează ca un job separat de coada individuală, pe aceeași infrastructură Redis. Diviziile de ligă dau motiv de revenire săptămânală, nu doar un eveniment izolat.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.4 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-070, SRV-071

---

## Grupa K · Economie și magazin

#### SRV-073 · Registrul de monedă și portofelul
- **Status:** ✅ Implementat
- **Descriere:** Fiecare mișcare de valoare, cu soldul rezultat și motivul. Singura poartă prin care se mișcă monedele.
- **Implementare corectă:** `CurrencyLedger` append-only cu `delta`, `balance_after`, `reason`, referință și actor. `WalletService` face scăderea printr-un `UPDATE ... WHERE balance >= n` condiționat, ca două cheltuieli simultane să nu poată duce soldul sub zero.
- **Finalizat:** 2026-08-16
- **Sursă:** `backend/api/src/store/wallet.service.ts`
- **Commit:** `4861e4a`
- **Depinde de:** —

#### SRV-074 · Powerups și efectele lor
- **Status:** ✅ Implementat
- **Descriere:** Obiecte vandabile cu efect exact asupra partidei, dintr-un enum închis.
- **Implementare corectă:** `Powerup` cu `effect` ca enum, `magnitude` și `duration_seconds`. Un efect necunoscut motorului de joc nu poate fi creat din panou. Retragerea din magazin e `active = false`, nu ștergere.
- **Finalizat:** 2026-08-16
- **Sursă:** `backend/api/prisma/schema.prisma`
- **Commit:** `4861e4a`
- **Depinde de:** SRV-073

#### SRV-075 · Pachete de gems și achiziții
- **Status:** ✅ Implementat
- **Descriere:** Produsul cumpărat cu bani reali, cu starea achiziției de la inițiere la livrare.
- **Implementare corectă:** `GemPack` cu preț în cea mai mică unitate a monedei, niciodată în virgulă mobilă. `Purchase` creat `PENDING`, devine `PAID` **doar** la confirmarea procesatorului; gems nu se acordă niciodată pe baza a ce raportează clientul. Prețul și cantitatea se copiază pe achiziție, nu se citesc prin relație — o schimbare de preț de mâine n-are voie să rescrie istoricul de azi.
- **Finalizat:** 2026-08-16
- **Sursă:** `backend/api/prisma/schema.prisma`
- **Commit:** `4861e4a`
- **Depinde de:** SRV-073

#### SRV-076 · Cosmetice și inventar
- **Status:** ✅ Implementat
- **Descriere:** Avataruri, rame, bannere, skinuri de hartă și ce deține fiecare jucător.
- **Implementare corectă:** `Cosmetic` cu tip și raritate; `UserInventory` cu `equipped`. Ce e echipat se citește dintr-un singur loc, ca un cosmetic să nu poată fi „echipat" fără să fie deținut.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `plan.md` §4 (de la linia 99)
- **Commit:** —
- **Depinde de:** —

#### SRV-077 · Rotația magazinului
- **Status:** ⬜ De făcut
- **Descriere:** Ce apare azi în magazin și ce se schimbă mâine.
- **Implementare corectă:** `shop_rotations(id, scope, starts_at, ends_at, item_ids)` cu selecție manuală sau automată. Rotația forțată din panou trebuie să poată fi declanșată înainte de termen, apoi revenită la programare.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Shop
- **Commit:** —
- **Depinde de:** SRV-076

#### SRV-078 · Facturare prin magazinele de aplicații
- **Status:** 🔒 Blocat — monetizare amânată
- **Descriere:** Bunurile digitale consumate în aplicație **trebuie** să treacă prin Google Play Billing și Apple IAP. Stripe nu e o opțiune acolo.
- **Implementare corectă:** Verificarea chitanței se face **server-side**, direct la Google sau Apple, niciodată pe baza a ce raportează clientul. `purchases.provider` distinge canalul. Stripe rămâne valabil pentru platforma web, deci sunt două integrări, nu una. Comisionul magazinelor e 15–30%. Necesită firmă, cont de dezvoltator și politici de restituire înainte de activare.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, secțiunea Monetizare
- **Commit:** —
- **Depinde de:** SRV-075

---

## Grupa L · Moderare și notificări

#### SRV-079 · Raportare și moderare de chat
- **Status:** ✅ Implementat
- **Descriere:** Jucătorii raportează mesaje; rapoartele ajung într-o coadă cu prioritate.
- **Implementare corectă:** `ChatReport` cu instantaneu al conținutului, ca raportul să rămână verificabil și după ce mesajul efemer dispare. Rapoartele din DM și de la prieteni au prioritate mai mare: contextul privat face hărțuirea mai greu de observat din afară.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** SRV-066

#### SRV-080 · Antispam și mute automat
- **Status:** ✅ Implementat
- **Descriere:** Limitare de rată, filtru de limbaj, detectarea repetițiilor, mut temporar automat.
- **Implementare corectă:** Limitare Redis în global și în meci, mascarea profanității, `chat_muted_until` pus automat la depășire.
- **Finalizat:** anterior sesiunii curente
- **Sursă:** `docs/archive/owner-plan-progress.md` §2
- **Commit:** —
- **Depinde de:** SRV-066

#### SRV-081 · Contestații la sancțiuni
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător sancționat trebuie să poată contesta, iar contestația trebuie să ajungă undeva.
- **Implementare corectă:** `appeals(id, sanction_id, user_id, body, state, reviewed_by, reviewed_at, decision_note)`. Legată de `sanctions`, nu de cont — o contestație se referă la o sancțiune anume. O singură contestație activă per sancțiune.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §3
- **Commit:** —
- **Depinde de:** SRV-016

#### SRV-082 · Cutie poștală în joc
- **Status:** ⬜ De făcut
- **Descriere:** Mesaje de la sistem sau de la administrație, cu recompense atașate.
- **Implementare corectă:** `inbox_messages(id, user_id, subject_key, body_key, params jsonb, reward_bundle_id, expires_at, read_at, claimed_at)`. Textele sunt chei traduse, nu șiruri — altfel un mesaj în masă ajunge în română la toți. Recompensa se revendică o singură dată, idempotent.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Notifications
- **Commit:** —
- **Depinde de:** SRV-003, SRV-064

#### SRV-083 · Mesaj de la administrație către un jucător
- **Status:** ⬜ De făcut
- **Descriere:** Panoul trebuie să poată trimite un mesaj unui jucător, fără ca acesta să poată fi blocat sau filtrat ca un DM obișnuit.
- **Implementare corectă:** `ConversationType` primește valoarea `SYSTEM`. `POST /admin/players/:id/message` ocolește regulile de treaptă de încredere și de blocare — un mesaj de la administrație nu e o conversație între egali — dar scrie în audit cu textul în încărcătură. Aplicația îl afișează într-o filă separată, fără câmp de răspuns până când există o coadă de suport.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md` §1
- **Commit:** —
- **Depinde de:** SRV-024, SRV-066

#### SRV-084 · Notificări push
- **Status:** ⬜ De făcut
- **Descriere:** Reamintiri de serie, tura ta la un duel asincron, început de turneu, sfârșit de sezon.
- **Implementare corectă:** `push_tokens(user_id, token, platform, language_id, created_at, revoked_at)` și `notification_campaigns` pentru trimiterile în masă. Textul se compune din chei traduse, în limba contului. Frecvența e plafonată per jucător, iar dezabonarea per categorie e obligatorie. Necesită un furnizor configurat — decizie de infrastructură.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Notifications
- **Commit:** —
- **Depinde de:** SRV-003, SRV-011

---

## Grupa M · Operare, contracte, conformitate

#### SRV-085 · Contractul de API, generat din sursă
- **Status:** ⬜ De făcut
- **Descriere:** Trei fronturi consumă același API. Tipurile lor sunt azi scrise de mână și se pot dezacorda tăcut de server.
- **Implementare corectă:** Schemă OpenAPI generată din decoratorii NestJS, plus tipuri TypeScript generate din ea pentru web și panou, și modele Dart pentru aplicație. Generarea rulează în CI și **cade dacă tipurile comise diferă** de cele generate. Rezolvă problema reală din `web/client/src/lib/territory.ts`, care oglindește manual serverul.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 3
- **Commit:** —
- **Depinde de:** —

#### SRV-086 · Contractul de evenimente în timp real
- **Status:** 🟡 Parțial
- **Descriere:** Evenimentele Socket.IO nu apar în OpenAPI, dar sunt la fel de contractuale.
- **Implementare corectă:** Un fișier unic de definiții pentru evenimentele de pe `/game` și `/chat`, cu încărcăturile lor, din care se generează tipurile pentru toate cele trei fronturi. Versionat: un client vechi trebuie să primească un refuz clar, nu un comportament ciudat.
- **Finalizat:** —
- **Sursă:** `backend/realtime/src/game/game.types.ts`
- **Commit:** —
- **Depinde de:** SRV-085

#### SRV-087 · Origini permise, pe listă
- **Status:** ✅ Implementat
- **Descriere:** CORS și handshake-ul Socket.IO acceptă doar originile configurate.
- **Implementare corectă:** `WEB_APP_ORIGINS` ca listă separată prin virgulă, aplicată și pe API, și pe realtime. Când lista e goală, realtime refuză tot — comportamentul de dinaintea existenței web-ului.
- **Finalizat:** 2026-08-16
- **Sursă:** `backend/api/src/web-origins.ts`
- **Commit:** —
- **Depinde de:** —

#### SRV-088 · Ștergerea contului prin anonimizare
- **Status:** ⬜ De făcut
- **Descriere:** Cererea de ștergere e un drept legal. „Nu se șterge nimic" și dreptul la ștergere se împacă prin anonimizare, nu prin excepție.
- **Implementare corectă:** La cerere, cu o perioadă de grație configurabilă care permite anularea: identificatorii personali — e-mail, nume afișat, username, etichete de dispozitiv, hash-uri de IP, jetoane push — se elimină definitiv. Rândurile de istoric rămân, legate de un cont marcat anonim, cu statisticile intacte. Un meci jucat rămâne un meci jucat; nu mai are nume. Se scrie în audit și se raportează în panou. **Obligatoriu înainte de lansare.**
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682); `00-README.md`, regula 2
- **Commit:** —
- **Depinde de:** SRV-019, SRV-024

#### SRV-089 · Export de date la cerere
- **Status:** ⬜ De făcut
- **Descriere:** Dreptul la portabilitate: un jucător poate cere tot ce ține sistemul despre el.
- **Implementare corectă:** Generare asincronă a unei arhive cu profilul, istoricul de meciuri, tranzacțiile și mesajele proprii, livrată printr-un link cu durată scurtă. Nu se generează sincron: la un istoric de zeci de mii de meciuri, cererea ar expira.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Depinde de:** SRV-088

#### SRV-090 · Sarcini programate și coadă de joburi
- **Status:** ⬜ De făcut
- **Descriere:** Agregatele zilnice, rotațiile, închiderea sezoanelor, recalculările — toate au nevoie de un loc unde să ruleze și de o urmă.
- **Implementare corectă:** Coadă cu reîncercare și blocare, pe Redis. Fiecare rulare scrie start, sfârșit și rezultat, vizibile în ADM-060. Un job care eșuează de trei ori alertează, nu se reîncearcă la nesfârșit. Joburile trebuie să fie idempotente: o rulare dublă a agregării zilnice n-are voie să dubleze cifrele.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §6.8 (de la linia 272)
- **Commit:** —
- **Depinde de:** SRV-021

#### SRV-091 · Observabilitate și verificări de sănătate
- **Status:** 🟡 Parțial
- **Descriere:** Panoul afișează starea serviciilor, dar patru din șapte n-au sondă reală.
- **Implementare corectă:** Verificare de sănătate cu latență măsurată pentru fiecare serviciu — API, bază de date, Redis, realtime, matchmaking. Urmărirea erorilor cu grupare și alertă. Latența bazei se măsoară deja la fiecare încărcare a tabloului de bord; restul lipsesc.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Monitoring
- **Commit:** —
- **Depinde de:** —

#### SRV-092 · Steaguri de funcționalitate
- **Status:** ⬜ De făcut
- **Descriere:** Pornirea și oprirea unei funcții fără redeploy, inclusiv pentru un procent de jucători.
- **Implementare corectă:** `feature_flags(key, enabled, rollout_pct, params jsonb, updated_by, updated_at)` cu istoric al comutărilor. Citite cu cache scurt, ca o comutare să aibă efect în secunde. Necesare pentru lansarea graduală a modului Clasic și a web-ului jucabil.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Feature Flags
- **Commit:** —
- **Depinde de:** —

#### SRV-093 · Test de încărcare pe matchmaking și realtime
- **Status:** ⬜ De făcut
- **Descriere:** Prima beta deschisă nu e momentul potrivit să afli câți jucători simultani suportă serverul.
- **Implementare corectă:** Scenariu care simulează intrarea în coadă, formarea partidelor și rundele complete pentru un număr crescător de clienți, până la degradare. Se rulează înainte de fiecare fază de beta, cu rezultatul consemnat. Se măsoară și memoria Redis: starea partidelor active e ce se umple primul.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Depinde de:** SRV-040

#### SRV-094 · Separarea CI de release
- **Status:** ⬜ De făcut
- **Descriere:** Azi orice push pe `main` poate produce un release public.
- **Implementare corectă:** Un flux de verificări la pull request — analiză, teste, build — și un flux separat de release, pornit **doar** de un tag explicit. Analiza și testele blochează deja build-ul; ce lipsește e separarea declanșatorului.
- **Finalizat:** —
- **Sursă:** `docs/archive/project-audit-2026-08-16.md`, problema 4
- **Commit:** —
- **Depinde de:** —
