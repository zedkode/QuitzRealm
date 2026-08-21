-- SRV-003: catalogul de traduceri editabil fără redeploy.
--
-- Migrare strict aditivă și reluabilă. Cheia compusă garantează o singură
-- valoare per cheie și limbă, iar editorul rămâne opțional pentru seed-urile de
-- sistem și pentru păstrarea istoricului după anonimizarea unui cont.

CREATE TABLE IF NOT EXISTS "translations" (
  "key" VARCHAR(160) NOT NULL,
  "language_id" UUID NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" UUID,
  CONSTRAINT "translations_pkey" PRIMARY KEY ("key", "language_id")
);

CREATE INDEX IF NOT EXISTS "translations_language_id_idx"
  ON "translations"("language_id");

CREATE INDEX IF NOT EXISTS "translations_updated_by_idx"
  ON "translations"("updated_by");

DO $$
BEGIN
  ALTER TABLE "translations"
    ADD CONSTRAINT "translations_language_id_fkey"
    FOREIGN KEY ("language_id") REFERENCES "languages"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "translations"
    ADD CONSTRAINT "translations_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
