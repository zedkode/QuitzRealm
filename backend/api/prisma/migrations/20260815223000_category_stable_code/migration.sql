ALTER TABLE "categories"
ADD COLUMN "code" VARCHAR(64);

CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");
