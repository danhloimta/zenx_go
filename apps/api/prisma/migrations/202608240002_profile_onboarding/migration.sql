BEGIN TRAN;

ALTER TABLE [dbo].[user_profiles] ADD [address] NVARCHAR(255) NULL;
ALTER TABLE [dbo].[user_profiles] ADD [profile_completed_at] DATETIME2 NULL;

-- Existing profiles were already completed before onboarding was introduced.
EXEC(N'UPDATE [dbo].[user_profiles]
SET [profile_completed_at] = [updated_at]
WHERE [profile_completed_at] IS NULL');

COMMIT TRAN;
