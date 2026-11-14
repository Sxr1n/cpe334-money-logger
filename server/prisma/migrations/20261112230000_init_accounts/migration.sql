-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'LOAN_TAKEN', 'LOAN_GIVEN', 'INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "type" "AccountType" NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "opening_balance" BIGINT,
    "opening_date" DATE,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounts_balance_check" CHECK (balance >= 0),
    CONSTRAINT "accounts_opening_balance_check" CHECK (opening_balance IS NULL OR opening_balance >= 0),
    CONSTRAINT "accounts_type_opening_balance_check" CHECK (type IN ('CASH','LOAN_TAKEN','LOAN_GIVEN') OR (opening_balance IS NULL AND balance = 0))
);

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex (standard unique for prisma)
CREATE UNIQUE INDEX "accounts_user_id_type_name_key" ON "accounts"("user_id", "type", "name");

-- CreateIndex (case-insensitive unique index per user, type, and lower(name) per SDS §2.3)
CREATE UNIQUE INDEX "accounts_user_id_type_lower_name_key" ON "accounts"("user_id", "type", lower("name"));

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
