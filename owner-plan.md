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

### 1.5 Gestionare sesiuni & legătură cu Admin Panel (pregătit pentru extensie web)
- **JWT access token (scurt, ex: 15 min) + refresh token (lung, ex: 30 zile, revocabil)** — model standard, permite deconectare forțată instantă a unui cont (necesar pentru acțiunile de ban/reset din admin panel, secțiunea 13) fără să aștepte expirarea naturală a unui token lung.
- **Sesiuni active listate pe cont** (dispozitiv, dată ultimei activități, aproximativ locație din IP) — jucătorul își poate revoca manual sesiunile de pe alte dispozitive, ca la orice cont modern (Google/Discord).
- Autentificarea e construită **independent de platformă** de la început (API REST + JWT, nu o soluție legată de SDK-ul mobil) — exact ca să poată fi refolosită neschimbată când aplicația se extinde pe **website** (secțiunea 13), fără rescriere de auth.
- Orice acțiune administrativă asupra unui cont (ban, resetare parolă forțată, ștergere) invalidează **imediat** toate sesiunile active ale acelui cont, prin revocarea refresh token-urilor din baza de date — legătură directă cu modulul de management utilizatori din Admin Panel (secțiunea 13.2).

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

## 6. Turnee — individuale & de guildă

**Inspirat din:** Clash of Clans (Clan Wars — competiție colectivă între guilde pe un obiectiv comun), Fortnite/COD Mobile (turnee cu bracket, faze de calificare), League of Legends Clash (turnee pe echipe organizate în weekend-uri fixe), Chess.com (Arena tournaments cu clasament live pe durată fixă).

### 6.1 Două tipuri de turnee, structuri diferite

| Tip | Participanți | Format | Frecvență |
|---|---|---|---|
| **Turneu individual** | Jucători singuri, înscriere liberă | Bracket cu eliminare sau Arena (clasament live pe durată fixă) | Săptămânal (mic) + lunar (mare, cu premii serioase) |
| **Turneu de guildă (Clan War)** | Guilde întregi (echipe de 10-50 membri, vezi 7.4) | Scor colectiv acumulat de membri într-o fereastră de timp | Săptămânal, cu sezon de "ligă de guilde" pe termen lung |

### 6.2 Turnee individuale — format Bracket
- Înscriere liberă (gratuită sau cu bilet de intrare din monedă moale/premium — vezi secțiunea 9), cu prag minim de rank sau skill rating pentru turneele "competitive" (evită dezechilibre; turneele "casual" rămân deschise tuturor).
- Bracket cu eliminare directă (16/32/64 jucători), meciuri Duo (1v1) sau FFA mici (4 jucători), programate pe sloturi orare fixe, cu notificare de reamintire.
- Clasament de avansare vizibil live, ca la orice bracket de eSports — creează spectacol și motiv de a urmări chiar și după eliminare (mod spectator, secțiunea 12.6).

### 6.3 Turnee individuale — format Arena (fără eliminare)
- Fereastră de timp fixă (ex: 48h), scor cumulat din toate partidele jucate în acea fereastră, clasament live actualizat după fiecare meci — inspirat direct din "Arena Tournaments" de pe Chess.com.
- Nu elimină pe nimeni — accesibil pentru jucători ocazionali care nu vor presiunea unui bracket cu eliminare, dar tot oferă competiție reală și recompense scalate pe poziția finală în clasament.

### 6.4 Turnee de guildă (Clan Wars)
1. **Fază de pregătire** (ex: 24h) — liderul de guildă activează participarea, membrii se pregătesc (fără presiune de scor încă).
2. **Fază de război** (ex: 48-72h) — fiecare membru contribuie la scorul colectiv al guildei jucând partide (puncte per victorie, bonus per streak, bonus per categorie stăpânită), similar mecanicii de "atacuri" din Clash of Clans, dar adaptată la mecanica de trivia: fiecare partidă jucată de un membru în această fereastră contribuie automat la scorul de război, nu necesită o acțiune separată de "atac".
3. **Sistem de perechi guildă-vs-guildă**: guildele sunt potrivite în perechi de nivel apropiat (bazat pe media skill rating a membrilor activi), competiția e direct între cele două guilde pe scor cumulat — câștigătoarea primește recompense de guildă (cosmetice exclusive de emblemă, monedă distribuită membrilor participanți).
4. **Ligă de guilde pe termen lung**: guildele urcă/coboară între diviziuni de ligă (Bronz → Argint → Aur → Platină → Diamant → Elită) în funcție de rezultatele săptămânale acumulate — dă un motiv de revenire săptămânală constantă, nu doar un eveniment izolat.

### 6.5 Recompense de turneu
- **Individuale**: monedă, XP de battle pass, cosmetice exclusive de turneu (skin/ramă marcată vizibil cu sezonul/ediția, ca un "trofeu purtabil"), titluri de nume speciale ("Campion Turneul de Vară 2027").
- **De guildă**: emblemă animată de guildă (vizibilă pe profilul fiecărui membru cât timp face parte din guildă), monedă distribuită proporțional cu contribuția individuală la scorul de război — motivează participare reală, nu doar apartenență pasivă.
- Turneele mari (lunare) pot avea și **premii cu bani reali sau vouchere** pentru top clasament — necesită verificare legală per piață de lansare (reguli de concurs/loterie diferă între țări) înainte de activare, aceeași notă de precauție ca la monetizare (secțiunea 9).

### 6.6 Anti-abuz specific turneelor
- Aceleași reguli de integritate server-side din `agents.md` — rezultatele de turneu se calculează exclusiv din datele de partidă validate server-side, niciodată auto-raportate de client.
- Detecție de "sandbagging" (jucători puternici care se prezintă artificial slabi pentru a intra la un prag inferior de turneu) — flag automat pe discrepanțe mari între skill rating istoric și rezultatele recente înainte de un turneu.
- Un membru care părăsește o guildă în mijlocul unui Clan War activ nu-i mai contează scorul contribuit anterior în calculul următorului turneu al noii guilde (previne "mercenariat" de ultim moment între guilde).

### 6.7 Model de date (extensie)

```
guilds: id, name, emblem_id, tag, leader_user_id, created_at, member_count
guild_members: guild_id, user_id, role (leader|officer|member), joined_at, contribution_score_current_war
tournaments: id, type (individual_bracket|individual_arena|guild_war), format, starts_at, ends_at, entry_requirement (rank_min, fee)
tournament_participants: tournament_id, user_id (nullable), guild_id (nullable), current_score, current_placement, eliminated_at
guild_wars: id, guild_a_id, guild_b_id, season_league_tier, starts_at, ends_at, score_a, score_b, winner_guild_id
guild_league_standings: guild_id, league_tier, season_id, wins, losses, points
```

### 6.8 Note pentru agenții de implementare
- Turneele reutilizează motorul de partidă deja construit (Duo/FFA din secțiunea 12) — nu e un sistem de joc separat, doar un **strat de programare, scor și recompense** peste partidele existente.
- Necesită un job de matchmaking special pentru Clan Wars (potrivire guildă-vs-guildă), separat de coada normală de matchmaking individual, dar pe aceeași infrastructură Redis/BullMQ deja planificată.
- Guildele sunt o extensie directă a clanurilor descrise deja la nivel de concept în secțiunea 7.4 — implementează entitatea `guilds` o singură dată, folosită atât pentru chat de clan/social (secțiunea 7), cât și pentru turnee (secțiunea de față).

---

## 7. Sisteme suplimentare de retenție & engagement

**Obiectiv:** un jucător nou trebuie să fie "prins" din primele minute, iar unul vechi trebuie să aibă un motiv să revină zilnic, nu doar să joace sporadic. Inspirație combinată din Duolingo (streak-uri, misiuni zilnice), Clash Royale/Fortnite (battle pass, evenimente sezoniere), Clash of Clans (clanuri), Chess.com (analiză post-partidă, coaching).

### 7.1 Recompense zilnice & streak de logare
- Calendar de recompense zilnice (monedă, cosmetice minore, bilete de eveniment) — cresc pe măsură ce streak-ul de zile consecutive crește, cu recompensă "mare" la pragurile de 7/30/100 zile.
- Streak-ul are un mic "grace period" (1 zi de protecție/lună, cumpărabilă cu monedă sau inclusă la VIP — secțiunea 9.3) ca să nu frustreze jucătorii care ratează o zi din motive reale, spre deosebire de sistemele dure care resetează instant.

### 7.2 Misiuni zilnice & săptămânale (quests)
- 3-5 misiuni zilnice ("răspunde corect la 15 întrebări de istorie", "câștigă 2 partide Blitz") + 1-2 misiuni săptămânale mai ample, cu recompense în monedă/XP/bilete de battle pass.
- Misiunile rotesc automat din același sistem de template-uri parametrizate descris la achievements (secțiunea 3.1) — nu necesită conținut unic per misiune.

### 7.3 Nivel de cont online (Account XP) — NU un sistem de campanie/hărți single-player
- **Clarificare importantă de denumire**: acest "nivel" e un **indicator pur de progres al contului online** (câte activități multiplayer/online ai acumulat de-a lungul timpului), complet distinct de conceptul de "level" folosit în jocuri single-player pentru hărți/etape/campanie. QuizRealm **nu are și nu va avea o campanie de nivele parcurse secvențial** — jocul e construit în jurul multiplayer-ului online (`plan.md` secțiunea 0, decizie confirmată). Ca să evităm confuzia terminologică în UI/documentație/comunicare cu jucătorii, folosim consecvent denumirea **"Nivel de cont"** sau **"Nivel online"**, niciodată doar "nivel" fără calificativ, și niciodată prescurtarea "lvl X hartă" care ar sugera progres prin conținut secvențial.
- XP acumulat din **orice activitate online** (partide jucate — nu doar victorii, participarea contează, misiuni, turnee, contribuții de comunitate), cu niveluri de cont (1, 2, 3…) care deblochează recompense cosmetice fixe la anumite praguri — progres constant pentru toată lumea, inclusiv jucătorii care nu urcă rapid în rank competitiv.
- Nivelul de cont e vizibil pe profil lângă rank (secțiunea 5) și badge-uri (secțiunea 3), dar clar etichetat vizual ca fiind un indicator diferit (iconiță/culoare distinctă), exact ca diferența dintre "Account Level" și "Rank competitiv" din jocuri precum Valorant sau Overwatch — două axe de progres paralele, niciuna nu se substituie celeilalte.

### 7.4 Clanuri / Echipe
- Grupuri de jucători (nume, emblemă custom, chat de clan — extensie a scopului "prieteni" din secțiunea 2), cu **clasament de clan** și **provocări săptămânale de clan** (suma de întrebări corecte a membrilor, victorii colective).
- Recompense de clan (cosmetice exclusive de clan, emblemă animată) motivează coeziune sociala și retenție de grup — jucătorii revin ca să nu-și dezamăgească echipa, unul dintre cei mai puternici factori de retenție cunoscuți în jocurile live-service.
- Structura de clan definită aici e **fundația tehnică** pentru turneele de guildă complete descrise în secțiunea 6 — aceeași entitate `guilds`, folosită atât pentru social/chat cotidian, cât și pentru competiția organizată de tip Clan War.

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

