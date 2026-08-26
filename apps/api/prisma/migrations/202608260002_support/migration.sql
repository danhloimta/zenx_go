BEGIN TRAN;

CREATE TABLE [dbo].[support_categories] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [support_categories_pkey] PRIMARY KEY,
  [code] VARCHAR(32) NOT NULL CONSTRAINT [support_categories_code_key] UNIQUE,
  [name] NVARCHAR(80) NOT NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [support_categories_status_df] DEFAULT 'ACTIVE',
  [sort_order] INT NOT NULL CONSTRAINT [support_categories_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [support_categories_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE TABLE [dbo].[support_faqs] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [support_faqs_pkey] PRIMARY KEY,
  [category_id] UNIQUEIDENTIFIER NOT NULL,
  [question] NVARCHAR(500) NOT NULL,
  [answer] NVARCHAR(4000) NOT NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [support_faqs_status_df] DEFAULT 'ACTIVE',
  [sort_order] INT NOT NULL CONSTRAINT [support_faqs_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [support_faqs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL,
  CONSTRAINT [support_faqs_category_question_key] UNIQUE ([category_id], [question])
);

CREATE TABLE [dbo].[support_tickets] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [support_tickets_pkey] PRIMARY KEY,
  [ticket_no] VARCHAR(40) NOT NULL CONSTRAINT [support_tickets_ticket_no_key] UNIQUE,
  [user_id] UNIQUEIDENTIFIER NOT NULL,
  [category_id] UNIQUEIDENTIFIER NOT NULL,
  [subject] NVARCHAR(160) NOT NULL,
  [description] NVARCHAR(4000) NOT NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [support_tickets_status_df] DEFAULT 'NEW',
  [created_at] DATETIME2 NOT NULL CONSTRAINT [support_tickets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE INDEX [support_categories_status_sort_idx] ON [dbo].[support_categories]([status], [sort_order]);
CREATE INDEX [support_faqs_category_status_sort_idx] ON [dbo].[support_faqs]([category_id], [status], [sort_order]);
CREATE INDEX [support_tickets_user_created_idx] ON [dbo].[support_tickets]([user_id], [created_at]);
CREATE INDEX [support_tickets_user_status_created_idx] ON [dbo].[support_tickets]([user_id], [status], [created_at]);

ALTER TABLE [dbo].[support_faqs]
  ADD CONSTRAINT [support_faqs_category_id_fkey]
  FOREIGN KEY ([category_id]) REFERENCES [dbo].[support_categories]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[support_tickets]
  ADD CONSTRAINT [support_tickets_user_id_fkey]
  FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION;
ALTER TABLE [dbo].[support_tickets]
  ADD CONSTRAINT [support_tickets_category_id_fkey]
  FOREIGN KEY ([category_id]) REFERENCES [dbo].[support_categories]([id]) ON DELETE NO ACTION;

COMMIT TRAN;
