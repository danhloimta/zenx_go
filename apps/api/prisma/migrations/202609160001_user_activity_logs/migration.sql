CREATE TABLE [dbo].[user_activity_logs] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [user_activity_logs_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [category] VARCHAR(16) NOT NULL,
  [event_type] VARCHAR(64) NOT NULL,
  [outcome] VARCHAR(16) NOT NULL,
  [actor_type] VARCHAR(16) NOT NULL,
  [ip_address] VARCHAR(64) NULL,
  [user_agent] NVARCHAR(512) NULL,
  [device_label] NVARCHAR(160) NULL,
  [metadata] NVARCHAR(MAX) NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [user_activity_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [user_activity_logs_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
  CONSTRAINT [user_activity_logs_category_ck] CHECK ([category] IN ('LOGIN', 'SECURITY')),
  CONSTRAINT [user_activity_logs_outcome_ck] CHECK ([outcome] IN ('SUCCESS', 'FAILED')),
  CONSTRAINT [user_activity_logs_actor_type_ck] CHECK ([actor_type] IN ('USER', 'ADMIN', 'SYSTEM'))
);
CREATE INDEX [user_activity_logs_user_created_idx] ON [dbo].[user_activity_logs]([user_id], [created_at] DESC, [id] DESC);
CREATE INDEX [user_activity_logs_user_category_created_idx] ON [dbo].[user_activity_logs]([user_id], [category], [created_at] DESC, [id] DESC);
CREATE INDEX [user_activity_logs_created_at_idx] ON [dbo].[user_activity_logs]([created_at]);
