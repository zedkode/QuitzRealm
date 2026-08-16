CREATE TYPE "achievement_rarity" AS ENUM (
  'common', 'rare', 'epic', 'legendary', 'mythic'
);

CREATE TABLE "achievement_templates" (
  "id" UUID NOT NULL,
  "template_key" VARCHAR(80) NOT NULL,
  "category" VARCHAR(40) NOT NULL,
  "param_schema" JSONB NOT NULL,
  "title_template" VARCHAR(160) NOT NULL,
  "description_template" VARCHAR(400) NOT NULL,
  "badge_asset_template" VARCHAR(160),
  "points_base" INTEGER NOT NULL DEFAULT 10,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "achievement_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "achievement_templates_template_key_key" UNIQUE ("template_key")
);

CREATE TABLE "achievements" (
  "id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "instance_key" VARCHAR(120) NOT NULL,
  "params" JSONB NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "description" VARCHAR(400) NOT NULL,
  "rarity" "achievement_rarity" NOT NULL DEFAULT 'common',
  "points" INTEGER NOT NULL DEFAULT 10,
  "target" INTEGER NOT NULL DEFAULT 1,
  "is_hidden" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "achievements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "achievements_instance_key_key" UNIQUE ("instance_key")
);

CREATE INDEX "achievements_template_id_idx" ON "achievements"("template_id");
CREATE INDEX "achievements_rarity_idx" ON "achievements"("rarity");

CREATE TABLE "user_achievements" (
  "user_id" UUID NOT NULL,
  "achievement_id" UUID NOT NULL,
  "progress_current" INTEGER NOT NULL DEFAULT 0,
  "unlocked_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id", "achievement_id")
);

CREATE INDEX "user_achievements_user_id_unlocked_at_idx" ON "user_achievements"("user_id", "unlocked_at");

CREATE TABLE "user_badge_slots" (
  "user_id" UUID NOT NULL,
  "slot_index" INTEGER NOT NULL,
  "achievement_id" UUID,
  CONSTRAINT "user_badge_slots_pkey" PRIMARY KEY ("user_id", "slot_index")
);

CREATE TABLE "user_profile_showcase" (
  "user_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "achievement_id" UUID NOT NULL,
  CONSTRAINT "user_profile_showcase_pkey" PRIMARY KEY ("user_id", "position")
);

CREATE INDEX "user_profile_showcase_achievement_id_idx" ON "user_profile_showcase"("achievement_id");

ALTER TABLE "achievements"
  ADD CONSTRAINT "achievements_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "achievement_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_achievements"
  ADD CONSTRAINT "user_achievements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_achievements_achievement_id_fkey"
  FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_badge_slots"
  ADD CONSTRAINT "user_badge_slots_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_badge_slots_achievement_id_fkey"
  FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_profile_showcase"
  ADD CONSTRAINT "user_profile_showcase_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_profile_showcase_achievement_id_fkey"
  FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
