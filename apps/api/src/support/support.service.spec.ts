import { SupportService } from './support.service';

describe('SupportService', () => {
  const prisma = {
    supportCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns only the active FAQ categories and questions in database order', async () => {
    prisma.supportCategory.findMany.mockResolvedValue([
      {
        id: 'category-1',
        code: 'ACCOUNT',
        name: 'Tài khoản',
        faqs: [{ id: 'faq-1', categoryId: 'category-1', question: 'Câu hỏi?', answer: 'Câu trả lời.' }],
      },
    ]);
    const service = new SupportService(prisma as never);

    await expect(service.getFaqs()).resolves.toEqual({
      categories: [{
        id: 'category-1',
        code: 'ACCOUNT',
        name: 'Tài khoản',
        faqs: [{ id: 'faq-1', categoryId: 'category-1', question: 'Câu hỏi?', answer: 'Câu trả lời.' }],
      }],
    });
    expect(prisma.supportCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'ACTIVE' } }));
  });

  it('rejects an inactive or unknown category before creating a ticket', async () => {
    prisma.supportCategory.findFirst.mockResolvedValue(null);
    const service = new SupportService(prisma as never);

    await expect(service.createTicket('user-1', {
      categoryId: 'category-unknown',
      subject: 'Không thể nạp Coin',
      description: 'Tôi đã thanh toán nhưng số dư chưa được cập nhật.',
    })).rejects.toMatchObject({ code: 'SUPPORT_CATEGORY_NOT_FOUND', status: 400 });
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('creates a new ticket with a public-safe, unique-looking ticket number', async () => {
    prisma.supportCategory.findFirst.mockResolvedValue({ id: 'category-1' });
    prisma.supportTicket.create.mockResolvedValue({
      id: 'ticket-id',
      ticketNo: 'ZSUP-20260826-AB12CD34',
      userId: 'user-1',
      categoryId: 'category-1',
      subject: 'Không thể nạp Coin',
      description: 'Tôi đã thanh toán nhưng số dư chưa được cập nhật.',
      status: 'NEW',
      createdAt: new Date('2026-08-26T12:00:00.000Z'),
      updatedAt: new Date('2026-08-26T12:00:00.000Z'),
      category: { id: 'category-1', code: 'TOPUP', name: 'Nạp tiền' },
    });
    const service = new SupportService(prisma as never);

    const result = await service.createTicket('user-1', {
      categoryId: 'category-1',
      subject: 'Không thể nạp Coin',
      description: 'Tôi đã thanh toán nhưng số dư chưa được cập nhật.',
    });

    expect(result).toMatchObject({ ticketNo: 'ZSUP-20260826-AB12CD34', status: 'NEW', category: { code: 'TOPUP' } });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('categoryId');
    expect(prisma.supportTicket.create.mock.calls[0]?.[0]?.data).toEqual(expect.objectContaining({ userId: 'user-1', status: 'NEW' }));
  });

  it('scopes ticket lists and details to the authenticated user', async () => {
    const ticket = {
      id: 'ticket-id',
      ticketNo: 'ZSUP-20260826-AB12CD34',
      userId: 'user-1',
      categoryId: 'category-1',
      subject: 'Không thể nạp Coin',
      description: 'Tôi đã thanh toán nhưng số dư chưa được cập nhật.',
      status: 'NEW',
      createdAt: new Date('2026-08-26T12:00:00.000Z'),
      updatedAt: new Date('2026-08-26T12:00:00.000Z'),
      category: { id: 'category-1', code: 'TOPUP', name: 'Nạp tiền' },
    };
    prisma.$transaction.mockResolvedValue([[ticket], 1]);
    prisma.supportTicket.findFirst.mockResolvedValue(ticket);
    const service = new SupportService(prisma as never);

    await expect(service.getTickets('user-1', { page: 1, pageSize: 10 })).resolves.toMatchObject({
      items: [{ ticketNo: ticket.ticketNo }], page: 1, pageSize: 10, total: 1, totalPages: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    await expect(service.getTicket('user-1', ticket.ticketNo)).resolves.toMatchObject({ ticketNo: ticket.ticketNo });
    const where = prisma.supportTicket.findFirst.mock.calls[0]?.[0]?.where;
    expect(where).toEqual({ userId: 'user-1', ticketNo: ticket.ticketNo });
  });

  it('returns a not-found error instead of exposing another user ticket', async () => {
    prisma.supportTicket.findFirst.mockResolvedValue(null);
    const service = new SupportService(prisma as never);

    await expect(service.getTicket('user-2', 'ZSUP-20260826-AB12CD34')).rejects.toMatchObject({
      code: 'SUPPORT_TICKET_NOT_FOUND', status: 404,
    });
  });
});
