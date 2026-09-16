import { permission, PERMISSIONS } from './permissions';

describe('permission registry', () => {
  it('maps a permission code to its CASL action and subject', () => {
    expect(permission('support.tickets.internal-note')).toEqual({
      code: 'support.tickets.internal-note',
      action: 'internal-note',
      subject: 'SupportTicket',
    });
  });

  it('keeps admin.access as the required baseline permission', () => {
    expect(PERMISSIONS.ADMIN_ACCESS).toEqual({
      code: 'admin.access',
      action: 'access',
      subject: 'Admin',
    });
  });

  it('maps auth settings management to its narrow CASL subject', () => {
    expect(PERMISSIONS.AUTH_SETTINGS_MANAGE).toEqual({
      code: 'settings.auth.manage',
      action: 'manage',
      subject: 'AuthSettings',
    });
  });

  it('registers player support notes as a narrow game permission', () => {
    expect(PERMISSIONS.GAME_PLAYERS_SUPPORT_NOTE).toEqual({
      code: 'game.players.support-note',
      action: 'support-note',
      subject: 'GamePlayer',
    });
  });

  it('registers full player profile management as a Game Admin permission', () => {
    expect(PERMISSIONS.GAME_PLAYERS_PROFILE_MANAGE).toEqual({
      code: 'game.players.profile.manage',
      action: 'manage',
      subject: 'GamePlayerProfile',
    });
  });

  it('registers maintenance operations as a Game Admin-only permission subject', () => {
    expect(PERMISSIONS.GAME_OPERATIONS_MANAGE).toEqual({
      code: 'game.operations.manage',
      action: 'manage',
      subject: 'GameOperations',
    });
  });
});
