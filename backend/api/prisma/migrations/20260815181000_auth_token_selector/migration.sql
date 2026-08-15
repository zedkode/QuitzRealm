-- AlterTable
ALTER TABLE "auth_tokens" ADD COLUMN     "selector" VARCHAR(32) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_selector_key" ON "auth_tokens"("selector");

