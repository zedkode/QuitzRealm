-- Magazin, powerups și plăți.
--
-- Strict aditivă: nu atinge nicio coloană sau tabel existent, ca aplicarea pe
-- baza de producție să nu poată pierde date.

-- Moneda premium. Separată de `coins`, care se câștigă în joc.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gems" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  CREATE TYPE "PowerupKind" AS ENUM ('in_match', 'out_of_match');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PowerupEffect" AS ENUM (
    'extra_time', 'fifty_fifty', 'double_round_score',
    'xp_multiplier', 'coin_multiplier', 'streak_shield'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CurrencyKind" AS ENUM ('coins', 'gems');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LedgerReason" AS ENUM ('purchase', 'spend', 'admin_grant', 'refund', 'reward');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PurchaseStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "powerups" (
  "id" UUID NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "kind" "PowerupKind" NOT NULL,
  "effect" "PowerupEffect" NOT NULL,
  "magnitude" INTEGER NOT NULL DEFAULT 1,
  "duration_seconds" INTEGER,
  "price_coins" INTEGER NOT NULL DEFAULT 0,
  "price_gems" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "powerups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "powerups_code_key" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "powerups_active_sort_order_idx" ON "powerups"("active", "sort_order");

CREATE TABLE IF NOT EXISTS "user_powerups" (
  "user_id" UUID NOT NULL,
  "powerup_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_powerups_pkey" PRIMARY KEY ("user_id", "powerup_id"),
  CONSTRAINT "user_powerups_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_powerups_powerup_id_fkey" FOREIGN KEY ("powerup_id")
    REFERENCES "powerups"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "active_powerups" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "powerup_id" UUID NOT NULL,
  "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "active_powerups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "active_powerups_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "active_powerups_powerup_id_fkey" FOREIGN KEY ("powerup_id")
    REFERENCES "powerups"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "active_powerups_user_id_expires_at_idx"
  ON "active_powerups"("user_id", "expires_at");

CREATE TABLE IF NOT EXISTS "gem_packs" (
  "id" UUID NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "gems" INTEGER NOT NULL,
  "bonus_gems" INTEGER NOT NULL DEFAULT 0,
  "price_cents" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'RON',
  "provider_price_id" VARCHAR(255),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gem_packs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gem_packs_code_key" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "gem_packs_active_sort_order_idx" ON "gem_packs"("active", "sort_order");

CREATE TABLE IF NOT EXISTS "purchases" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "gem_pack_id" UUID NOT NULL,
  "provider" VARCHAR(32) NOT NULL DEFAULT 'stub',
  "provider_session_id" VARCHAR(255),
  "provider_payment_id" VARCHAR(255),
  "status" "PurchaseStatus" NOT NULL DEFAULT 'pending',
  "price_cents" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "gems_granted" INTEGER NOT NULL DEFAULT 0,
  "failure_reason" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  "refunded_at" TIMESTAMP(3),
  CONSTRAINT "purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchases_provider_session_id_key" UNIQUE ("provider_session_id"),
  CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "purchases_gem_pack_id_fkey" FOREIGN KEY ("gem_pack_id")
    REFERENCES "gem_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "purchases_user_id_created_at_idx" ON "purchases"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "purchases_status_created_at_idx" ON "purchases"("status", "created_at");

CREATE TABLE IF NOT EXISTS "currency_ledger" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "currency" "CurrencyKind" NOT NULL,
  "delta" INTEGER NOT NULL,
  "balance_after" INTEGER NOT NULL,
  "reason" "LedgerReason" NOT NULL,
  "reference_type" VARCHAR(40),
  "reference_id" VARCHAR(64),
  "actor_id" UUID,
  "note" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "currency_ledger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "currency_ledger_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "currency_ledger_user_id_created_at_idx"
  ON "currency_ledger"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "currency_ledger_currency_reason_created_at_idx"
  ON "currency_ledger"("currency", "reason", "created_at");

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "actor_role" VARCHAR(30) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "target_type" VARCHAR(40),
  "target_id" VARCHAR(64),
  "target_user_id" UUID,
  "payload" JSONB,
  "ip" VARCHAR(64),
  "user_agent" VARCHAR(300),
  "success" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "admin_audit_log_target_user_id_fkey" FOREIGN KEY ("target_user_id")
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admin_audit_log_actor_id_created_at_idx"
  ON "admin_audit_log"("actor_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_log_action_created_at_idx"
  ON "admin_audit_log"("action", "created_at");
