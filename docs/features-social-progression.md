# FEATURES-SOCIAL-PROGRESSION.md — QuizRealm
> Extensie detaliată a `plan.md`: sistem de login/înregistrare, chat cu protecție bazată pe activitate, achievements & badges (1000+), customizare avatar/profil (stil Discord), sistem de rank (20+ trepte).
> Inspirație combinată din: Discord, Xbox Live/PlayStation Network, Steam, League of Legends, Chess.com, Duolingo, Fortnite, Twitch.

**Status:** Draft v1 — se adaugă la roadmap-ul din `plan.md`
**Ultima actualizare:** 2026-08-15

---

## 1. Sistem de login & înregistrare

**Inspirat din:** Discord (username vs display name separate, verificare email obligatorie pentru anumite acțiuni), Steam (Steam Guard/2FA), Riot Games (verificare vârstă, un singur cont per persoană), Duolingo (mod invitat cu conversie ulterioară).

### 1.1 Metode de autentificare
- **Email + parolă** (obligatoriu, cont principal).
- **OAuth Google** (rapid, recomandat implicit).
- **Mod invitat/guest** — poți juca solo/antrenament fără cont, dar **multiplayer ranked, chat și cosmetice necesită cont creat**; progresul de guest se poate lega de un cont ulterior (o singură conversie, ca să nu se abuzeze de resetări).
- **2FA opțional (TOTP)** — recomandat pentru conturi cu cosmetice premium/rank înalt, ca la Steam Guard.

### 1.2 Identitate: username vs display name
- **Username** (handle unic, gen `@nume_utilizator`) — folosit pentru identificare unică, schimbabil rar (cooldown 30 zile, ca Discord).
- **Display name** — numele afișat în joc/chat, schimbabil liber, poate avea **stil custom** (vezi secțiunea 4.5) dacă e deblocat.

### 1.3 Verificare & anti-fraudă la înregistrare
- Verificare email obligatorie înainte de a accesa multiplayer ranked sau chat global.
- Captcha/verificare anti-bot la înregistrare (previne farm de conturi pentru manipulare leaderboard/moderare).
- Rate limiting pe IP/device pentru creări de cont în masă.
- Age gate simplu (dată naștere) — sub o vârstă minimă, cont cu restricții (fără chat liber, fără linkuri externe pe profil), aliniat cu bune practici de protecție a minorilor.
- Un cont = un dispozitiv+email verificat cu reguli de detecție a conturilor multiple abuzive (farm de conturi pentru achievements/rank).

### 1.4 Flux de recuperare
- Reset parolă prin email cu token expirabil (15-30 min).
- Recuperare cont prin suport dacă email-ul nu mai e accesibil (flux manual, nu automat, pentru siguranță).

---

## 2. Sistem de chat — global, prieteni și privat, cu protecție bazată pe activitate

**Inspirat din:** Discord (server public vs DM vs prieteni, niveluri de verificare, slow mode), Twitch (chat public cu sloweode), League of Legends (sistemul de Onoare care restricționează/deblochează privilegii sociale), Steam (chat de prieteni separat de chat de grup), platforme cu "karma gating" (Reddit-style) pentru postarea de linkuri.

### 2.1 Principiu general
Chat-ul **nu e deschis complet din prima secundă** — accesul crește progresiv pe măsură ce jucătorul demonstrează activitate reală (întrebări răspunse corect, nu doar timp petrecut). Peste acest principiu, există **trei scopuri de chat distincte**, fiecare cu reguli proprii de vizibilitate și risc:

| Scop | Cine participă | Nivel de risc | Model |
|---|---|---|---|
| **Global** | Oricine din lobby/camera publică | Ridicat (străini, spam, abuz) | many-to-many, efemer |
| **Prieteni** | Doar conexiuni mutuale acceptate | Scăzut (consimțământ reciproc) | 1:1 sau grup de prieteni, persistent |
| **Privat (DM)** | Orice doi jucători, chiar dacă nu sunt prieteni | Mediu-ridicat (necunoscuți în 1:1) | 1:1, persistent, opt-in per utilizator |

### 2.2 Chat global
- Camere publice de lobby/matchmaking (eventual sharded pe limbă/regiune, ca să nu devină un singur flux ilizibil).
- **Doar text efemer** (nu se salvează istoric pe termen lung, reduce suprafața de risc și volumul de moderare retroactivă).
- Complet supus treptelor de încredere din secțiunea 2.4 — cel mai strict dintre cele trei scopuri, pentru că expune la necunoscuți fără niciun filtru de relație.
- **Fără linkuri sau imagini sub T3**, fără DM-uri inițiate direct din chat-ul global (previne "vânătoarea" de conturi noi de către escroci).

