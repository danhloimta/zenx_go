BEGIN TRY
  BEGIN TRAN;

  CREATE TABLE [dbo].[auth_settings] (
    [id] INT NOT NULL CONSTRAINT [auth_settings_pkey] PRIMARY KEY CONSTRAINT [auth_settings_id_df] DEFAULT 1,
    [google_login_registration_enabled] BIT NOT NULL CONSTRAINT [auth_settings_google_login_registration_enabled_df] DEFAULT 1,
    [facebook_login_registration_enabled] BIT NOT NULL CONSTRAINT [auth_settings_facebook_login_registration_enabled_df] DEFAULT 1,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [auth_settings_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [auth_settings_singleton_check] CHECK ([id] = 1)
  );

  INSERT INTO [dbo].[auth_settings] ([id]) VALUES (1);

  INSERT INTO [dbo].[permissions] ([id], [code], [module], [action], [subject], [name], [sort_order])
  VALUES (NEWID(), 'settings.auth.manage', 'settings', 'manage', 'AuthSettings', N'Quản lý cài đặt đăng nhập', 1);

  INSERT INTO [dbo].[role_permissions] ([role_id], [permission_id])
  SELECT r.[id], p.[id]
  FROM [dbo].[roles] r
  INNER JOIN [dbo].[permissions] p ON p.[code] = 'settings.auth.manage'
  WHERE r.[code] = 'SUPER_ADMIN';

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
