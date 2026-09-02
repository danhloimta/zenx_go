BEGIN TRAN;

CREATE TABLE [dbo].[games] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [games_pkey] PRIMARY KEY,
  [code] VARCHAR(32) NOT NULL CONSTRAINT [games_code_key] UNIQUE,
  [name] NVARCHAR(160) NOT NULL,
  [slug] VARCHAR(160) NOT NULL CONSTRAINT [games_slug_key] UNIQUE,
  [subdomain] VARCHAR(63) NOT NULL CONSTRAINT [games_subdomain_key] UNIQUE,
  [record_type] VARCHAR(16) NOT NULL,
  [tagline] NVARCHAR(500) NOT NULL,
  [short_description] NVARCHAR(1000) NOT NULL,
  [long_description] NVARCHAR(MAX) NULL,
  [lifecycle_status] VARCHAR(24) NOT NULL,
  [operational_status] VARCHAR(24) NOT NULL CONSTRAINT [games_operational_status_df] DEFAULT 'AVAILABLE',
  [release_year] INT NULL,
  [theme_preset] VARCHAR(40) NOT NULL,
  [theme_config] NVARCHAR(MAX) NOT NULL,
  [feature_config] NVARCHAR(MAX) NOT NULL,
  [logo_url] NVARCHAR(2048) NULL,
  [icon_url] NVARCHAR(2048) NULL,
  [cover_url] NVARCHAR(2048) NULL,
  [hero_desktop_url] NVARCHAR(2048) NULL,
  [hero_mobile_url] NVARCHAR(2048) NULL,
  [featured] BIT NOT NULL CONSTRAINT [games_featured_df] DEFAULT 0,
  [primary_game] BIT NOT NULL CONSTRAINT [games_primary_game_df] DEFAULT 0,
  [is_public] BIT NOT NULL CONSTRAINT [games_is_public_df] DEFAULT 0,
  [sort_order] INT NOT NULL CONSTRAINT [games_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [games_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE TABLE [dbo].[genres] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [genres_pkey] PRIMARY KEY,
  [code] VARCHAR(32) NOT NULL CONSTRAINT [genres_code_key] UNIQUE,
  [name] NVARCHAR(80) NOT NULL,
  [slug] VARCHAR(80) NOT NULL CONSTRAINT [genres_slug_key] UNIQUE,
  [sort_order] INT NOT NULL CONSTRAINT [genres_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [genres_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE TABLE [dbo].[game_genres] (
  [game_id] UNIQUEIDENTIFIER NOT NULL,
  [genre_id] UNIQUEIDENTIFIER NOT NULL,
  CONSTRAINT [game_genres_pkey] PRIMARY KEY ([game_id], [genre_id])
);

CREATE TABLE [dbo].[game_platforms] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_platforms_pkey] PRIMARY KEY,
  [game_id] UNIQUEIDENTIFIER NOT NULL,
  [platform] VARCHAR(24) NOT NULL,
  CONSTRAINT [game_platforms_game_id_platform_key] UNIQUE ([game_id], [platform])
);

CREATE TABLE [dbo].[game_articles] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_articles_pkey] PRIMARY KEY,
  [game_id] UNIQUEIDENTIFIER NOT NULL,
  [title] NVARCHAR(240) NOT NULL,
  [slug] VARCHAR(180) NOT NULL,
  [excerpt] NVARCHAR(1000) NOT NULL,
  [content] NVARCHAR(MAX) NOT NULL,
  [cover_image_url] NVARCHAR(2048) NULL,
  [category] VARCHAR(32) NOT NULL,
  [status] VARCHAR(16) NOT NULL CONSTRAINT [game_articles_status_df] DEFAULT 'PUBLISHED',
  [published_at] DATETIME2 NULL,
  [seo_title] NVARCHAR(240) NULL,
  [seo_description] NVARCHAR(500) NULL,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [game_articles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL,
  CONSTRAINT [game_articles_game_id_slug_key] UNIQUE ([game_id], [slug])
);

CREATE TABLE [dbo].[game_milestones] (
  [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [game_milestones_pkey] PRIMARY KEY,
  [game_id] UNIQUEIDENTIFIER NOT NULL,
  [title] NVARCHAR(240) NOT NULL,
  [description] NVARCHAR(1000) NULL,
  [display_period] NVARCHAR(80) NOT NULL,
  [status] VARCHAR(24) NOT NULL,
  [checklist_config] NVARCHAR(MAX) NOT NULL,
  [sort_order] INT NOT NULL CONSTRAINT [game_milestones_sort_order_df] DEFAULT 0,
  [created_at] DATETIME2 NOT NULL CONSTRAINT [game_milestones_created_at_df] DEFAULT CURRENT_TIMESTAMP,
  [updated_at] DATETIME2 NOT NULL
);

CREATE INDEX [games_is_public_sort_idx] ON [dbo].[games]([is_public], [sort_order]);
CREATE INDEX [games_subdomain_is_public_idx] ON [dbo].[games]([subdomain], [is_public]);
CREATE INDEX [games_lifecycle_status_is_public_idx] ON [dbo].[games]([lifecycle_status], [is_public]);
CREATE INDEX [game_genres_genre_id_game_id_idx] ON [dbo].[game_genres]([genre_id], [game_id]);
CREATE INDEX [game_platforms_platform_game_id_idx] ON [dbo].[game_platforms]([platform], [game_id]);
CREATE INDEX [game_articles_game_status_published_idx] ON [dbo].[game_articles]([game_id], [status], [published_at]);
CREATE INDEX [game_milestones_game_sort_idx] ON [dbo].[game_milestones]([game_id], [sort_order]);

ALTER TABLE [dbo].[game_genres] ADD CONSTRAINT [game_genres_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[game_genres] ADD CONSTRAINT [game_genres_genre_id_fkey] FOREIGN KEY ([genre_id]) REFERENCES [dbo].[genres]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[game_platforms] ADD CONSTRAINT [game_platforms_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[game_articles] ADD CONSTRAINT [game_articles_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE;
ALTER TABLE [dbo].[game_milestones] ADD CONSTRAINT [game_milestones_game_id_fkey] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE;

COMMIT TRAN;
