SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
BEGIN TRAN;

ALTER TABLE [dbo].[payments] ADD [idempotency_key] VARCHAR(255) NULL;

DROP INDEX [wallet_transactions_idempotency_key_filtered_key] ON [dbo].[wallet_transactions];

CREATE UNIQUE INDEX [wallet_transactions_user_idempotency_key_filtered_key]
  ON [dbo].[wallet_transactions]([user_id], [idempotency_key])
  WHERE [idempotency_key] IS NOT NULL;

CREATE INDEX [wallet_transactions_user_idempotency_key_idx]
  ON [dbo].[wallet_transactions]([user_id], [idempotency_key]);

EXEC(N'CREATE UNIQUE INDEX [payments_user_idempotency_key_filtered_key]
  ON [dbo].[payments]([user_id], [idempotency_key])
  WHERE [idempotency_key] IS NOT NULL');

EXEC(N'CREATE INDEX [payments_user_idempotency_key_idx]
  ON [dbo].[payments]([user_id], [idempotency_key])');

COMMIT TRAN;