## 8. Idei noi — mecanici suplimentare gândite să atragă și să rețină jucătorii

Peste sistemele deja descrise (achievements, rank, battle pass, clanuri, turnee), următoarele **6 mecanici noi** sunt gândite specific pentru profilul acestui joc — online, multiplayer, sesiuni scurte pe mobil — cu accent pe bucle de retenție dovedite în jocuri/aplicații comparabile.

### 8.1 "Întrebarea Zilei" — mecanică virală de tip Wordle
- O singură întrebare specială, **identică pentru toți jucătorii din lume**, disponibilă o dată pe zi, separată de partidele normale — nu afectează rank-ul, e pur despre participare și comparație socială.
- După ce răspunzi, vezi cum te-ai descurcat față de prieteni (nu doar față de toată lumea) — mecanica exactă care a făcut Wordle/Connections viral: **comparație cu cercul social**, nu doar un scor abstract global.
- Rezultat ușor de distribuit (un "card" vizual, fără să dezvăluie răspunsul corect celor care n-au jucat încă) pe rețele sociale externe — buclă de creștere organică gratuită, fără cost de achiziție.

### 8.2 Provocare directă către un prieten (Duel asincron rapid)
- Poți trimite unui prieten o provocare de "3 întrebări rapide" direct din chat/profil, fără să fie nevoie ca amândoi să fiți online în același moment — prietenul primește notificare, joacă rundă lui când are timp (în următoarele 24h), rezultatele se compară automat.
- Reduce bariera de a juca multiplayer la un moment convenabil pentru fiecare — inspirat de mecanica de "turn-based async" din jocuri precum Words With Friends, dar adaptată la sesiuni foarte scurte (sub 1 minut), perfectă pentru pauze scurte pe mobil.

### 8.3 Sistem de "Rivalitate" (Nemesis)
- Dacă joci de mai multe ori împotriva aceluiași jucător (întâlnit random în matchmaking), sistemul propune automat marcarea lui ca **"Rival"** — istoricul dintre voi doi (scor total, ultima confruntare) devine vizibil pe profil, cu un buton rapid de "Revanșă".
- Creează narrative personale în joc ("ești 3-2 cu Rivalul tău") — motiv emoțional de revenire mult mai puternic decât un clasament abstract, folosit cu succes informal în multe jocuri competitive (rivalități organice), aici formalizat ca feature explicit.

### 8.4 Colecție tematică "Album de cunoștințe" (mecanică de tip Panini)
- Pe măsură ce răspunzi corect la suficiente întrebări dintr-o categorie/subcategorie, "completezi" vizual o pagină tematică de album (ex: pagina "Istoria României", pagina "Sistemul Solar") — o reprezentare vizuală atractivă a progresului de cunoștințe, peste simpla bară de progres a achievements.
- Albume complete deblochează un cosmetic unic tematic + un titlu ("Cunoscător al Istoriei") — combină achievements (secțiunea 3) cu un strat vizual de colecție care apelează la instinctul de "completare" foarte puternic la retenție (aceeași psihologie din spatele albumelor de fotbaliști, dar aplicată la conținut educațional).

### 8.5 Provocare comunitară globală (obiectiv colectiv de sezon)
- Un obiectiv cumulativ vizibil pentru toată comunitatea (ex: "1 miliard de răspunsuri corecte date de toți jucătorii împreună până la finalul sezonului"), cu o bară de progres globală vizibilă în aplicație și recompense pentru **toată lumea** dacă obiectivul e atins — mecanică de tip "live-service community event", folosită cu succes pentru a crea senzația de "facem parte din ceva mai mare" (fiecare partidă individuală contribuie la un rezultat colectiv), nu doar competiție individuală.
- Nu necesită coordonare între jucători — se întâmplă pasiv, doar prin faptul că joci normal, deci nu adaugă presiune sau complexitate, doar un strat suplimentar de motivație.

### 8.6 Prezicere live pe partide de spectator ("Cine crezi că va câștiga?")
- Când urmărești o partidă ca spectator (proprie, de prieten, sau de turneu — secțiunea 6), poți "prezice" cine câștigă folosind monedă moale (nu bani reali — evită orice conotație de pariuri reale), câștigând monedă bonus dacă ghicești corect.
- Transformă modul spectator dintr-o experiență pasivă într-una activă și implicantă, crescând timpul petrecut în aplicație chiar și atunci când jucătorul nu e activ într-o partidă proprie — util mai ales la turneele mari, unde mulți jucători vor urmări fără să joace simultan.

---

## 9. Store & Shop — arhitectură completă (bani reali + monedă in-game)

**Principiu de bază (păstrat din `plan.md` secțiunea 9): fără pay-to-win.** Toate sistemele de mai jos sunt cosmetice, de confort sau de conținut adițional — niciodată avantaj competitiv plătit (dificultatea întrebărilor și șansele de câștig rămân identice, indiferent cât cheltuie cineva).

> **Notă:** evită mecanici de tip loot box/pachet cosmetic aleatoriu plătit cu bani reali — sunt reglementate sau interzise în mai multe țări (inclusiv pentru minori) și cresc riscul legal/de reputație. Recomandarea de mai jos e pe **cumpărare directă și battle pass** (conținut vizibil, preț fix), nu pe randomizare plătită. Aceasta nu e consultanță juridică — o verificare legală per piață de lansare rămâne necesară înainte de activare.

### 9.0 Distincția Store vs Shop — două sisteme separate, nu unul singur

Ai cerut explicit ca acest sistem să fie gândit separat: **Store** (intrarea de bani reali) și **Shop** (cheltuirea monedei din joc). Structurăm astfel:

| | **Store** | **Shop** |
|---|---|---|
| **Ce faci acolo** | Cumperi **monedă premium (gems)** sau **abonamente/pachete** direct cu bani reali | Cheltuiești **coins** (câștigate prin joc) sau **gems** (din Store) pe cosmetice/conținut |
| **Metodă de plată** | Google Play Billing / App Store In-App Purchase (procesare externă, obligatorie pe mobil) | Monedă internă — nicio interacțiune cu bani reali în acest ecran |
| **Conținut** | Pachete de gems (cu bonus la sume mari), abonament VIP, pachete "Fondator"/oferte speciale | Avataruri, rame, bannere, emote-uri, titluri de nume, pachete tematice de întrebări, bilete de turneu |
| **Componentă tehnică** | `backend/api` modul `store` — validare de chitanță (receipt validation) server-side obligatorie pentru fiecare achiziție, sincronizare cu Google Play/App Store | `backend/api` modul `shop` — catalog de iteme cu preț fix în coins/gems, fără nicio dependență de procesatori de plăți externi |
| **De ce separat** | Reduce suprafața de risc/fraudă (doar `store` atinge plăți reale) și permite ca `shop`-ul (catalogul cosmeticelor) să fie identic pe orice platformă viitoare (mobil + website, secțiunea 13), chiar dacă metoda de plată din `store` diferă între platforme | — |

- **Validare server-side obligatorie**: orice achiziție din Store trece printr-un flux de verificare a chitanței (receipt) direct la Google/Apple înainte ca gems/abonamentul să fie creditat contului — previne fraudă prin chitanțe falsificate trimise direct de client.
- **Store-ul e specific platformei** (reguli diferite Android/iOS/web — comisioane, fluxuri de achiziție), în timp ce **Shop-ul e universal** (același catalog, aceleași prețuri în monedă internă, indiferent de platformă) — separarea asta ușurează mult extinderea ulterioară pe website (secțiunea 13).

### 9.1 Monedă duală
- **Monedă moale (coins)** — câștigată prin joc (partide, misiuni, streak), folosită pentru cosmetice de bază și intrări în anumite evenimente.
- **Monedă tare (gems)** — cumpărată cu bani reali (pachete de valoare crescândă, cu bonus la pachetele mari, model standard mobile), folosită pentru cosmetice premium, battle pass, sloturi extra de clan/prieteni.

### 9.2 Battle Pass sezonier
- Sezon de ~6-8 săptămâni (aliniat cu resetul sezonier de rank din secțiunea 5.2), cu o linie gratuită de recompense + o linie premium cumpărabilă cu gems.
- Recompensele premium sunt **exclusiv cosmetice** (avataruri, rame, bannere, emote-uri, titluri de nume) + monedă moale bonus — nu conținut care afectează gameplay.
- Cel mai previzibil și mai bine acceptat model de monetizare recurentă din jocurile live-service actuale (Fortnite, Clash Royale, COD Mobile) — venit constant, fără percepția de "plătești ca să câștigi".

### 9.3 Abonament VIP/Premium (recurent lunar)
- Beneficii non-competitive: XP boost (progres mai rapid la nivel de cont, nu la ELO), grace period suplimentar la streak, badge exclusiv de abonat, slot suplimentar de showcase pe profil, prioritate ușoară la matchmaking în camere private, acces anticipat la conținut sezonier cosmetic.
- Model similar Discord Nitro / Xbox Game Pass — venit recurent previzibil, complementar battle pass-ului (nu-l înlocuiește).

### 9.4 Magazin de cosmetice cu cumpărare directă
- Avataruri, rame, bannere, efecte de nume, emote-uri/reacții animate în chat — toate cumpărabile direct cu gems, la preț fix, vizibile în întregime înainte de cumpărare (fără randomizare).
- Rotație periodică a magazinului (ca la Fortnite) pentru senzație de noutate constantă și FOMO controlat, fără presiune de tip gambling.

### 9.5 Pachete tematice de întrebări (conținut adițional)
- Pachete de categorii premium (ex: "Film & Serii Internaționale", "Sport de Elită") cumpărabile cu bani reali, disponibile pentru **modurile solo/antrenament și camere private** — nu afectează matchmaking-ul ranked (care rămâne pe banca standard, gratuită, pentru fairness).
- Monetizează valoarea conținutului masiv de întrebări construit conform `plan.md` secțiunea 5, fără să introducă avantaj competitiv.

### 9.6 Personalizare de clan cu bani reali
- Embleme/bannere animate de clan, teme de chat de clan — cumpărabile de liderul de clan, vizibile pentru toți membrii (motivează upgrade colectiv, similar cosmeticelor de clan din Clash of Clans).

### 9.7 Fondator / early adopter (o singură dată, la lansare)
- Pachet unic "Fondator" (cosmetice exclusive, imposibil de obținut ulterior) pentru primii jucători care cumpără orice sumă în primele X săptămâni de la lansare — creează urgență autentică fără presiune predatorie (o singură achiziție, nu recurentă).

### 9.8 Protecții pentru cheltuieli reale (obligatorii, nu opționale)
- **Limite de cheltuială configurabile** de jucător (self-imposed spending limits), afișate clar înainte de orice achiziție.
- **Conturi de minori** (din age-gate, secțiunea 1.3): achiziții cu bani reali blocate sau necesită confirmare/control parental explicit, conform reglementărilor locale de protecție a minorilor pentru achiziții in-app.
- Istoric de achiziții accesibil integral din profil, fără costuri ascunse sau conversii neclare între monedă moale/tare/preț real.

