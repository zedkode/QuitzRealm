-- Shadow-ban temporar, limitat la chatul global. Nu afectează DM-urile sau
-- conversațiile dintre prieteni, care rămân protejate de blocare și moderare.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "global_chat_shadow_banned_until" TIMESTAMP(3);
