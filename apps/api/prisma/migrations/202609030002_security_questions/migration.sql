BEGIN TRAN;

CREATE TABLE [dbo].[security_questions] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [security_questions_pkey] PRIMARY KEY,
  [code] VARCHAR(40) NOT NULL CONSTRAINT [security_questions_code_key] UNIQUE,
  [label] NVARCHAR(255) NOT NULL,
  [sort_order] INT NOT NULL CONSTRAINT [security_questions_sort_order_df] DEFAULT 0,
  [is_active] BIT NOT NULL CONSTRAINT [security_questions_is_active_df] DEFAULT 1,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [security_questions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE INDEX [security_questions_is_active_sort_order_idx]
ON [dbo].[security_questions]([is_active], [sort_order]);

COMMIT TRAN;
