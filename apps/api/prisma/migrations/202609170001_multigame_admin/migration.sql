BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[roles] ADD [scope_type] VARCHAR(16) NOT NULL CONSTRAINT [roles_scope_type_df] DEFAULT 'PLATFORM';
  ALTER TABLE [dbo].[permissions] ADD [scope_type] VARCHAR(16) NOT NULL CONSTRAINT [permissions_scope_type_df] DEFAULT 'PLATFORM';
  ALTER TABLE [dbo].[authorization_audit_logs] ADD [game_id] UNIQUEIDENTIFIER NULL;
  ALTER TABLE [dbo].[authorization_audit_logs] ADD CONSTRAINT [authorization_audit_logs_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE SET NULL;
  CREATE INDEX [authorization_audit_logs_game_id_created_at_idx] ON [dbo].[authorization_audit_logs]([game_id], [created_at]);

  CREATE TABLE [dbo].[game_role_assignments] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_role_assignments_pkey] PRIMARY KEY,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [game_id] UNIQUEIDENTIFIER NOT NULL,
    [role_id] UNIQUEIDENTIFIER NOT NULL,
    [assigned_by_user_id] UNIQUEIDENTIFIER NULL,
    [assigned_at] DATETIME2 NOT NULL CONSTRAINT [game_role_assignments_assigned_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [game_role_assignments_user_game_role_key] UNIQUE ([user_id], [game_id], [role_id]),
    CONSTRAINT [game_role_assignments_user_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
    CONSTRAINT [game_role_assignments_game_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE,
    CONSTRAINT [game_role_assignments_role_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE,
    CONSTRAINT [game_role_assignments_assigned_by_fkey] FOREIGN KEY ([assigned_by_user_id]) REFERENCES [dbo].[users]([id])
  );
  CREATE INDEX [game_role_assignments_game_user_idx] ON [dbo].[game_role_assignments]([game_id], [user_id]);
  CREATE INDEX [game_role_assignments_role_user_idx] ON [dbo].[game_role_assignments]([role_id], [user_id]);

  CREATE TABLE [dbo].[game_players] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_players_pkey] PRIMARY KEY,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [game_id] UNIQUEIDENTIFIER NOT NULL,
    [status] VARCHAR(16) NOT NULL CONSTRAINT [game_players_status_df] DEFAULT 'ACTIVE',
    [first_login_at] DATETIME2 NOT NULL CONSTRAINT [game_players_first_login_at_df] DEFAULT CURRENT_TIMESTAMP,
    [last_login_at] DATETIME2 NOT NULL CONSTRAINT [game_players_last_login_at_df] DEFAULT CURRENT_TIMESTAMP,
    [login_count] INT NOT NULL CONSTRAINT [game_players_login_count_df] DEFAULT 1,
    [blocked_at] DATETIME2 NULL,
    [blocked_by_user_id] UNIQUEIDENTIFIER NULL,
    [block_reason] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [game_players_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [game_players_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [game_players_user_game_key] UNIQUE ([user_id], [game_id]),
    CONSTRAINT [game_players_user_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
    CONSTRAINT [game_players_game_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE,
    CONSTRAINT [game_players_blocked_by_fkey] FOREIGN KEY ([blocked_by_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL
  );
  CREATE INDEX [game_players_game_last_login_idx] ON [dbo].[game_players]([game_id], [last_login_at]);
  CREATE INDEX [game_players_game_status_last_login_idx] ON [dbo].[game_players]([game_id], [status], [last_login_at]);

  CREATE TABLE [dbo].[game_sso_clients] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_sso_clients_pkey] PRIMARY KEY,
    [game_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_sso_clients_game_key] UNIQUE,
    [client_id] VARCHAR(96) NOT NULL CONSTRAINT [game_sso_clients_client_id_key] UNIQUE,
    [client_secret_hash] NVARCHAR(255) NOT NULL,
    [redirect_uri] NVARCHAR(2048) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [game_sso_clients_is_active_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [game_sso_clients_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [game_sso_clients_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [game_sso_clients_game_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE
  );

  CREATE TABLE [dbo].[game_sso_authorization_codes] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_sso_authorization_codes_pkey] PRIMARY KEY,
    [code_hash] CHAR(64) NOT NULL CONSTRAINT [game_sso_authorization_codes_code_hash_key] UNIQUE,
    [client_id] UNIQUEIDENTIFIER NOT NULL,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [game_id] UNIQUEIDENTIFIER NOT NULL,
    [redirect_uri] NVARCHAR(2048) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [game_sso_authorization_codes_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [game_sso_authorization_codes_user_client_key] UNIQUE ([user_id], [client_id]),
    CONSTRAINT [game_sso_authorization_codes_client_fkey] FOREIGN KEY ([client_id]) REFERENCES [dbo].[game_sso_clients]([id]),
    CONSTRAINT [game_sso_authorization_codes_user_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
    CONSTRAINT [game_sso_authorization_codes_game_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE
  );
  CREATE INDEX [game_sso_authorization_codes_expires_at_idx] ON [dbo].[game_sso_authorization_codes]([expires_at]);
  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
