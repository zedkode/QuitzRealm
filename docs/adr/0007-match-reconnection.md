# ADR 0007 — Reconectare în partidă cu păstrarea locului

**Dată:** 2026-08-15
**Status:** Acceptat
**Fază:** `plan.md` Faza 2 („Mod Duo 1v1 complet funcțional online, cu
reconectare de bază”), `init.md` Pas 7 („Reconectare la deconectare, păstrarea
locului 60-90s”)

## Context

Până acum, o pierdere de conexiune în timpul unui duel era ireversibilă: nu
exista un traseu de revenire, iar rundele continuau să se închidă pe expirarea
deadline-ului, cu jucătorul absent primind timeout după timeout. Pe mobil, unde
trecerea Wi-Fi ↔ date mobile rupe socket-ul în mod normal, asta transformă un
incident de rețea de trei secunde într-o înfrângere.

## Decizie

1. **Deconectarea pune partida în pauză, nu o încheie.** Starea din Redis capătă
   `status = 'paused'`, `pausedAt` și `resumeDeadlineAt`. Cheia
   `user:<id>:match` **nu** se șterge, deci locul rămâne rezervat.
2. **Fereastra de grație e 75 s implicit** (`RECONNECT_GRACE_MS`), plafonată la
   90 s, în banda de 60-90 s cerută de `init.md`. Valori mai mici sunt permise
   doar ca să nu dureze testele un minut.
3. **Cronometrul rundei îngheață.** La reluare, `roundStartedAt` și `deadlineAt`
   se translatează cu durata pauzei. Consecință: nici jucătorul rămas conectat
   nu pierde timp de gândire, iar timpii de răspuns raportați rămân comparabili
   între cei doi. Alternativa — să lăsăm ceasul să curgă — ar fi pedepsit un
   jucător pentru rețeaua celuilalt.
4. **La revenire, serverul trimite un instantaneu complet** (`match:state`)
   doar către socket-ul care s-a reconectat: rundă, scoruri cumulate, întrebarea
   curentă și, per jucător, `hasAnswered` + `connected`.
   - `hasAnswered` spune *dacă* s-a răspuns, niciodată *ce* s-a răspuns.
     `correctAnswer` rămâne exclusiv în `round:result`, ca până acum. Un
     instantaneu care ar conține răspunsul adversarului ar fi un canal de
     scurgere exact în momentul în care jucătorul încă poate răspunde.
   - Nici clientul nu recuperează ce a trimis înainte de cădere: selecția se
     resetează, pentru că singura sursă de adevăr e serverul, iar el nu o expune.
5. **`session:ready` transportă `activeMatchId`.** Fără el, clientul reconectat
   ar trimite `matchmaking:join`, care e respins pentru cine are deja o partidă,
   și ar ateriza într-o stare de eroare în loc să-și reia meciul.
6. **Expirarea grației înseamnă abandon**, cu `endedBy: 'forfeit'` în
   `match:finished`: absentul primește `LOSS`, cel rămas `WIN`. **Dacă au plecat
   toți, rezultatul e `DRAW`** — nimeni nu câștigă o partidă pe care n-a
   jucat-o nimeni, și nici nu se acordă ELO pentru o deconectare dublă.
7. **Socket-ul vechi care se închide după reconectare e ignorat**, prin
   compararea `player.socketId` cu socket-ul care se deconectează. Ordinea
   „conectare nouă înainte de evenimentul de disconnect al celei vechi” e
   frecventă și altfel ar pune imediat pe pauză o partidă tocmai reluată.

## Consecințe

- O cădere scurtă de rețea nu mai costă partida; una lungă costă, dar explicit
  și cu un rezultat corect persistat.
- Abandonul deliberat („închid aplicația când pierd”) devine o înfrângere după
  75 s, nu o partidă suspendată la nesfârșit.
- Apare o stare nouă în client (`DuelPhase.reconnecting`) și un banner de
  „adversarul lipsește”, cu numărătoare inversă a ferestrei de revenire.
- Rămâne neacoperit: reconectarea **între** partide (rematch-ul pornește un flux
  nou) și persistarea parțială a unei partide întrerupte de o cădere a
  serviciului realtime — starea trăiește în Redis cu TTL, nu în Postgres.
