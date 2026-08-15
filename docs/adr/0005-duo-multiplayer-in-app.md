# ADR 0005 — Duel Duo online în aplicație, pe runde multiple

**Dată:** 2026-08-15
**Status:** Acceptat
**Fază:** `plan.md` Faza 2 — Multiplayer MVP

## Context

Bootstrap-ul livrase un serviciu realtime funcțional, dar partida `duo` se încheia
**după o singură rundă** (vezi nota din `EVENTS.md`), iar aplicația Flutter nu avea
niciun client de multiplayer. `passed.md` cerea, pe bună dreptate, să nu se înceapă
Faza 2 pe baza excepției de la Pasul 6; proprietarul a cerut ulterior, explicit,
continuarea cu ce urmează în `plan.md`.

Între timp, blocajul principal s-a redus: banca are acum 14 întrebări `APPROVED`
(pachetul curatoriat cu surse oficiale), suficient pentru partide reale.

## Decizie

1. **Partidă pe runde multiple.** `MATCH_TOTAL_ROUNDS` (implicit 5) controlează
   lungimea unei partide `duo`. Serverul:
   - închide runda când ambii au răspuns sau la expirarea deadline-ului;
   - emite `round:result` cu `correctAnswer` (dezvăluit **doar** după închidere);
   - pornește automat runda următoare cu o întrebare nefolosită în partida curentă
     (`usedQuestionIds`), sau încheie partida dacă banca nu mai poate livra una;
   - persistă rezultatul **o singură dată**, la finalul partidei.
2. **Timpul de răspuns se măsoară per rundă** (`roundStartedAt`), nu de la începutul
   partidei — altfel teritoriul ar fi mers mereu la cine a răspuns în prima rundă.
3. **Client Flutter.** Un singur `RealtimeClient` în `core/network/` vorbește
   Socket.IO și traduce evenimentele brute în tipurile din `domain/duel/`.
   `DuelController` (Riverpod) ține starea; widget-urile nu ating socket-ul.
4. **Clientul nu decide nimic.** Nu primește `correctAnswer` înainte de a răspunde,
   nu calculează scor și nu declară câștigător. Scorul afișat este cel cumulat de
   server, păstrat între runde în starea locală doar pentru afișare.
5. **Contul este obligatoriu pentru duel** (JWT la handshake), dar rămâne opțional
   pentru campania offline.

## Consecințe

- Duelul 1v1 se joacă efectiv de pe telefon, contra unui alt jucător real:
  matchmaking → 5 runde → rezultat persistat → ELO recalculat.
- `backend/realtime/scripts/sparring-partner.js` permite testarea 1v1 de pe un
  singur dispozitiv. **Nu** este botul de joc din Faza 2: alege la întâmplare,
  fiindcă un client nu are voie să știe răspunsul corect.
- Rămân neimplementate din Faza 2: reconectarea cu păstrarea locului (60-90s),
  partidele private cu cod, boții configurabili și ecranul de clasament.
- `EVENTS.md` reflectă contractul nou (`totalRounds`, `correctAnswer`, `answer`,
  `roundsPlayed`).