### 2.3 Chat de prieteni
- Necesită mai întâi **conexiune de prietenie mutuală** (cerere trimisă + acceptată — flux identic cu Steam/Discord: `pending → accepted`, cu opțiune de refuz/blocare).
- Conversații **persistente** (istoric păstrat, ca orice chat de mesagerie modernă), 1:1 sau grup mic de prieteni.
- Praguri de încredere mai relaxate decât la global (link-uri/imagini permise mai devreme, pentru că relația e deja consimțită reciproc), dar **filtrul de profanitate și raportarea rămân active** — consimțământul între prieteni nu elimină nevoie de protecție împotriva unui prieten care devine abuziv.
- Status de prezență (online/în meci/offline) vizibil doar prietenilor, ca la Discord/Steam.

### 2.4 Chat privat (mesaje directe către necunoscuți)
- Permite trimiterea unui mesaj direct către **orice jucător**, nu doar prieteni — dar e cel mai sensibil canal, deci are protecții suplimentare față de chat-ul de prieteni:
  - **Setare de confidențialitate per utilizator** (ca la Discord "Who can send you a DM"): `Oricine` / `Doar prieteni` / `Nimeni` — implicit **`Doar prieteni`** pentru conturi noi și **obligatoriu `Doar prieteni` pentru conturi cu age-gate de minor** (nu se poate schimba manual la `Oricine`).
  - Necesită minim treapta **T2** de încredere (secțiunea 2.5) pentru a iniția un DM privat către un necunoscut — un cont abia creat nu poate trimite mesaje directe la necunoscuți.
  - Primul mesaj dintr-un DM necunoscut poate ajunge într-o **coadă de tip "cerere de mesaj"** (ca Instagram/Discord "Message Requests") — destinatarul acceptă/respinge/blochează înainte ca firul să devină conversație normală.
  - Rate limiting mai strict decât la chat de prieteni (previne spam în masă către necunoscuți).

### 2.5 Trepte de încredere (trust tiers), bazate pe activitate

Cu o bancă de 50.000-100.000+ întrebări, un jucător activ poate acumula ușor zeci de mii de răspunsuri corecte pe termen lung — 5 trepte s-ar epuiza prea repede și ar lăsa jucătorii veterani fără progres perceptibil. Extindem la **9 trepte**, cu creștere logaritmică a pragurilor, ca progresul să rămână semnificativ și la mii de ore de joc:

| Treaptă | Prag (întrebări răspunse **corect**, cumulativ) | Global | Prieteni | DM către necunoscuți | Alte privilegii |
|---|---|---|---|---|---|
| **T0 — Nou** | 0–9 | Doar reacții/emote presetate | Chat text complet | Nepermis | — |
| **T1 — Ucenic** | 10–49 | Chat text în partidele proprii | Chat text complet | Nepermis | — |
| **T2 — Contribuitor** | 50–199 | + Chat în lobby-uri publice | + Linkuri/imagini | Poate iniția (cu coadă de "cerere de mesaj") | — |
| **T3 — Stabilit** | 200–999 | + Linkuri filtrate, camere publice cu nume custom | — | Rate limit relaxat | — |
| **T4 — Experimentat** | 1.000–4.999 | + Imagini/GIF-uri, canale de comunitate (propuneri întrebări) | — | — | Rapoartele lui au greutate ușor mai mare la moderare |
| **T5 — Expert** | 5.000–14.999 | + Poate crea sondaje rapide în chat public | — | — | Acces la canale de feedback beta pentru feature-uri noi |
| **T6 — Maestru al comunității** | 15.000–49.999 | + Poate seta temă/culoare pentru camerele publice proprii | — | — | Prioritate redusă la timpul de răspuns al suportului |
| **T7 — Elite** | 50.000–99.999 | — | — | — | Status de "raportor de încredere" (rapoartele lui pot declanșa acțiune automată mai rapidă), acces la program de ambasadori/preview features |
| **T8 — Legendă a comunității** | 100.000+ | — | — | — | Badge unic exclusiv, vizibil pe listă publică de "veterani"; poate participa la un consiliu consultativ de comunitate (vot pe propuneri minore de feature-uri) |

- Pragurile sunt configurabile (nu hardcodate în client) — ajustabile din admin panel după observarea comportamentului real la lansare, și pot fi recalibrate pe măsură ce banca de întrebări crește spre 100.000+.
- Trecerea de la T4 în sus nu mai deblochează restricții de bază (acelea sunt deja deblocate la T3) — devine în schimb un **sistem de prestigiu social** (recunoaștere, nu doar acces), corelat cu Prestige Score-ul din sistemul de achievements (secțiunea 3.3).
- Validarea răspunsurilor corecte care contează pentru progres e făcută **exclusiv server-side**, la fel ca la calculul de scor (vezi `agents.md` secțiunea 3, `backend/realtime`) — nu se poate ocoli prin exploit-uri client-side.

