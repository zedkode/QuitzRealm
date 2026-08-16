-- Admin role foundation for the separate web control plane.
DO $$
BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('user', 'admin', 'moderator', 'content_editor', 'support');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" "AdminRole" NOT NULL DEFAULT 'user';
