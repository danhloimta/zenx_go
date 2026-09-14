BEGIN TRY
  BEGIN TRAN;

  CREATE TABLE [dbo].[roles] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [roles_pkey] PRIMARY KEY,
    [code] VARCHAR(32) NOT NULL CONSTRAINT [roles_code_key] UNIQUE,
    [name] NVARCHAR(120) NOT NULL,
    [description] NVARCHAR(500) NULL,
    [is_system] BIT NOT NULL CONSTRAINT [roles_is_system_df] DEFAULT 0,
    [is_active] BIT NOT NULL CONSTRAINT [roles_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [roles_updated_at_df] DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE [dbo].[permissions] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [permissions_pkey] PRIMARY KEY,
    [code] VARCHAR(64) NOT NULL CONSTRAINT [permissions_code_key] UNIQUE,
    [module] VARCHAR(32) NOT NULL,
    [action] VARCHAR(48) NOT NULL,
    [subject] VARCHAR(48) NOT NULL,
    [name] NVARCHAR(160) NOT NULL,
    [description] NVARCHAR(500) NULL,
    [sort_order] INT NOT NULL CONSTRAINT [permissions_sort_order_df] DEFAULT 0,
    [is_active] BIT NOT NULL CONSTRAINT [permissions_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [permissions_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [permissions_action_subject_key] UNIQUE ([action], [subject])
  );
  CREATE TABLE [dbo].[role_permissions] (
    [role_id] UNIQUEIDENTIFIER NOT NULL,
    [permission_id] UNIQUEIDENTIFIER NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [role_permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [role_permissions_pkey] PRIMARY KEY ([role_id], [permission_id]),
    CONSTRAINT [role_permissions_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE,
    CONSTRAINT [role_permissions_permission_id_fkey] FOREIGN KEY ([permission_id]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE
  );
  CREATE TABLE [dbo].[authorization_audit_logs] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [authorization_audit_logs_pkey] PRIMARY KEY,
    [actor_user_id] UNIQUEIDENTIFIER NULL,
    [action] VARCHAR(64) NOT NULL,
    [target_type] VARCHAR(32) NOT NULL,
    [target_id] UNIQUEIDENTIFIER NULL,
    [before_data] NVARCHAR(max) NULL,
    [after_data] NVARCHAR(max) NULL,
    [reason] NVARCHAR(500) NULL,
    [ip_address] VARCHAR(64) NULL,
    [user_agent] NVARCHAR(512) NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [authorization_audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [authorization_audit_logs_actor_user_id_fkey] FOREIGN KEY ([actor_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL
  );

  INSERT INTO [dbo].[roles] ([id], [code], [name], [description], [is_system]) VALUES
    (NEWID(), 'SUPER_ADMIN', N'Super Admin', N'Toàn quyền hệ thống', 1),
    (NEWID(), 'SUPPORT', N'Nhân viên hỗ trợ', N'Vận hành hỗ trợ khách hàng', 1);

  INSERT INTO [dbo].[permissions] ([id], [code], [module], [action], [subject], [name], [sort_order]) VALUES
    (NEWID(), 'admin.access', 'admin', 'access', 'Admin', N'Truy cập quản trị', 1),
    (NEWID(), 'admin.dashboard.view', 'admin', 'read', 'Dashboard', N'Xem tổng quan', 2),
    (NEWID(), 'users.view', 'users', 'read', 'User', N'Xem người dùng', 1),
    (NEWID(), 'users.profile.update', 'users', 'update-profile', 'User', N'Cập nhật hồ sơ người dùng', 2),
    (NEWID(), 'users.status.update', 'users', 'update-status', 'User', N'Cập nhật trạng thái người dùng', 3),
    (NEWID(), 'users.roles.assign', 'users', 'assign-role', 'User', N'Gán role người dùng', 4),
    (NEWID(), 'users.sessions.revoke', 'users', 'revoke-session', 'User', N'Thu hồi phiên người dùng', 5),
    (NEWID(), 'users.password.reset', 'users', 'reset-password', 'User', N'Đặt lại mật khẩu', 6),
    (NEWID(), 'users.sensitive.view', 'users', 'view-sensitive', 'User', N'Xem dữ liệu nhạy cảm', 7),
    (NEWID(), 'users.sensitive.update', 'users', 'update-sensitive', 'User', N'Cập nhật dữ liệu nhạy cảm', 8),
    (NEWID(), 'roles.view', 'roles', 'read', 'Role', N'Xem role', 1),
    (NEWID(), 'roles.create', 'roles', 'create', 'Role', N'Tạo role', 2),
    (NEWID(), 'roles.update', 'roles', 'update', 'Role', N'Cập nhật role', 3),
    (NEWID(), 'roles.delete', 'roles', 'delete', 'Role', N'Xóa role', 4),
    (NEWID(), 'roles.permissions.assign', 'roles', 'assign-permission', 'Role', N'Gán permission cho role', 5),
    (NEWID(), 'support.dashboard.view', 'support', 'read', 'SupportDashboard', N'Xem tổng quan hỗ trợ', 1),
    (NEWID(), 'support.agents.view', 'support', 'read', 'SupportAgent', N'Xem nhân viên hỗ trợ', 2),
    (NEWID(), 'support.tickets.view', 'support', 'read', 'SupportTicket', N'Xem ticket', 3),
    (NEWID(), 'support.tickets.claim', 'support', 'claim', 'SupportTicket', N'Nhận ticket', 4),
    (NEWID(), 'support.tickets.update', 'support', 'update', 'SupportTicket', N'Cập nhật ticket', 5),
    (NEWID(), 'support.tickets.reply', 'support', 'reply', 'SupportTicket', N'Phản hồi ticket', 6),
    (NEWID(), 'support.tickets.internal-note', 'support', 'internal-note', 'SupportTicket', N'Ghi chú nội bộ', 7),
    (NEWID(), 'support.faq.manage', 'support', 'manage', 'SupportFaq', N'Quản lý FAQ', 8),
    (NEWID(), 'content.dashboard.view', 'content', 'read', 'ContentDashboard', N'Xem tổng quan nội dung', 1),
    (NEWID(), 'content.assets.upload', 'content', 'upload', 'Asset', N'Tải asset', 2),
    (NEWID(), 'games.view', 'content', 'read', 'Game', N'Xem game', 3),
    (NEWID(), 'games.manage', 'content', 'manage', 'Game', N'Quản lý game', 4),
    (NEWID(), 'games.publish', 'content', 'publish', 'Game', N'Xuất bản game', 5),
    (NEWID(), 'genres.manage', 'content', 'manage', 'Genre', N'Quản lý thể loại', 6),
    (NEWID(), 'articles.manage', 'content', 'manage', 'Article', N'Quản lý bài viết', 7),
    (NEWID(), 'events.manage', 'content', 'manage', 'Event', N'Quản lý sự kiện', 8),
    (NEWID(), 'announcements.manage', 'content', 'manage', 'Announcement', N'Quản lý thông báo', 9),
    (NEWID(), 'finance.dashboard.view', 'finance', 'read', 'FinanceDashboard', N'Xem tổng quan tài chính', 1),
    (NEWID(), 'finance.packages.manage', 'finance', 'manage', 'CoinPackage', N'Quản lý gói nạp', 2),
    (NEWID(), 'finance.payments.view', 'finance', 'read', 'Payment', N'Xem payment', 3),
    (NEWID(), 'finance.payments.process', 'finance', 'process', 'Payment', N'Xử lý payment', 4),
    (NEWID(), 'finance.payments.refund', 'finance', 'refund', 'Payment', N'Hoàn tiền payment', 5),
    (NEWID(), 'finance.transactions.view', 'finance', 'read', 'WalletTransaction', N'Xem giao dịch ví', 6),
    (NEWID(), 'finance.transactions.export', 'finance', 'export', 'WalletTransaction', N'Xuất giao dịch ví', 7),
    (NEWID(), 'finance.wallet.adjust', 'finance', 'adjust', 'Wallet', N'Điều chỉnh ví', 8);

  INSERT INTO [dbo].[role_permissions] ([role_id], [permission_id])
  SELECT r.[id], p.[id] FROM [dbo].[roles] r CROSS JOIN [dbo].[permissions] p WHERE r.[code] = 'SUPPORT' AND (p.[module] = 'support' OR p.[code] = 'admin.access');

  ALTER TABLE [dbo].[user_roles] ADD [role_id] UNIQUEIDENTIFIER NULL, [assigned_by_user_id] UNIQUEIDENTIFIER NULL, [assigned_at] DATETIME2 NULL;
  UPDATE ur SET [role_id] = r.[id], [assigned_at] = ur.[created_at] FROM [dbo].[user_roles] ur INNER JOIN [dbo].[roles] r ON r.[code] = ur.[role];
  IF EXISTS (SELECT 1 FROM [dbo].[user_roles] WHERE [role_id] IS NULL) THROW 50001, 'Cannot migrate an unknown legacy role.', 1;
  ALTER TABLE [dbo].[user_roles] ALTER COLUMN [role_id] UNIQUEIDENTIFIER NOT NULL;
  ALTER TABLE [dbo].[user_roles] ALTER COLUMN [assigned_at] DATETIME2 NOT NULL;
  ALTER TABLE [dbo].[user_roles] DROP CONSTRAINT [user_roles_user_id_role_key];
  DROP INDEX [user_roles_role_user_id_idx] ON [dbo].[user_roles];
  ALTER TABLE [dbo].[user_roles] DROP COLUMN [role];
  ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_user_id_role_id_key] UNIQUE ([user_id], [role_id]);
  ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]);
  ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_assigned_by_user_id_fkey] FOREIGN KEY ([assigned_by_user_id]) REFERENCES [dbo].[users]([id]);
  CREATE INDEX [user_roles_role_id_user_id_idx] ON [dbo].[user_roles]([role_id], [user_id]);
  CREATE INDEX [roles_is_active_code_idx] ON [dbo].[roles]([is_active], [code]);
  CREATE INDEX [permissions_module_sort_order_idx] ON [dbo].[permissions]([module], [sort_order]);
  CREATE INDEX [role_permissions_permission_id_role_id_idx] ON [dbo].[role_permissions]([permission_id], [role_id]);
  CREATE INDEX [authorization_audit_logs_target_type_target_id_created_at_idx] ON [dbo].[authorization_audit_logs]([target_type], [target_id], [created_at]);
  CREATE INDEX [authorization_audit_logs_actor_user_id_created_at_idx] ON [dbo].[authorization_audit_logs]([actor_user_id], [created_at]);
  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
