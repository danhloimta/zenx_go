BEGIN TRY
  BEGIN TRAN;

  IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[game_articles]') 
      AND name = N'deleted_at'
  )
  BEGIN
    ALTER TABLE [dbo].[game_articles]
      ADD [deleted_at] DATETIME2 NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'[dbo].[game_articles]') 
      AND name = N'game_articles_deleted_at_idx'
  )
  BEGIN
    CREATE NONCLUSTERED INDEX [game_articles_deleted_at_idx]
      ON [dbo].[game_articles] ([deleted_at]);
  END;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
