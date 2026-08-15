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

Adaugă jucătorul în coada FIFO `duo`. Identitatea și socket-ul sunt determinate
server-side din sesiunea autentificată. Endpoint-ul este limitat la 10 cereri pe
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

## Evenimente server → client

### `session:ready`

```json
{ "userId": "uuid", "activeMatchId": "uuid" }
```

Confirmă că handshake-ul JWT a fost validat și sesiunea a fost înregistrată în
Redis. `activeMatchId` este `null` dacă jucătorul nu are o partidă în desfășurare;
când are, clientul **nu** trebuie să trimită `matchmaking:join` — serverul îl
repune singur în partidă și îi trimite `match:state`.

### `matchmaking:queued` / `matchmaking:left`

```json
{ "mode": "duo" }
```

### `matchmaking:rejected`

```json
{ "mode": "duo", "reason": "email_not_verified" }
```

Răspuns la `matchmaking:join` când contul nu are dreptul să joace ranked
(`docs/features-social-progression.md` §1.3). Jucătorul **nu** a fost adăugat în
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
  "totalRounds": 5,
  "players": [{ "userId": "uuid" }, { "userId": "uuid" }]
}
```

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

