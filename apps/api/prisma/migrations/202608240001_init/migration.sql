BEGIN TRAN;

CREATE TABLE [dbo].[users] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [users_pkey] PRIMARY KEY,
  [username] NVARCHAR(64) NOT NULL,
  [username_normalized] NVARCHAR(64) NOT NULL CONSTRAINT [users_username_normalized_key] UNIQUE,
  [email] NVARCHAR(320) NOT NULL,
  [email_normalized] NVARCHAR(320) NOT NULL CONSTRAINT [users_email_normalized_key] UNIQUE,
  [phone] NVARCHAR(32) NOT NULL,
  [phone_normalized] NVARCHAR(32) NOT NULL CONSTRAINT [users_phone_normalized_key] UNIQUE,
  [password_hash] NVARCHAR(255) NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [users_status_df] DEFAULT 'PENDING',
  [phone_verified_at] DATETIME2 NULL,
  [email_verified_at] DATETIME2 NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);
CREATE TABLE [dbo].[user_profiles] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [user_profiles_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [user_profiles_user_id_key] UNIQUE,
  [full_name] NVARCHAR(160) NOT NULL,
  [avatar_url] NVARCHAR(2048) NULL,
  [date_of_birth] DATE NULL,
  [gender] VARCHAR(16) NOT NULL CONSTRAINT [user_profiles_gender_df] DEFAULT 'UNSPECIFIED',
  [city] NVARCHAR(120) NULL,
  [terms_version] NVARCHAR(32) NOT NULL,
  [privacy_version] NVARCHAR(32) NOT NULL,
  [accepted_at] DATETIME2 NOT NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [user_profiles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);
CREATE TABLE [dbo].[social_identities] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [social_identities_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [provider] VARCHAR(16) NOT NULL,
  [provider_user_id] NVARCHAR(255) NOT NULL,
  [email_at_link_time] NVARCHAR(320) NULL,
  [linked_at] DATETIME2 NOT NULL CONSTRAINT [social_identities_linked_at_df] DEFAULT CURRENT_TIMESTAMP,
  [last_login_at] DATETIME2 NULL,
  CONSTRAINT [social_identities_provider_user_id_key] UNIQUE ([provider], [provider_user_id])
);
CREATE TABLE [dbo].[otp_requests] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [otp_requests_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NULL,
  [channel] VARCHAR(16) NOT NULL,
  [purpose] VARCHAR(32) NOT NULL,
  [destination] NVARCHAR(320) NOT NULL,
  [destination_normalized] NVARCHAR(320) NOT NULL,
  [code_hash] NVARCHAR(255) NOT NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [otp_requests_status_df] DEFAULT 'PENDING',
  [attempt_count] INT NOT NULL CONSTRAINT [otp_requests_attempt_count_df] DEFAULT 0,
  [expires_at] DATETIME2 NOT NULL,
  [resend_after] DATETIME2 NOT NULL,
  [used_at] DATETIME2 NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [otp_requests_created_at_df] DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE [dbo].[otp_verifications] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [otp_verifications_pkey] PRIMARY KEY,
  [otp_request_id] UNIQUEIDENTIFIER NOT NULL,
  [token_hash] NVARCHAR(255) NOT NULL CONSTRAINT [otp_verifications_token_hash_key] UNIQUE,
  [purpose] VARCHAR(32) NOT NULL,
  [expires_at] DATETIME2 NOT NULL,
  [consumed_at] DATETIME2 NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [otp_verifications_created_at_df] DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE [dbo].[refresh_sessions] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [refresh_sessions_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [token_hash] NVARCHAR(255) NOT NULL CONSTRAINT [refresh_sessions_token_hash_key] UNIQUE,
  [expires_at] DATETIME2 NOT NULL,
  [revoked_at] DATETIME2 NULL,
  [replaced_by_id] UNIQUEIDENTIFIER NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [refresh_sessions_created_at_df] DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE [dbo].[wallets] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [wallets_pkey] PRIMARY KEY,
  [user_id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [wallets_user_id_key] UNIQUE,
  [currency] VARCHAR(16) NOT NULL CONSTRAINT [wallets_currency_df] DEFAULT 'ZENX',
  [balance] BIGINT NOT NULL CONSTRAINT [wallets_balance_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [wallets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL,
  CONSTRAINT [wallets_balance_non_negative_ck] CHECK ([balance] >= 0)
);
CREATE TABLE [dbo].[coin_packages] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [coin_packages_pkey] PRIMARY KEY,
  [code] VARCHAR(32) NOT NULL CONSTRAINT [coin_packages_code_key] UNIQUE,
  [name] NVARCHAR(120) NOT NULL,
  [price_vnd] BIGINT NOT NULL CONSTRAINT [coin_packages_price_positive_ck] CHECK ([price_vnd] > 0),
  [coin_amount] BIGINT NOT NULL CONSTRAINT [coin_packages_coin_positive_ck] CHECK ([coin_amount] > 0),
  [status] VARCHAR(16) NOT NULL CONSTRAINT [coin_packages_status_df] DEFAULT 'ACTIVE',
  [sort_order] INT NOT NULL CONSTRAINT [coin_packages_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [coin_packages_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);
CREATE TABLE [dbo].[payments] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [payments_pkey] PRIMARY KEY,
  [payment_no] VARCHAR(40) NOT NULL CONSTRAINT [payments_payment_no_key] UNIQUE,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [coin_package_id] UNIQUEIDENTIFIER NOT NULL,
  [amount_vnd] BIGINT NOT NULL CONSTRAINT [payments_amount_positive_ck] CHECK ([amount_vnd] > 0),
  [coin_amount] BIGINT NOT NULL CONSTRAINT [payments_coin_positive_ck] CHECK ([coin_amount] > 0),
  [provider] VARCHAR(64) NOT NULL,
  [payment_method] VARCHAR(32) NOT NULL,
  [provider_transaction_id] VARCHAR(255) NULL,
  [provider_payload] NVARCHAR(4000) NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [payments_status_df] DEFAULT 'CREATED',
  [created_at] DATETIME2 NOT NULL CONSTRAINT [payments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [paid_at] DATETIME2 NULL,
  [expired_at] DATETIME2 NULL,
  [updated_at] DATETIME2 NOT NULL
);
CREATE TABLE [dbo].[wallet_transactions] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [wallet_transactions_pkey] PRIMARY KEY,
  [transaction_no] VARCHAR(40) NOT NULL CONSTRAINT [wallet_transactions_transaction_no_key] UNIQUE,
  [wallet_id] UNIQUEIDENTIFIER NOT NULL,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [payment_id] UNIQUEIDENTIFIER NULL,
  [type] VARCHAR(16) NOT NULL,
  [amount] BIGINT NOT NULL CONSTRAINT [wallet_transactions_amount_positive_ck] CHECK ([amount] > 0),
  [balance_before] BIGINT NOT NULL CONSTRAINT [wallet_transactions_balance_before_ck] CHECK ([balance_before] >= 0),
  [balance_after] BIGINT NOT NULL CONSTRAINT [wallet_transactions_balance_after_ck] CHECK ([balance_after] >= 0),
  [status] VARCHAR(16) NOT NULL CONSTRAINT [wallet_transactions_status_df] DEFAULT 'SUCCESS',
  [reference_type] VARCHAR(64) NOT NULL,
  [reference_id] VARCHAR(255) NOT NULL,
  [idempotency_key] VARCHAR(255) NULL,
  [description] NVARCHAR(500) NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [wallet_transactions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [completed_at] DATETIME2 NULL
);
CREATE UNIQUE INDEX [payments_provider_transaction_id_filtered_key] ON [dbo].[payments]([provider_transaction_id]) WHERE [provider_transaction_id] IS NOT NULL;
CREATE UNIQUE INDEX [wallet_transactions_payment_id_filtered_key] ON [dbo].[wallet_transactions]([payment_id]) WHERE [payment_id] IS NOT NULL;
CREATE UNIQUE INDEX [wallet_transactions_idempotency_key_filtered_key] ON [dbo].[wallet_transactions]([idempotency_key]) WHERE [idempotency_key] IS NOT NULL;
CREATE INDEX [users_status_idx] ON [dbo].[users]([status]);
CREATE INDEX [social_identities_user_id_idx] ON [dbo].[social_identities]([user_id]);
CREATE INDEX [otp_requests_destination_purpose_created_idx] ON [dbo].[otp_requests]([destination_normalized], [purpose], [created_at]);
CREATE INDEX [otp_requests_user_purpose_created_idx] ON [dbo].[otp_requests]([user_id], [purpose], [created_at]);
CREATE INDEX [otp_verifications_purpose_expires_idx] ON [dbo].[otp_verifications]([purpose], [expires_at]);
CREATE INDEX [refresh_sessions_user_revoked_idx] ON [dbo].[refresh_sessions]([user_id], [revoked_at]);
CREATE INDEX [wallet_transactions_wallet_created_idx] ON [dbo].[wallet_transactions]([wallet_id], [created_at]);
CREATE INDEX [wallet_transactions_user_created_idx] ON [dbo].[wallet_transactions]([user_id], [created_at]);
CREATE INDEX [coin_packages_status_sort_idx] ON [dbo].[coin_packages]([status], [sort_order]);
CREATE INDEX [payments_user_created_idx] ON [dbo].[payments]([user_id], [created_at]);
CREATE INDEX [payments_status_created_idx] ON [dbo].[payments]([status], [created_at]);
ALTER TABLE [dbo].[user_profiles] ADD CONSTRAINT [user_profiles_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[social_identities] ADD CONSTRAINT [social_identities_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[otp_requests] ADD CONSTRAINT [otp_requests_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL;
ALTER TABLE [dbo].[otp_verifications] ADD CONSTRAINT [otp_verifications_request_fkey] FOREIGN KEY ([otp_request_id]) REFERENCES [dbo].[otp_requests]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[refresh_sessions] ADD CONSTRAINT [refresh_sessions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[wallets] ADD CONSTRAINT [wallets_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[wallet_transactions] ADD CONSTRAINT [wallet_transactions_wallet_id_fkey] FOREIGN KEY ([wallet_id]) REFERENCES [dbo].[wallets]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[wallet_transactions] ADD CONSTRAINT [wallet_transactions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[wallet_transactions] ADD CONSTRAINT [wallet_transactions_payment_id_fkey] FOREIGN KEY ([payment_id]) REFERENCES [dbo].[payments]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_coin_package_id_fkey] FOREIGN KEY ([coin_package_id]) REFERENCES [dbo].[coin_packages]([id]) ON DELETE NO ACTION;

COMMIT TRAN;
