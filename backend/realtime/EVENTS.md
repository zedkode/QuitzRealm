# Contract evenimente Socket.IO — QuizRealm realtime

Namespace: `/game`

Autentificarea are loc la handshake prin `auth.token` sau header-ul
`Authorization: Bearer <JWT>`. Serverul validează semnătura și expirarea JWT cu
același `JWT_ACCESS_SECRET` folosit de API. Un client neautentificat primește
`server:error` și este deconectat.

## Evenimente client → server

### `matchmaking:join`

```json
{ "mode": "duo" }
```

Pentru un lobby Clasic public de 4–8 jucători:

```json
{ "mode": "classic", "playerCount": 4 }
```

Adaugă jucătorul în coada FIFO separată după mod și dimensiune. Duo are implicit
2 participanți; Clasic cere explicit `playerCount` între 4 și 8. Identitatea și
socket-ul sunt determinate server-side din sesiunea autentificată. Evenimentul
este limitat la 10 cereri pe
minut și utilizator.

### `matchmaking:leave`

Fără payload. Elimină jucătorul autentificat din coadă.

### `round:answer`

```json
{
  "matchId": "uuid",
  "answer": "4"
}
```

Clientul trimite numai valoarea răspunsului. Nu trimite `isCorrect`, scor,
teritoriu sau rezultat. Serverul validează apartenența la meci, deadline-ul și
faptul că jucătorul nu a răspuns deja.

### `chat:match:join`

```json
{ "matchId": "uuid" }
```

Cere istoricul efemer și dreptul de scriere pentru chatul partidei. Serverul
compară `matchId` cu partida activă din Redis și verifică apartenența în starea
meciului; identificatorul primit de la client nu este o dovadă de acces.

### `chat:match:send`

```json
{ "matchId": "uuid", "content": "Bun duel!" }
```

Trimite text liber numai jucătorilor cărora API-ul le acordă acces
`ownMatches` sau `public`. Conturile T0 și minorii rămân la reacții presetate.
Linkurile, mutul, blocările și limita de mesaje sunt validate server-side.

### `chat:match:react`

```json
{ "matchId": "uuid", "reaction": "good_luck" }
```

Reacțiile acceptate sunt `good_luck`, `nice_move`, `wow` și `well_played`.
Sunt disponibile inclusiv pentru T0/minori, dar respectă mutul și rate limit-ul.

### `chat:global:join` / `chat:global:leave`

Fără payload. Intrarea în camera publică de chat (`docs/features-social-progression.md`
§2.2). La intrare, serverul răspunde cu `chat:global:history`.

### `chat:global:send`

```json
{ "content": "salut tuturor" }
```

Maximum 500 de caractere — mai scurt decât la mesajele private, pentru că
globalul e un flux comun și pereții de text îl fac ilizibil pentru toți.
Cere treapta **T2** (`globalChat: "public"`), email confirmat și cont de major.
Limitat la 5 mesaje / 10 secunde, pe utilizator, cu contorul în Redis — un
contor în memoria procesului s-ar înmulți cu numărul de instanțe.

### `chat:send`

```json
{ "conversationId": "uuid", "content": "hai la o revanșă" }
```

Mesaj într-o conversație persistentă (prieteni sau DM acceptat). Realtime **nu**
scrie în baza de date: trimite mai departe la `POST /chat/internal/messages`,
deci verificările (mut, blocare, treaptă pentru linkuri, filtru de limbaj,
detecție de spam) sunt exact cele de pe ruta REST. Două căi cu reguli proprii ar
diverge tocmai acolo unde contează.

## Evenimente server → client

### `chat:match:history`

```json
{
  "matchId": "uuid",
  "access": "reactions",
  "messages": []
}
```

Răspuns la `chat:match:join`. `access` este `reactions` sau `text`; clientul îl
afișează, dar serverul reverifică permisiunea la fiecare trimitere. Istoricul
stă numai în Redis, maximum 50 de mesaje, cu expirare la o oră.

### `chat:match:message`

```json
{
  "id": "uuid",
  "matchId": "uuid",
  "senderId": "uuid",
  "senderName": "Cavalerul",
  "kind": "reaction",
  "content": "well_played",
  "createdAt": "2026-08-15T19:00:00.000Z"
}
```

Este emis numai în camera `match:<matchId>`. `kind` este `text` sau `reaction`.
Perechile blocate sunt excluse din livrare.