### 2.6 Protecții comune (aplicate pe toate cele trei scopuri)
- **Rate limiting mesaje**, cu praguri diferite per scop (cel mai strict la global și DM necunoscuți).
- **Filtru de limbaj/profanitate**, extensibil pentru română + engleză.
- **Detecție automată de spam** (mesaje identice repetate, flood de linkuri) → mute automat temporar.
- **Raportare + moderare**: rapoarte confirmate → timeout automat, apoi review manual pentru interdicții mai lungi; rapoartele din DM/prieteni au prioritate mai mare la review (context privat, risc de hărțuire mai greu de observat extern).
- **Shadow-ban** pentru abuzatori recidivi la chat global.
- **Block per utilizator**, valabil universal (odată blocat, blocarea se aplică pe toate cele trei canale simultan).
- **Minorii (age-gate activ)**: fără chat global text liber (doar reacții/emote presetate indiferent de treaptă), DM restricționat obligatoriu la `Doar prieteni`, ca măsură de protecție implicită.

### 2.7 Sistem de prietenie (necesar pentru 2.3)
- Cerere de prietenie: `pending → accepted / declined / blocked`.
- Listă de prieteni cu status de prezență, opțiune de a vedea "ce joacă acum" (ca Discord/Steam), respectând setarea de confidențialitate a profilului (secțiunea 4.9).
- Sugestii de prieteni pe baza jucătorilor întâlniți recent în partide (opt-in, nu automat).

### 2.8 Note tehnice
- Toate cele trei scopuri merg prin același serviciu `backend/realtime` (Socket.IO), dar pe **namespace-uri/canale separate** (`chat:global`, `chat:friends`, `chat:dm`) — documentate în `backend/realtime/EVENTS.md`, conform `agents.md`.
- Chat-ul global e efemer (nu persistă în Postgres, doar log temporar pentru moderare/rapoarte); chat-ul de prieteni și DM-urile sunt persistente (tabel `messages`, cu paginare la citire istoric).
- Treapta de încredere se recalculează server-side la fiecare partidă terminată (progres live, feedback imediat jucătorului: "mai ai X răspunsuri corecte până deblochezi chat-ul global").

### 2.9 Model de date (extensie)

```
friendships: user_id_a, user_id_b, status (pending|accepted|blocked), requested_by, created_at
conversations: id, type (friend|dm_request|dm_accepted), created_at
conversation_participants: conversation_id, user_id, joined_at
messages: id, conversation_id (nullable pt. global), scope (global|friend|dm), sender_id, content, created_at, flagged (bool)
user_privacy_settings: user_id, dm_permission (everyone|friends_only|nobody), profile_visibility, is_minor (derivat din age-gate, read-only)
chat_reports: id, message_id, reporter_id, reason, created_at, resolution
```

---

## 3. Sistem de achievements & badges (1000+)

**Inspirat din:** Xbox Achievements/Gamerscore, PlayStation Trophies (bronze/silver/gold/platinum), Steam Achievements, Genshin Impact (900+ achievements prin design parametrizat), Duolingo (badges pentru streak/milestone), Chess.com.

### 3.1 De ce 1000+ nu înseamnă 1000 de design-uri unice manuale
Ca la Genshin/jocuri mobile mari, volumul se atinge prin **template-uri parametrizate**, nu prin scriere manuală una câte una. Un template + o listă de valori = zeci/sute de achievements generate sistematic, fiecare cu text/badge generat din același tipar.

### 3.2 Categorii de achievements (cu estimare de volum)

