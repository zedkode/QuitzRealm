-- SRV-001: registrul limbilor și al țărilor.
--
-- Migrare strict aditivă și reluabilă: nu modifică și nu șterge date
-- existente. Retragerea unei limbi sau țări se face ulterior prin `active`.

CREATE TABLE IF NOT EXISTS "languages" (
  "id" UUID NOT NULL,
  "iso_code" VARCHAR(10) NOT NULL,
  "name_key" VARCHAR(160) NOT NULL,
  "is_global_pool" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "languages_iso_code_key"
  ON "languages"("iso_code");

CREATE TABLE IF NOT EXISTS "countries" (
  "id" UUID NOT NULL,
  "iso_alpha2" VARCHAR(2) NOT NULL,
  "name_key" VARCHAR(160) NOT NULL,
  "default_language_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "countries_iso_alpha2_key"
  ON "countries"("iso_alpha2");

CREATE INDEX IF NOT EXISTS "countries_default_language_id_active_idx"
  ON "countries"("default_language_id", "active");

DO $$
BEGIN
  ALTER TABLE "countries"
    ADD CONSTRAINT "countries_default_language_id_fkey"
    FOREIGN KEY ("default_language_id") REFERENCES "languages"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
