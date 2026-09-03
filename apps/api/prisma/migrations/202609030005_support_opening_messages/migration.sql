BEGIN TRY
  BEGIN TRAN;

  INSERT INTO [dbo].[support_ticket_messages]
    ([id], [ticket_id], [author_user_id], [author_type], [visibility], [body], [created_at])
  SELECT
    NEWID(),
    ticket.[id],
    ticket.[user_id],
    'CUSTOMER',
    'PUBLIC',
    ticket.[description],
    ticket.[created_at]
  FROM [dbo].[support_tickets] AS ticket
  WHERE NOT EXISTS (
    SELECT 1
    FROM [dbo].[support_ticket_messages] AS message
    WHERE message.[ticket_id] = ticket.[id]
  );

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