| Categorie | Template | Exemplu de instanțiere | Volum estimat |
|---|---|---|---|
| **Cunoștințe per categorie** | "Răspunde corect la N întrebări din categoria X" | N ∈ {10, 50, 100, 500, 1000, 5000} × ~25 categorii/subcategorii | ~150 |
| **Precizie per categorie** | "Atinge X% acuratețe (min. N partide) în categoria Y" | X ∈ {70, 85, 95, 100} × 25 categorii | ~100 |
| **Streak-uri de răspunsuri corecte** | "N răspunsuri corecte consecutive" | N ∈ {5,10,25,50,100,250} | ~10 (globale) + variante per mod |
| **Streak-uri zilnice de joc** | "Joacă N zile consecutive" | N ∈ {3,7,14,30,60,100,365} | ~10 |
| **Victorii per mod de joc** | "Câștigă N partide în modul M" | N ∈ {1,10,50,100,500,1000} × 4 moduri | ~24 |
| **Comeback / performanță** | "Câștigă o partidă după ce ai fost sub X% teritoriu" | praguri multiple | ~15 |
| **Viteză de răspuns** | "Răspunde corect în sub X secunde, de N ori" | X ∈ {2,3,5} × N ∈ {10,50,200} | ~30 |
| **Rank/progres competitiv** | "Atinge rank-ul R pentru prima dată" | 20+ rank-uri (secțiunea 5) | 20+ |
| **Social** | "Adaugă N prieteni", "Joacă N partide cu prieteni", "Trimite N mesaje de chat deblocat" | praguri multiple | ~20 |
| **Colecție cosmetice** | "Deblochează N cosmetice", "Deblochează un set complet (avatar+ramă+banner)" | praguri + seturi tematice | ~80 |
| **Comunitate/contribuție** | "Propune N întrebări aprobate", "Primește N like-uri pe întrebările propuse" | praguri multiple | ~15 |
| **Explorare** | "Joacă cel puțin o partidă în fiecare mod", "Testează toate categoriile o dată" | fix | ~10 |
| **Sezoniere/evenimente** | "Participă la evenimentul sezonier X" | recurente, câte 10-20 per sezon, cresc continuu în timp | 20+ per sezon (nelimitat pe termen lung) |
| **Secrete/ascunse** | Condiții neobișnuite, dezvăluite doar la deblocare (ca "easter eggs") | ~50 la lansare, se adaugă continuu | 50+ |
| **Meta-achievements** | "Deblochează N achievements în total", "Deblochează toate achievements-urile dintr-o categorie" | praguri | ~30 |

**Total estimat la lansare: ~1000-1200**, cu creștere continuă prin conținut sezonier (fără efort de design unic per item — doar populare de template existent cu parametri noi).

### 3.3 Rarități & puncte de prestigiu
- Fiecare achievement are o **raritate**: Comun / Rar / Epic / Legendar / Mitic (ca la loot systems moderne — Fortnite/mobile gacha), calculată automat din % de jucători care l-au deblocat (recalculat periodic), nu setată manual.
- Fiecare achievement dă **puncte de prestigiu** (echivalent Gamerscore/Trophy points) — sumă totală afișată pe profil ca "Prestige Score", separată de ELO (unul măsoară skill competitiv, altul măsoară implicare/completitudine).

### 3.4 Badges & afișare pe avatar
- Cele mai rare/importante achievements devin **badge-uri** afișabile lângă avatar (ca badge-urile Discord sub username, sau trofeele PSN pe lângă gamertag) — max 3 sloturi vizibile simultan, alese de jucător.
- **Showcase de profil**: jucătorul își alege manual un top (ex: 5-6 achievements) de afișat pe pagina de profil (ca Steam showcase), independent de badge-urile de lângă avatar.
- Badge-uri de rank (secțiunea 5) sunt distincte de badge-urile de achievement, dar folosesc același sistem vizual de sloturi.

### 3.5 Model de date (extensie la schema din `plan.md` secțiunea 4)

```
achievement_templates: id, template_key, category, param_schema (JSON), title_template, description_template, badge_asset_template, points_base
achievements: id, template_id, params (JSON, ex: {"category":"istorie","threshold":100}), title (rezolvat), description (rezolvat), rarity (recalculat periodic), points, is_hidden
user_achievements: user_id, achievement_id, unlocked_at, progress_current, progress_target
user_badge_slots: user_id, slot_index (0-2), achievement_id (nullable)
user_profile_showcase: user_id, position, achievement_id
```

### 3.6 Notă tehnică pentru agenții de implementare
Nu genera 1000 de rânduri manual în migrare. Implementează **`achievement_templates`** + un job `expand-achievement-templates` care le instanțiază automat din parametri (similar structural cu `generate-questions` din `init.md`). Progresul (`progress_current`) se actualizează din aceleași evenimente de joc deja emise de `backend/realtime` (nu duplica logică de tracking separată per achievement).

---

## 4. Customizare avatar & profil (stil Discord)

**Inspirat din:** Discord (avatar decorations, banner, About Me, connections, custom status), PlayStation Network (teme de profil), Xbox (gamerpic + clan tag), Steam (artwork showcase, nivel de profil), Twitter/X (bio + linkuri).

