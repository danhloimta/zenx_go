import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminAuditAction,
  AdminRole,
  SupportMessageAuthorType,
  SupportMessageVisibility,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { AdminAuditContext, AdminAuditService } from '../admin/admin.audit.service';
import { assertLimitedMarkdown } from './limited-markdown';
import {
  AdminCreateSupportMessageDto,
  AdminSupportCategoryCreateDto,
  AdminSupportCategoryUpdateDto,
  AdminSupportFaqCreateDto,
  AdminSupportFaqQueryDto,
  AdminSupportFaqUpdateDto,
  AdminSupportTicketClaimDto,
  AdminSupportTicketUpdateDto,
  AdminSupportTicketsQueryDto,
} from './admin-support.dto';
import { SupportTicketMessagesQueryDto } from './dto';

const CATEGORY_SELECT = {
  id: true,
  code: true,
  name: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;
const PERSON_SELECT = {
  id: true,
  username: true,
  email: true,
  phone: true,
  status: true,
  profile: { select: { fullName: true, avatarUrl: true } },
} as const;
const AGENT_SELECT = {
  id: true,
  username: true,
  status: true,
  profile: { select: { fullName: true } },
  roles: { select: { role: true } },
} as const;
const TICKET_SELECT = {
  id: true,
  ticketNo: true,
  userId: true,
  categoryId: true,
  subject: true,
  description: true,
  status: true,
  priority: true,
  assigneeUserId: true,
  lastActivityAt: true,
  lastCustomerMessageAt: true,
  lastStaffReplyAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: CATEGORY_SELECT },
  user: { select: PERSON_SELECT },
  assignee: { select: AGENT_SELECT },
} as const;

type AdminContext = AdminAuditContext;

