BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[games]
    ADD [template_version] INT NOT NULL CONSTRAINT [games_template_version_df] DEFAULT 1,
        [page_config] NVARCHAR(MAX) NOT NULL CONSTRAINT [games_page_config_df] DEFAULT N'{}';

  UPDATE [dbo].[games]
    SET [theme_preset] = 'EDITORIAL_FANTASY'
    WHERE [theme_preset] NOT IN ('EDITORIAL_FANTASY', 'DARK_STRATEGY', 'PLAYFUL_CASUAL', 'SCI_FI_SHOOTER');

  /* Backfill a valid, data-driven page skeleton for existing records. Dynamic SQL
     is required because SQL Server compiles the whole batch before seeing the
     newly-added column. */
  EXEC sys.sp_executesql N'
    UPDATE [dbo].[games]
      SET [page_config] = JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(
        N''{"schemaVersion":1,"preset":"'' + [theme_preset] + N''","hero":{"eyebrow":"ZENX GO","title":"","description":"","imageUrl":null,"mobileImageUrl":null},"intro":{"eyebrow":"Về game","title":"","description":"","imageUrl":null},"featureCards":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"gallery":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"faqs":[],"roles":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"locations":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"equipment":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"closing":{"eyebrow":"Kết nối cộng đồng","title":"","description":""}}'',
        ''$.hero.title'', [name]),
        ''$.hero.description'', [tagline]),
        ''$.hero.imageUrl'', [hero_desktop_url]),
        ''$.hero.mobileImageUrl'', [hero_mobile_url]),
        ''$.intro.title'', [name]),
        ''$.intro.description'', [short_description])
      WHERE [page_config] = N''{}'';';

  EXEC sys.sp_executesql N'
    UPDATE [dbo].[games]
      SET [page_config] = JSON_MODIFY([page_config], ''$.legacyRenderer'', [theme_preset])
      WHERE [code] IN (''LDDM'', ''VTHL'', ''TTM'', ''CTO'');';

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