### 4.1 Avatar
- **Avatare presetate** ilustrate, tematice (deblocabile prin achievements, rank, magazin cu monedă câștigată în joc).
- **Upload avatar custom** (imagine proprie) — trece prin **moderare automată** (detecție conținut nepotrivit) înainte de a fi vizibilă public.
- **Rame de avatar (avatar frames/decorations)** — overlay vizual peste avatar, unele animate (deblocate din achievements rare, rank înalt, evenimente sezoniere) — mecanică identică cu "Avatar Decorations" din Discord.

### 4.2 Banner de profil
- Imagine/gradient afișat în partea de sus a paginii de profil, deblocabil similar cu avatarul (presetate + eventual custom upload moderat pentru trepte superioare).

### 4.3 Bio / "Despre mine"
- Câmp de text scurt (ex: max 200 caractere), fără formatare complexă (evită vector de abuz), filtrat de același sistem de profanitate ca la chat.

### 4.4 Status custom
- Text scurt + emoji opțional (ex: "Antrenez pentru sezonul nou 🔥"), similar statusului custom din Discord — persistent sau cu expirare setabilă de jucător.

### 4.5 Stil nume afișat
- Culoare/gradient de nume deblocabil (ca numele colorate Nitro din Discord sau numele stilizate din unele MOBA-uri pe baza de rank/achievement).
- Titlu/prefix opțional afișat lângă nume (ex: derivat din rank sau dintr-un achievement ales — "Marele Erudit", vezi secțiunea 5), similar titlurilor din MMO-uri sau Chess.com.

### 4.6 Linkuri & informații
- Secțiune de linkuri externe (social media, website personal) — **fiecare link trece prin verificare/blacklist de domenii** înainte de a fi salvat, ca protecție anti-phishing (deblocată abia de la treapta T3 de încredere din secțiunea 2, ca să nu fie vector de spam pentru conturi noi).

### 4.7 Conexiuni la alte platforme (gaming connections)
- Legare cont **PlayStation Network, Xbox Live, Steam, Discord** (și eventual Epic/Twitch mai târziu) prin OAuth unde e disponibil, afișate ca iconițe verificate pe profil — exact ca secțiunea "Connections" din Discord.
- La MVP: doar **afișare de identitate verificată** (badge/iconiță pe profil), fără integrare gameplay cross-platform — extensii ulterioare (ex: statistici cross-game) sunt out-of-scope inițial.

### 4.8 Temă/personalizare pagină de profil
- Culoare de accent a paginii de profil, eventual fundal/textură deblocabile — nu un editor complex, ci un set curat de opțiuni presetate (ca temele de profil PSN), pentru a păstra coerența vizuală a design system-ului din `plan.md` secțiunea 7.

### 4.9 Confidențialitate
- Control per secțiune: profil public / doar prieteni / privat — pentru conexiuni externe, statistici detaliate și listă de prieteni, aliniat cu practicile standard din rețelele sociale moderne.

### 4.10 Model de date (extensie)

```
user_profile: user_id, bio, status_text, status_emoji, banner_id, name_style_id, name_title_achievement_id (nullable), theme_accent_id, visibility (public|friends|private)
user_avatar: user_id, avatar_asset_id (nullable, dacă presetat), custom_avatar_url (nullable, dacă upload), frame_id (nullable)
user_links: user_id, label, url, verified (bool)
user_external_connections: user_id, provider (psn|xbox|steam|discord|...), external_display_name, verified_at
```

---

## 5. Sistem de rank (minim 20 trepte)

**Inspirat din:** League of Legends (Iron→Challenger, divizii), Chess.com/Lichess (titluri bazate pe rating), Valorant/CS2 (trepte + subtrepte), Rocket League/Clash Royale (ligi/arene).

### 5.1 Structură propusă — temă "cunoaștere/erudiție" specifică jocului (nu copiată din alte jocuri)

24 de trepte = 8 ranguri majore × 3 diviziuni (I–III), suficient de granular pentru progres perceptibil, peste minimul de 20 cerut:

| Rang major | Diviziuni | Interval ELO orientativ |
|---|---|---|
| 1. Novice | I–III | 0–599 |
| 2. Ucenic | I–III | 600–999 |
| 3. Cercetător | I–III | 1000–1399 |
| 4. Erudit | I–III | 1400–1799 |
| 5. Sofist | I–III | 1800–2199 |
| 6. Filosof | I–III | 2200–2599 |
| 7. Oracol | I–III | 2600–2999 |
| 8. Mare Maestru | — (fără diviziuni, top absolut) | 3000+ |
| **Legendă** (titlu unic, doar Top 100 global, recalculat live) | — | dinamic |

= **23 trepte fixe + 1 treaptă dinamică de vârf** = 24 total, peste minimul de 20.