### 9.9 Model de date (extensie)

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

## 10. Sistem internațional — țară, limbă, matchmaking regional & clasamente

**Inspirat din:** League of Legends/Valorant (server regions cu transfer plătit și limitat), Clash Royale/PUBG Mobile (selectare regiune la prima pornire), Duolingo (conținut per limbă), Discord (canale/servere pe limbă cu moderare automată de limbă).

### 10.1 Principiu general
La finalizarea înregistrării, jucătorul alege **țara** și **limba** — două selecții distincte, dar corelate:

- **Țara** determină identitatea de clasament regional și, pentru limbile "locale", și populația cu care e matchat.
- **Limba** determină banca de întrebări folosită și camera de chat în care e plasat.
- **Regula specială pentru engleză:** dacă jucătorul alege limba **Engleză**, nu mai e legat de o singură țară pentru matchmaking/clasament — intră automat în **poolul Global**, alături de toți ceilalți jucători care au ales engleză, indiferent din ce țară sunt (SUA, UK, India, Nigeria, Filipine etc.). Pentru orice altă limbă (română, franceză, germană etc.), matchmaking-ul și clasamentul rămân **la nivel de țară**.

Motivul din spate: o limbă precum româna are o populație de jucători concentrată clar într-o țară, deci gruparea pe țară păstrează calitatea meciului (aceeași limbă, cultură, fus orar apropiat). Engleza însă e vorbită global de populații mari și dispersate — a o restricționa pe țară ar fragmenta artificial o comunitate uriașă și ar mări timpii de așteptare la matchmaking fără motiv real.

### 10.2 Selectare țară & limbă la onboarding
- Ecran dedicat, imediat după crearea contului (înainte de prima partidă): listă de țări (căutabilă, cu steag), pre-selecție sugerată din locale-ul telefonului/IP (dar **niciodată impusă automat** — jucătorul confirmă explicit).
- Limba se sugerează automat pe baza țării alese (ex: România → română, dar jucătorul poate alege engleză dacă preferă poolul global), niciodată forțată.
- **Cooldown la schimbare**: țara și limba pot fi schimbate ulterior din setări, dar cu un cooldown (ex: o dată la 60-90 zile), ca să nu fie folosite pentru a "cumpăra" un clasament mai ușor prin schimbări repetate — similar restricției de transfer de server din League of Legends/Valorant.
- **La schimbare de țară/limbă cu impact pe clasament**, progresul de rank din vechea regiune **nu se transferă 1:1** — se aplică un recalibrare (meciuri de plasare noi în noul pool), exact ca la un transfer de server în jocurile competitive citate mai sus, ca să nu existe avantaj artificial.

### 10.3 Matchmaking pe regiune
- **Pool-uri de matchmaking** definite de combinația (limbă, țară) pentru limbile locale, respectiv doar (limbă = engleză) pentru poolul global.
- **Fallback de lărgire a căutării**: dacă poolul local e prea mic (populație redusă, ore de noapte locale), coada de matchmaking se lărgește progresiv (ex: după 20-30s fără meci găsit, extinde căutarea la țări vecine cu aceeași limbă sau oferă opțiunea explicită "joacă în poolul global" — mereu cu acordul/vizibilitatea jucătorului, nu silențios). Aceeași mecanică de "lărgire treptată" e folosită în majoritatea jocurilor competitive ca să evite cozi infinite fără să strice complet omogenitatea regiunii.
- Partidele private (cu cod) **nu sunt restricționate de regiune** — poți invita pe oricine, indiferent de țară/limbă (e alegerea explicită a jucătorilor implicați, nu matchmaking automat).

### 10.4 Clasamente (leaderboards) pe mai multe niveluri
- **Clasament de țară** — vizibil implicit, cel mai relevant pentru jucătorii cu limbă locală ("cel mai bun din România").
- **Clasament Global** — pentru poolul de engleză, plus un clasament global "toți jucătorii, toate limbile" opțional (pur informativ, comparație absolută, dar competiția reală/matchmaking-ul rămâne separat pe regiune pentru limbile locale).
- **Clasament de prieteni** (deja definit în `plan.md`) — rămâne neschimbat, independent de regiune.
- UI-ul de clasament permite comutare rapidă între "Țara mea" / "Global" / "Prieteni", ca la Duolingo (ligi) sau la clasamentele regionale din jocurile mobile mari.

### 10.5 Localizarea băncii de întrebări
- Extensie directă a strategiei hibride din `plan.md` secțiunea 5: fiecare întrebare are deja un câmp `language`. Pipeline-ul de generare AI + crowdsourcing rulează **per limbă**, nu doar per categorie.
- **Lansare inițială recomandată: română + engleză** (acoperă atât poolul local principal, cât și poolul global), cu adăugare de limbi noi ulterior pe baza cererii (ex: franceză, germană, spaniolă), fără schimbare de schemă — doar populare de conținut nou.
- Categoria "specific țării" (menționată deja în `plan.md` ca "România specific") se generalizează la **"[Țară] specific"** pentru fiecare țară cu pool propriu; pentru poolul global de engleză, categoria echivalentă devine "cultură generală internațională", nu specifică unei singure țări.
- **Dacă un jucător alege o limbă fără bancă de întrebări localizată încă** (limbă neacoperită la momentul respectiv), aplicația îl informează clar și îl direcționează temporar spre poolul global de engleză, până când limba lui e adăugată — nu un fallback silențios/ascuns.

### 10.6 Camere de chat pe limbă & moderare automată de limbă

Fiecare cameră de chat global/regional (secțiunea 2.2) are o **limbă atribuită explicit** (cea a pool-ului din care face parte: română pentru camera de România, engleză pentru camera Globală etc.). Cerința ta: dacă cineva scrie într-o altă limbă decât cea a camerei, sistemul trebuie să-i semnaleze că are voie să scrie doar în limba camerei.

**Mecanism propus:**
1. La fiecare mesaj trimis într-o cameră globală/regională, serverul rulează o **detecție automată de limbă** (bibliotecă de detecție lingvistică ușoară, server-side — nu client-side, ca să nu poată fi ocolită) pe conținutul mesajului.
2. Dacă limba detectată **nu se potrivește** cu limba camerei, cu un **prag de încredere suficient de mare** (pentru a evita fals-pozitive pe mesaje scurte, emoji, nume proprii, numere — acestea sunt exceptate automat de la verificare, fiind ambigue lingvistic prin natura lor), mesajul e blocat de la publicare, iar expeditorul primește un **mesaj de sistem vizibil doar lui**: *"Această cameră este pentru limba [X]. Te rugăm să scrii doar în [X]."*
3. **Nu e o penalizare la prima abatere** — doar un mesaj de îndrumare, cu opțiunea de a rescrie. Abaterile repetate (același utilizator, mai multe mesaje blocate într-un interval scurt) intră în același sistem de raportare/moderare descris în secțiunea 2.6 (poate duce la mute temporar în camera respectivă, nu la nivel de cont).
4. **Camera de prieteni și DM-urile private NU sunt supuse acestei verificări** — sunt conversații private între utilizatori care au consimțit reciproc, pot vorbi orice limbă doresc între ei. Verificarea de limbă se aplică **doar camerelor publice/regionale**, unde coerența lingvistică e necesară pentru ca toată lumea din cameră să se poată înțelege.
5. **Poolul global de engleză** aplică aceeași regulă, dar cu conștientizarea că engleza vorbită global variază (britanică/americană/alte variante) — detecția verifică *limba*, nu dialectul sau nivelul de corectitudine gramaticală.

### 10.7 Model de date (extensie)

```
countries: id, iso_code, name, flag_asset
languages: id, iso_code, name, is_global_pool (bool, true doar pentru engleză la lansare)
user_profile: + country_id, language_id, region_changed_at (pentru cooldown)
question_bank: questions.language_id (deja implicit din plan.md, referențiat explicit aici)
matchmaking_pools: id, language_id, country_id (nullable dacă is_global_pool)
chat_rooms: + language_id (limba atribuită camerei)
language_violations: id, user_id, message_id, room_id, detected_language_id, room_language_id, confidence_score, action_taken (warned|blocked|muted), created_at
leaderboards: + scope (country|global|friends), country_id (nullable dacă scope=global)
```

### 10.8 Note pentru agenții de implementare
- Detecția de limbă rulează în `backend/realtime` (același serviciu care gestionează chat-ul, conform `agents.md` secțiunea 3), **niciodată doar client-side** — la fel ca validarea răspunsurilor de joc, integritatea regulii depinde de aplicare server-side.
- Matchmaking-ul pe regiune se implementează ca un parametru suplimentar în coada Redis existentă din `plan.md`/`init.md` (Faza 2) — nu un sistem separat, doar o cheie de partiționare (`language_id` + `country_id` sau `is_global_pool`) adăugată la coada deja planificată.
- Recomandare fermă: **nu lansa cu mai mult de 2 limbi** (română + engleză) pentru a păstra calitatea băncii de întrebări și a comunității de chat per limbă; extinderea se face pe bază de date reale de cerere (câți jucători aleg o limbă neacoperită și sunt direcționați spre fallback global), nu speculativ.

---

## 11. Sistem de dificultate & anti-repetiție a întrebărilor

**Inspirat din:** Chess.com Puzzle Rush (rating de dificultate calibrat din performanța reală a jucătorilor), Duolingo (algoritmul "Birdbrain" care ajustează dificultatea pe baza probabilității de răspuns corect), Kahoot (dificultate configurabilă per sesiune), sisteme clasice de Item Response Theory folosite în testare adaptivă educațională.

`plan.md` secțiunea 4 definește deja un câmp simplu `difficulty (1-5)` setat la creare. Secțiunea de față **extinde** acel câmp cu un sistem complet de calibrare empirică și un mecanism explicit de a preveni repetarea prea deasă a acelorași întrebări pentru același jucător.

### 11.1 Dificultate calibrată empiric, nu doar estimată la creare
- La creare (AI sau comunitate), o întrebare primește o **dificultate inițială estimată** (1-5, ca până acum) — doar un punct de plecare, nu adevărul final.
- După ce o întrebare a fost răspunsă de un număr minim de jucători (ex: 50+), sistemul calculează o **dificultate reală calibrată**, pe o scală continuă (similar unui rating ELO de întrebare), pe baza ratei reale de răspuns corect **ponderată cu nivelul jucătorilor care au răspuns** (nu doar % brut — o întrebare la care răspund corect doar jucătorii avansați e obiectiv mai grea decât una la care răspund corect și începătorii, chiar dacă % brut e similar).
- Recalibrarea rulează periodic (job în `backend/workers`, similar structural cu `recalculate-leaderboard` din `init.md`), nu la fiecare răspuns individual (evită cost de calcul inutil).
- Banda afișată în UI (Foarte ușor / Ușor / Mediu / Greu / Expert) rămâne simplă pentru jucător, dar e derivată din scorul continuu calibrat, nu din eticheta inițială fixă.
- Întrebările noi (fără suficiente răspunsuri încă pentru calibrare) sunt introduse **treptat, într-un eșantion controlat** de partide, tocmai ca să acumuleze date reale rapid, fără să domine sesiunile jucătorilor obișnuiți.

