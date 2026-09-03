BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[support_tickets]
    ADD [priority] VARCHAR(16) NOT NULL CONSTRAINT [support_tickets_priority_df] DEFAULT 'NORMAL',
        [assignee_user_id] UNIQUEIDENTIFIER NULL,
        [last_activity_at] DATETIME2 NOT NULL CONSTRAINT [support_tickets_last_activity_at_df] DEFAULT CURRENT_TIMESTAMP,
        [last_customer_message_at] DATETIME2 NULL,
        [last_staff_reply_at] DATETIME2 NULL,
        [resolved_at] DATETIME2 NULL,
        [closed_at] DATETIME2 NULL;

  EXEC sp_executesql N'
    UPDATE [dbo].[support_tickets]
      SET [last_activity_at] = [updated_at],
          [last_customer_message_at] = [created_at],
          [resolved_at] = CASE WHEN [status] IN (''RESOLVED'', ''CLOSED'') THEN [updated_at] ELSE NULL END,
          [closed_at] = CASE WHEN [status] = ''CLOSED'' THEN [updated_at] ELSE NULL END';

  CREATE TABLE [dbo].[support_ticket_messages] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [support_ticket_messages_pkey] PRIMARY KEY,
    [ticket_id] UNIQUEIDENTIFIER NOT NULL,
    [author_user_id] UNIQUEIDENTIFIER NOT NULL,
    [author_type] VARCHAR(16) NOT NULL,
    [visibility] VARCHAR(16) NOT NULL,
    [body] NVARCHAR(4000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [support_ticket_messages_created_at_df] DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE [dbo].[support_ticket_read_states] (
    [ticket_id] UNIQUEIDENTIFIER NOT NULL,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [last_read_at] DATETIME2 NOT NULL,
    CONSTRAINT [support_ticket_read_states_pkey] PRIMARY KEY CLUSTERED ([ticket_id], [user_id])
  );

  CREATE INDEX [support_tickets_status_priority_last_activity_idx]
    ON [dbo].[support_tickets]([status], [priority], [last_activity_at]);
  CREATE INDEX [support_tickets_assignee_status_last_activity_idx]
    ON [dbo].[support_tickets]([assignee_user_id], [status], [last_activity_at]);
  CREATE INDEX [support_tickets_last_activity_idx]
    ON [dbo].[support_tickets]([last_activity_at]);
  CREATE INDEX [support_ticket_messages_ticket_created_idx]
    ON [dbo].[support_ticket_messages]([ticket_id], [created_at]);
  CREATE INDEX [support_ticket_messages_author_created_idx]
    ON [dbo].[support_ticket_messages]([author_user_id], [created_at]);
  CREATE INDEX [support_ticket_read_states_user_read_idx]
    ON [dbo].[support_ticket_read_states]([user_id], [last_read_at]);

  ALTER TABLE [dbo].[support_tickets]
    ADD CONSTRAINT [support_tickets_assignee_user_id_fkey]
    FOREIGN KEY ([assignee_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

  ALTER TABLE [dbo].[support_ticket_messages]
    ADD CONSTRAINT [support_ticket_messages_ticket_id_fkey]
    FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[support_tickets]([id]) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT [support_ticket_messages_author_user_id_fkey]
    FOREIGN KEY ([author_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  ALTER TABLE [dbo].[support_ticket_read_states]
    ADD CONSTRAINT [support_ticket_read_states_ticket_id_fkey]
    FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[support_tickets]([id]) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT [support_ticket_read_states_user_id_fkey]
    FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
