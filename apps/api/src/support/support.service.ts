import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { SupportStatus, SupportTicketStatus } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { CreateSupportTicketDto, SupportTicketsQueryDto } from './dto';

const CATEGORY_SELECT = {
  id: true,
  code: true,
  name: true,
} as const;

const FAQ_SELECT = {
  id: true,
  categoryId: true,
  question: true,
  answer: true,
} as const;

const TICKET_INCLUDE = {
  category: { select: CATEGORY_SELECT },
} as const;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async getFaqs() {
    const categories = await this.prisma.supportCategory.findMany({
      where: { status: SupportStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        ...CATEGORY_SELECT,
        faqs: {
          where: { status: SupportStatus.ACTIVE },
          orderBy: [{ sortOrder: 'asc' }, { question: 'asc' }],
          select: FAQ_SELECT,
        },
      },
    });
    return { categories };
  }

  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    const category = await this.prisma.supportCategory.findFirst({
      where: { id: dto.categoryId, status: SupportStatus.ACTIVE },
      select: { id: true },
    });
    if (!category) {
      throw new DomainError(ErrorCode.SUPPORT_CATEGORY_NOT_FOUND, 'Support category not found', 400);
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const ticket = await this.prisma.supportTicket.create({
          data: {
            ticketNo: this.ticketNo(),
            userId,
            categoryId: category.id,
            subject: dto.subject,
            description: dto.description,
            status: SupportTicketStatus.NEW,
          },
          include: TICKET_INCLUDE,
        });
        return this.publicTicket(ticket);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002' || attempt === 2) {
          throw error;
        }
      }
    }

    throw new Error('Could not create support ticket');
  }

  async getTickets(userId: string, query: SupportTicketsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.SupportTicketWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: TICKET_INCLUDE,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return {
      items: items.map((item) => this.publicTicket(item)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTicket(userId: string, ticketNo: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { userId, ticketNo: ticketNo.trim() },
      include: TICKET_INCLUDE,
    });
    if (!ticket) {
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    }
    return this.publicTicket(ticket);
  }

  private ticketNo() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `ZSUP-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private publicTicket<T extends {
    id: string;
    userId: string;
    categoryId: string;
    category: { id: string; code: string; name: string };
  }>(ticket: T) {
    const { id: _id, userId: _userId, categoryId: _categoryId, ...safeTicket } = ticket;
    void _id;
    void _userId;
    void _categoryId;
    return safeTicket;
  }
}
