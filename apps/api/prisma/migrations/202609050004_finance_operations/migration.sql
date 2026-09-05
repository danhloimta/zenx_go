BEGIN TRY
  BEGIN TRAN;

  /* Existing deployments used a filtered unique index because ledger keys were
     nullable. Make every ledger row idempotent before exposing admin money
     operations. The legacy value is derived from the immutable row id. */
  UPDATE [dbo].[wallet_transactions]
    SET [idempotency_key] = CONCAT('legacy:', CONVERT(VARCHAR(36), [id]))
    WHERE [idempotency_key] IS NULL;

  IF EXISTS (
    SELECT [user_id], [idempotency_key]
    FROM [dbo].[wallet_transactions]
    GROUP BY [user_id], [idempotency_key]
    HAVING COUNT(*) > 1
  )
  BEGIN
    THROW 51000, 'Duplicate wallet transaction idempotency keys must be resolved before finance operations migration.', 1;
  END;

  IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[wallet_transactions]') AND name = N'wallet_transactions_user_idempotency_key_filtered_key')
    DROP INDEX [wallet_transactions_user_idempotency_key_filtered_key] ON [dbo].[wallet_transactions];
  IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[wallet_transactions]') AND name = N'wallet_transactions_user_idempotency_key_idx')
    DROP INDEX [wallet_transactions_user_idempotency_key_idx] ON [dbo].[wallet_transactions];

  ALTER TABLE [dbo].[wallet_transactions]
    ALTER COLUMN [idempotency_key] VARCHAR(255) NOT NULL;

  ALTER TABLE [dbo].[wallet_transactions]
    ADD CONSTRAINT [wallet_transactions_user_id_idempotency_key_key]
    UNIQUE NONCLUSTERED ([user_id], [idempotency_key]);

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
