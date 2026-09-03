BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[users]
    ADD [auth_version] INT NOT NULL CONSTRAINT [users_auth_version_df] DEFAULT 0,
        [must_change_password] BIT NOT NULL CONSTRAINT [users_must_change_password_df] DEFAULT 0;

  CREATE TABLE [dbo].[user_roles] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [user_roles_pkey] PRIMARY KEY,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [role] VARCHAR(32) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_roles_user_id_role_key] UNIQUE NONCLUSTERED ([user_id], [role])
  );

  CREATE TABLE [dbo].[admin_audit_logs] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [admin_audit_logs_pkey] PRIMARY KEY,
    [actor_user_id] UNIQUEIDENTIFIER NOT NULL,
    [action] VARCHAR(64) NOT NULL,
    [target_type] VARCHAR(32) NOT NULL,
    [target_id] UNIQUEIDENTIFIER NULL,
    [reason] NVARCHAR(500) NOT NULL,
    [metadata] NVARCHAR(max) NOT NULL,
    [ip_address] VARCHAR(64) NULL,
    [user_agent] NVARCHAR(512) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [admin_audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX [user_roles_role_user_id_idx] ON [dbo].[user_roles]([role], [user_id]);
  CREATE INDEX [admin_audit_logs_created_at_idx] ON [dbo].[admin_audit_logs]([created_at]);
  CREATE INDEX [admin_audit_logs_actor_user_id_created_at_idx] ON [dbo].[admin_audit_logs]([actor_user_id], [created_at]);
  CREATE INDEX [admin_audit_logs_target_type_target_id_created_at_idx] ON [dbo].[admin_audit_logs]([target_type], [target_id], [created_at]);
  CREATE INDEX [admin_audit_logs_action_created_at_idx] ON [dbo].[admin_audit_logs]([action], [created_at]);

  ALTER TABLE [dbo].[user_roles]
    ADD CONSTRAINT [user_roles_user_id_fkey]
    FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE [dbo].[admin_audit_logs]
    ADD CONSTRAINT [admin_audit_logs_actor_user_id_fkey]
    FOREIGN KEY ([actor_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
