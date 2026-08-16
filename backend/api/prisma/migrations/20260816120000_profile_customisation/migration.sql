-- Profil & setări: `owner-plan.md` §4 (customizare), §4.9 (confidențialitate),
-- §10.2 (țară cu cooldown).

-- --- Tipuri noi de cosmetice (§4.5) ---
ALTER TYPE "CosmeticType" ADD VALUE IF NOT EXISTS 'name_style';
ALTER TYPE "CosmeticType" ADD VALUE IF NOT EXISTS 'title';

-- --- Cine te vede online (§4.9) ---
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'online_visibility') THEN
    CREATE TYPE "online_visibility" AS ENUM ('everyone', 'friends', 'nobody');
  END IF;
END
$$;

-- --- Catalogul de cosmetice ---
-- `code` e unic, iar tabelul poate avea deja rânduri: se completează din `id`
-- înainte de constrângere, altfel migrarea ar pica pe o bază populată.
ALTER TABLE "cosmetics" ADD COLUMN IF NOT EXISTS "code" VARCHAR(64);
UPDATE "cosmetics" SET "code" = 'legacy-' || "id"::text WHERE "code" IS NULL;
ALTER TABLE "cosmetics" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "cosmetics_code_key" ON "cosmetics"("code");

ALTER TABLE "cosmetics" ADD COLUMN IF NOT EXISTS "unlock_level" INTEGER;
ALTER TABLE "cosmetics" ADD COLUMN IF NOT EXISTS "unlock_rank_order" INTEGER;
ALTER TABLE "cosmetics" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "cosmetics_type_sort_order_idx" ON "cosmetics"("type", "sort_order");

CREATE INDEX IF NOT EXISTS "user_inventory_user_id_equipped_idx"
  ON "user_inventory"("user_id", "equipped");

-- --- Ce e echipat se citește dintr-un singur loc ---
-- `users.avatar_id` / `users.frame_id` erau citite la construirea profilului,
-- dar nimic nu le scria vreodată. Din momentul în care echiparea devine reală,
-- două surse pentru „ce poartă jucătorul" s-ar putea contrazice; sursa rămâne
-- `user_inventory.equipped`.
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "frame_id";

-- --- Țară & cooldown de regiune (§10.2) ---
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" VARCHAR(2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region_changed_at" TIMESTAMP(3);

-- --- Profilul editabil (§4.3, §4.4, §4.8) ---
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "user_id" UUID NOT NULL,
  "bio" VARCHAR(200),
  "status_text" VARCHAR(80),
  "status_emoji" VARCHAR(16),
  "status_expires_at" TIMESTAMP(3),
  "theme_accent" VARCHAR(24) NOT NULL DEFAULT 'gold',
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- --- Linkuri externe (§4.6) ---
CREATE TABLE IF NOT EXISTS "user_links" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "label" VARCHAR(32) NOT NULL,
  "url" VARCHAR(200) NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_links_user_id_url_key"
  ON "user_links"("user_id", "url");

-- --- Confidențialitate extinsă (§4.9 + captura 04-account-settings) ---
ALTER TABLE "user_privacy_settings"
  ADD COLUMN IF NOT EXISTS "online_visibility" "online_visibility" NOT NULL DEFAULT 'friends';
ALTER TABLE "user_privacy_settings"
  ADD COLUMN IF NOT EXISTS "allow_match_invites" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_privacy_settings"
  ADD COLUMN IF NOT EXISTS "chat_censorship" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_privacy_settings"
  ADD COLUMN IF NOT EXISTS "chat_notifications" BOOLEAN NOT NULL DEFAULT true;

-- --- Chei străine ---
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE "user_profiles"
      ADD CONSTRAINT "user_profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_links_user_id_fkey'
  ) THEN
    ALTER TABLE "user_links"
      ADD CONSTRAINT "user_links_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
