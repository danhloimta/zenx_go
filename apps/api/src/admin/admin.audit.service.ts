import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AdminAuditAction } from '../common/domain';

export type AdminAuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AdminAuditInput = AdminAuditContext & {
  action: AdminAuditAction;
  targetType: string;
  targetId?: string;
  reason: string;
  metadata?: unknown;
};

type AuditWriter = Pick<Prisma.TransactionClient, 'adminAuditLog'> | PrismaService;

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /(password|secret|citizen|cipher|auth.?tag|\biv\b|token|hash)/iu;

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AdminAuditInput, writer: AuditWriter = this.prisma) {
    return writer.adminAuditLog.create({
      data: {
        id: randomUUID(),
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        metadata: JSON.stringify(this.sanitize(input.metadata ?? {})),
        ipAddress: input.ipAddress?.slice(0, 64),
        userAgent: input.userAgent?.slice(0, 512),
      },
    });
  }

  sanitize(value: unknown, key?: string): unknown {
    if (key && SENSITIVE_KEY.test(key)) return REDACTED;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        this.sanitize(entryValue, entryKey),
      ]),
    );
  }
}
