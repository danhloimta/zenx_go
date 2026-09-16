import { GameAdminService } from './game-admin.service';

describe('GameAdminService support tickets', () => {
  const prisma = {
    supportTicket: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
    supportTicketMessage: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operation: any) => typeof operation === 'function' ? operation(prisma) : Promise.all(operation));
  });

  it('does not expose a ticket belonging to another game', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue(null);
    const service = new GameAdminService(prisma as never, {} as never);
    await expect(service.getSupportTicket('game-a', 'ZSUP-1')).rejects.toMatchObject({ code: 'SUPPORT_TICKET_NOT_FOUND', status: 404 });
    expect(prisma.supportTicket.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { gameId: 'game-a', ticketNo: 'ZSUP-1' } }));
  });

  it('creates a public reply without assigning the ticket and waits for the player', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'IN_PROGRESS' });
    prisma.supportTicketMessage.create.mockResolvedValue({ id: 'message-1', authorType: 'STAFF', visibility: 'PUBLIC', body: 'Đã kiểm tra.', createdAt: new Date(), author: { username: 'admin', profile: { fullName: 'Admin Game' } } });
    const service = new GameAdminService(prisma as never, {} as never);
    await expect(service.replySupportTicket('game-a', 'ZSUP-1', { body: 'Đã kiểm tra.' }, 'admin-1')).resolves.toMatchObject({ body: 'Đã kiểm tra.', author: { fullName: 'Admin Game' } });
    expect(prisma.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'WAITING_USER' }) }));
  });

  it('rejects a reply to a closed ticket', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'CLOSED' });
    const service = new GameAdminService(prisma as never, {} as never);
    await expect(service.replySupportTicket('game-a', 'ZSUP-1', { body: 'Đã kiểm tra.' }, 'admin-1')).rejects.toMatchObject({ code: 'SUPPORT_TICKET_CLOSED', status: 409 });
    expect(prisma.supportTicketMessage.create).not.toHaveBeenCalled();
  });
});
