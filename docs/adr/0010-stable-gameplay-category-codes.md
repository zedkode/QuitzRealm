# ADR 0010 — Coduri stabile pentru cele 20 de categorii de gameplay

**Status:** Acceptat prin cererea proprietarului  
**Data:** 2026-08-15  
**Sursă:** cererea explicită a proprietarului și `owner-plan.md` §10

## Context

Taxonomia inițială din `plan.md` are opt domenii în limba română și 45 de
subcategorii. Proprietarul a cerut explicit 20 de categorii de gameplay,
inclusiv domenii care nu existau (`gaming`, `cars`, `logic`, `economy`) și două
categorii separate pentru filme și muzică. Câmpul `categories.name` nu poate fi
un identificator sigur deoarece numele vizibil trebuie tradus.

## Decizie

- `categories` primește un `code` stabil, unic și independent de limbă.
- Cele 20 de coduri cerute sunt mapate pe rădăcini sau subcategorii, fără a
  duplica domeniile deja existente.
- Numele stocat rămâne în română, limba implicită a aplicației; UI va traduce
  numele prin cod când catalogul de categorii este expus în aplicație.
- Lotul inițial conține trei întrebări cu răspuns și explicație per categorie.
  Fiind redactate de AI, sunt inserate exclusiv cu `source=AI` și
  `status=PENDING`; aprobarea cere o verificare factuală separată.

## Consecințe

- Seed-ul taxonomiei rămâne idempotent și poate adopta categoriile vechi care
  aveau același nume, completându-le codul.
- Migrarea este aditivă și nu șterge ori redenumește rânduri existente.
- Cele 60 de întrebări nu intră în rotația live până când sunt revizuite și
  aprobate conform `agents.md`.
