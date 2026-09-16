BEGIN TRY
  BEGIN TRAN;

  IF COL_LENGTH('dbo.games', 'maintenance_message') IS NULL
    ALTER TABLE [dbo].[games] ADD [maintenance_message] NVARCHAR(500) NULL;

  IF COL_LENGTH('dbo.games', 'maintenance_ends_at') IS NULL
    ALTER TABLE [dbo].[games] ADD [maintenance_ends_at] DATETIME2 NULL;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
