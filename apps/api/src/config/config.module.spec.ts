import { appConfigValidationSchema } from './config.module';

describe('AppConfigModule validation', () => {
  it('treats empty social provider settings as unconfigured', () => {
    const result = appConfigValidationSchema.validate({
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      GOOGLE_REDIRECT_URI: '',
      FACEBOOK_CLIENT_ID: '',
      FACEBOOK_CLIENT_SECRET: '',
      FACEBOOK_REDIRECT_URI: '',
    });

    expect(result.error).toBeUndefined();
    expect(result.value.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.value.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(result.value.FACEBOOK_CLIENT_ID).toBeUndefined();
    expect(result.value.FACEBOOK_CLIENT_SECRET).toBeUndefined();
  });
});