### 11.2 Rating de skill al jucătorului (separat de ELO competitiv)
- Fiecare jucător are un **skill rating de cunoștințe**, calculat global și **per categorie** (ex: poți fi "Expert" la Geografie dar "Ucenic" la Sport) — distinct de ELO-ul competitiv din sistemul de rank (secțiunea 5), care măsoară rezultatul meciurilor, nu nivelul de cunoștințe brut per domeniu.
- Acest rating se actualizează după fiecare răspuns, pe o logică similară ELO: răspunzi corect la o întrebare grea → creștere mai mare; răspunzi greșit la o întrebare ușoară → scădere mai mare — exact mecanismul din spatele sistemelor adaptive citate mai sus.

### 11.3 Selectare adaptivă a întrebărilor
- **În matchmaking ranked**: întrebările livrate într-un meci sunt alese să fie potrivite cu skill rating-ul mediu al celor doi/mai multor jucători din partidă (nu extreme aleatorii de dificultate care ar face meciul nedrept sau plictisitor).
- **În mod solo/antrenament**: jucătorul poate alege manual o bandă de dificultate țintă (Ușor/Mediu/Greu/Adaptiv-automat), pentru cine vrea control explicit, nu doar sistem automat.
- **Progresie graduală în cadrul unei partide lungi**: opțional, dificultatea poate crește ușor pe măsură ce runda avansează (ca la multe quiz show-uri), configurabil per mod de joc.

### 11.4 Anti-repetiție — o întrebare nu revine prea curând la același jucător
Cerința explicită: **întrebările să nu se repete ușor**. Mecanism pe mai multe niveluri:

1. **Istoric per jucător**: fiecare întrebare afișată unui jucător e înregistrată (`user_question_history`), cu data ultimei afișări.
2. **Fereastră de excludere (cooldown)**: o întrebare deja văzută de un jucător **nu revine** decât după ce a trecut fie un interval minim de timp (ex: 30-60 zile), fie un număr minim de alte întrebări diferite văzute între timp (ex: minim 300) — se aplică pragul care se atinge mai târziu dintre cele două, pentru jucătorii foarte activi care ar epuiza altfel fereastra de timp prea repede.
3. **Fără repetiție în aceeași partidă/sesiune**: în cadrul unei singure partide, aceeași întrebare nu apare de două ori, indiferent de cooldown-ul general (regulă hard, nu doar probabilistică).
4. **Selecție ponderată, nu pur aleatorie**: din poolul de întrebări eligibile (potrivite ca dificultate, categorie, limbă, în afara ferestrei de excludere), algoritmul favorizează cu prioritate mai mare întrebările:
   - văzute de jucător cel mai demult în timp (sau niciodată),
   - afișate cel mai rar **la nivel global** (`times_asked` mic) — asta previne fenomenul din multe quiz-uri unde câteva "întrebări vedetă" apar disproporționat de des pentru toată lumea, în timp ce restul băncii masive de 50.000-100.000 de întrebări stă nefolosită.
   - cu un factor mic de randomizare peste ponderi, ca să nu devină previzibil ("dacă știu ce am răspuns ultima dată, știu ce urmează").
5. **Rotație de categorii**: în modurile cu categorii mixte, sistemul evită și înșiruirea a prea multe întrebări consecutive din aceeași categorie pentru același jucător (variație percepută, nu doar variație reală de conținut).

### 11.5 De ce contează mai ales la o bancă de 50.000-100.000 de întrebări
Fără acest sistem, o bancă mare de întrebări nu are valoare practică dacă algoritmul de selecție tot alege dintr-un subset mic "sigur" (întrebări deja calibrate, populare, ușor de livrat). Selecția ponderată + fereastra de excludere sunt exact mecanismul care transformă volumul brut de întrebări în **varietate resimțită real** de jucător — motivul principal pentru care ai cerut inițial mult mai multe întrebări decât ConQUIZtador2.

### 11.6 Model de date (extensie)

```
question_difficulty_stats: question_id, difficulty_label (1-5, afișat), difficulty_elo (continuu, calibrat), times_asked, times_correct, last_recalibrated_at, is_calibrated (bool, fals până la pragul minim de răspunsuri)
user_skill_rating: user_id, category_id (nullable = global), skill_elo, updated_at
user_question_history: user_id, question_id, last_shown_at, times_shown_to_user
```

### 11.7 Note pentru agenții de implementare
- Algoritmul de selecție a întrebărilor rulează **exclusiv server-side** (în `backend/api` sau un serviciu dedicat `question-selector`, apelat de `backend/realtime` la generarea rundei) — niciodată pe client, altfel devine ocolibil/predictibil (același principiu de integritate server-side aplicat deja validării răspunsurilor, conform `agents.md`).
- Job-ul de recalibrare a dificultății se implementează în `backend/workers`, alături de `generate-questions` și `recalculate-leaderboard`, cu aceeași infrastructură BullMQ deja planificată în `init.md` — nu un serviciu nou separat.
- Pragurile exacte (nr. minim de răspunsuri pentru calibrare, durata cooldown-ului, dimensiunea ferestrei de 300 întrebări) sunt **configurabile din admin panel**, nu hardcodate — se ajustează empiric după lansare, pe măsură ce banca de întrebări crește spre 100.000+.

---

### 11.8 Ajustare generală: curbă de dificultate mai ridicată
Peste calibrarea empirică (11.1), aplicăm și o **ajustare intenționată în sus** a dificultății percepute, ca jocul să rămână provocator inclusiv pentru jucători experimentați, nu doar la primele ore:

- **Distribuție de dificultate mai grea în modurile ranked**: proporția de întrebări "Foarte ușor" scade pe măsură ce skill rating-ul jucătorului (11.2) crește — un jucător avansat nu mai vede practic deloc întrebări din banda cea mai ușoară, spre deosebire de o distribuție plată identică pentru toată lumea.
- **Timpi de răspuns mai stricți la ranguri superioare**: fereastra de 12s/10s din `plan.md` rămâne standardul pentru jucători noi/casual, dar la ranguri înalte (Oracol+, secțiunea 5) timpul se reduce ușor (ex: -2s), adăugând presiune reală de cunoaștere rapidă, nu doar de cunoaștere corectă — aliniat cu modul în care jocurile competitive citate (Valorant, chess bullet) cresc dificultatea prin timp, nu doar prin conținut.
- **Bonus de dificultate crescândă la streak-uri lungi**: în modul solo/antrenament, o serie lungă de răspunsuri corecte consecutive împinge treptat dificultatea în sus (nu doar scorul), recompensând explicit stăpânirea reală, nu doar noroc/răbdare.
- **Categorii "Expert"**: la fiecare categorie majoră, un sub-set de întrebări marcate explicit ca bandă "Expert" (dincolo de 1-5 standard) — folosite doar pentru jucători cu skill rating foarte ridicat în acea categorie specifică sau în moduri dedicate ("Mod Dificil"), nu amestecate implicit în poolul normal.
- Aceste ajustări sunt **parametri de configurare** (nu cod hardcodat), reglabile din admin panel (secțiunea 13.4) pe măsură ce se observă date reale de dificultate percepută vs. rata de abandon a partidelor.

---

## 12. Multiplayer extins — partide de la 4 până la 8 jucători (Free-for-All)

**Inspirat din:** ConQUIZtador2 (mecanica de bază: capturare teritorii + fază de "luptă"/atac, moduri Public/Privat cu boți, Rapid vs Lung), Teamfight Tactics (sistem de rank bazat pe **plasament** într-o partidă cu 8 jucători, nu doar victorie/înfrângere binară), Risk/Territorial.io (dinamica de hartă multi-jucător, alianțe temporare), Fall Guys/battle royale-uri (eliminare progresivă + recompense scalate pe loc final).

`plan.md` definește deja modurile **Duo (1v1)** și **Clasic/Blitz**. Secțiunea de față extinde mecanica de cucerire teritorii la **partide cu 4, 5, 6, 7 sau 8 jucători simultan (8 = maxim absolut)**, păstrând sufletul jocului original, dar rezolvând problemele care apar când numărul de jucători crește mult față de cei 2-3 din ConQUIZtador2.

### 12.1 De ce nu poți doar "copia" mecanica de la 3 jucători la 8
ConQUIZtador2 funcționează pe **ture** (ordinea jucătorilor e aleatoare, dar secvențială) pentru că la 2-3 jucători așteptarea e scurtă. La 8 jucători, o mecanică pur secvențială ar face o rundă de 8x mai lentă — inacceptabil pentru un joc mobil modern. De aceea, structura de mai jos schimbă rezolvarea din **secvențială în simultană**, păstrând însă cele două faze clasice (capturare + luptă) care dau identitatea jocului.

### 12.2 Scalare hartă & teritorii în funcție de numărul de jucători
- Numărul de teritorii de pe hartă **crește proporțional** cu numărul de jucători, ca fiecare partidă să aibă spațiu suficient de manevră strategică, nu doar câteva teritorii disputate haotic:

| Jucători | Teritorii pe hartă (orientativ) | Teritorii de bază per jucător la start |
|---|---|---|
| 4 | 24-28 | 2 |
| 5 | 28-32 | 2 |
| 6 | 32-38 | 2 |
| 7 | 36-42 | 2 |
| 8 | 40-48 | 2 |

- Hărțile sunt construite pe o **grilă hexagonală sau poligonală cu adiacență explicită** (fiecare teritoriu știe care sunt vecinii lui) — necesar pentru faza de atac (13.3), unde poți ataca doar teritorii adiacente celor deja controlate, exact ca la Risk/Territorial.io, nu oriunde pe hartă la întâmplare.
- La fel ca în original, există **hărți tematice** (ex: România, Europa, Lume) — cu varianta de 4-8 jucători disponibilă pe toate, dimensiunea hărții adaptându-se automat la numărul de participanți din lobby.

### 12.3 Structura unei partide (2 faze, extinsă la N jucători)

**Faza 1 — Capturare (echivalentul "Rundei I + II" din ConQUIZtador2):**
1. Fiecărui jucător i se atribuie automat 2 teritorii de bază, neadiacente între ele și de restul jucătorilor pe cât permite harta (fairness de poziționare, calculat de server, nu ales manual de jucător la modurile publice — la partide private, cine găzduiește poate alege manual poziționarea, ca la "Separeu" din original).
2. Teritoriile rămase, libere, se capturează prin runde de întrebări **rezolvate simultan**: toți jucătorii primesc aceeași întrebare în același timp (grilă sau răspuns rapid numeric, exact tipurile din `plan.md`), iar teritoriul liber contestat merge la primul răspuns corect (sau la cea mai apropiată estimare, la tip numeric) — identic ca principiu cu regula de "cea mai apropiată estimare" din original, dar rezolvat simultan pentru toți, nu pe rând.
3. Faza de capturare se termină fie când toate teritoriile libere sunt ocupate, fie după un număr fix de runde (configurabil per mod: Rapid vs Lung, ca în original).

