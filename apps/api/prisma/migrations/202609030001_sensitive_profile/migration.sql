BEGIN TRAN;

CREATE TABLE [dbo].[sensitive_profiles] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [sensitive_profiles_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [sensitive_profiles_user_id_key] UNIQUE,
  [citizen_id_ciphertext] NVARCHAR(2048) NULL,
  [citizen_id_iv] VARCHAR(32) NULL,
  [citizen_id_auth_tag] VARCHAR(32) NULL,
  [citizen_id_lookup_hash] CHAR(64) NULL,
  [citizen_id_last4] CHAR(4) NULL,
  [secret_code_hash] NVARCHAR(255) NULL,
  [security_question_code] VARCHAR(40) NULL,
  [security_answer_hash] NVARCHAR(255) NULL,
  [security_version] INT NOT NULL CONSTRAINT [sensitive_profiles_security_version_df] DEFAULT 0,
  [failed_challenge_count] INT NOT NULL CONSTRAINT [sensitive_profiles_failed_challenge_count_df] DEFAULT 0,
  [challenge_locked_until] DATETIME2 NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [sensitive_profiles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL,
  CONSTRAINT [sensitive_profiles_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [sensitive_profiles_citizen_id_lookup_hash_key]
ON [dbo].[sensitive_profiles]([citizen_id_lookup_hash])
WHERE [citizen_id_lookup_hash] IS NOT NULL;

COMMIT TRAN;
