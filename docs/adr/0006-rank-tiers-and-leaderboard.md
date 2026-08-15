# ADR 0006 — Trepte de rang și clasament global

**Dată:** 2026-08-15
**Status:** Acceptat
**Fază:** `plan.md` Faza 2 (leaderboard, ELO) + `docs/features-social-progression.md` §5
(„Sistem de rank” este mapat pe Faza 2 în secțiunea 9 a acelui document)

## Context

Faza 2 din `plan.md` cere „calcul ELO, leaderboard simplu”. ELO-ul funcționa deja și
se persista la finalul partidelor duo, dar nu era vizibil nicăieri: nici ca rang, nici
ca poziție în clasament. `docs/features-social-progression.md` §5 definește structura
de ranguri cu minimum 20 de trepte.

## Decizie

1. **Treptele de rang sunt configurație statică în cod**
   (`backend/api/src/ranks/rank-tiers.ts`), calculate din `users.elo_rating`.
   - Nu am creat tabelele `rank_tiers` / `user_rank` din §5.4. Motiv: la acest stadiu
     nu există date de utilizator suplimentare de stocat — treapta este o funcție pură
     de ELO, iar o a doua sursă de adevăr ar putea diverge de `elo_rating`.
   - Sezoanele, meciurile de plasare, promovarea cu serie de confirmare, soft reset-ul
     și decay-ul (§5.2) **nu** sunt implementate: sunt Faza 4 și vor cere migrare.
2. **Numărul de trepte urmează tabelul din §5.1**, nu totalul declarat în text.
   Tabelul dă diviziuni I–III rangurilor 1–7 și „Mare Maestru” fără diviziuni:
   7×3 + 1 = **22 de trepte fixe**, plus „Legendă” (dinamică, Top 100) = 23.
   Documentul afirmă „23 fixe + 1 = 24”. Am urmat tabelul, fiind specificația
   detaliată; cerința de minimum 20 de trepte e respectată în ambele citiri.
   **De clarificat de proprietar** dacă „Mare Maestru” trebuie să aibă diviziuni.
3. **Diviziunea III este cea mai joasă, I cea mai înaltă**, ca în jocurile citate ca
   inspirație. Intervalele de ELO ale unui rang major se împart egal între diviziuni.
4. **„Legendă” este poziție, nu prag de ELO**: se acordă doar jucătorilor din Top 100
   care sunt deja pe treapta de vârf, deci se rezolvă cu poziția din clasament.
5. **Clasamentul se citește din Postgres**, sursa de adevăr pentru ELO, ordonat după
   `elo_rating` desc, apoi vechimea contului (departajare stabilă). Sorted set-ul Redis
   populat de `backend/workers` rămâne pentru scalare ulterioară; la volumul actual ar
   fi livrat poziții învechite imediat după o partidă.
6. **`GET /leaderboard` este public**, `GET /leaderboard/me` cere autentificare, iar
   `GET /leaderboard/tiers` expune treptele ca aplicația să nu le dubleze hardcodat.

## Consecințe

- Bucla de progres competitiv este vizibilă cap-coadă: duel → ELO → rang → clasament.
- Clientul afișează rangul, nu îl calculează — o schimbare de praguri nu cere versiune
  nouă de aplicație.
- Când vor apărea sezoanele, `resolveRank` rămâne punctul unic de adevăr; se adaugă
  peste el starea sezonieră, fără a rescrie clientul.
- Rămân neimplementate din §5: recompense per rang, leaderboard per rang/diviziune și
  leaderboard de prieteni (acesta din urmă depinde de sistemul de prietenie, Faza 3).