**Faza 2 — Luptă (echivalentul fazei de atac din ConQUIZtador2):**
1. Jucătorii pot ataca teritorii **adiacente** controlate de alți jucători.
2. La fiecare rundă de luptă, fiecare jucător activ **alege o țintă de atac** dintre teritoriile adiacente disponibile (sau pasează, dacă vrea să consolideze apărarea) — alegerea se face într-o fereastră scurtă de timp, simultan pentru toți, nu pe rând.
3. Toate atacurile declarate într-o rundă se rezolvă **simultan**, printr-o singură întrebare comună: cine răspunde corect (sau cel mai aproape, la numeric) câștigă teritoriul disputat; la conflicte multiple pe același teritoriu (2+ jucători atacă aceeași țintă în aceeași rundă), câștigă cel cu răspunsul corect și cel mai rapid dintre atacatori.
4. Un jucător care își pierde **toate** teritoriile e **eliminat** din faza activă (vezi 12.6 — nu iese din aplicație, ci intră în mod spectator).
5. Partida se termină când rămâne un singur jucător cu teritorii, sau la epuizarea numărului de runde configurat pentru mod — la egalitate de teritorii la final, departajare printr-o singură întrebare finală de viteză/precizie (regulă preluată direct din mecanismul de departajare al ConQUIZtador2 original).

### 12.4 Moduri de lobby: Public, Privat, Echipe

- **Public** — matchmaking automat, jucători aleatori de nivel apropiat (skill rating din secțiunea 11.2 + ELO din secțiunea 5), completare cu boți dacă lobby-ul nu se umple în timp util (vezi 12.7).
- **Privat** — găzduit de un jucător, invitații prin cod/link, poate seta numărul exact de jucători (4-8), poate completa sloturile rămase cu boți (nivel configurabil), poate alege harta — extensie directă a modului "Separeu" din original.
- **Echipe (opțional, mod avansat)** — la 4, 6 sau 8 jucători, lobby-ul poate fi împărțit în **perechi/triouri** cu teritorii adiacente alocate aceleiași echipe și un clasament de echipă separat de cel individual — echipele nu se pot ataca reciproc, dar teritoriile lor combinate contează la scorul final de echipă. Acest mod se lansează după modul FFA de bază (vezi roadmap, secțiunea 14).

### 12.5 Alianțe temporare (mod avansat, post-lansare)
- La partidele FFA cu 6-8 jucători, se poate introduce ulterior o mecanică opțională de **alianță temporară** (doi jucători convin să nu se atace reciproc pentru un număr limitat de runde, vizibil pentru restul jucătorilor ca semnal strategic) — inspirată din dinamica de diplomacy a jocurilor de tip Risk. **Nu e o cerință de MVP** — se evaluează după ce modul FFA de bază e stabil și testat, pentru că adaugă complexitate de UI și de echilibrare semnificativă.

### 12.6 Eliminare, mod spectator & recompense pe loc final
- Un jucător eliminat (fără teritorii) **nu părăsește partida** — intră automat în **mod spectator**, poate vedea restul partidei live, poate trimite reacții rapide (nu chat text liber, pentru a nu perturba jucătorii activi), și primește locul final conform momentului eliminării (ultimul eliminat = locul cel mai bun dintre eliminați).
- **Recompensele sunt scalate pe loc final** (1-8), nu binar victorie/înfrângere — ca la un battle royale: locul 1 primește recompensa maximă (monedă, XP, progres de battle pass), dar și locul 4-5 primește ceva vizibil, nu zero — motivează participarea și în partidele care nu se termină cu victorie totală, esențial pentru retenție la modurile cu mulți jucători (unde șansa brută de victorie e mai mică decât la Duo).

### 12.7 Matchmaking pentru loturi de 4-8 jucători
- Coadă de matchmaking separată pe **dimensiune de lobby aleasă** (jucătorul alege înainte "vreau o partidă de 4" / "de 8" etc., sau "orice mărime, cel mai rapid meci găsit").
- **Fereastră de completare cu boți**: dacă lobby-ul public nu ajunge la numărul țintă de jucători într-un interval configurabil (ex: 20-30s), sloturile rămase se completează automat cu boți calibrați la nivelul mediu al jucătorilor reali din lobby — identic ca principiu cu completarea automată din original, dar aplicat și modurilor mai mari.
- Matchmaking-ul respectă și **regionalizarea din secțiunea 10** — un lobby de 8 jucători se formează întâi din poolul de țară/limbă al jucătorului, cu aceeași logică de lărgire progresivă dacă poolul local e prea mic pentru a umple rapid un lobby de 8.

### 12.8 Rank pentru partide FFA — sistem bazat pe plasament, nu victorie/înfrângere binară
- Modurile Duo (1v1) rămân pe ELO clasic (câștig/pierdere), conform `plan.md`/secțiunea 5.
- Pentru modurile FFA de 4-8 jucători, ELO-ul competitiv (secțiunea 5) se actualizează pe baza **locului final din partidă**, nu doar victorie/înfrângere — exact mecanismul folosit de Teamfight Tactics pentru partidele sale de 8 jucători: locul 1 câștigă cel mai mult, locurile de mijloc câștigă/pierd puțin, ultimele locuri pierd cel mai mult, iar cantitatea exactă depinde și de ELO-ul relativ al celorlalți 7 adversari din partida respectivă (a termina pe locul 3 într-un lobby foarte puternic valorează mai mult decât locul 3 într-un lobby slab).
- Această formulă se calculează server-side la finalul partidei (`backend/api`, folosind rezultatele trimise de `backend/realtime`, conform fluxului deja definit în `plan.md`/`agents.md`), nu client-side.

### 12.9 Reconectare la partide cu mulți jucători
- Extensie directă a mecanismului deja definit în `plan.md` secțiunea 8: la 4-8 jucători, un jucător deconectat își păstrează locul ~60-90s (stare în Redis), cu teritoriile "înghețate" (nu pot fi atacate în timp ce el e marcat ca reconectabil, pentru fairness), apoi e înlocuit automat de un bot dacă nu revine — esențial la loturi mari, unde o partidă cu un jucător "mort" prea mult timp strică echilibrul pentru toți ceilalți 6-7 participanți activi.

### 12.10 Durata partidei scalată cu numărul de jucători
- Numărul de runde per mod (Rapid/Lung) se ajustează ușor în funcție de mărimea lobby-ului, ca durata totală de joc să rămână într-un interval confortabil pentru sesiune mobilă (țintă orientativ: Rapid ~5-8 minute indiferent de 4 sau 8 jucători, Lung ~15-20 minute) — la mai mulți jucători, faza de luptă are mai multe runde posibile de rezolvat în paralel per rundă (fiecare rundă rezolvă simultan mai multe atacuri), nu neapărat mai multe runde în total.

### 12.11 Model de date (extensie la schema din `plan.md`)

```
matches: + player_count_target (4-8), lobby_type (public|private|team), map_id
territories: id, map_id, name, base_value
territory_adjacency: territory_id, adjacent_territory_id
match_territories: match_id, territory_id, owner_player_id (nullable = liber), captured_at
match_players: + placement (1-8, nullable până la final), eliminated_at (nullable), is_spectating (bool)
match_attacks: match_id, round_number, attacker_player_id, target_territory_id, resolved (bool), winner_player_id
team_lobbies (dacă modul Echipe e activ): match_id, team_number, player_ids[]
```

### 12.13 Grup organizat (Party) — intrare împreună în matchmaking public
- Jucătorii pot forma un **grup/party** (din lista de prieteni, secțiunea 2.7) înainte de a intra în coada de matchmaking public FFA — liderul de party pornește căutarea, toți membrii intră **în aceeași partidă**, restul sloturilor completându-se cu jucători random/boți.
- La modurile ranked, un party nu poate depăși jumătate din numărul total de jucători ai lobby-ului (ex: max 4 într-un lobby de 8), pentru a păstra un nivel rezonabil de fairness față de jucătorii individuali din același meci — regulă standard în jocurile competitive cu FFA + party queue.
- Chat de party dedicat (canal separat de chat-ul general al partidei), activ și înainte de începerea căutării, pentru coordonare.

### 12.14 Note pentru agenții de implementare
- Rezolvarea simultană a rundelor (12.3, 12.4) e cea mai sensibilă piesă de implementat corect în `backend/realtime` — toate răspunsurile unei runde trebuie colectate într-o fereastră de timp fixă și rezolvate **atomic** (server decide câștigătorul o singură dată, pe baza tuturor răspunsurilor primite până la expirarea timpului), nu progresiv pe măsură ce sosesc, altfel apar condiții de cursă (race conditions) între jucători cu latențe diferite.
- Nu implementa modul FFA de 4-8 direct peste codul de Duo (1v1) — proiectează din start `backend/realtime` cu un model de "rundă cu N participanți" generic, în care Duo e doar cazul particular N=2, ca să nu fie nevoie de rescriere ulterioară.
- Modul Echipe (12.4) și Alianțele temporare (12.5) sunt **explicit post-MVP** pentru acest sistem — nu bloca lansarea modurilor FFA de bază (4-8 jucători individuali) așteptând aceste extensii.

---

## 13. Admin Panel — control complet, gândit din start pentru extensie web

