BEGIN TRY
  BEGIN TRAN;

  /* Preserve the established visual composition for seeded sites while the
     data-driven renderer is rolled out. New games never receive this marker. */
  UPDATE [dbo].[games]
    SET [page_config] = JSON_MODIFY([page_config], '$.legacyRenderer', [theme_preset])
    WHERE [code] IN ('LDDM', 'VTHL', 'TTM', 'CTO');

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
