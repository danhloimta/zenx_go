BEGIN TRY
  BEGIN TRAN;
  ALTER TABLE [dbo].[support_tickets] ADD [game_id] UNIQUEIDENTIFIER NULL;
  ALTER TABLE [dbo].[support_tickets] ADD CONSTRAINT [support_tickets_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE SET NULL;
  CREATE INDEX [support_tickets_game_id_last_activity_at_idx] ON [dbo].[support_tickets]([game_id], [last_activity_at]);
  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
