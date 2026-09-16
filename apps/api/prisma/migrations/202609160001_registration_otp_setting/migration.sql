BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[auth_settings]
    ADD [phone_registration_otp_required] BIT NOT NULL
      CONSTRAINT [auth_settings_phone_registration_otp_required_df] DEFAULT 1;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
