-- CHG-01 (FR-28, BR-18): optional credit limit on LOAN_TAKEN accounts. Existing rows get NULL = no limit.
ALTER TABLE "accounts" ADD COLUMN "credit_limit" BIGINT;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_credit_limit_check"
    CHECK (credit_limit IS NULL OR (type = 'LOAN_TAKEN' AND credit_limit > 0 AND balance <= credit_limit));