**Inspirat din:** panourile de administrare din jocuri live-service moderne (Riot's internal tools pentru LoL/Valorant — management de conturi, ban-uri, evenimente), Discord's Trust & Safety tooling, WordPress/Shopify admin (referință pentru arhitectura "admin web separat, consumă același API").

### 13.1 Principiu arhitectural — un singur backend, două fronturi
Admin Panel-ul **nu e o funcție ascunsă în aplicația mobilă** — e o **aplicație web separată** (React/Next.js, echipă internă), care consumă **exact același `backend/api`** folosit de aplicația Flutter. Asta înseamnă:
- Orice acțiune din admin panel (ban, editare întrebare, creare eveniment) trece prin aceleași endpointuri validate, aceeași bază de date — nu există o cale ocolitoare/duplicat de logică.
- Pregătește terenul direct pentru cerința ta de extindere ulterioară **și a aplicației principale pe website** (nu doar mobil) — dacă backend-ul e deja consumat corect de un al doilea client web (admin panel-ul), adăugarea unui al treilea client (site-ul public pentru utilizatori) e o extensie firească, nu o refactorizare.
- Acces restricționat prin **roluri** (`admin`, `moderator`, `content_editor`, `support`) — nu toți administratorii au acces la tot (ex: un `content_editor` poate aproba întrebări, dar nu poate bana conturi).

### 13.2 Management utilizatori
- **Căutare & vizualizare cont**: după username/email/ID, cu profil complet (istoric partide, achievements, achiziții, rapoarte primite/făcute, trepte de încredere din secțiunea 2.5).
- **Resetare cont**: resetare parolă forțată (trimite email de resetare), resetare progres (opțional, la cerere GDPR sau abuz de exploit), cu logare obligatorie a motivului (audit trail — cine, când, de ce).
- **Ștergere cont**: conform GDPR/reglementări locale — ștergere completă sau anonimizare (păstrează date agregate/statistici, șterge identificatori personali), cu perioadă de graț configurabilă înainte de ștergere definitivă (permite anularea unei ștergeri accidentale/abuzive).
- **Ban/suspendare**: temporar (cu durată) sau permanent, cu **motiv obligatoriu din listă predefinită** (spam, limbaj abuziv, trișare, achiziții frauduloase, etc.) + câmp liber opțional, vizibil în istoricul contului. Ban-ul declanșează automat revocarea sesiunilor active (secțiunea 1.5).
- **Istoric de acțiuni admin per cont** (audit log) — orice acțiune administrativă asupra unui utilizator e înregistrată permanent, cu admin-ul responsabil, pentru responsabilizare și posibile dispute/apeluri ale utilizatorului.

### 13.3 Management conținut — întrebări & categorii, multi-limbă/multi-țară din start
- **Adăugare/editare manuală de întrebări** (grilă sau numeric), cu selecție obligatorie de **limbă** și **categorie** — direct legat de sistemul internațional din secțiunea 10: fiecare întrebare aparține explicit unei limbi, exact ca structura de bază deja definită acolo, nu un adaos ulterior.
- **Coadă de moderare** — toate întrebările `pending` (generate AI sau propuse de comunitate, conform `plan.md` secțiunea 5) apar aici pentru aprobare/respingere/editare, filtrabile pe limbă, categorie, sursă (AI/comunitate), și pe semnalele automate de calitate (rată de dislike, rată de răspuns corect anormală — secțiunea 11.1).
- **Bulk actions**: aprobare/respingere în masă pe filtre (util pentru sampling de verificare rapidă a loturilor mari generate AI, conform fluxului din `init.md`).
- **Vizualizare per limbă/țară**: dashboard care arată acoperirea băncii de întrebări per limbă (câte întrebări aprobate există pentru română vs engleză vs o limbă nouă adăugată), esențial pentru a decide când o limbă nouă e gata de lansare (conform recomandării din secțiunea 10.8 — nu lansa o limbă nouă fără bancă suficientă).

### 13.4 Configurare parametri de joc (fără redeployment)
- Prag-urile menționate în tot acest document ca "nu hardcodate" (trepte de încredere — secțiunea 2.5, cooldown anti-repetiție — secțiunea 11.4, curba de dificultate — secțiunea 11.8, cooldown schimbare țară/limbă — secțiunea 10.2) sunt toate editabile dintr-un ecran central de configurare, cu istoric de modificări — permite ajustare rapidă post-lansare fără a necesita un nou build de aplicație.

### 13.5 Sistem de evenimente (creat din Admin Panel)
Cerința ta explicită: să poți **crea evenimente** direct din admin panel, cu **recompense configurabile** pentru cei care le completează.

- **Creare eveniment**: nume, descriere, interval de timp (start/sfârșit), **scop** (ex: "răspunde corect la 200 de întrebări din categoria Istorie", "câștigă 10 partide Blitz", "participă la 3 turnee") — folosind aceleași template-uri parametrizate de urmărire a progresului deja construite pentru achievements/misiuni (secțiunile 3.1 și 7.2), nu un sistem de tracking separat.
- **Recompense configurabile per prag**: un eveniment poate avea mai multe trepte de recompensă (ex: 25% progres → recompensă mică, 100% progres → recompensă mare), fiecare recompensă aleasă dintr-un catalog existent (cosmetice din Shop, coins, gems, bilete de turneu) — nu necesită cod nou per eveniment, doar configurare de date.
- **Targetare opțională**: eveniment global (toți jucătorii) sau targetat (ex: doar un anumit pool de țară/limbă — legat direct de secțiunea 10, util pentru evenimente culturale locale precum "Ziua Națională" specifică unei singure țări), sau doar pentru un anumit rang minim.
- **Previzualizare & activare programată**: adminul poate pregăti un eveniment din timp (draft), cu activare automată programată la data de start, fără intervenție manuală în momentul lansării.
- **Dashboard de performanță eveniment**: rată de participare, rată de completare per treaptă, în timp real cât evenimentul e activ — permite ajustare rapidă (ex: extinderea duratei) dacă participarea e mult sub așteptări.

### 13.6 Moderare chat & rapoarte
- Coadă de rapoarte de chat (secțiunea 2.6) și de întrebări (secțiunea 5 din `plan.md`), cu context complet (mesajul/întrebarea raportată, istoricul raportorului și al raportatului, acțiuni disponibile: avertisment, mute temporar, ban, respingere raport ca neîntemeiat).
- Prioritizare automată — rapoartele din DM/chat de prieteni (secțiunea 2.3-2.4, context privat, risc mai greu de observat extern) și cele de la "raportori de încredere" (T7+, secțiunea 2.5) urcă mai sus în coadă.

### 13.7 Dashboard & analitice
- Metrici din `plan.md` secțiunea 12 (retenție D1/D7/D30, timp de matchmaking, rating pozitiv al întrebărilor) vizibile centralizat, filtrabile pe țară/limbă (secțiunea 10) — permite să vezi dacă, de exemplu, retenția e mai slabă într-o anumită regiune și necesită investigare separată.
- Rapoarte financiare de bază (venituri Store, per tip de produs — gems, VIP, pachete tematice) pentru echipa de produs, fără acces la date de plată sensibile (acelea rămân doar la nivelul procesatorului de plăți/Google/Apple).

### 13.8 Model de date (extensie)

```
admin_users: id, user_id, role (admin|moderator|content_editor|support), created_at
admin_audit_log: id, admin_user_id, action_type, target_type (user|question|event|...), target_id, reason, metadata (JSON), created_at
game_config_parameters: key, value (JSON), description, updated_by_admin_id, updated_at
events: id, title, description, scope (global|country|language|rank_min), starts_at, ends_at, status (draft|active|ended), goal_template_id, goal_params (JSON)
event_reward_tiers: event_id, progress_threshold, reward_item_id, reward_type (cosmetic|coins|gems|tournament_ticket)
user_event_progress: user_id, event_id, progress_current, rewards_claimed (JSON)
```

### 13.9 Note pentru agenții de implementare
- Admin Panel-ul e un proiect separat în monorepo: `admin/` (alături de `mobile/` și `backend/` din structura definită în `init.md`), un client web care **nu duplică logică de business** — orice validare/regulă trăiește în `backend/api`, admin panel-ul e doar interfață.
- Autentificarea admin-ilor folosește **același sistem JWT** din secțiunea 1.5, dar cu un scope/claim suplimentar de rol — nu un sistem de auth complet separat.
- Implementarea completă a Admin Panel-ului nu e blocantă pentru MVP-ul de joc (Faza 0-2 din `plan.md`), dar **modulele de bază — management utilizatori și moderare de conținut — trebuie disponibile înainte de lansarea publică** (Faza 5-6), pentru că fără ele echipa n-ar putea răspunde la abuz/probleme reale de conținut odată ce jocul are utilizatori reali.

---

## 14. Idei suplimentare — runda 2 de features unicate (minim 10)

Peste tot ce e deja documentat (achievements, turnee, clanuri, cele 6 idei din secțiunea 8), următoarele **11 mecanici** sunt gândite să adauge ceva **structural nou** — nu variații ale aceluiași tip de recompensă, ci straturi noi de gameplay, strategie sau conținut care nu există încă în document.

### 14.1 Teritorii Legendare (Capitale) — strat de strategie pe hartă
- Pe fiecare hartă (secțiunea 12.2), câteva teritorii sunt marcate vizual distinct ca **"Teritorii Legendare"** (ex: o capitală, o minune istorică) — cine le controlează la finalul partidei primește un bonus semnificativ de scor/XP, dar cucerirea lor necesită să răspunzi corect la o întrebare **puțin mai grea** decât teritoriile obișnuite din acea rundă.
- Adaugă o miză tactică reală ("merită să risc un atac greu pentru bonusul de capitală?") peste mecanica de bază — inspirat din conceptul de capitală/oraș-cheie din Civilization și Risk.

### 14.2 Cărți de cunoștințe — power-up-uri colecționabile (non-p2w)
- Jucătorii câștigă prin joc (nu cumpără avantaj, doar cosmetic/timp câștigat prin joc) **carduri de power-up** consumabile: "50/50" (elimină 2 variante greșite la o întrebare grilă), "Timp Extra" (+3s la o rundă), "Dublu Scor" (o singură rundă).
- Înainte de o partidă privată/antrenament, jucătorul își alege un mic "deck" de maxim 2-3 carduri active pentru acea partidă — adaugă strategie de pregătire, similar power-up-urilor din Kahoot/Trivia Crack, dar **exclus din modurile ranked** (fairness — competiția clasată rămâne pur pe cunoștințe, cardurile sunt doar pentru moduri casual/private).

### 14.3 Roata Cunoașterii — mod cu categorie-surpriză, rezolvată live
- Un mod de joc în care, înainte de fiecare rundă, o "roată" vizuală se învârte live pe ecran și alege categoria întrebării următoare, vizibilă simultan pentru toți jucătorii din partidă — element de spectacol tip game-show (Wheel of Fortune), care rupe rutina și crește imprevizibilitatea/distracția unei partide, fără să afecteze fairness-ul (roata e identică pentru toți din meciul respectiv).

### 14.4 Harta Vie — campanie mondială persistentă de guildă
- Un strat complet nou, separat de partidele individuale: o **hartă mondială persistentă** (nu se resetează per partidă) pe care guildele (secțiunea 6) luptă pentru controlul unor regiuni pe parcursul unui sezon întreg, prin acumularea de scor colectiv (similar hărții de război din jocuri de strategie mobile precum Rise of Kingdoms, dar aplicat la trivia).
- Controlul unei regiuni pe Harta Vie oferă bonusuri pasive membrilor guildei respective (ex: XP boost mic, monedă bonus) cât timp o dețin — creează un obiectiv pe termen lung, vizibil constant în aplicație, dincolo de meciurile individuale.
- Sezonier, cu reset parțial la fiecare sezon nou (aliniat cu resetul de rank din secțiunea 5), ca guildele mici să aibă mereu șansă reală de intrare în competiție.

### 14.5 Mod Co-op vs. Boss AI — provocare săptămânală PvE
- Un mod complet nou, **necompetitiv între jucători**: 2-4 prieteni formează echipă (folosind party queue din secțiunea 12.13) împotriva unui "Boss" — un set special de întrebări foarte grele, cu o temă rotativă săptămânală (ex: "Boss-ul Istoriei Antice"), unde echipa trebuie să acumuleze împreună un scor țintă într-un timp limitat.
- Diversifică experiența dincolo de PvP — util mai ales pentru jucători care vor să joace cu prietenii fără presiunea de a se învinge reciproc, și pentru conținut recurent săptămânal ușor de produs (doar un set nou de întrebări grele + o temă, nu cod nou).

### 14.6 Provocare cu miză — pariu social între prieteni (monedă moale, nu bani reali)
- Extensie directă a provocării directe din secțiunea 8.2: înainte de un duel amical cu un prieten, oricare din cei doi poate propune o **"miză"** în monedă moale (ex: 50 coins) — câștigătorul ia miza ambilor. Complet separat de bani reali (nicio conotație de gambling), doar un strat suplimentar de tensiune competitivă între prieteni, opțional și mereu vizibil/acceptat explicit de amândoi înainte de start.

### 14.7 Program Mentor-Discipol — mentorat formal, nu doar informal
- Extensie formalizată a ideii de coaching din secțiunea 7.5: jucătorii cu prestige/rank înalt se pot înscrie ca **"Mentori"** disponibili; sistemul îi potrivește automat cu jucători noi care activează opțiunea "vreau un mentor" (algoritm simplu de potrivire pe limbă/țară/disponibilitate orară).
- Ambii primesc recompense legate de **progresul real al discipolului** (ex: discipolul urcă de la T0 la T3 în trepte de încredere, secțiunea 2.5, sau atinge un prag de rank) — motivează mentori să investească timp real, nu doar să se înscrie pasiv, spre deosebire de un simplu "coaching" opțional necuantificat.

### 14.8 Cronica Personală — recap automat, stil "an în revistă"
- La finalul fiecărui sezon (sau lunar), aplicația generează automat un **card vizual de recap personal** (cele mai bune victorii, categoria la care ai fost cel mai bun, cel mai lung streak, evoluția de rank) — mecanică similară "Spotify Wrapped"/"Duolingo Year in Review", extrem de eficientă pentru distribuire organică pe rețele sociale externe.
- Suplimentar, un mic "on this day" — resurfacing periodic al unei realizări vechi ("Acum un an ai câștigat primul tău turneu") — aduce o notă de nostalgie/continuitate care crește atașamentul pe termen lung.

### 14.9 Replay Cinematic — highlight reel generat automat
- Pentru cele mai spectaculoase partide (comeback-uri mari, victorii FFA cu loc 1 dintr-un lobby de 8, finaluri strânse la departajare), sistemul generează automat un **scurt clip/story vizual** (câteva momente cheie animate din meci, nu doar un scor static) — jucătorul îl poate salva/distribui extern.
- Diferă de Cronica Personală (15.8, recap agregat pe termen lung) prin faptul că e generat **per meci individual**, imediat după un moment notabil — conținut de distribuit "la cald", motor de creștere organică prin partajare socială.

### 14.10 Program Poliglot — traduceri comunitare pentru extindere lingvistică
- Leagă direct de sistemul internațional (secțiunea 10): jucători de încredere (T4+, secțiunea 2.5) care vorbesc fluent 2+ limbi pot contribui la **traducerea/adaptarea culturală a întrebărilor** dintr-o limbă deja acoperită într-una nouă, aflată în pipeline de extindere.
- Contribuțiile trec prin aceeași coadă de moderare din admin panel (secțiunea 13.3), cu un rol/badge distinct **"Poliglot"** pe profil — accelerează exact procesul descris în secțiunea 10.5 ("extindere pe bază de cerere reală"), transformând extinderea lingvistică dintr-un cost intern pur în comunitate.

### 14.11 Mod Battle Royale extins — eveniment special periodic (20-50 jucători)
- Dincolo de FFA-ul standard de 4-8 jucători (secțiunea 12), un **mod de eveniment** (nu permanent, activat de admin panel — secțiunea 13.5) cu loturi mult mai mari (20-50 jucători), pe o hartă extinsă proporțional, cu eliminare progresivă mai agresivă (runde cu timp de răspuns tot mai scurt) — folosit ca eveniment de weekend/sărbătoare, nu ca mod standard (complexitatea de matchmaking/echilibrare pentru loturi atât de mari nu justifică menținerea lui permanentă, dar e un eveniment spectaculos de atras atenție periodic, similar modului "battle royale" ca eveniment special în alte jocuri live-service).

### 14.12 Model de date (extensie, cumulat pentru ideile de mai sus)

```
legendary_territories: territory_id, map_id, bonus_type, bonus_value
power_up_cards: id, type, effect_value, rarity
user_power_up_inventory: user_id, power_up_card_id, quantity
match_power_up_usage: match_id, user_id, power_up_card_id, round_number
world_map_regions: id, name, controlling_guild_id (nullable), season_id
world_map_contributions: guild_id, region_id, user_id, points_contributed, season_id
coop_boss_events: id, theme, week_starts_at, week_ends_at, target_score, question_set_id
coop_boss_attempts: event_id, party_id, members[], score_achieved, completed (bool)
friend_wagers: id, match_id, challenger_id, challenged_id, stake_coins, status (proposed|accepted|resolved), winner_id
mentorships: mentor_user_id, apprentice_user_id, started_at, apprentice_milestone_target, status (active|completed|ended)
season_recaps: user_id, season_id, recap_data (JSON), generated_at
match_highlights: id, match_id, user_id, highlight_type, media_asset_url, generated_at
polyglot_contributions: user_id, question_id, source_language_id, target_language_id, status (pending|approved|rejected)
```

### 14.13 Note pentru agenții de implementare
- Aceste 11 idei **nu sunt toate de aceeași prioritate** — recomand implementarea în ordinea: 15.2 (power-up-uri, impact mare pe engagement, cost mic), 15.6 (miză socială, cost minim, reutilizează duelul async din 8.2), 15.8 (recap sezonier, cost mic, impact viral mare), apoi restul pe baza capacității echipei — nu le construi pe toate simultan.
- 15.4 (Harta Vie) e cea mai costisitoare tehnic dintre toate (necesită un serviciu nou de stare persistentă pe termen lung, separat de starea efemeră de partidă din `backend/realtime`) — tratată explicit ca proiect separat, nu o extensie mică.
- 15.9 (Replay Cinematic) necesită o decizie tehnică explicită (ADR, conform `agents.md`) despre generarea de conținut vizual — animație pre-construită populată cu date reale de meci, nu video generat de AI de la zero, pentru cost și predictibilitate.

---

## 15. Idei suplimentare — runda 3 de features unicate (10 idei noi)

A treia rundă de idei, fiecare gândită să adauge ceva **structural diferit** — nu recompense noi peste mecanici vechi, ci moduri, formate de întrebare, straturi sociale sau canale de prezență complet noi.

### 15.1 Muzeul Personal
- Spațiu personal 3D/izometric, explorabil, în care jucătorul își aranjează spațial trofeele, achievements-urile rare și cosmeticele deblocate — nu o listă de showcase (secțiunea 3.4), ci un loc vizitabil de către prieteni.
- **Inspirat din:** camerele personalizabile din Animal Crossing/Habbo Hotel.
- **Notă de implementare:** poate reutiliza render-ul de cosmetice/avatar deja construit (secțiunea 4); complexitate principală e în editorul de plasare 3D/izometric, nu în date noi — candidat bun pentru o fază târzie (Faza 6+), cost UI ridicat.

### 15.2 Ora Marelui Duel
- Eveniment live, sincronizat pentru tot poolul regional/global (secțiunea 10), la o oră fixă zilnică — toți jucătorii online în acel moment primesc **exact aceeași întrebare, exact simultan**, ca un moment colectiv de emisiune live.
- **Diferă de Întrebarea Zilei** (secțiunea 8.1, asincronă) prin sincronizare reală — creează senzația de eveniment comun, nu doar activitate individuală paralelă.
- **Notă de implementare:** reutilizează motorul de rezolvare simultană din `backend/realtime` (secțiunea 12.14), scalat la un canal broadcast de masă în loc de o singură partidă — necesită testare de scalabilitate dedicată (mii de conexiuni simultane pe același eveniment).

### 15.3 Insignă de Sezon Vie
- Cosmetic care **evoluează vizual în timp real** pe parcursul sezonului (crește, se luminează, capătă detalii noi cu fiecare victorie majoră), în loc de o recompensă statică primită o singură dată.
- **Inspirat din:** cosmetice evolutive/"evolving skins" din shootere competitive moderne.
- **Notă de implementare:** necesită sistem de asset-uri cu stări progresive (5-10 variante vizuale per insignă, nu generare dinamică) — planificat cel mai simplu ca serie fixă de etape, nu animație continuă.

### 15.4 Contracte de Cunoaștere
- Provocări personale generate aleatoriu, cu recompense mari dar condiții specifice și fereastră scurtă de timp (ex: "câștigă 3 meciuri consecutive fără să pierzi teritoriu, în următoarele 2 ore") — spre deosebire de misiunile zilnice fixe (secțiunea 7.2), au variație mare și presiune de timp.
- **Inspirat din:** sistemul de "bounty"/profeții din Path of Exile.
- **Notă de implementare:** folosește același motor de template-uri parametrizate de la achievements/misiuni (secțiunile 3.1, 7.2), doar cu fereastră de expirare mult mai scurtă și pool de generare aleatorie la activare, nu fix.

### 15.5 Arborele Cunoașterii
- Skill tree vizual, ramificat, per categorie majoră — nu o bară de progres sau o listă de achievements, ci o hartă arborescentă pe care o "urci" deblocând subcategorii tot mai specifice, cu titluri/efecte vizuale la fiecare nod.
- **Diferă de skill rating** (secțiunea 11.2, un număr) prin faptul că oferă o reprezentare **vizuală, explorabilă** a progresului de cunoaștere, cu senzație de progres RPG tangibil.
- **Notă de implementare:** derivă direct din datele deja colectate în `user_skill_rating` per categorie (secțiunea 11.6) — stratul nou e vizualizarea, nu tracking-ul, care există deja.

### 15.6 Trivia Karaoke (mod vocal)
- Mod casual/party în care jucătorul răspunde **cu vocea**, prin recunoaștere vocală, în loc să atingă ecranul — gândit pentru joc local, mai mulți oameni în jurul unui singur telefon.
- **Diferă complet** de restul jocului (online-competitiv) prin faptul că e un mod social offline-cu-prietenii, nu competitiv online — extinde publicul dincolo de jucătorii solo.
- **Notă de implementare:** necesită integrare speech-to-text (on-device, pentru latență și cost — ex: API nativ Android de recunoaștere vocală, nu apel server pentru fiecare răspuns), și e complet izolat de sistemul de scor/rank (mod pur local, fără conexiune la server pentru rezultat).

### 15.7 Widget de pe ecranul de acasă
- Widget nativ Android, vizibil fără să deschizi aplicația: streak curent, Întrebarea Zilei în așteptare, memento de misiune neterminată.
- **Inspirat din:** widget-ul de streak al Duolingo — prezență pasivă constantă, mai puțin agresivă decât o notificare push.
- **Notă de implementare:** Flutter permite widget-uri native Android prin platform channels (`home_widget` sau echivalent) — implementare relativ ieftină, impact de retenție disproporționat de mare față de cost, candidat bun de prioritizat devreme în Faza 4.

### 15.8 Testament Digital (Legacy)
- La praguri foarte înalte de progres, sau la o pauză lungă anunțată voluntar, jucătorul poate alege să "lase moștenire" o parte din cosmetice/monedă unui prieten sau guildei lui.
- Transformă o pauză/retragere într-un gest social vizibil, nu o dispariție tăcută a contului — mecanică neobișnuită, cu încărcătură emoțională, nemaiîntâlnită ca atare în jocurile citate ca inspirație în restul documentului.
- **Notă de implementare:** flux simplu (transfer de itemi/monedă către un beneficiar ales, cu confirmare explicită, ireversibil) — atenție la abuz (nu trebuie să devină o portiță de a ocoli restricțiile Store/Shop, deci transferurile de monedă premium/gems ar trebui excluse sau limitate, doar coins/cosmetice necumpărate cu bani reali).

### 15.9 Modul Detectiv
- Tip nou de întrebare (dincolo de grilă și numeric, `plan.md` secțiunea 4): indicii dezvăluite progresiv despre un subiect ("e o persoană", "a trăit în secolul XIX"...), răspunsul se poate da oricând — cu cât mai devreme (mai puține indicii văzute), cu atât mai multe puncte.
- **Inspirat din:** Akinator/formatul "Cine sunt eu" — o variație reală de format de întrebare, nu doar o temă nouă peste formatul existent.
- **Notă de implementare:** necesită extindere de schemă la `questions` (câmp nou `type = deduction`, cu listă ordonată de indicii per întrebare) și logică nouă de scor (funcție descrescătoare de puncte pe măsură ce se dezvăluie indicii) — impact mediu asupra pipeline-ului de generare de întrebări (secțiunea 5 din `plan.md`), pentru că necesită un format de conținut diferit de grilă/numeric.

### 15.10 Liga Familiei
- Structură socială mică, separată de guilde (secțiunea 6, zeci de membri) și de prieteni (perechi, secțiunea 2.7) — un "cerc de familie" conectat prin invitație, cu clasament privat doar între ei și provocări blânde, potrivite pentru joc între generații diferite.
- Motivație: un mod prin care jocul devine motiv real de conectare între membri de familie de vârste/niveluri diferite, nu doar între jucători de skill apropiat — completează golul dintre "prieten 1:1" și "guildă mare, orientată spre competiție".
- **Notă de implementare:** reutilizează structura de bază `friendships`/`guild` (secțiunile 2.9, 6.7) cu un tip nou de grup mic (max 6-8 membri), fără cerințe de skill rating la intrare — cea mai ieftină idee din runda asta de implementat, aproape pur configurare peste sisteme deja existente.

### 15.11 Model de date (extensie, cumulat pentru ideile de mai sus)

```
museum_layouts: user_id, layout_data (JSON — poziții spațiale ale itemelor expuse)
mass_events: id, event_type (grand_duel_hour), scheduled_at, region_scope (country_id|language_id|global), question_id
evolving_badges: id, base_badge_id, stage_thresholds (JSON), current_stage_asset_map (JSON)
user_evolving_badge_progress: user_id, evolving_badge_id, current_stage, updated_at
knowledge_contracts: id, template_id, params (JSON), expires_at
user_knowledge_contracts: user_id, contract_id, status (active|completed|expired), accepted_at
knowledge_tree_nodes: id, category_id, parent_node_id, unlock_threshold, title, visual_asset_id
user_knowledge_tree_progress: user_id, node_id, unlocked_at
legacy_transfers: id, from_user_id, to_user_id (nullable), to_guild_id (nullable), items (JSON), coins_amount, status (pending|completed), created_at
deduction_questions: question_id, clues (JSON ordonat), max_points, point_decay_per_clue
family_leagues: id, name, created_by_user_id
family_league_members: family_league_id, user_id, joined_at
```

### 15.12 Note pentru agenții de implementare
- Cele mai ieftine de implementat, cu impact bun/cost mic — recomandate primele: **16.7 (widget ecran de acasă)**, **16.10 (Liga Familiei)**, **16.5 (Arborele Cunoașterii, doar strat de vizualizare peste date existente)**.
- Cele mai costisitoare/riscante — tratate explicit ca proiecte separate, nu extensii mici: **16.1 (Muzeul Personal, UI 3D dedicat)**, **16.2 (Ora Marelui Duel, scalabilitate de eveniment de masă)**, **16.9 (Modul Detectiv, format nou de conținut care afectează pipeline-ul de generare a întrebărilor)**.
- **16.8 (Testament Digital)** necesită o revizuire explicită de abuz/fraudă înainte de activare (posibilă portiță de ocolire a restricțiilor de monedă premium) — nu se lansează fără o regulă clară în acest sens, documentată printr-un ADR conform `agents.md`.

---

## 16. Integrare în roadmap-ul din `plan.md`

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
| Protecții cheltuieli reale (limite, control parental) | **Obligatoriu înainte de orice achiziție reală activă** — implementat odată cu 9.1-9.4, nu ulterior |
| Selectare țară/limbă la onboarding + matchmaking regional de bază (RO + pool global EN) | **Faza 2** — integrat direct în coada de matchmaking planificată deja acolo |
| Clasamente pe țară/global/prieteni | Faza 2-3, folosește aceleași date de rezultat de partidă |
| Localizare bancă de întrebări per limbă (RO + EN la lansare) | Faza 0-1 pentru generarea inițială, extins continuu conform secțiunii 5 din `plan.md` |
| Camere de chat pe limbă + detecție automată de limbă | Faza 3, în paralel cu restul sistemului de chat |
| Extindere la limbi/țări suplimentare | Post-lansare, pe bază de cerere reală măsurată |
| Dificultate calibrată empiric (elo de întrebare) | Faza 3, necesită volum minim de răspunsuri — pornește imediat ce Faza 2 generează date reale de joc |
| Skill rating per jucător/categorie + selecție adaptivă | Faza 3-4 |
| Anti-repetiție (istoric, cooldown, selecție ponderată) | **Faza 2**, integrat direct în livrarea de întrebări din `backend/realtime` — necesar de la primul multiplayer funcțional, nu se amână |
| Curbă de dificultate mai ridicată (distribuție per skill, timpi reduși la ranguri înalte) | Faza 4, necesită date reale de la Faza 3 pentru calibrare |
| Multiplayer FFA de bază (Duo + modul generic N=2..8, fără echipe/alianțe) | **Faza 2**, proiectat din start ca model generic (nu doar Duo hardcodat), conform notei tehnice din secțiunea 12.14 |
| Scalare hartă/teritorii pentru 4-8 jucători + rezolvare simultană de runde | Faza 2-3 |
| Rank FFA bazat pe plasament (stil Teamfight Tactics) | Faza 3, după ce ELO clasic Duo (Faza 2) e stabil |
| Grup organizat (Party queue) | Faza 3-4 |
| Mod Echipe + Alianțe temporare (FFA avansat) | Post-MVP, explicit după lansare (secțiunea 12.5) |
| Turnee individuale (Bracket + Arena) | Faza 5, reutilizează motorul de partidă existent |
| Clanuri/Guilde — fundație socială (nume, emblemă, chat) | Faza 5 (deja în listă mai sus, cf. secțiunea 7.4) |
| Turnee de guildă (Clan Wars) + ligă de guilde | Faza 5-6, necesită fundația de clanuri funcțională mai întâi |
| Idei noi de retenție (Întrebarea Zilei, Duel asincron, Rivalitate, Album, Provocare comunitară, Predicție spectator) | Faza 4-5, prioritizate individual pe baza capacității echipei — nu toate 6 simultan |
| Store & Shop — separare arhitecturală + validare chitanțe | Faza 4, înlocuiește/extinde implementarea de bază "monedă duală + magazin" din rândul de mai sus |
| Admin Panel — management utilizatori & moderare conținut (module de bază) | **Obligatoriu înainte de Faza 6 (lansare publică)** — fără el echipa nu poate răspunde la abuz real |
| Admin Panel — configurare parametri, dashboard analitice | Faza 5 |
| Admin Panel — sistem de evenimente (creare + recompense) | Faza 5, folosește template-urile de achievements/misiuni deja construite |
| Cărți de cunoștințe (power-up-uri) | Faza 4-5, doar moduri casual/private, exclus din ranked |
| Provocare cu miză între prieteni | Faza 4, extensie ieftină a duelului async (secțiunea 8.2) |
| Cronica Personală (recap sezonier) | Faza 5, impact viral mare pentru cost relativ mic |
| Roata Cunoașterii (categorie-surpriză) | Faza 4-5, variație de mod, cost redus |
| Program Mentor-Discipol | Faza 5-6, necesită bază de jucători suficient de mare pentru potrivire |
| Replay Cinematic (highlight reel) | Faza 5-6, necesită ADR tehnic dedicat (secțiunea 14.13) |
| Program Poliglot (traduceri comunitare) | Post-lansare, activat când apare cerere reală pentru o limbă nouă (secțiunea 10.5/10.8) |
| Teritorii Legendare (Capitale) | Faza 4, extensie a hărților existente, nu sistem separat |
| Mod Co-op vs. Boss AI | Faza 6, conținut recurent post-lansare |
| Harta Vie (campanie mondială de guildă) | Post-lansare, cel mai costisitor tehnic — proiect separat, necesită guildele (Faza 5) deja stabile |
| Mod Battle Royale extins (20-50 jucători) | Post-lansare, eveniment special periodic, nu mod permanent |
| Widget ecran de acasă (streak/misiuni) | Faza 4, cost mic, impact de retenție disproporționat de mare |
| Liga Familiei | Faza 5, configurare ieftină peste sisteme deja existente (prieteni/guilde) |
| Arborele Cunoașterii (vizualizare skill tree) | Faza 5, doar strat de vizualizare peste date deja colectate (secțiunea 11.2) |
| Contracte de Cunoaștere (provocări cu fereastră scurtă) | Faza 5, reutilizează motorul de template-uri de la achievements/misiuni |
| Insignă de Sezon Vie (cosmetic evolutiv) | Faza 5-6 |
| Ora Marelui Duel (eveniment sincronizat live) | Faza 6, necesită testare de scalabilitate dedicată |
| Muzeul Personal (spațiu 3D explorabil) | Post-lansare, cost UI ridicat |
| Modul Detectiv (tip nou de întrebare cu indicii) | Post-lansare, impact asupra pipeline-ului de generare a întrebărilor |
| Trivia Karaoke (mod vocal local) | Post-lansare, extensie de public, izolată tehnic de restul jocului |
| Testament Digital (Legacy) | Post-lansare, necesită ADR de anti-abuz înainte de activare |

**Notă pentru agenți de implementare:** actualizează `plan.md` secțiunea 10 (Roadmap) și secțiunea 4 (Modele de date) pentru a referenția acest fișier, în loc să dublezi conținutul acolo.