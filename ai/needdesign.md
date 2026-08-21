# Ce lipsește din panoul de admin și de ce

Fișier de lucru. Fiecare intrare descrie ceva care apare în referința de design,
nu e construit, motivul, și ce anume ar trebui făcut ca să existe.

Regula după care s-a lucrat: un buton care arată că merge dar nu face nimic e
mai rău decât unul dezactivat cu explicație. Tot ce e listat mai jos apare în
interfață în forma din referință, dar dezactivat, cu motivul în `title`.

Ultima actualizare: 17 august 2026, după pagina **All Players**.

---

## 1. Send Message (buton pe rând și în panoul de detaliu)

**Stare:** dezactivat.

**De ce:** nu există endpoint prin care panoul să trimită un mesaj unui jucător.
Modelele `Conversation`, `ConversationParticipant` și `Message` există și
susțin DM-uri între jucători, dar toate presupun doi participanți obișnuiți și
trec prin regulile de încredere din `backend/api/src/chat/trust-tier.ts`
(`canInitiateDm` cere treapta T2). Un mesaj de la administrație nu e un DM
între egali: nu trebuie să poată fi blocat, raportat sau ignorat de filtrele de
chat, și nu trebuie să ceară ca administratorul să aibă „treaptă de încredere".

**Cum ar trebui făcut:**

1. `ConversationType` primește o valoare nouă, `SYSTEM`.
2. `POST /admin/players/:id/message` cu corp `{ subject, body }`, restrâns la
   `@AdminRoles('ADMIN', 'SUPPORT', 'MODERATOR')`.
3. Serviciul creează (sau refolosește) o conversație `SYSTEM` între contul de
   sistem și jucător și scrie mesajul; ocolește `chatPermissionsFor`, dar scrie
   în `AdminAuditLog` cu acțiunea `player.message.send` și cu textul în
   `payload` (`AuditService` redactează deja câmpurile sensibile).
4. Aplicația Flutter afișează conversațiile `SYSTEM` într-o filă separată, fără
   câmp de răspuns.

**Decizie de luat:** poate jucătorul să răspundă? Dacă da, mesajele lui trebuie
să ajungă într-o coadă de suport, ceea ce înseamnă încă un model.

---

## 2. Add Note / Create Player Note

**Stare:** ambele butoane dezactivate.

**De ce:** nu există model pentru notele interne de cont. Nu se pot înghesui în
`AdminAuditLog`: auditul e o consemnare imuabilă a ce s-a întâmplat, iar o notă
e o observație editabilă și ștergibilă. Amestecate, prima își pierde valoarea
de probă.

**Cum ar trebui făcut:**

```prisma
model PlayerNote {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  authorId  String   @map("author_id") @db.Uuid
  body      String   @db.VarChar(2000)
  /// Notele fixate apar primele în panou.
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user   User @relation("PlayerNoteTarget", fields: [userId], references: [id], onDelete: Cascade)
  author User @relation("PlayerNoteAuthor", fields: [authorId], references: [id], onDelete: Restrict)

  @@index([userId, createdAt])
  @@map("player_notes")
}
```

Plus `GET/POST/PATCH/DELETE /admin/players/:id/notes`, fiecare scriere
consemnată în audit. În panoul de detaliu, notele intră ca secțiune proprie sub
`Linked Devices`.

---

## 3. Ban, distinct de Suspend

**Stare:** butonul `Suspend` funcționează (comută `users.banned_at` și revocă
sesiunile). Butonul `Ban` e dezactivat.

**De ce:** în modelul actual nu există nicio diferență între cele două. Există
un singur câmp, `users.banned_at`, fără motiv, fără durată și fără legătură cu
o contestație. Două butoane care scriu în același câmp ar fi o minciună de
interfață: administratorul ar crede că a aplicat o sancțiune mai grea decât cea
de dinainte, fără ca nimic din sistem să fie de acord.

**Cum ar trebui făcut:**

```prisma
enum SanctionKind { SUSPENSION @map("suspension") BAN @map("ban") }

model Sanction {
  id         String       @id @default(uuid()) @db.Uuid
  userId     String       @map("user_id") @db.Uuid
  actorId    String       @map("actor_id") @db.Uuid
  kind       SanctionKind
  reason     String       @db.VarChar(500)
  /// `null` = permanent. Suspendările au termen; ban-urile de regulă nu.
  expiresAt  DateTime?    @map("expires_at")
  liftedAt   DateTime?    @map("lifted_at")
  liftedById String?      @map("lifted_by") @db.Uuid
  createdAt  DateTime     @default(now()) @map("created_at")

  @@index([userId, createdAt])
  @@map("sanctions")
}
```

