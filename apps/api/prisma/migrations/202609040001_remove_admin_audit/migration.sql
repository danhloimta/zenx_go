BEGIN TRY
  BEGIN TRAN;

  IF OBJECT_ID(N'[dbo].[admin_audit_logs]', N'U') IS NOT NULL
  BEGIN
    ALTER TABLE [dbo].[admin_audit_logs]
      DROP CONSTRAINT [admin_audit_logs_actor_user_id_fkey];
    DROP TABLE [dbo].[admin_audit_logs];
  END;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
