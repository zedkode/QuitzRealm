-- SRV-005: limba canonică a întrebărilor și taxonomie localizabilă/regională.
--
-- Coloana legacy `questions.language` rămâne fizic pentru compatibilitatea
-- binarelor vechi, însă schema Prisma expune numai FK-ul `language_id`.
-- Triggerul sincronizează ambele direcții pe durata tranziției.

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "name_key" VARCHAR(160);
ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "country_code" VARCHAR(2);

-- Generalizează rădăcina românească existentă fără a-i schimba UUID-ul.
UPDATE "categories"
SET
  "code" = 'country-specific-ro',
  "name" = 'Specific României',
  "country_code" = 'RO'
WHERE "id" = '10000000-0000-4000-8000-000000000008'::uuid;

-- Categoriile explicit românești din domeniile globale sunt și ele regionale.
UPDATE "categories"
SET "country_code" = 'RO'
WHERE "id" IN (
  '11000000-0000-4000-8000-000000000001'::uuid,
  '12000000-0000-4000-8000-000000000001'::uuid,
  '15000000-0000-4000-8000-000000000001'::uuid,
  '15000000-0000-4000-8000-000000000004'::uuid,
  '16000000-0000-4000-8000-000000000001'::uuid,
  '18000000-0000-4000-8000-000000000001'::uuid,
  '18000000-0000-4000-8000-000000000002'::uuid,
  '18000000-0000-4000-8000-000000000003'::uuid,
  '18000000-0000-4000-8000-000000000004'::uuid,
  '18000000-0000-4000-8000-000000000005'::uuid,
  '18000000-0000-4000-8000-000000000006'::uuid
);

UPDATE "categories"
SET "name_key" = 'category.' || COALESCE(
  "code",
  'node_' || REPLACE("id"::text, '-', '')
) || '.name'
WHERE "name_key" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "name_key" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key_key"
  ON "categories"("name_key");
CREATE INDEX IF NOT EXISTS "categories_country_code_idx"
  ON "categories"("country_code");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_country_code_fkey'
      AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_country_code_fkey"
      FOREIGN KEY ("country_code") REFERENCES "countries"("iso_alpha2")
      ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
  END IF;
END
$$;

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "language_id" UUID;

DO $$
DECLARE
  duplicate_iso TEXT;
BEGIN
  SELECT STRING_AGG(normalized_iso, ', ' ORDER BY normalized_iso)
  INTO duplicate_iso
  FROM (
    SELECT LOWER("iso_code") AS normalized_iso
    FROM "languages"
    GROUP BY LOWER("iso_code")
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_iso IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'SRV-005 cannot map question languages unambiguously',
      DETAIL = 'Duplicate normalized language ISO codes: ' || duplicate_iso;
  END IF;
END
$$;

UPDATE "questions" AS question
SET
  "language_id" = language."id",
  "language" = language."iso_code"
FROM "languages" AS language
WHERE question."language_id" IS NULL
  AND LOWER(BTRIM(question."language")) = LOWER(language."iso_code");

DO $$
DECLARE
  unresolved_languages TEXT;
BEGIN
  SELECT STRING_AGG(DISTINCT COALESCE("language", '<null>'), ', ')
  INTO unresolved_languages
  FROM "questions"
  WHERE "language_id" IS NULL;

  IF unresolved_languages IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'SRV-005 cannot backfill questions.language_id',
      DETAIL = 'Seed languages before migrating; unresolved legacy values: ' ||
        unresolved_languages;
  END IF;
END
$$;

-- Dacă o execuție anterioară a adăugat deja FK-ul, normalizează și coloana
-- legacy după identificatorul canonic.
UPDATE "questions" AS question
SET "language" = language."iso_code"
FROM "languages" AS language
WHERE question."language_id" = language."id"
  AND question."language" IS DISTINCT FROM language."iso_code";

CREATE OR REPLACE FUNCTION sync_question_language_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_id UUID;
  resolved_iso VARCHAR(10);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."language_id" IS NOT NULL THEN
      SELECT "id", "iso_code"
      INTO resolved_id, resolved_iso
      FROM "languages"
      WHERE "id" = NEW."language_id";
    ELSE
      SELECT "id", "iso_code"
      INTO resolved_id, resolved_iso
      FROM "languages"
      WHERE LOWER("iso_code") = LOWER(BTRIM(NEW."language"));
    END IF;
  ELSIF NEW."language_id" IS DISTINCT FROM OLD."language_id" THEN
    SELECT "id", "iso_code"
    INTO resolved_id, resolved_iso
    FROM "languages"
    WHERE "id" = NEW."language_id";
  ELSIF NEW."language" IS DISTINCT FROM OLD."language" THEN
    SELECT "id", "iso_code"
    INTO resolved_id, resolved_iso
    FROM "languages"
    WHERE LOWER("iso_code") = LOWER(BTRIM(NEW."language"));
  ELSE
    SELECT "id", "iso_code"
    INTO resolved_id, resolved_iso
    FROM "languages"
    WHERE "id" = NEW."language_id";
  END IF;

  IF resolved_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Question language does not exist',
      DETAIL = 'Provide a valid languages.id or languages.iso_code.';
  END IF;

  NEW."language_id" := resolved_id;
  NEW."language" := resolved_iso;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS "questions_sync_language_columns" ON "questions";
CREATE TRIGGER "questions_sync_language_columns"
BEFORE INSERT OR UPDATE OF "language_id", "language" ON "questions"
FOR EACH ROW EXECUTE FUNCTION sync_question_language_columns();

ALTER TABLE "questions" ALTER COLUMN "language_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS
  "questions_language_id_status_category_id_difficulty_idx"
  ON "questions"("language_id", "status", "category_id", "difficulty");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_language_id_fkey'
      AND conrelid = 'questions'::regclass
  ) THEN
    ALTER TABLE "questions"
      ADD CONSTRAINT "questions_language_id_fkey"
      FOREIGN KEY ("language_id") REFERENCES "languages"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
