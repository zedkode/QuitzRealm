-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'numeric');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('ai', 'community', 'curated');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('classic', 'blitz', 'duo', 'private');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('waiting', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('win', 'loss', 'draw');

-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('avatar', 'frame', 'banner', 'map_skin');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "refresh_token_hash" TEXT,
    "avatar_id" UUID,
    "frame_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "elo_rating" INTEGER NOT NULL DEFAULT 1000,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "icon" VARCHAR(100),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "category_id" UUID NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT NOT NULL,
    "source" "QuestionSource" NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'pending',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "dislike_count" INTEGER NOT NULL DEFAULT 0,
    "times_asked" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "language" VARCHAR(10) NOT NULL DEFAULT 'ro',
    "created_by" UUID,
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'waiting',
    "map_id" VARCHAR(100) NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "territories_won" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "result" "MatchResult" NOT NULL,
    "elo_delta" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("match_id","user_id")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "round_number" INTEGER NOT NULL,
    "question_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "answer_given" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "territory_affected" VARCHAR(100),

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosmetics" (
    "id" UUID NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "rarity" VARCHAR(30) NOT NULL,
    "price_coins" INTEGER NOT NULL DEFAULT 0,
    "price_gems" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cosmetics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "user_id" UUID NOT NULL,
    "cosmetic_id" UUID NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("user_id","cosmetic_id")
);

-- CreateTable
CREATE TABLE "question_reports" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_parent_id_key" ON "categories"("name", "parent_id");

-- CreateIndex
CREATE INDEX "questions_category_id_difficulty_status_language_idx" ON "questions"("category_id", "difficulty", "status", "language");

-- CreateIndex
CREATE INDEX "matches_status_mode_idx" ON "matches"("status", "mode");

-- CreateIndex
CREATE INDEX "match_events_match_id_round_number_idx" ON "match_events"("match_id", "round_number");

-- CreateIndex
CREATE INDEX "question_reports_question_id_created_at_idx" ON "question_reports"("question_id", "created_at");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_cosmetic_id_fkey" FOREIGN KEY ("cosmetic_id") REFERENCES "cosmetics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
