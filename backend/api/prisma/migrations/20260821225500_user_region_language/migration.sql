-- SRV-002: țara și limba alese explicit pe cont, cu semnal persistent pentru
-- recalibrarea rangului când jucătorul schimbă pool-ul competitiv.
--
-- Migrarea este strict aditivă și reluabilă. Cheile străine sunt create
-- `NOT VALID` pentru ca un upgrade peste utilizatori legacy să poată popula
-- mai întâi catalogul SRV-001; seed-ul validează constrângerile după upsert.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language_id" UUID;
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "rank_recalibration_requested_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_country_code_idx" ON "users"("country_code");
CREATE INDEX IF NOT EXISTS "users_language_id_idx" ON "users"("language_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_country_code_fkey'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_country_code_fkey"
      FOREIGN KEY ("country_code") REFERENCES "countries"("iso_alpha2")
      ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_language_id_fkey'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_language_id_fkey"
      FOREIGN KEY ("language_id") REFERENCES "languages"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
  END IF;
END
$$;