### 5.2 Mecanică
- **ELO ascuns** ca bază de calcul (formulă standard, K-factor mai mare la începutul contului pentru convergență rapidă, apoi stabilizare), afișat public doar ca **rang + diviziune**, nu ca număr brut (reduce presiunea de "număr exact", ca la League/Valorant).
- **Meciuri de plasare** (5-10 partide) la primul acces în modul ranked, pentru a calibra rapid ELO-ul inițial.
- **Promovare/retrogradare** între diviziuni pe baza unei serii scurte de confirmare la prag (evită fluctuații pe un singur meci norocos/ghinionist).
- **Reset sezonier parțial** (soft reset — rangul coboară cu câteva trepte la început de sezon, nu la zero), cu recalibrare rapidă în primele meciuri ale sezonului — mecanică standard în jocurile competitive citate mai sus.
- **Decay la inactivitate** doar pentru treptele superioare (Oracol+), pentru a păstra semnificația rangurilor de vârf.
- **Recompense per rang** — cosmetice unice (ramă de avatar, titlu de nume) deblocate **prima dată** când atingi un rang, plus recompense sezoniere pe baza rangului final la închiderea sezonului (ca la LoL/Valorant end-of-season rewards).

### 5.3 Afișare
- Iconiță de rang lângă avatar/nume în toate contextele (profil, lobby, meci) — coerentă cu badge-urile de achievement, dar vizual distinctă (ca insigna de rang separată de trofee în PSN/Xbox).
- Leaderboard global + leaderboard per rang/diviziune + leaderboard de prieteni (ca la Duolingo — comparație socială mai motivantă decât un singur clasament global anonim).

### 5.4 Model de date (extensie)

```
rank_tiers: id, major_rank (1-8), division (1-3 sau null pt. treapta 8), name, elo_min, elo_max, icon_asset
user_rank: user_id, current_elo, current_tier_id, season_id, peak_tier_id_this_season, placement_matches_completed
seasons: id, name, starts_at, ends_at, soft_reset_applied
```

---

## 7. Sisteme suplimentare de retenție & engagement

**Obiectiv:** un jucător nou trebuie să fie "prins" din primele minute, iar unul vechi trebuie să aibă un motiv să revină zilnic, nu doar să joace sporadic. Inspirație combinată din Duolingo (streak-uri, misiuni zilnice), Clash Royale/Fortnite (battle pass, evenimente sezoniere), Clash of Clans (clanuri), Chess.com (analiză post-partidă, coaching).

### 7.1 Recompense zilnice & streak de logare
- Calendar de recompense zilnice (monedă, cosmetice minore, bilete de eveniment) — cresc pe măsură ce streak-ul de zile consecutive crește, cu recompensă "mare" la pragurile de 7/30/100 zile.
- Streak-ul are un mic "grace period" (1 zi de protecție/lună, cumpărabilă cu monedă sau inclusă la VIP — secțiunea 8.3) ca să nu frustreze jucătorii care ratează o zi din motive reale, spre deosebire de sistemele dure care resetează instant.

### 7.2 Misiuni zilnice & săptămânale (quests)
- 3-5 misiuni zilnice ("răspunde corect la 15 întrebări de istorie", "câștigă 2 partide Blitz") + 1-2 misiuni săptămânale mai ample, cu recompense în monedă/XP/bilete de battle pass.
- Misiunile rotesc automat din același sistem de template-uri parametrizate descris la achievements (secțiunea 3.1) — nu necesită conținut unic per misiune.

### 7.3 Nivel de cont (Account XP) — progres separat de rank
- XP acumulat din orice activitate (nu doar victorii — participarea contează), cu niveluri de cont (1, 2, 3…) care deblochează recompense cosmetice fixe la anumite praguri — progres constant pentru toată lumea, inclusiv jucătorii care nu urcă rapid în rank competitiv.

### 7.4 Clanuri / Echipe
- Grupuri de jucători (nume, emblemă custom, chat de clan — extensie a scopului "prieteni" din secțiunea 2), cu **clasament de clan** și **provocări săptămânale de clan** (suma de întrebări corecte a membrilor, victorii colective).
- Recompense de clan (cosmetice exclusive de clan, emblemă animată) motivează coeziune sociala și retenție de grup — jucătorii revin ca să nu-și dezamăgească echipa, unul dintre cei mai puternici factori de retenție cunoscuți în jocurile live-service.

### 7.5 Analiză post-partidă & coaching
- La finalul unei partide: breakdown vizual (unde ai pierdut teren, la ce categorii ai fost slab, timp mediu de răspuns), similar rapoartelor post-joc din Chess.com — transformă o înfrângere într-un motiv de revenire ("data viitoare știu la ce să lucrez"), nu doar frustrare.
- Opțional, fază ulterioară: **sistem de mentorat** — jucători cu rank/prestige înalt pot fi listați ca "disponibili pentru coaching" pentru novici, fără schimb de bani (social feature, crește retenția veteranilor care capătă un rol nou în comunitate).

