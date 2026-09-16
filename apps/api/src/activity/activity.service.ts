import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityLogsQueryDto } from './activity.dto';

export type ActivityContext = { ipAddress?: string; userAgent?: string };
export type ActivityInput = {
  userId: string; category: 'LOGIN' | 'SECURITY'; eventType: string;
  outcome?: 'SUCCESS' | 'FAILED'; actorType?: 'USER' | 'ADMIN' | 'SYSTEM';
  context?: ActivityContext; metadata?: Record<string, string | number | boolean | null>;
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: ActivityInput, client: Prisma.TransactionClient | PrismaService = this.prisma) {
    const userAgent = input.context?.userAgent?.slice(0, 512) || null;
    return client.userActivityLog.create({ data: {
      userId: input.userId, category: input.category, eventType: input.eventType,
      outcome: input.outcome ?? 'SUCCESS', actorType: input.actorType ?? 'USER',
      ipAddress: normalizeIp(input.context?.ipAddress), userAgent,
      deviceLabel: deviceLabel(userAgent),
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    }});
  }

  async list(userId: string, query: ActivityLogsQueryDto, includeUserAgent = false) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserActivityLogWhereInput = {
      userId, createdAt: { gte: retentionStart() },
      ...(query.category && query.category !== 'ALL' ? { category: query.category } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.userActivityLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.userActivityLog.count({ where }),
    ]);
    return { items: items.map((item) => ({ id: item.id, category: item.category, eventType: item.eventType, outcome: item.outcome, actorType: item.actorType, ipAddress: item.ipAddress, deviceLabel: item.deviceLabel, ...(includeUserAgent ? { userAgent: item.userAgent } : {}), createdAt: item.createdAt })), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async cleanup(retentionDays = 180) {
    const result = await this.prisma.userActivityLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - retentionDays * 86_400_000) } } });
    return result.count;
  }
}

export function retentionStart() { return new Date(Date.now() - 180 * 86_400_000); }
export function normalizeIp(ip?: string) { if (!ip) return null; const value = ip.trim().replace(/^::ffff:/, ''); return value.slice(0, 64) || null; }
export function deviceLabel(userAgent?: string | null) {
  if (!userAgent) return 'Thiết bị không xác định';
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox' : /CriOS\//.test(userAgent) ? 'Chrome' : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'Trình duyệt không xác định';
  const os = /Android/.test(userAgent) ? 'Android' : /iPhone|iPad|iPod/.test(userAgent) ? 'iOS' : /Windows/.test(userAgent) ? 'Windows' : /Mac OS X/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : 'Hệ điều hành không xác định';
  const device = /Mobile|Android|iPhone|iPod/.test(userAgent) ? 'Mobile' : /iPad|Tablet/.test(userAgent) ? 'Tablet' : 'Desktop';
  return `${browser} · ${os} · ${device}`.slice(0, 160);
}
