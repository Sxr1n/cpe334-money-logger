-- CreateEnum
CREATE TYPE "TxnForm" AS ENUM ('PAYMENT', 'RECEIPT');

-- CreateEnum
CREATE TYPE "TxnStatus" AS ENUM ('POSTED', 'VOID');

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "form" "TxnForm" NOT NULL,
    "primary_account_id" INTEGER NOT NULL,
    "txn_date" DATE NOT NULL,
    "total" BIGINT NOT NULL,
    "note" VARCHAR(200),
    "status" "TxnStatus" NOT NULL DEFAULT 'POSTED',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transactions_total_check" CHECK (total > 0)
);

-- CreateTable
CREATE TABLE "transaction_lines" (
    "id" SERIAL NOT NULL,
    "txn_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "transaction_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transaction_lines_amount_check" CHECK (amount > 0)
);

-- CreateIndex
CREATE INDEX "transactions_user_id_txn_date_id_idx" ON "transactions"("user_id", "txn_date" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "transaction_lines_account_id_idx" ON "transaction_lines"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_lines_txn_id_account_id_key" ON "transaction_lines"("txn_id", "account_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_primary_account_id_fkey" FOREIGN KEY ("primary_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_txn_id_fkey" FOREIGN KEY ("txn_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

