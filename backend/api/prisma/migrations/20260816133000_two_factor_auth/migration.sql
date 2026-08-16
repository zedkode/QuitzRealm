-- Autentificare opțională cu doi factori (TOTP).
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT,
  ADD COLUMN IF NOT EXISTS "two_factor_enabled_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "two_factor_recovery_codes" JSONB;

-- Prisma map-ează enumul TypeScript la tipul PostgreSQL existent.
ALTER TYPE "auth_token_purpose" ADD VALUE IF NOT EXISTS 'two_factor_login';