### 7.6 Evenimente sezoniere & tematice
- Categorii/hărți/skinuri disponibile temporar (ex: "Săptămâna Istoriei", "Weekend de Sport") cu achievements și cosmetice exclusive perioadei — creează urgență și motiv recurent de revenire, aliniat cu conținutul sezonier deja planificat la achievements (secțiunea 3.2).

### 7.7 Onboarding orientat spre "primul WOW"
- Primele 2-3 partide sunt împotriva unor boți calibrați să lase jucătorul să simtă senzația de cucerire/victorie devreme (fără să fie evident trucat), cu tutorial minimal integrat în joc, nu ecrane statice — obiectiv: primul moment de satisfacție să apară în primele 3-5 minute de la instalare, nu după 15 minute de setup.
- Recompensă de bun venit vizibilă imediat (cosmetic exclusiv "Fondator"/primele X zile de la lansare) — creează atașament emoțional timpuriu.

### 7.8 Notificări inteligente de re-engagement
- Push notification pentru: streak pe cale să se rupă, misiune zilnică neterminată aproape de expirare, prieten care tocmai a intrat online, sezon de battle pass aproape de final — toate cu frecvență limitată și configurabile de jucător (evită oboseala de notificări, care distruge retenția pe termen lung dacă e abuzată).

---

## 8. Monetizare extinsă — cheltuieli cu bani reali

**Principiu de bază (păstrat din `plan.md` secțiunea 9): fără pay-to-win.** Toate sistemele de mai jos sunt cosmetice, de confort sau de conținut adițional — niciodată avantaj competitiv plătit (dificultatea întrebărilor și șansele de câștig rămân identice, indiferent cât cheltuie cineva).

> **Notă:** evită mecanici de tip loot box/pachet cosmetic aleatoriu plătit cu bani reali — sunt reglementate sau interzise în mai multe țări (inclusiv pentru minori) și cresc riscul legal/de reputație. Recomandarea de mai jos e pe **cumpărare directă și battle pass** (conținut vizibil, preț fix), nu pe randomizare plătită. Aceasta nu e consultanță juridică — o verificare legală per piață de lansare rămâne necesară înainte de activare.

### 8.1 Monedă duală
- **Monedă moale (coins)** — câștigată prin joc (partide, misiuni, streak), folosită pentru cosmetice de bază și intrări în anumite evenimente.
- **Monedă tare (gems)** — cumpărată cu bani reali (pachete de valoare crescândă, cu bonus la pachetele mari, model standard mobile), folosită pentru cosmetice premium, battle pass, sloturi extra de clan/prieteni.

### 8.2 Battle Pass sezonier
- Sezon de ~6-8 săptămâni (aliniat cu resetul sezonier de rank din secțiunea 5.2), cu o linie gratuită de recompense + o linie premium cumpărabilă cu gems.
- Recompensele premium sunt **exclusiv cosmetice** (avataruri, rame, bannere, emote-uri, titluri de nume) + monedă moale bonus — nu conținut care afectează gameplay.
- Cel mai previzibil și mai bine acceptat model de monetizare recurentă din jocurile live-service actuale (Fortnite, Clash Royale, COD Mobile) — venit constant, fără percepția de "plătești ca să câștigi".

### 8.3 Abonament VIP/Premium (recurent lunar)
- Beneficii non-competitive: XP boost (progres mai rapid la nivel de cont, nu la ELO), grace period suplimentar la streak, badge exclusiv de abonat, slot suplimentar de showcase pe profil, prioritate ușoară la matchmaking în camere private, acces anticipat la conținut sezonier cosmetic.
- Model similar Discord Nitro / Xbox Game Pass — venit recurent previzibil, complementar battle pass-ului (nu-l înlocuiește).

### 8.4 Magazin de cosmetice cu cumpărare directă
- Avataruri, rame, bannere, efecte de nume, emote-uri/reacții animate în chat — toate cumpărabile direct cu gems, la preț fix, vizibile în întregime înainte de cumpărare (fără randomizare).
- Rotație periodică a magazinului (ca la Fortnite) pentru senzație de noutate constantă și FOMO controlat, fără presiune de tip gambling.

### 8.5 Pachete tematice de întrebări (conținut adițional)
- Pachete de categorii premium (ex: "Film & Serii Internaționale", "Sport de Elită") cumpărabile cu bani reali, disponibile pentru **modurile solo/antrenament și camere private** — nu afectează matchmaking-ul ranked (care rămâne pe banca standard, gratuită, pentru fairness).
- Monetizează valoarea conținutului masiv de întrebări construit conform `plan.md` secțiunea 5, fără să introducă avantaj competitiv.

