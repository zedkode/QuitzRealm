-- CreateEnum
CREATE TYPE "dm_permission" AS ENUM ('everyone', 'friends_only', 'nobody');

-- CreateEnum
CREATE TYPE "profile_visibility" AS ENUM ('public', 'friends', 'private');

-- CreateEnum
CREATE TYPE "friendship_status" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "conversation_type" AS ENUM ('friend', 'dm_request', 'dm_accepted');

-- CreateEnum
CREATE TYPE "message_scope" AS ENUM ('friend', 'dm');

-- CreateEnum
CREATE TYPE "chat_report_resolution" AS ENUM ('pending', 'dismissed', 'warned', 'muted', 'banned');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "chat_muted_until" TIMESTAMP(3),
ADD COLUMN     "correct_answers" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_privacy_settings" (
    "user_id" UUID NOT NULL,
    "dm_permission" "dm_permission" NOT NULL DEFAULT 'friends_only',
    "profile_visibility" "profile_visibility" NOT NULL DEFAULT 'public',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "user_id_a" UUID NOT NULL,
    "user_id_b" UUID NOT NULL,
    "status" "friendship_status" NOT NULL DEFAULT 'pending',
    "requested_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "type" "conversation_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "scope" "message_scope" NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reports" (
    "id" UUID NOT NULL,
    "message_id" UUID,
    "reporter_id" UUID NOT NULL,
    "reported_user_id" UUID NOT NULL,
    "content_snapshot" VARCHAR(1000) NOT NULL,
    "scope" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "resolution" "chat_report_resolution" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "chat_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friendships_user_id_b_status_idx" ON "friendships"("user_id_b", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_a_user_id_b_key" ON "friendships"("user_id_a", "user_id_b");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_reports_resolution_priority_created_at_idx" ON "chat_reports"("resolution", "priority", "created_at");

-- AddForeignKey
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_a_fkey" FOREIGN KEY ("user_id_a") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_b_fkey" FOREIGN KEY ("user_id_b") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
