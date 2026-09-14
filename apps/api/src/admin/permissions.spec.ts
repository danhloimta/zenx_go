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
});
