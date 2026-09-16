BEGIN TRY
  BEGIN TRAN;

  IF COL_LENGTH('dbo.game_players', 'support_note') IS NULL
    ALTER TABLE [dbo].[game_players] ADD [support_note] NVARCHAR(2000) NULL;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
