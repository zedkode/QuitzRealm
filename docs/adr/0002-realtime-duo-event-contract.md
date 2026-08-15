# ADR 0002: Contractul realtime pentru bootstrap-ul Duo

## Context

Pasul 4 cere un serviciu Socket.IO separat, autentificare cu JWT emis de API,
matchmaking `duo`, stare live în Redis și validare server-side a răspunsului.
Contractele evenimentelor și limita exactă a partidei de bootstrap nu erau încă
stabilite în `plan.md`.

## Decizie

Folosim un serviciu NestJS separat în `backend/realtime`, cu namespace-ul
Socket.IO `/game`. Coada FIFO, maparea utilizator–socket, lock-urile și starea
partidei sunt păstrate în Redis. Clientul trimite numai `matchId` și valoarea
răspunsului; întrebarea completă, răspunsul corect, scorul, teritoriul și
rezultatul rămân autoritatea serverului.

Pentru verificarea bootstrap-ului, un meci `duo` are o singură rundă. După
adjudecare, realtime apelează endpoint-ul intern al API-ului pentru persistare și
recalcul ELO. Contractul complet este documentat în `backend/realtime/EVENTS.md`.

## Consecințe

- Niciun payload de client nu poate declara un răspuns corect sau un câștigător.
- Un restart de proces nu elimină starea autoritativă a meciului din Redis.
- Operațiile concurente pe același meci sunt serializate cu lock Redis.
- Dacă persistarea eșuează, starea devine `persistence_failed` și nu se emite
  `match:finished`.
- Reconectarea, matchmaking-ul ELO și meciurile cu mai multe runde rămân pentru
  Faza 2, fără a fi simulate în bootstrap.
