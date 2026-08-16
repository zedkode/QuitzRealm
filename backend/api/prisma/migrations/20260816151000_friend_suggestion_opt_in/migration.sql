-- Sugestiile de prieteni pe baza jucătorilor întâlniți sunt opt-in.
-- Valoarea implicită false protejează atât conturile existente, cât și cele noi.
ALTER TABLE "user_privacy_settings"
  ADD COLUMN IF NOT EXISTS "allow_friend_suggestions" BOOLEAN NOT NULL DEFAULT false;