`users.banned_at` rămâne ca sold denormalizat pentru citirea rapidă din
`AuthService.validateAccessUser` (care deja respinge conturile suspendate), dar
adevărul devine `sanctions`. Ecranul **Bans / Suspensions** din meniu se
construiește direct peste acest tabel, iar **Appeals** se leagă de `sanctionId`.

---

## 4. Faction / Campaign

**Stare:** filtrul „All Factions" din referință a fost înlocuit cu **All Plans**
(Premium / Free), care e real. Câmpul `Faction / Campaign` din panoul de detaliu
afișează „—" cu motivul la hover.

**De ce:** nu există model de sezon, facțiune sau teritoriu persistent. Partidele
folosesc hărți hexagonale generate per meci, fără stăpânire între meciuri.

**Cum ar trebui făcut:** e primul bloc din `docs/` care lipsește în întregime —
`Season`, `Faction`, `County`, `Territory`, `FactionMembership`. Până atunci,
orice coloană „facțiune" într-un tabel de jucători e decorativă. Vezi și
paginile din secțiunea **Campaigns**, toate marcate „Planificat".

---

## 5. Avg Session Time (cardul al șaselea)

**Stare:** cardul e construit, afișează „—" cu motivul la hover.

**De ce:** `user_sessions` ține **sesiuni de autentificare** — perechea de
token-uri refresh. Durata lor se măsoară în zile, nu în minute. `lastSeenAt -
createdAt` ar da un număr, dar acel număr nu e „cât a jucat cineva"; ar fi o
cifră greșită cu încredere, exact lucrul pe care panoul îl evită peste tot.

**Cum ar trebui făcut:** o sesiune de joc e altceva și trebuie măsurată separat.
Cel mai ieftin: `backend/realtime` marchează conectarea și deconectarea pe
`/game` și scrie perechi într-un tabel `PlaySession { userId, startedAt,
endedAt }`. Media pe 24 h devine atunci o interogare directă. Alternativ, se
poate deduce din `matches.started_at`/`ended_at` grupat pe jucător, dar asta
măsoară doar timpul petrecut în meci, nu în aplicație — dacă se alege varianta
asta, eticheta trebuie să devină „Avg Match Time".

---

## 6. Filtrul „All Platforms"

**Stare:** neconstruit; locul lui e ocupat de **All Plans**.

