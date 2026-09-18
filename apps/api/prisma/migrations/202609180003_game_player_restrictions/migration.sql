BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[game_players]
    ALTER COLUMN [status] VARCHAR(24) NOT NULL;

  UPDATE [dbo].[game_players]
  SET [status] = 'PERMANENTLY_BANNED'
  WHERE [status] = 'BLOCKED';

  ALTER TABLE [dbo].[game_players]
    ADD [blocked_until] DATETIME2 NULL,
        [chat_blocked] BIT NOT NULL CONSTRAINT [game_players_chat_blocked_df] DEFAULT 0,
        [chat_blocked_at] DATETIME2 NULL,
        [chat_blocked_by_user_id] UNIQUEIDENTIFIER NULL,
        [chat_block_reason] NVARCHAR(500) NULL;

  ALTER TABLE [dbo].[game_players]
    ADD CONSTRAINT [game_players_chat_blocked_by_fkey]
      FOREIGN KEY ([chat_blocked_by_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION;

  CREATE INDEX [game_players_game_blocked_until_idx]
    ON [dbo].[game_players]([game_id], [blocked_until]);

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