### 8.6 Personalizare de clan cu bani reali
- Embleme/bannere animate de clan, teme de chat de clan — cumpărabile de liderul de clan, vizibile pentru toți membrii (motivează upgrade colectiv, similar cosmeticelor de clan din Clash of Clans).

### 8.7 Fondator / early adopter (o singură dată, la lansare)
- Pachet unic "Fondator" (cosmetice exclusive, imposibil de obținut ulterior) pentru primii jucători care cumpără orice sumă în primele X săptămâni de la lansare — creează urgență autentică fără presiune predatorie (o singură achiziție, nu recurentă).

### 8.8 Protecții pentru cheltuieli reale (obligatorii, nu opționale)
- **Limite de cheltuială configurabile** de jucător (self-imposed spending limits), afișate clar înainte de orice achiziție.
- **Conturi de minori** (din age-gate, secțiunea 1.3): achiziții cu bani reali blocate sau necesită confirmare/control parental explicit, conform reglementărilor locale de protecție a minorilor pentru achiziții in-app.
- Istoric de achiziții accesibil integral din profil, fără costuri ascunse sau conversii neclare între monedă moale/tare/preț real.

### 8.9 Model de date (extensie)

```
wallets: user_id, coins_balance, gems_balance
transactions: id, user_id, type (purchase|earn|spend), currency (coins|gems|real_money), amount, item_id (nullable), created_at
battle_pass_seasons: id, season_id, starts_at, ends_at, free_track_rewards (JSON), premium_track_rewards (JSON)
user_battle_pass: user_id, season_id, tier_current, xp_current, premium_unlocked (bool)
shop_items: id, type, price_gems, price_real (nullable, pt. pachete de gems), available_from, available_until (nullable)
subscriptions: user_id, plan (vip_monthly), status, renews_at
spending_limits: user_id, monthly_limit_real_money (nullable), parental_control_active (bool)
```

---

## 9. Integrare în roadmap-ul din `plan.md`

Aceste 5 sisteme **nu sunt Faza 0-2** (care rămân concentrate pe gameplay + multiplayer de bază, conform `plan.md`). Se integrează astfel:

| Sistem | Fază recomandată |
|---|---|
| Login & înregistrare (versiune de bază: email/parolă + Google) | **Faza 0** — necesar de la început, nu se amână |
| Login avansat (2FA, guest mode, age gate complet) | Faza 4 (polish) |
| Chat de bază — global (fără trepte de încredere, doar în meci) | Faza 2 (odată cu multiplayer) |
| Chat complet — global cu 9 trepte + prieteni + DM cu protecții | Faza 3 (în paralel cu conținutul/moderarea) |
| Sistem de prietenie (cereri, listă, prezență) | Faza 3, necesar înainte de chat de prieteni |
| Achievements — sistem tehnic (templates + tracking) | Faza 3 |
| Achievements — populare completă la 1000+ | Faza 4-5 |
| Customizare avatar/profil de bază (avatar+username) | Faza 0-1 |
| Customizare avatar/profil completă (ramă, banner, conexiuni, linkuri) | Faza 4 |
| Sistem de rank | Faza 2 (ELO de bază există deja acolo conform `plan.md`) → extins la 24 de trepte vizuale în Faza 4 |
| Recompense zilnice & streak, misiuni zilnice/săptămânale | Faza 3-4 (retenție, în paralel cu polish-ul UI) |
| Nivel de cont (Account XP) | Faza 3, folosește aceleași evenimente ca achievements |
| Clanuri/Echipe | Faza 5 (feature social avansată, după ce baza socială e stabilă) |
| Analiză post-partidă & coaching | Faza 4 |
| Evenimente sezoniere & tematice | Faza 5-6, recurent post-lansare |
| Monedă duală (coins/gems) + magazin cosmetice | Faza 4, pregătire infrastructură de plăți |
| Battle Pass sezonier | Faza 5, aliniat cu primul sezon de rank |
| Abonament VIP/Premium | Faza 5-6 |
| Pachete tematice de întrebări (DLC) | Faza 5-6 |
| Protecții cheltuieli reale (limite, control parental) | **Obligatoriu înainte de orice achiziție reală activă** — implementat odată cu 8.1-8.4, nu ulterior |

**Notă pentru agenți de implementare:** actualizează `plan.md` secțiunea 10 (Roadmap) și secțiunea 4 (Modele de date) pentru a referenția acest fișier, în loc să dublezi conținutul acolo.