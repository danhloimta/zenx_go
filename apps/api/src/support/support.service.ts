import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { SupportStatus, SupportTicketStatus } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSupportMessageDto,
  SupportTicketMessagesQueryDto,
  CreateSupportTicketDto,
  SupportTicketsQueryDto,
} from './dto';

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
      throw new DomainError(
        ErrorCode.SUPPORT_CATEGORY_NOT_FOUND,
        'Support category not found',
        400,
      );
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const ticket = await this.prisma.$transaction(async (tx) => {
          const created = await tx.supportTicket.create({
            data: {
              ticketNo: this.ticketNo(),
              userId,
              categoryId: category.id,
              subject: dto.subject,
              description: dto.description,
              status: SupportTicketStatus.NEW,
              lastActivityAt: new Date(),
              lastCustomerMessageAt: new Date(),
            },
            include: TICKET_INCLUDE,
          });
          await tx.supportTicketMessage.create({
            data: {
              ticketId: created.id,
              authorUserId: userId,
              authorType: 'CUSTOMER',
              visibility: 'PUBLIC',
              body: dto.description,
              createdAt: created.createdAt,
            },
          });
          return created;
        });
        return this.publicTicket(ticket);
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002' ||
          attempt === 2
        ) {
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
    const readStates = await this.prisma.supportTicketReadState.findMany({
      where: { userId, ticketId: { in: items.map((item) => item.id) } },
      select: { ticketId: true, lastReadAt: true },
    });
    const readAt = new Map(readStates.map((state) => [state.ticketId, state.lastReadAt]));
    return {
      items: items.map((item) => ({
        ...this.publicTicket(item),
        unread: Boolean(
          item.lastStaffReplyAt &&
          (!readAt.get(item.id) || item.lastStaffReplyAt > readAt.get(item.id)!),
        ),
      })),
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
    const readState = await this.prisma.supportTicketReadState.findUnique({
      where: { ticketId_userId: { ticketId: ticket.id, userId } },
      select: { lastReadAt: true },
    });
    return {
      ...this.publicTicket(ticket),
      unread: Boolean(
        ticket.lastStaffReplyAt && (!readState || ticket.lastStaffReplyAt > readState.lastReadAt),
      ),
    };
  }

  async getMessages(userId: string, ticketNo: string, query: SupportTicketMessagesQueryDto) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { userId, ticketNo: ticketNo.trim() },
      select: { id: true },
    });
    if (!ticket)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { ticketId: ticket.id, visibility: 'PUBLIC' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicketMessage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          authorType: true,
          body: true,
          createdAt: true,
          author: { select: { username: true, profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.supportTicketMessage.count({ where }),
    ]);
    return {
      items: items.map((item) => this.publicMessage(item)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createMessage(userId: string, ticketNo: string, dto: CreateSupportMessageDto) {
    const now = new Date();
    const message = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findFirst({
        where: { userId, ticketNo: ticketNo.trim() },
      });
      if (!ticket)
        throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
      if (ticket.status === SupportTicketStatus.CLOSED)
        throw new DomainError(ErrorCode.SUPPORT_TICKET_CLOSED, 'This ticket is closed', 409);
      let status = ticket.status;
      let resolvedAt: Date | null | undefined;
      if (ticket.status === SupportTicketStatus.RESOLVED) {
        if (
          !ticket.resolvedAt ||
          now.getTime() - ticket.resolvedAt.getTime() > 7 * 24 * 60 * 60 * 1000
        ) {
          throw new DomainError(
            ErrorCode.SUPPORT_TICKET_REOPEN_EXPIRED,
            'The ticket can no longer be reopened; create a new ticket',
            409,
          );
        }
        status = SupportTicketStatus.IN_PROGRESS;
        resolvedAt = null;
      } else if (ticket.status === SupportTicketStatus.WAITING_USER) {
        status = SupportTicketStatus.IN_PROGRESS;
      }
      const created = await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          authorUserId: userId,
          authorType: 'CUSTOMER',
          visibility: 'PUBLIC',
          body: dto.body,
        },
        select: {
          id: true,
          authorType: true,
          body: true,
          createdAt: true,
          author: { select: { username: true, profile: { select: { fullName: true } } } },
        },
      });
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status,
          ...(resolvedAt !== undefined ? { resolvedAt } : {}),
          lastCustomerMessageAt: now,
          lastActivityAt: now,
        },
      });
      return created;
    });
    return this.publicMessage(message);
  }

  async markRead(userId: string, ticketNo: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { userId, ticketNo: ticketNo.trim() },
      select: { id: true },
    });
    if (!ticket)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    await this.prisma.supportTicketReadState.upsert({
      where: { ticketId_userId: { ticketId: ticket.id, userId } },
      update: { lastReadAt: new Date() },
      create: { ticketId: ticket.id, userId, lastReadAt: new Date() },
    });
    return { read: true };
  }

  async unreadCount(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      select: {
        lastStaffReplyAt: true,
        readStates: { where: { userId }, select: { lastReadAt: true } },
      },
    });
    const count = tickets.filter(
      (ticket) =>
        ticket.lastStaffReplyAt &&
        (!ticket.readStates[0] || ticket.lastStaffReplyAt > ticket.readStates[0].lastReadAt),
    ).length;
    return { count };
  }

  private ticketNo() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `ZSUP-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private publicTicket<
    T extends {
      id: string;
      userId: string;
      categoryId: string;
      assigneeUserId?: unknown;
      category: { id: string; code: string; name: string };
    },
  >(ticket: T) {
    const {
      id: _id,
      userId: _userId,
      categoryId: _categoryId,
      assigneeUserId: _assigneeUserId,
      ...safeTicket
    } = ticket;
    void _id;
    void _userId;
    void _categoryId;
    void _assigneeUserId;
    return safeTicket;
  }

  private publicMessage<
    T extends {
      id: string;
      authorType: string;
      body: string;
      createdAt: Date;
      author?: { username: string; profile: { fullName: string } | null };
    },
  >(message: T) {
    return {
      id: message.id,
      authorType: message.authorType,
      body: message.body,
      createdAt: message.createdAt,
      author: message.author
        ? { username: message.author.username, fullName: message.author.profile?.fullName ?? null }
        : null,
    };
  }
}
