jest.mock('marked', () => ({ Marked: class { use() {} parse() { return ''; } } }));

import { GameService } from './game.service';

describe('GameService', () => {
  it('exposes an SSO authorize URL only for an active game client', () => {
    const service = new GameService({} as any);
    const serialize = (service as any).publicGameSummary.bind(service);
    const game = {
      code: 'ORION', name: 'Orion', slug: 'orion', subdomain: 'orion', recordType: 'REAL', tagline: '', shortDescription: '', lifecycleStatus: 'LIVE', operationalStatus: 'AVAILABLE', themePreset: 'SCI_FI_SHOOTER', featured: false, primaryGame: false, sortOrder: 1, genres: [], platforms: [],
      ssoClient: { clientId: 'zenx-orion', redirectUri: 'https://orion.example.com/sso/callback', isActive: true },
    };
    expect(serialize(game).sso).toEqual({ authorizeUrl: '/api/v1/game-sso/authorize?client_id=zenx-orion&redirect_uri=https%3A%2F%2Forion.example.com%2Fsso%2Fcallback' });
    expect(serialize({ ...game, ssoClient: { ...game.ssoClient, isActive: false } }).sso).toBeNull();
  });
});
