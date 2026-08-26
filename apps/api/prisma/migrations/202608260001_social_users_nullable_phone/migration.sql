BEGIN TRAN;

ALTER TABLE [dbo].[users] ALTER COLUMN [phone] NVARCHAR(32) NULL;
ALTER TABLE [dbo].[users] ALTER COLUMN [phone_normalized] NVARCHAR(32) NULL;
ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_phone_normalized_key];

CREATE UNIQUE INDEX [users_phone_normalized_key]
ON [dbo].[users] ([phone_normalized])
WHERE [phone_normalized] IS NOT NULL;

COMMIT TRAN;
