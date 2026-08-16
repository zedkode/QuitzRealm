-- Cod cu viață scurtă, folosit o dată pentru a trece în siguranță rezultatul
-- Google OAuth din browserul sistemului în aplicația mobilă.
ALTER TYPE "auth_token_purpose" ADD VALUE IF NOT EXISTS 'mobile_oauth_exchange';
