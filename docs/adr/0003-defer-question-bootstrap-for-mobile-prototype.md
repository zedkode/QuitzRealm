# ADR 0003 — Amânarea batch-ului de întrebări pentru prototipul mobil

- **Status:** Accepted
- **Data:** 2026-08-14

## Context

`init.md` cere finalizarea Pasului 6 înainte de Pasul 7, iar Faza 0 din `plan.md` include un batch de aproximativ 5.000 de întrebări. Generatorul și gate-ul factual există, dar preflight-ul complet, batch-ul și aprobarea unui eșantion nu sunt finalizate. Proprietarul proiectului a cerut explicit o aplicație Android instalabilă acum și păstrarea separată a tuturor pașilor peste care se trece.

## Decizie

Începem temporar Pasul 7 din `init.md`, mapat la Faza 1 din `plan.md`, strict pentru verticala mobilă autentificare + antrenament solo și pentru obținerea unui APK instalabil.

Pașii amânați sunt inventariați în `passed.md`. Întrebările existente rămân `PENDING`; nu sunt aprobate automat și nu sunt înlocuite cu date mock în fluxul runtime. Absența întrebărilor aprobate este afișată explicit în aplicație.

Această decizie nu declară Pasul 6, Faza 0, Pasul 7 sau bootstrap-ul complete și nu autorizează începerea Fazei 2.

## Consecințe

- Putem construi, instala și valida aplicația Android înainte ca banca inițială să fie completă.
- Fluxul solo poate fi validat structural față de API, dar nu poate fi declarat end-to-end cu date reale până când există întrebări `APPROVED`.
- Datoria de conținut și mediul Redis trebuie reluate în ordinea din `passed.md`.
- Orice raport de progres trebuie să distingă APK-ul instalabil de criteriul încă nebifat „rundă solo cu date reale din backend”.