@Injectable()
export class SupportAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async dashboard(actorUserId: string) {
    const [statusCounts, priorityCounts, unassigned, mine, unread] = await Promise.all([
      Promise.all(
        Object.values(SupportTicketStatus).map(
          async (status) =>
            [status, await this.prisma.supportTicket.count({ where: { status } })] as const,
        ),
      ),
      Promise.all(
        Object.values(SupportTicketPriority).map(
          async (priority) =>
            [priority, await this.prisma.supportTicket.count({ where: { priority } })] as const,
        ),
      ),
      this.prisma.supportTicket.count({
        where: { assigneeUserId: null, status: { not: SupportTicketStatus.CLOSED } },
      }),
      this.prisma.supportTicket.count({
        where: { assigneeUserId: actorUserId, status: { not: SupportTicketStatus.CLOSED } },
      }),
      this.unreadCount(actorUserId),
    ]);
    return {
      tickets: {
        byStatus: Object.fromEntries(statusCounts),
        byPriority: Object.fromEntries(priorityCounts),
        unassigned,
        assignedToMe: mine,
        unread,
      },
    };
  }

  async agents() {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        roles: { some: { role: { in: [AdminRole.SUPPORT, AdminRole.SUPER_ADMIN] } } },
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
      select: AGENT_SELECT,
    });
    return users.map((user) => ({
      ...user,
      fullName: user.profile?.fullName ?? null,
      profile: undefined,
      roles: user.roles.map(({ role }) => role),
    }));
  }

  async listTickets(actorUserId: string, query: AdminSupportTicketsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.SupportTicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.assignee === 'ME'
        ? { assigneeUserId: actorUserId }
        : query.assignee === 'UNASSIGNED'
          ? { assigneeUserId: null }
          : {}),
      ...(search
        ? {
            OR: [
              { ticketNo: { contains: search } },
              { subject: { contains: search } },
              { user: { is: { username: { contains: search } } } },
              { user: { is: { email: { contains: search } } } },
              { user: { is: { phone: { contains: search } } } },
              { user: { is: { profile: { is: { fullName: { contains: search } } } } } },
            ],
          }
        : {}),
    };
    const ticketSelect = {
      ...TICKET_SELECT,
      readStates: { where: { userId: actorUserId }, select: { lastReadAt: true } },
    } as const;
    if (query.unreadOnly) {
      const allItems = await this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
        select: ticketSelect,
      });
      const unreadItems = allItems
        .map((item) => this.publicTicket(item))
        .filter((item) => item.unread);
      const totalUnread = unreadItems.length;
      return {
        items: unreadItems.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: totalUnread,
        totalPages: Math.ceil(totalUnread / pageSize),
      };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: ticketSelect,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    const mapped = items.map((item) => this.publicTicket(item));
    return {
      items: mapped,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTicket(actorUserId: string, ticketNo: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { ticketNo: ticketNo.trim() },
      select: {
        ...TICKET_SELECT,
        readStates: { where: { userId: actorUserId }, select: { lastReadAt: true } },
      },
    });
    if (!ticket)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    const messages = await this.getMessages(actorUserId, ticketNo, { page: 1, pageSize: 50 });
    return {
      ...this.publicTicket(ticket),
      messages: messages.items,
      messagesPage: messages.page,
      messagesPageSize: messages.pageSize,
      messagesTotal: messages.total,
      messagesTotalPages: messages.totalPages,
    };
  }

  async getMessages(actorUserId: string, ticketNo: string, query: SupportTicketMessagesQueryDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { ticketNo: ticketNo.trim() },
      select: { id: true },
    });
    if (!ticket)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { ticketId: ticket.id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicketMessage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          authorUserId: true,
          authorType: true,
          visibility: true,
          body: true,
          createdAt: true,
          author: { select: { username: true, profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.supportTicketMessage.count({ where }),
    ]);
    return {
      items: items.map((item) => this.publicMessage(item, actorUserId)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async claim(
    actorUserId: string,
    ticketNo: string,
    dto: AdminSupportTicketClaimDto,
    context: AdminContext,
  ) {
    const current = await this.prisma.supportTicket.findUnique({
      where: { ticketNo: ticketNo.trim() },
      select: { id: true, ticketNo: true, status: true, assigneeUserId: true, updatedAt: true },
    });
    if (!current)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    if (current.status === SupportTicketStatus.CLOSED)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_CLOSED, 'This ticket is closed', 409);
    if (current.assigneeUserId === actorUserId) return this.getTicket(actorUserId, ticketNo);
    if (current.assigneeUserId)
      throw new DomainError(
        ErrorCode.SUPPORT_TICKET_ASSIGNED_TO_ANOTHER,
        'This ticket is assigned to another agent',
        409,
      );
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.supportTicket.updateMany({
        where: { id: current.id, assigneeUserId: null, updatedAt: current.updatedAt },
        data: {
          assigneeUserId: actorUserId,
          status:
            current.status === SupportTicketStatus.NEW
              ? SupportTicketStatus.IN_PROGRESS
              : current.status,
          lastActivityAt: new Date(),
        },
      });
      if (updated.count !== 1)
        throw new DomainError(
          ErrorCode.SUPPORT_TICKET_ASSIGNED_TO_ANOTHER,
          'This ticket was claimed by another agent',
          409,
        );
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.SUPPORT_TICKET_ASSIGNED,
          targetType: 'SUPPORT_TICKET',
          targetId: current.id,
          reason: dto.reason,
          metadata: { from: null, to: actorUserId },
        },
        tx,
      );
    });
    return this.getTicket(actorUserId, ticketNo);
  }

  async updateTicket(
    actorUserId: string,
    ticketNo: string,
    dto: AdminSupportTicketUpdateDto,
    context: AdminContext,
  ) {
    const current = await this.prisma.supportTicket.findUnique({
      where: { ticketNo: ticketNo.trim() },
      select: {
        id: true,
        ticketNo: true,
        status: true,
        priority: true,
        assigneeUserId: true,
        updatedAt: true,
      },
    });
    if (!current)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    const statusChanged = dto.status !== undefined && dto.status !== current.status;
    const priorityChanged = dto.priority !== undefined && dto.priority !== current.priority;
    const assigneeChanged =
      dto.assigneeUserId !== undefined && dto.assigneeUserId !== current.assigneeUserId;
    if (!statusChanged && !priorityChanged && !assigneeChanged)
      return this.getTicket(actorUserId, ticketNo);
    if (current.status === SupportTicketStatus.CLOSED)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_CLOSED, 'This ticket is closed', 409);
    if (dto.assigneeUserId !== undefined && dto.assigneeUserId !== null)
      await this.assertAgent(dto.assigneeUserId);
    if (statusChanged) this.assertStatusTransition(current.status, dto.status!);
    const now = new Date();
    const data: Prisma.SupportTicketUpdateManyMutationInput = {
      lastActivityAt: now,
      ...(priorityChanged ? { priority: dto.priority } : {}),
      ...(assigneeChanged ? { assigneeUserId: dto.assigneeUserId } : {}),
    };
    if (statusChanged) {
      data.status = dto.status;
      if (dto.status === SupportTicketStatus.RESOLVED) data.resolvedAt = now;
      if (dto.status === SupportTicketStatus.IN_PROGRESS) data.resolvedAt = null;
      if (dto.status === SupportTicketStatus.CLOSED) data.closedAt = now;
    }
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.supportTicket.updateMany({
        where: { id: current.id, updatedAt: current.updatedAt },
        data,
      });
      if (updated.count !== 1)
        throw new DomainError(
          ErrorCode.STALE_ADMIN_UPDATE,
          'The ticket was changed by another operator',
          409,
        );
      if (assigneeChanged)
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_TICKET_ASSIGNED,
            targetType: 'SUPPORT_TICKET',
            targetId: current.id,
            reason: dto.reason,
            metadata: { from: current.assigneeUserId, to: dto.assigneeUserId },
          },
          tx,
        );
      if (priorityChanged)
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_TICKET_PRIORITY_CHANGED,
            targetType: 'SUPPORT_TICKET',
            targetId: current.id,
            reason: dto.reason,
            metadata: { from: current.priority, to: dto.priority },
          },
          tx,
        );
      if (statusChanged)
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_TICKET_STATUS_CHANGED,
            targetType: 'SUPPORT_TICKET',
            targetId: current.id,
            reason: dto.reason,
            metadata: { from: current.status, to: dto.status },
          },
          tx,
        );
    });
    return this.getTicket(actorUserId, ticketNo);
  }

  async sendMessage(
    actorUserId: string,
    ticketNo: string,
    dto: AdminCreateSupportMessageDto,
    context: AdminContext,
  ) {
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.supportTicket.findUnique({
        where: { ticketNo: ticketNo.trim() },
        select: { id: true, status: true, assigneeUserId: true, updatedAt: true },
      });
      if (!current)
        throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
      this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
      if (current.status === SupportTicketStatus.CLOSED)
        throw new DomainError(ErrorCode.SUPPORT_TICKET_CLOSED, 'This ticket is closed', 409);
      if (dto.visibility === SupportMessageVisibility.PUBLIC) {
        if (!current.assigneeUserId)
          throw new DomainError(
            ErrorCode.SUPPORT_TICKET_NOT_ASSIGNED,
            'Claim the ticket before replying',
            409,
          );
        if (current.assigneeUserId !== actorUserId)
          throw new DomainError(
            ErrorCode.SUPPORT_TICKET_ASSIGNED_TO_ANOTHER,
            'This ticket is assigned to another agent',
            409,
          );
      }
      const message = await tx.supportTicketMessage.create({
        data: {
          ticketId: current.id,
          authorUserId: actorUserId,
          authorType: SupportMessageAuthorType.STAFF,
          visibility: dto.visibility,
          body: dto.body,
        },
        select: {
          id: true,
          authorUserId: true,
          authorType: true,
          visibility: true,
          body: true,
          createdAt: true,
          author: { select: { username: true, profile: { select: { fullName: true } } } },
        },
      });
      await tx.supportTicket.update({
        where: { id: current.id },
        data: {
          lastActivityAt: now,
          ...(dto.visibility === SupportMessageVisibility.PUBLIC
            ? { lastStaffReplyAt: now, status: SupportTicketStatus.WAITING_USER }
            : {}),
        },
      });
      await this.audit.record(
        {
          ...context,
          action:
            dto.visibility === SupportMessageVisibility.PUBLIC
              ? AdminAuditAction.SUPPORT_MESSAGE_SENT
              : AdminAuditAction.SUPPORT_INTERNAL_NOTE_ADDED,
          targetType: 'SUPPORT_TICKET',
          targetId: current.id,
          reason: 'Support message',
          metadata: {
            messageId: message.id,
            visibility: dto.visibility,
            authorType: SupportMessageAuthorType.STAFF,
          },
        },
        tx,
      );
      return message;
    });
    return this.publicMessage(result, actorUserId);
  }

  async markRead(actorUserId: string, ticketNo: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { ticketNo: ticketNo.trim() },
      select: { id: true },
    });
    if (!ticket)
      throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    await this.prisma.supportTicketReadState.upsert({
      where: { ticketId_userId: { ticketId: ticket.id, userId: actorUserId } },
      update: { lastReadAt: new Date() },
      create: { ticketId: ticket.id, userId: actorUserId, lastReadAt: new Date() },
    });
    return { read: true };
  }

  async unreadCount(actorUserId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { status: { not: SupportTicketStatus.CLOSED }, lastCustomerMessageAt: { not: null } },
      select: {
        lastCustomerMessageAt: true,
        readStates: { where: { userId: actorUserId }, select: { lastReadAt: true } },
      },
    });
    return tickets.filter(
      (ticket) =>
        ticket.lastCustomerMessageAt &&
        (!ticket.readStates[0] || ticket.lastCustomerMessageAt > ticket.readStates[0].lastReadAt),
    ).length;
  }

  async listFaqs(query: AdminSupportFaqQueryDto) {
    const categories = await this.prisma.supportCategory.findMany({
      where: query.categoryId ? { id: query.categoryId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        ...CATEGORY_SELECT,
        faqs: {
          where: {
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
              ? {
                  OR: [
                    { question: { contains: query.search } },
                    { answer: { contains: query.search } },
                  ],
                }
              : {}),
          },
          orderBy: [{ sortOrder: 'asc' }, { question: 'asc' }],
          select: {
            id: true,
            categoryId: true,
            question: true,
            answer: true,
            status: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return { categories };
  }

  async createCategory(dto: AdminSupportCategoryCreateDto, context: AdminContext) {
    try {
      const category = await this.prisma.$transaction(async (tx) => {
        const created = await tx.supportCategory.create({
          data: { code: dto.code, name: dto.name, status: dto.status, sortOrder: dto.sortOrder },
        });
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_CATEGORY_CREATED,
            targetType: 'SUPPORT_CATEGORY',
            targetId: created.id,
            reason: dto.reason,
            metadata: { fields: ['code', 'name', 'status', 'sortOrder'] },
          },
          tx,
        );
        return created;
      });
      return category;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new DomainError(
          ErrorCode.SUPPORT_CATEGORY_CODE_EXISTS,
          'Support category code already exists',
          409,
        );
      throw error;
    }
  }

  async updateCategory(
    categoryId: string,
    dto: AdminSupportCategoryUpdateDto,
    context: AdminContext,
  ) {
    const current = await this.prisma.supportCategory.findUnique({ where: { id: categoryId } });
    if (!current)
      throw new DomainError(
        ErrorCode.SUPPORT_CATEGORY_NOT_FOUND,
        'Support category not found',
        404,
      );
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    const data: Prisma.SupportCategoryUpdateManyMutationInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    };
    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.supportCategory.updateMany({
        where: { id: categoryId, updatedAt: current.updatedAt },
        data,
      });
      if (changed.count !== 1)
        throw new DomainError(
          ErrorCode.STALE_ADMIN_UPDATE,
          'The category was changed by another operator',
          409,
        );
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.SUPPORT_CATEGORY_UPDATED,
          targetType: 'SUPPORT_CATEGORY',
          targetId: categoryId,
          reason: dto.reason,
          metadata: { fields: Object.keys(data).filter((key) => key !== 'updatedAt') },
        },
        tx,
      );
      return tx.supportCategory.findUniqueOrThrow({
        where: { id: categoryId },
        select: CATEGORY_SELECT,
      });
    });
    return updated;
  }

  async createFaq(dto: AdminSupportFaqCreateDto, context: AdminContext) {
    assertLimitedMarkdown(dto.answer);
    const category = await this.prisma.supportCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category)
      throw new DomainError(
        ErrorCode.SUPPORT_CATEGORY_NOT_FOUND,
        'Support category not found',
        404,
      );
    try {
      return await this.prisma.$transaction(async (tx) => {
        const faq = await tx.supportFaq.create({
          data: {
            categoryId: dto.categoryId,
            question: dto.question,
            answer: dto.answer,
            status: dto.status,
            sortOrder: dto.sortOrder,
          },
        });
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_FAQ_CREATED,
            targetType: 'SUPPORT_FAQ',
            targetId: faq.id,
            reason: dto.reason,
            metadata: {
              categoryId: dto.categoryId,
              fields: ['question', 'answer', 'status', 'sortOrder'],
            },
          },
          tx,
        );
        return faq;
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new DomainError(
          ErrorCode.SUPPORT_FAQ_DUPLICATE,
          'A FAQ with the same question already exists in this category',
          409,
        );
      throw error;
    }
  }

  async updateFaq(faqId: string, dto: AdminSupportFaqUpdateDto, context: AdminContext) {
    const current = await this.prisma.supportFaq.findUnique({ where: { id: faqId } });
    if (!current)
      throw new DomainError(ErrorCode.SUPPORT_FAQ_NOT_FOUND, 'Support FAQ not found', 404);
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    if (dto.answer !== undefined) assertLimitedMarkdown(dto.answer);
    const data: Prisma.SupportFaqUpdateManyMutationInput = {
      ...(dto.question !== undefined ? { question: dto.question } : {}),
      ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const changed = await tx.supportFaq.updateMany({
          where: { id: faqId, updatedAt: current.updatedAt },
          data,
        });
        if (changed.count !== 1)
          throw new DomainError(
            ErrorCode.STALE_ADMIN_UPDATE,
            'The FAQ was changed by another operator',
            409,
          );
        await this.audit.record(
          {
            ...context,
            action: AdminAuditAction.SUPPORT_FAQ_UPDATED,
            targetType: 'SUPPORT_FAQ',
            targetId: faqId,
            reason: dto.reason,
            metadata: { fields: Object.keys(data).filter((key) => key !== 'updatedAt') },
          },
          tx,
        );
        return tx.supportFaq.findUniqueOrThrow({ where: { id: faqId } });
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new DomainError(
          ErrorCode.SUPPORT_FAQ_DUPLICATE,
          'A FAQ with the same question already exists in this category',
          409,
        );
      throw error;
    }
  }

  private async assertAgent(userId: string) {
    const agent = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE',
        roles: { some: { role: { in: [AdminRole.SUPPORT, AdminRole.SUPER_ADMIN] } } },
      },
      select: { id: true },
    });
    if (!agent)
      throw new DomainError(ErrorCode.SUPPORT_AGENT_NOT_FOUND, 'Support agent not found', 400);
  }

  private assertStatusTransition(current: string, next: SupportTicketStatus) {
    const allowed: Record<string, SupportTicketStatus[]> = {
      [SupportTicketStatus.NEW]: [SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.RESOLVED],
      [SupportTicketStatus.IN_PROGRESS]: [
        SupportTicketStatus.WAITING_USER,
        SupportTicketStatus.RESOLVED,
      ],
      [SupportTicketStatus.WAITING_USER]: [
        SupportTicketStatus.IN_PROGRESS,
        SupportTicketStatus.RESOLVED,
      ],
      [SupportTicketStatus.RESOLVED]: [SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.CLOSED],
      [SupportTicketStatus.CLOSED]: [],
    };
    if (!allowed[current]?.includes(next))
      throw new DomainError(
        ErrorCode.SUPPORT_TICKET_STATUS_INVALID,
        'This ticket status transition is not allowed',
        400,
      );
  }

  private assertExpected(current: Date, expected: string) {
    const date = new Date(expected);
    if (Number.isNaN(date.getTime()) || date.getTime() !== current.getTime())
      throw new DomainError(
        ErrorCode.STALE_ADMIN_UPDATE,
        'The ticket was changed by another operator',
        409,
      );
  }

  private publicTicket<
    T extends {
      id: string;
      userId: string;
      categoryId: string;
      assigneeUserId: string | null;
      status: string;
      lastCustomerMessageAt: Date | null;
      readStates?: { lastReadAt: Date }[];
      [key: string]: unknown;
    },
  >(ticket: T) {
    const { readStates: states, ...safe } = ticket;
    const unread = Boolean(
      ticket.lastCustomerMessageAt &&
      (!states?.[0] || ticket.lastCustomerMessageAt > states[0].lastReadAt),
    );
    const assignee = safe.assignee as {
      id: string;
      username: string;
      status: string;
      profile: { fullName: string } | null;
      roles: { role: string }[];
    } | null | undefined;
    return {
      ...safe,
      assignee: assignee
        ? {
            id: assignee.id,
            username: assignee.username,
            status: assignee.status,
            fullName: assignee.profile?.fullName ?? null,
            roles: assignee.roles.map(({ role }) => role),
          }
        : null,
      unread,
    };
  }

  private publicMessage<
    T extends {
      id: string;
      authorUserId: string;
      authorType: string;
      visibility: string;
      body: string;
      createdAt: Date;
      author?: { username: string; profile: { fullName: string } | null };
    },
  >(message: T, _actorUserId?: string) {
    return {
      id: message.id,
      authorType: message.authorType,
      visibility: message.visibility,
      body: message.body,
      createdAt: message.createdAt,
      author: message.author
        ? { username: message.author.username, fullName: message.author.profile?.fullName ?? null }
        : null,
    };
  }
}