**De ce:** `user_sessions.device_label` e text liber, pus de client. Se poate
număra (de acolo vine „Linked Devices", care e real), dar nu se poate filtra pe
el fără o normalizare: „Pixel 8", „SM-G991B" și „iPhone15,2" ar fi trei
platforme distincte.

**Cum ar trebui făcut:** `UserSession` primește `platform` ca enum
(`ANDROID | IOS | WEB`), completat la autentificare din antetul clientului, nu
ghicit din `deviceLabel`. Abia atunci filtrul are ce interoga.

---

## 7. Steagurile de țară

**Stare:** coloana **Region** afișează codul ISO într-o pastilă plus numele
complet al țării (din `Intl.DisplayNames`, deci fără nimic adăugat în bundle).
Referința arată steaguri.

**De ce:** emoji-urile de steag (`🇷🇴`) nu se redau pe Windows în browserele pe
Chromium — apar ca două litere într-un dreptunghi. Cum panoul e folosit exact
acolo, ar fi arătat rupt tocmai la utilizator.

**Cum ar trebui făcut:** un sprite SVG cu steagurile țărilor care apar efectiv,
încărcat leneș, sau pachetul `flag-icons` limitat la subsetul folosit. Nu merită
făcut până nu există destui jucători cu `country_code` completat ca să se vadă
diferența.

---

## 8. Limba contului

**Stare:** câmpul `Country / Language` arată doar țara.

**De ce:** limba preferată nu se salvează pe cont; aplicația o citește din
setările telefonului la fiecare pornire.

**Cum ar trebui făcut:** `users.locale` (`VarChar(10)`), scris la înregistrare
din antetul `Accept-Language` și modificabil din setările aplicației. E și
condiția ca **Content / CMS → Translations** să aibă sens.

---

## 9. Sparkline pe trei dintre cardurile de sus

**Stare:** *Total Players* și *New Signups (24h)* au grafic; *Active Today*,
*Flagged Accounts* și *Premium Players* au spațiul rezervat, dar gol.

**De ce:** `/admin/players/stats` calculează seria de 30 de zile pentru total și
înscrieri (ambele derivă din `users.created_at`). Pentru celelalte trei ar
trebui istoric zilnic: câți erau activi în fiecare zi, câți semnalați, câți
plătitori. Primul se poate obține din `user_sessions`; celelalte două nu — starea
de „semnalat" și cea de „premium" sunt calculate în prezent, nu păstrate zi cu zi.

**Cum ar trebui făcut:** un tabel de agregate zilnice, scris de o sarcină
programată la miezul nopții:

```prisma
model DailyPlayerStat {
  day             DateTime @id @db.Date
  activePlayers   Int      @map("active_players")
  flaggedAccounts Int      @map("flagged_accounts")
  premiumPlayers  Int      @map("premium_players")
  @@map("daily_player_stats")
}
```

E și condiția pentru **Analytics → Retention**, care are nevoie de cohorte, nu
de fotografii ale prezentului.

---

## 10. Avatarele jucătorilor

**Stare:** avatar generat din id — gradient plus inițiale, stabil pentru același
cont.

**De ce:** conturile n-au poză în baza de date. O cerere către un serviciu extern
de avatare (Gravatar și celelalte) ar scurge către un terț numele sau hash-ul
e-mailului fiecărui jucător afișat în panou, la fiecare încărcare a listei.

**Cum ar trebui făcut:** dacă se adaugă avatare încărcate de jucători,
`UserProfile` primește `avatarUrl`, iar fișierele stau pe stocarea proprie, nu
la un terț. Avatarul generat rămâne ca rezervă pentru conturile fără poză.

---

## 11. Insigna de „verificat"

**Stare:** bifa albastră de lângă nume marchează **e-mail confirmat**
(`users.email_verified_at`).

**De ce e de discutat:** în referință bifa pare să însemne altceva — cont
notabil, creator, partener. Dacă asta era intenția, e nevoie de un câmp separat
(`users.verifiedAt` plus motivul), pentru că „și-a confirmat adresa" și „e un
cont recunoscut public" sunt două lucruri diferite, iar acum al doilea ar fi
acordat automat oricui apasă pe un link din e-mail.

---

## 12. Trust Score

**Stare:** funcțional, calculat în `trustScore()` din
`backend/api/src/admin/players.service.ts`, cu explicația completă întoarsă în
`basis` și afișată la hover.

**Formula, provizorie:** bază 60, plus până la 20 din treapta de încredere din
chat (T0–T8), plus 10 pentru e-mail confirmat, plus 10 pentru 2FA, minus 5 pe
raport primit (maximum −40), minus 50 dacă e suspendat.

**Ce lipsește:** pragurile sunt hardcodate. `owner-plan.md` §2.5 cere ca treptele de încredere să fie editabile din panou. Când se face
ecranul **System → General Settings**, formula trebuie mutată într-un tabel de
configurație, iar `basis` să citeze valorile configurate, nu constantele.

---

## 13. „View Profile" ca pagină publică

**Stare:** butonul desfășoară în panou un bloc cu progresul real (level, XP, ELO,
meciuri, monede, gems, rapoarte, treaptă de chat).

**De ce nu duce la o pagină:** aplicația web nu are rută de profil public.
`GET /players/:username` există în API și e folosit de aplicația Flutter.

**Cum ar trebui făcut:** o rută `/players/:username` în `web/client/src/App.tsx`
peste endpointul existent. E o pagină publică, nu una de admin, deci intră mai
degrabă în lucrul la site decât în panou.

---

## 14. Limite deliberate, nu lipsuri

Notate ca să nu fie „reparate" din greșeală:

- **Acțiunile în masă sunt plafonate la 100 de conturi** pe cerere
  (`BULK_LIMIT` în `players.controller.ts`). O operație de disciplină nu se
  poate anula; o cerere care ar atinge mai mult e aproape sigur o greșeală de
  selecție.
- **Exportul CSV păstrează e-mailul mascat.** Un fișier descărcat pleacă de sub
  controlul panoului. Adresa completă se obține una câte una, prin
  `POST /admin/players/:id/reveal-email`, care se consemnează în audit.
- **Exportul „toate rezultatele" aduce cel mult 100 de rânduri**, limita
  `pageSize` a endpointului. Pentru extrageri mari e nevoie de un export
  asincron care produce fișierul pe server și trimite un link — altfel o cerere
  cu sute de mii de rânduri ține un proces ocupat până la timeout.
- **Un administrator nu se poate suspenda singur** printr-o acțiune în masă;
  propriul cont e sărit și raportat separat în răspuns.
- **Sortarea după „Last Online" e reală**, prin `LEFT JOIN LATERAL` peste
  `user_sessions`. Nu se poate face prin clientul Prisma, de aceea listarea din
  `PlayersService.list` e scrisă în SQL parametrizat.
