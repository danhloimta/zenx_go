BEGIN TRY
  BEGIN TRAN;

  IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[genres]')
      AND name = N'is_active'
  )
  BEGIN
    EXEC sp_executesql N'
      ALTER TABLE [dbo].[genres]
        ADD [is_active] BIT NOT NULL CONSTRAINT [genres_is_active_df] DEFAULT 1;
    ';

    -- Dynamic SQL is required here: SQL Server compiles the outer batch before
    -- the ALTER is applied, so a regular UPDATE would not see the new column.
    EXEC sp_executesql N'UPDATE [dbo].[genres] SET [is_active] = 1;';
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[dbo].[genres]')
      AND name = N'genres_is_active_sort_order_idx'
  )
  BEGIN
    EXEC sp_executesql N'
      CREATE NONCLUSTERED INDEX [genres_is_active_sort_order_idx]
        ON [dbo].[genres]([is_active], [sort_order]);
    ';
  END;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
