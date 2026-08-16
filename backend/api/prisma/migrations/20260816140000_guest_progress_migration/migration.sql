-- Conversie unică din modul invitat. Progresul solo nu se scrie în XP/ELO
-- competitive, ci se păstrează pentru deblocarea campaniei după autentificare.
CREATE TABLE IF NOT EXISTS "guest_migrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guest_id" VARCHAR(128) NOT NULL,
  "user_id" UUID NOT NULL,
  "campaign_progress" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guest_migrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guest_migrations_guest_id_key" UNIQUE ("guest_id"),
  CONSTRAINT "guest_migrations_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "guest_migrations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
