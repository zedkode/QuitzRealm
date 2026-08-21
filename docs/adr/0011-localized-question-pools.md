# ADR 0011 — Bănci de întrebări localizate și fallback explicit

**Status:** Acceptat prin `SRV-005`  
**Data:** 2026-08-21  
**Sursă:** `owner-plan.md` §10.5 și `ai/tasks/01-server-core.md` (`SRV-005`)

## Context

`questions.language` era un șir fără integritate referențială, iar numele
categoriilor erau expuse în română. Realtime cerea în mod fix `language=ro`,
deci preferința salvată pe cont nu influența întrebările și o trecere la banca
globală nu putea fi comunicată clientului.

## Decizie

- Limba canonică a întrebării este `questions.language_id`, cu FK `RESTRICT`
  spre `languages`. Coloana fizică legacy `language` rămâne temporar ca punte
  aditivă și este sincronizată prin trigger, dar nu mai apare în modelul Prisma.
- Categoria expune `name_key`, nu numele legacy. Traducerile română și engleză
  sunt rânduri obișnuite din catalogul `translations` creat de `SRV-003`.
- `categories.country_code` marchează conținutul regional. „Specific României”
  este o categorie regională, iar poolul global are categoria distinctă
  `international-general-knowledge` / `international-culture`.
- O categorie intră în rotație numai dacă are cel puțin
  `QUESTION_BANK_MIN_APPROVED_PER_CATEGORY` întrebări aprobate pentru filtrele
  cerute. Întrebările pending, respinse sau flagged nu contribuie la prag.
- Contractul nou întoarce `{ question, bank }` sau `{ questions, bank }`.
  `bank` păstrează limba și țara cerute, poolul rezolvat, pragul și
  `messageKey + params`. Dacă nici banca globală engleză nu are acoperire,
  răspunsul este eroarea localizabilă `QUESTION_BANK_UNAVAILABLE`.
- Realtime citește limba și țara din capabilitățile contului. Nu are voie să le
  creadă din payloadul clientului și nu poate schimba poolul în timpul meciului.

## Compatibilitate și limite

`GET /questions` rămâne temporar o listă pentru clientul Flutter existent și
acceptă aliasul `language`. Consumatorii noi folosesc `GET /questions/pool`, iar
endpointul intern cere obligatoriu `requestedLanguageIsoCode`.

Partiționarea cozilor pe limbă și țară rămâne în `SRV-044`. Până atunci, un grup
selectat din regiuni incompatibile este refuzat explicit; nu este mutat tăcut
într-un alt pool.
