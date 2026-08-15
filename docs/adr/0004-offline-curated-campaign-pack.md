# ADR 0004 — Campanie solo offline pe pachete curatoriate, livrate cu aplicația

**Dată:** 2026-08-15
**Status:** Acceptat (la cererea explicită a proprietarului proiectului)

## Context

`init.md` Pasul 6 și `passed.md` sunt încă deschise: banca de întrebări din Postgres
are 2 întrebări `PENDING` și 0 `APPROVED`. Regula din `agents.md` §4 interzice intrarea
în rotația de joc a întrebărilor neaprobate, deci fluxul solo online rămâne corect blocat
în starea „banca aprobată este goală”.

Proprietarul a cerut explicit o aplicație **jucabilă acum**, cu identitate vizuală de joc,
fără să aștepte finalizarea pipeline-ului AI de generare + verificare.

## Decizie

1. Campania solo se joacă din **pachete de întrebări curatoriate manual**, livrate ca
   assets în `mobile/assets/questions/*.json` (nouă ținuturi × 15 întrebări în română,
   fiecare cu explicație).
   - Acestea nu sunt întrebări „mock”: sunt conținut scris și verificat manual, echivalentul
     clientului pentru `QuestionSource.CURATED` + `QuestionStatus.APPROVED` deja existente
     în backend (`backend/api/src/questions/curated-solo-question-pack.ts`).
   - Un test (`test/data/question_pack_test.dart`) impune, la fiecare rulare: id-uri unice,
     texte neduplicate, exact 4 variante distincte la grilă, răspunsul corect prezent între
     variante, explicație obligatorie și acoperire pe benzile de dificultate.
2. Sursa de întrebări e abstractizată prin `RoundSource` (`lib/domain/battle/round_source.dart`):
   - `LocalRoundSource` — campania offline, judecă răspunsul pe baza pachetului;
   - implementarea peste API rămâne pentru fluxul online, unde **serverul** dă verdictul.
   Widget-urile nu văd niciodată răspunsul corect înainte de trimitere, în ambele cazuri.
3. Progresul (stele per asalt, XP, nivel) se salvează local, prin `shared_preferences`
   (`SharedPreferencesProgressStore`). Nu înlocuiește profilul din backend; contul rămâne
   opțional în aplicație.
4. Sistemul de design de joc (paletă, iconografie vectorială proprie, panouri, butoane cu
   relief, fundal animat) este adus mai devreme din **Faza 4** a `plan.md`, la cererea
   proprietarului. **Nu** au fost aduse și cosmeticele/magazinul din aceeași fază.

## Consecințe

- Jocul e complet jucabil fără backend, docker sau cont: 9 ținuturi × 3 asalturi.
- `init.md` Pasul 6 și lista din `passed.md` **rămân deschise**. Pachetele offline nu
  bifează criteriul „~5.000 de întrebări în DB” și nu înlocuiesc verificarea manuală a
  întrebărilor generate AI.
- Când banca `APPROVED` din Postgres devine utilizabilă, `RoundSource` permite comutarea
  pe sursa online fără să schimbe ecranele de joc.
- Dependență nouă: `shared_preferences` (plugin oficial Flutter, fără serviciu cloud).
- Platformă nouă în repo: `mobile/windows/` (runner desktop), utilă pentru dezvoltare și
  testare rapidă. Android rămâne platforma-țintă din `plan.md`.
