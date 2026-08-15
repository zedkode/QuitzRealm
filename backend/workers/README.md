# QuizRealm workers

Serviciu NestJS fără server HTTP, care procesează job-uri BullMQ peste Redis:

- `generate-questions` apelează provider-ul AI configurat, validează strict lotul complet, elimină întrebările similare din aceeași categorie și inserează doar întrebări `PENDING`;
- `recalculate-leaderboard` reconstruiește periodic Sorted Set-ul Redis din ratingurile ELO din PostgreSQL.

## Configurare

Copie `.env.example` în `.env` și configurează `DATABASE_URL`, `REDIS_URL` și provider-ul AI. `AI_PROVIDER=openai-compatible` folosește endpoint-ul `${AI_BASE_URL}/chat/completions`; cheia este opțională pentru servere self-hosted. `AI_MODEL` generează lotul, iar `AI_VERIFIER_MODEL` îl verifică factual înainte de inserare; pentru bootstrap se recomandă modele diferite. `AI_RESPONSE_FORMAT` acceptă `json_object` implicit sau `json_schema` pentru modele care implementează eficient structured outputs. `AI_PROVIDER=fixture` este determinist și este permis doar pentru teste/verificări locale.

Schema Prisma și migrările sunt păstrate central în `backend/api/prisma`. Din acest director rulează:

```powershell
npm install
npm run prisma:generate
npm run build
```

## Rulare

Pornește procesorul persistent:

```powershell
npm run start:dev
```

Adaugă manual un lot și așteaptă rezultatul:

```powershell
npm run generate:questions -- --category-id <uuid> --difficulty 3 --quantity 20 --language ro
```

Planifică distribuția bootstrap fără a apela provider-ul AI:

```powershell
npm run generate:bootstrap -- --target 5000 --language ro
```

Planul folosește doar cele 45 de subcategorii ale taxonomy-ului inițial și dificultățile 1–5. Pentru ținta de 5.000 rezultă 225 bucket-uri, cu 22 sau 23 de întrebări fiecare. Numai flag-ul explicit `--execute` pornește generarea:

```powershell
npm run generate:bootstrap -- --target 5000 --batch-size 25 --concurrency 2 --max-attempts 3 --language ro --execute
```

Rularea este reluabilă: întrebările AI `PENDING` și `APPROVED` deja existente sunt scăzute din ținta fiecărui bucket. Provider-ul `fixture` este respins pentru această comandă, pentru a nu contamina banca reală cu date de test.

Recalculează manual leaderboard-ul:

```powershell
npm run recalculate:leaderboard
```

Loturile structural invalide sunt respinse integral și logate fără a salva conținut parțial. Dintr-un lot structural valid sunt inserate numai întrebările acceptate de verificatorul factual, toate cu status `PENDING`; verdictul AI nu înlocuiește sampling-ul manual. Rerularea aceluiași lot nu dublează întrebările similare (prag Jaccard `0.85` în aceeași categorie).