### `chat:rejected` (scope `match`)

```json
{ "scope": "match", "matchId": "uuid", "reason": "tier_too_low" }
```

Motive posibile: `not_in_match`, `tier_too_low`, `muted`, `rate_limited`,
`links_not_allowed` și `invalid`.

### `chat:global:history`

```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "Cavalerul Zorilor",
      "content": "salut",
      "createdAt": "2026-08-15T21:00:00.000Z"
    }
  ]
}
```

Ultimele mesaje din camera globală, ca ecranul să nu se deschidă gol. Chatul
global e **efemer** (§2.8): trăiește doar în Redis, cel mult 100 de mesaje cu
TTL de 24 h, atât cât un raport mai are rost. Nu ajunge în Postgres.

### `chat:global:message`

Același obiect ca un element din `chat:global:history`.

Livrarea respectă blocările în **ambele sensuri**: mesajul nu se trimite deloc
către cei blocați sau care l-au blocat pe expeditor. Blocarea trebuie să
însemne „nu-l mai văd”, nu doar „nu-l mai afișez”.

### `chat:message`

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "hai la o revanșă",
  "createdAt": "2026-08-15T21:00:00.000Z"
}
```

Mesaj persistent livrat expeditorului și fiecărui participant, în camera lui
personală `user:<id>`. `content` e textul **stocat**, deci profanitatea vine
deja mascată — clientul nu poate afișa altceva decât s-a salvat.

### `chat:rejected` (scope `global` / `direct`)

```json
{ "scope": "global", "reason": "tier_too_low" }
```

Motive la `global`: `tier_too_low`, `muted`, `rate_limited`, `invalid`.
La `direct`, `reason` e `refused`, iar `message` conține explicația venită de la
API (treaptă prea mică pentru linkuri, cerere de mesaj neacceptată, blocare).

### `friends:presence`

```json
{ "userId": "uuid", "status": "online" }
```

Prezența din §2.3, trimisă **doar prietenilor** — nu e o difuzare globală, ci o
notificare țintită către camerele lor personale. `status` este `online` sau
`offline`.

### `session:ready`

```json
{ "userId": "uuid", "activeMatchId": "uuid", "friendsOnline": ["uuid"] }
```

Confirmă că handshake-ul JWT a fost validat și sesiunea a fost înregistrată în
Redis. `activeMatchId` este `null` dacă jucătorul nu are o partidă în desfășurare;
când are, clientul **nu** trebuie să trimită `matchmaking:join` — serverul îl
repune singur în partidă și îi trimite `match:state`.
`friendsOnline` conține prietenii conectați în acel moment, ca lista de prieteni
să nu arate pe toată lumea offline până se mișcă cineva.

### `matchmaking:queued` / `matchmaking:left`

```json
{ "mode": "duo", "playerCountTarget": 2, "lobbyType": "public" }
```

### `matchmaking:rejected`

```json
{ "mode": "duo", "reason": "email_not_verified" }
```

Răspuns la `matchmaking:join` când contul nu are dreptul să joace ranked
(`owner-plan.md` §1.3). Jucătorul **nu** a fost adăugat în
coadă. Motive posibile:

| `reason` | Înțeles |
|---|---|
| `email_not_verified` | Adresa de email nu e confirmată încă. |
| `account_restricted` | Emailul e confirmat, dar contul e restricționat din alt motiv. |

Capabilitățile se citesc la fiecare cerere din `GET /users/internal/:id/capabilities`,
nu din tokenul de acces: altfel un jucător care tocmai și-a confirmat emailul ar
mai aștepta până la 15 minute, cât trăiește tokenul.

### `match:found`

```json
{
  "matchId": "uuid",
  "mode": "duo",
  "playerCountTarget": 2,
  "lobbyType": "public",
  "totalRounds": 5,
  "players": [{ "userId": "uuid" }, { "userId": "uuid" }]
}
```

În Clasic, `mode` este `classic`, lista are 4–8 participanți, iar răspunsurile
sunt păstrate până la expirarea ferestrei. Runda este apoi rezolvată o singură
dată, atomic. Duo păstrează compatibilitatea existentă și poate închide fereastra
mai devreme după ce ambii jucători au răspuns.

### `round:started`

Emis la începutul fiecărei runde, inclusiv al primei.

```json
{
  "matchId": "uuid",
  "roundNumber": 1,
  "totalRounds": 5,
  "deadlineAt": "2026-08-14T16:00:12.000Z",
  "question": {
    "id": "uuid",
    "type": "MULTIPLE_CHOICE",
    "categoryId": "uuid",
    "difficulty": 1,
    "text": "Cât fac doi plus doi?",
    "options": ["3", "4", "5", "6"],
    "language": "ro"
  }
}
```

`correctAnswer` nu este transmis niciodată clientului.

### `round:answer-accepted`

```json
{ "matchId": "uuid" }
```

Confirmă numai înregistrarea răspunsului, nu corectitudinea lui.

### `round:result`

```json
{
  "matchId": "uuid",
  "roundNumber": 1,
  "totalRounds": 5,
  "correctAnswer": "4",
  "players": [
    {
      "userId": "uuid",
      "score": 1,
      "territoriesWon": 1,
      "isCorrect": true,
      "answer": "4",
      "responseTimeMs": 820
    }
  ]
}
```

Pentru grilă, fiecare răspuns corect primește un punct, iar cel mai rapid
răspuns corect câștigă teritoriul. Pentru numeric, valoarea validă cea mai
apropiată primește un punct și teritoriul; la egalitate, ambii primesc punctul,
dar teritoriul nu se acordă.

`correctAnswer` apare **numai aici**, după închiderea rundei — niciodată în
`round:started`. `score` și `territoriesWon` sunt cumulate pe toată partida.

Dacă runda încheiată nu este ultima, serverul emite imediat după acest eveniment
un nou `round:started`, cu o întrebare nefolosită în partida curentă.

## Reconectare

Când un jucător pierde conexiunea în timpul unei partide active, partida **nu se
încheie**: intră în pauză, iar locul îi rămâne rezervat `RECONNECT_GRACE_MS`
(implicit 75 s, în banda de 60-90 s cerută de `init.md`). Cronometrul rundei este
înghețat, deci jucătorul rămas conectat nu pierde timp de gândire.

### `match:paused`

```json
{
  "matchId": "uuid",
  "disconnectedUserId": "uuid",
  "resumeDeadlineAt": "2026-08-15T16:01:27.000Z"
}
```

Emis către camera partidei. Cât timp partida e în pauză, `round:answer` este
respins, iar runda nu se închide la expirarea deadline-ului.

### `match:state`

Emis **numai către socket-ul care tocmai s-a reconectat**, imediat după
`session:ready`. Conține tot ce îi trebuie clientului ca să redeseneze partida.

```json
{
  "matchId": "uuid",
  "mode": "duo",
  "playerCountTarget": 2,
  "lobbyType": "public",
  "status": "active",
  "roundNumber": 3,
  "totalRounds": 5,
  "deadlineAt": "2026-08-15T16:01:39.000Z",
  "resumeDeadlineAt": null,
  "question": { "id": "uuid", "type": "MULTIPLE_CHOICE", "text": "…", "options": ["…"] },
  "players": [
    {
      "userId": "uuid",
      "score": 2,
      "territoriesWon": 1,
      "hasAnswered": false,
      "connected": true
    }
  ]
}
```

`hasAnswered` spune doar *dacă* s-a răspuns, niciodată *ce* s-a răspuns:
răspunsul adversarului la runda în curs și `correctAnswer` rămân ascunse până la
`round:result`.

### `match:resumed`

```json
{
  "matchId": "uuid",
  "reconnectedUserId": "uuid",
  "deadlineAt": "2026-08-15T16:01:39.000Z"
}
```

Emis către cameră când toți jucătorii sunt din nou conectați. `deadlineAt` este
deja translatat cu durata pauzei — clientul își repornește cronometrul de la
această valoare, nu de la cea dinaintea pauzei.

### `match:finished`

```json
{
  "matchId": "uuid",
  "roundsPlayed": 5,
  "endedBy": "rounds",
  "players": [
    {
      "userId": "uuid",
      "territoriesWon": 3,
      "score": 3,
      "result": "WIN"
    }
  ]
}
```

Partida `duo` se joacă pe `MATCH_TOTAL_ROUNDS` runde (implicit 5) și se încheie
după ultima rundă. Rezultatul se persistă o singură dată, la final. Dacă banca
de întrebări nu mai poate livra o întrebare nefolosită, partida se încheie mai
devreme, cu scorul acumulat până în acel moment.

`endedBy` este `"rounds"` când s-au jucat rundele și `"forfeit"` când un jucător
nu s-a mai reconectat în fereastra de grație. La abandon, cel absent primește
`LOSS`, iar cel rămas `WIN`; dacă au plecat toți, rezultatul e `DRAW` pentru
ambii — nimeni nu câștigă o partidă pe care n-a jucat-o nimeni.

### `match:error` / `server:error`

```json
{ "matchId": "uuid", "message": "Mesaj sigur pentru client" }
```

`match:error` este emis dacă rezultatul calculat nu poate fi persistat în API.
Starea rămâne în Redis cu `status = persistence_failed`; nu se raportează fals
un meci finalizat.

---

## Teritorii (mod Clasic)

Câmpurile de mai jos apar **doar** la partidele `classic`. La `duo` lipsesc
complet: modul acela n-are hartă, iar `territoriesWon` rămâne un simplu contor.

Harta e generată **pe server** și trimisă clientului. Clientul n-o calculează
niciodată singur — două calcule independente ar putea diverge, iar doi jucători
ar vedea hărți diferite ale aceleiași partide.

### `round:result` — câmp adițional

```json
{
  "territory": {
    "ownership": { "t0": "user-a", "t1": null, "t2": "user-b" },
    "contestedTerritoryId": "t7"
  }
}
```

- `ownership` — proprietarul fiecărui teritoriu; `null` = liber, încă necucerit.
- `contestedTerritoryId` — teritoriul liber pus în joc în runda **următoare**;
  `null` când nu mai există teritorii libere (partida a intrat în faza de luptă).

Teritoriul contestat e ales cu preferință pentru granițele existente. Fără asta,
harta s-ar umple în pete rupte între ele, iar faza de luptă ar începe cu jucători
care n-au granițe comune și deci n-au pe cine ataca.

### `match:snapshot` — câmpuri adiționale

Pe lângă `territory`, snapshotul conține și `territoryMap`: harta întreagă, cu
teritoriile, coordonatele lor hexagonale și adiacența explicită.

```json
{
  "territoryMap": {
    "playerCount": 4,
    "territories": [
      { "id": "t0", "coordinates": { "q": 0, "r": 0 }, "neighbourIds": ["t1", "t2"] }
    ],
    "bases": { "user-a": ["t3", "t19"] }
  }
}
```

Harta apare **doar în snapshot**, nu la fiecare rundă: e imuabilă pe toată
partida, iar retrimiterea ei la fiecare răspuns ar fi risipă de bandă. Clientul o
primește la intrare și la reconectare, apoi actualizează doar `ownership`.

Adiacența e reciprocă și verificată prin teste: dacă A îl vede pe B ca vecin dar
B nu-l vede pe A, faza de atac ar permite lovituri într-un singur sens.

### Faza de luptă (`classic`)

Când nu mai există teritorii libere, partida trece automat în faza de luptă:
`contestedTerritoryId` devine `null`, iar cucerirea se face prin atacuri.

**Client → server: `battle:declare-attack`**

```json
{ "matchId": "…", "territoryId": "t12" }
```

Serverul verifică adiacența: ținta trebuie să fie vecină cu un teritoriu deținut
de atacator. Clientul poate ascunde restul, dar nu poate fi crezut pe cuvânt.
Un spectator (jucător fără teritorii) primește eroare.

**Server → client: `battle:attack-declared`** — confirmare trimisă **doar
atacatorului**. Ținta e informație tactică; ceilalți o află abia la rezolvare.

**`round:result` — câmp adițional `conquests`**

```json
{
  "conquests": [
    { "territoryId": "t12", "winnerId": "user-a", "previousOwnerId": "user-b" }
  ]
}
```

Regulile de rezolvare (§12.3 faza 2), aplicate simultan pentru toate țintele:

1. contează doar atacatorii care au **răspuns corect**; dacă niciunul n-a
   nimerit, teritoriul rămâne la proprietar — apărarea reușește implicit;
2. la mai mulți atacatori pe aceeași țintă câștigă **cel mai rapid** dintre cei
   corecți;
3. un răspuns corect fără timp măsurat pierde în fața unuia cronometrat, altfel
   absența unei valori ar fi mai bună decât un răspuns real;
4. la timpi identici departajează identificatorul, ca rezultatul să nu depindă de
   ordinea cheilor dintr-un obiect.

Declarațiile **nu se moștenesc** între runde: fiecare rundă de luptă cere o țintă
nouă.
