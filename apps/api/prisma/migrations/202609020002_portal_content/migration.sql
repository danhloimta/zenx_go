BEGIN TRAN;

ALTER TABLE [dbo].[games]
  ADD [primary_cta_label] NVARCHAR(80) NULL,
      [primary_cta_path] NVARCHAR(2048) NULL,
      [secondary_cta_label] NVARCHAR(80) NULL,
      [secondary_cta_path] NVARCHAR(2048) NULL;

CREATE TABLE [dbo].[portal_announcements] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [portal_announcements_pkey] PRIMARY KEY,
  [code] VARCHAR(64) NOT NULL CONSTRAINT [portal_announcements_code_key] UNIQUE,
  [title] NVARCHAR(160) NOT NULL,
  [message] NVARCHAR(500) NOT NULL,
  [cta_label] NVARCHAR(80) NULL,
  [cta_path] NVARCHAR(2048) NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [portal_announcements_status_df] DEFAULT 'PUBLISHED',
  [starts_at] DATETIME2 NOT NULL,
  [ends_at] DATETIME2 NULL,
  [sort_order] INT NOT NULL CONSTRAINT [portal_announcements_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [portal_announcements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE TABLE [dbo].[game_events] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_events_pkey] PRIMARY KEY,
  [game_id] UNIQUEIDENTIFIER NULL,
  [title] NVARCHAR(240) NOT NULL,
  [slug] VARCHAR(180) NOT NULL CONSTRAINT [game_events_slug_key] UNIQUE,
  [excerpt] NVARCHAR(1000) NOT NULL,
  [content] NVARCHAR(MAX) NOT NULL,
  [cover_image_url] NVARCHAR(2048) NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [game_events_status_df] DEFAULT 'PUBLISHED',
  [starts_at] DATETIME2 NOT NULL,
  [ends_at] DATETIME2 NULL,
  [published_at] DATETIME2 NULL,
  [seo_title] NVARCHAR(240) NULL,
  [seo_description] NVARCHAR(500) NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [game_events_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE INDEX [portal_announcements_status_window_idx]
  ON [dbo].[portal_announcements]([status], [starts_at], [ends_at]);
CREATE INDEX [game_events_game_status_published_idx]
  ON [dbo].[game_events]([game_id], [status], [published_at]);
CREATE INDEX [game_events_status_window_idx]
  ON [dbo].[game_events]([status], [starts_at], [ends_at]);

ALTER TABLE [dbo].[game_events]
  ADD CONSTRAINT [game_events_game_id_fkey]
  FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE SET NULL;

COMMIT TRAN;
