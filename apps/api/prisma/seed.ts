import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import {
  AccountStatus,
  Gender,
  PaymentMethod,
  PaymentStatus,
  SecurityQuestionCode,
  SocialProvider,
  SupportMessageAuthorType,
  SupportMessageVisibility,
  SupportStatus,
  SupportTicketPriority,
  SupportTicketStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../src/common/domain';
import { createPageConfig } from '../src/admin/content/game-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Khởi tạo dữ liệu mẫu cho hệ thống ZENX GO...');

  await prisma.authSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, phoneRegistrationOtpRequired: true },
  });

  const { superAdmin, supportRole, gameRoles, financeRole } = await seedRolesAndPermissions();
  const users = await seedUsers({ superAdmin, supportRole, financeRole });
  await seedSecurityQuestions();
  const { games } = await seedGames();
  await seedGameRolesAndPlayers({ users, games, gameRoles });
  await seedPortalContent(games);
  const packages = await seedCoinPackages();
  await seedFinanceAndTransactions({ users, packages });
  await seedSupportSystem({ users, games });
  await seedActivityAndAuditLogs({ users, games });

  console.log('✅ Hoàn tất khởi tạo toàn bộ dữ liệu mẫu hệ thống!');
}

/* ========================================================================== */
/* 1. ROLES & PERMISSIONS                                                     */
/* ========================================================================== */
async function seedRolesAndPermissions() {
  const superAdmin = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: { name: 'Super Admin', description: 'Toàn quyền quản trị hệ thống' },
    create: {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Toàn quyền quản trị hệ thống',
      isSystem: true,
      isActive: true,
    },
  });

  const supportRole = await prisma.role.upsert({
    where: { code: 'SUPPORT' },
    update: { name: 'Nhân viên hỗ trợ', description: 'Vận hành và chăm sóc khách hàng' },
    create: {
      code: 'SUPPORT',
      name: 'Nhân viên hỗ trợ',
      description: 'Vận hành và chăm sóc khách hàng',
      isSystem: true,
      isActive: true,
    },
  });

  const financeRole = await prisma.role.upsert({
    where: { code: 'FINANCE_MANAGER' },
    update: { name: 'Quản lý tài chính', description: 'Đối soát nạp coin và quản lý dòng tiền' },
    create: {
      code: 'FINANCE_MANAGER',
      name: 'Quản lý tài chính',
      description: 'Đối soát nạp coin và quản lý dòng tiền',
      isSystem: false,
      isActive: true,
    },
  });

  const gameRoles = await Promise.all([
    prisma.role.upsert({
      where: { code: 'GAME_ADMIN' },
      update: { scopeType: 'GAME' },
      create: {
        code: 'GAME_ADMIN',
        name: 'Game Admin',
        description: 'Quản trị vận hành toàn diện một game',
        isSystem: true,
        isActive: true,
        scopeType: 'GAME',
      },
    }),
    prisma.role.upsert({
      where: { code: 'GAME_CONTENT_MANAGER' },
      update: { scopeType: 'GAME' },
      create: {
        code: 'GAME_CONTENT_MANAGER',
        name: 'Quản lý nội dung game',
        description: 'Quản lý nội dung, bài viết và sự kiện trong game',
        isSystem: true,
        isActive: true,
        scopeType: 'GAME',
      },
    }),
    prisma.role.upsert({
      where: { code: 'GAME_PLAYER_MODERATOR' },
      update: { scopeType: 'GAME' },
      create: {
        code: 'GAME_PLAYER_MODERATOR',
        name: 'Điều phối người chơi',
        description: 'Kiểm duyệt, hỗ trợ và quản lý trạng thái người chơi trong game',
        isSystem: true,
        isActive: true,
        scopeType: 'GAME',
      },
    }),
  ]);

  const permissions = [
    { code: 'admin.access', module: 'admin', action: 'access', subject: 'Admin', name: 'Truy cập quản trị', sortOrder: 1 },
    { code: 'admin.dashboard.view', module: 'admin', action: 'read', subject: 'Dashboard', name: 'Xem tổng quan', sortOrder: 2 },
    { code: 'users.view', module: 'users', action: 'read', subject: 'User', name: 'Xem người dùng', sortOrder: 1 },
    { code: 'users.profile.update', module: 'users', action: 'update-profile', subject: 'User', name: 'Cập nhật hồ sơ người dùng', sortOrder: 2 },
    { code: 'users.status.update', module: 'users', action: 'update-status', subject: 'User', name: 'Cập nhật trạng thái người dùng', sortOrder: 3 },
    { code: 'users.roles.assign', module: 'users', action: 'assign-role', subject: 'User', name: 'Gán role người dùng', sortOrder: 4 },
    { code: 'users.sessions.revoke', module: 'users', action: 'revoke-session', subject: 'User', name: 'Thu hồi phiên người dùng', sortOrder: 5 },
    { code: 'users.password.reset', module: 'users', action: 'reset-password', subject: 'User', name: 'Đặt lại mật khẩu', sortOrder: 6 },
    { code: 'users.sensitive.view', module: 'users', action: 'view-sensitive', subject: 'User', name: 'Xem dữ liệu nhạy cảm', sortOrder: 7 },
    { code: 'users.sensitive.update', module: 'users', action: 'update-sensitive', subject: 'User', name: 'Cập nhật dữ liệu nhạy cảm', sortOrder: 8 },
    { code: 'roles.view', module: 'roles', action: 'read', subject: 'Role', name: 'Xem role', sortOrder: 1 },
    { code: 'roles.create', module: 'roles', action: 'create', subject: 'Role', name: 'Tạo role', sortOrder: 2 },
    { code: 'roles.update', module: 'roles', action: 'update', subject: 'Role', name: 'Cập nhật role', sortOrder: 3 },
    { code: 'roles.delete', module: 'roles', action: 'delete', subject: 'Role', name: 'Xóa role', sortOrder: 4 },
    { code: 'roles.permissions.assign', module: 'roles', action: 'assign-permission', subject: 'Role', name: 'Gán permission cho role', sortOrder: 5 },
    { code: 'settings.auth.manage', module: 'settings', action: 'manage', subject: 'AuthSettings', name: 'Quản lý cài đặt đăng nhập', sortOrder: 1 },
    { code: 'support.dashboard.view', module: 'support', action: 'read', subject: 'SupportDashboard', name: 'Xem tổng quan hỗ trợ', sortOrder: 1 },
    { code: 'support.agents.view', module: 'support', action: 'read', subject: 'SupportAgent', name: 'Xem nhân viên hỗ trợ', sortOrder: 2 },
    { code: 'support.tickets.view', module: 'support', action: 'read', subject: 'SupportTicket', name: 'Xem ticket', sortOrder: 3 },
    { code: 'support.tickets.claim', module: 'support', action: 'claim', subject: 'SupportTicket', name: 'Nhận ticket', sortOrder: 4 },
    { code: 'support.tickets.update', module: 'support', action: 'update', subject: 'SupportTicket', name: 'Cập nhật ticket', sortOrder: 5 },
    { code: 'support.tickets.reply', module: 'support', action: 'reply', subject: 'SupportTicket', name: 'Phản hồi ticket', sortOrder: 6 },
    { code: 'support.tickets.internal-note', module: 'support', action: 'internal-note', subject: 'SupportTicket', name: 'Ghi chú nội bộ', sortOrder: 7 },
    { code: 'support.faq.manage', module: 'support', action: 'manage', subject: 'SupportFaq', name: 'Quản lý FAQ', sortOrder: 8 },
    { code: 'content.dashboard.view', module: 'content', action: 'read', subject: 'ContentDashboard', name: 'Xem tổng quan nội dung', sortOrder: 1 },
    { code: 'content.assets.upload', module: 'content', action: 'upload', subject: 'Asset', name: 'Tải asset', sortOrder: 2 },
    { code: 'games.view', module: 'content', action: 'read', subject: 'Game', name: 'Xem game', sortOrder: 3 },
    { code: 'games.manage', module: 'content', action: 'manage', subject: 'Game', name: 'Quản lý game', sortOrder: 4 },
    { code: 'games.publish', module: 'content', action: 'publish', subject: 'Game', name: 'Xuất bản game', sortOrder: 5 },
    { code: 'genres.manage', module: 'content', action: 'manage', subject: 'Genre', name: 'Quản lý thể loại', sortOrder: 6 },
    { code: 'articles.manage', module: 'content', action: 'manage', subject: 'Article', name: 'Quản lý bài viết', sortOrder: 7 },
    { code: 'events.manage', module: 'content', action: 'manage', subject: 'Event', name: 'Quản lý sự kiện', sortOrder: 8 },
    { code: 'announcements.manage', module: 'content', action: 'manage', subject: 'Announcement', name: 'Quản lý thông báo', sortOrder: 9 },
    { code: 'finance.dashboard.view', module: 'finance', action: 'read', subject: 'FinanceDashboard', name: 'Xem tổng quan tài chính', sortOrder: 1 },
    { code: 'finance.packages.manage', module: 'finance', action: 'manage', subject: 'CoinPackage', name: 'Quản lý gói nạp', sortOrder: 2 },
    { code: 'finance.payments.view', module: 'finance', action: 'read', subject: 'Payment', name: 'Xem payment', sortOrder: 3 },
    { code: 'finance.payments.process', module: 'finance', action: 'process', subject: 'Payment', name: 'Xử lý payment', sortOrder: 4 },
    { code: 'finance.payments.refund', module: 'finance', action: 'refund', subject: 'Payment', name: 'Hoàn tiền payment', sortOrder: 5 },
    { code: 'finance.transactions.view', module: 'finance', action: 'read', subject: 'WalletTransaction', name: 'Xem giao dịch ví', sortOrder: 6 },
    { code: 'finance.transactions.export', module: 'finance', action: 'export', subject: 'WalletTransaction', name: 'Xuất giao dịch ví', sortOrder: 7 },
    { code: 'finance.wallet.adjust', module: 'finance', action: 'adjust', subject: 'Wallet', name: 'Điều chỉnh ví', sortOrder: 8 },
    { code: 'game.dashboard.view', module: 'game', action: 'read', subject: 'GameDashboard', name: 'Xem tổng quan game', sortOrder: 1, scopeType: 'GAME' },
    { code: 'game.presentation.manage', module: 'game', action: 'manage', subject: 'GamePresentation', name: 'Quản lý trình bày game', sortOrder: 2, scopeType: 'GAME' },
    { code: 'game.content.manage', module: 'game', action: 'manage', subject: 'GameContent', name: 'Quản lý nội dung game', sortOrder: 3, scopeType: 'GAME' },
    { code: 'game.events.manage', module: 'game', action: 'manage', subject: 'GameEvent', name: 'Quản lý sự kiện game', sortOrder: 4, scopeType: 'GAME' },
    { code: 'game.players.view', module: 'game', action: 'read', subject: 'GamePlayer', name: 'Xem người chơi game', sortOrder: 5, scopeType: 'GAME' },
    { code: 'game.players.moderate', module: 'game', action: 'moderate', subject: 'GamePlayer', name: 'Khóa/mở người chơi game', sortOrder: 6, scopeType: 'GAME' },
    { code: 'game.players.temporary-lock', module: 'game', action: 'lock', subject: 'GamePlayer', name: 'Khóa tài khoản tạm thời', sortOrder: 7, scopeType: 'GAME' },
    { code: 'game.players.permanent-ban', module: 'game', action: 'ban', subject: 'GamePlayer', name: 'Cấm tài khoản vĩnh viễn', sortOrder: 8, scopeType: 'GAME' },
    { code: 'game.players.chat.moderate', module: 'game', action: 'moderate', subject: 'GamePlayerChat', name: 'Khóa/mở chat người chơi', sortOrder: 9, scopeType: 'GAME' },
    { code: 'game.chat.history.view', module: 'game', action: 'read', subject: 'GameChatHistory', name: 'Truy xuất lịch sử hội thoại', sortOrder: 10, scopeType: 'GAME' },
    { code: 'game.players.support-note', module: 'game', action: 'support-note', subject: 'GamePlayer', name: 'Ghi chú hỗ trợ người chơi', sortOrder: 11, scopeType: 'GAME' },
    { code: 'game.players.profile.manage', module: 'game', action: 'manage', subject: 'GamePlayerProfile', name: 'Chỉnh sửa hồ sơ player', sortOrder: 12, scopeType: 'GAME' },
    { code: 'game.operations.manage', module: 'game', action: 'manage', subject: 'GameOperations', name: 'Vận hành bảo trì game', sortOrder: 13, scopeType: 'GAME' },
    { code: 'game.audit.view', module: 'game', action: 'read', subject: 'GameAudit', name: 'Xem nhật ký game', sortOrder: 14, scopeType: 'GAME' },
    { code: 'game.support.manage', module: 'game', action: 'manage', subject: 'GameSupport', name: 'Hỗ trợ người chơi game', sortOrder: 15, scopeType: 'GAME' },
  ];

  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, sortOrder: perm.sortOrder, scopeType: perm.scopeType ?? 'PLATFORM' },
      create: perm,
    });

    if ((perm.scopeType ?? 'PLATFORM') === 'PLATFORM') {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: created.id } },
        update: {},
        create: { roleId: superAdmin.id, permissionId: created.id },
      });
    }

    if ((perm.scopeType ?? 'PLATFORM') === 'PLATFORM' && (perm.module === 'support' || perm.code === 'admin.access' || perm.code === 'users.view')) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: supportRole.id, permissionId: created.id } },
        update: {},
        create: { roleId: supportRole.id, permissionId: created.id },
      });
    }

    if ((perm.scopeType ?? 'PLATFORM') === 'PLATFORM' && (perm.module === 'finance' || perm.code === 'admin.access' || perm.code === 'admin.dashboard.view' || perm.code === 'users.view')) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: financeRole.id, permissionId: created.id } },
        update: {},
        create: { roleId: financeRole.id, permissionId: created.id },
      });
    }
  }

  const gamePermissionCodes: Record<string, string[]> = {
    GAME_ADMIN: [
      'game.dashboard.view', 'game.presentation.manage', 'game.content.manage',
      'game.events.manage', 'game.players.view', 'game.players.moderate',
      'game.players.temporary-lock', 'game.players.permanent-ban',
      'game.players.chat.moderate', 'game.chat.history.view',
      'game.players.support-note', 'game.players.profile.manage',
      'game.operations.manage', 'game.audit.view', 'game.support.manage',
    ],
    GAME_CONTENT_MANAGER: [
      'game.dashboard.view', 'game.presentation.manage',
      'game.content.manage', 'game.events.manage',
    ],
    GAME_PLAYER_MODERATOR: [
      'game.dashboard.view', 'game.players.view',
      'game.players.moderate', 'game.players.temporary-lock',
      'game.players.permanent-ban', 'game.players.support-note',
    ],
  };

  for (const role of gameRoles) {
    const permissionIds = (
      await prisma.permission.findMany({
        where: { code: { in: gamePermissionCodes[role.code] } },
        select: { id: true },
      })
    ).map((entry) => entry.id);

    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return { superAdmin, supportRole, gameRoles, financeRole };
}

/* ========================================================================== */
/* 2. USERS & PROFILES                                                        */
/* ========================================================================== */
async function seedUsers({
  superAdmin,
  supportRole,
  financeRole,
}: {
  superAdmin: { id: string };
  supportRole: { id: string };
  financeRole: { id: string };
}) {
  // Dọn dẹp tài khoản thử nghiệm cũ nếu có để tránh xung đột dữ liệu và loại bỏ các tên không phù hợp
  const obsoleteUsernames = [
    'manualadmin',
    'manualcontent',
    'manualmoderator',
    'manualplayer',
    'player1',
    'support',
    'testuser1',
  ];
  const obsoleteUsers = await prisma.user.findMany({
    where: { username: { in: obsoleteUsernames } },
    select: { id: true },
  });
  const obsoleteIds = obsoleteUsers.map((u) => u.id);
  if (obsoleteIds.length > 0) {
    await prisma.supportTicketMessage.deleteMany({ where: { authorUserId: { in: obsoleteIds } } });
    await prisma.supportTicketReadState.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.supportTicket.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.gamePlayer.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.gameRoleAssignment.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.userActivityLog.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.refreshSession.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.socialIdentity.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.sensitiveProfile.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: obsoleteIds } } });
    await prisma.user.deleteMany({ where: { id: { in: obsoleteIds } } });
  }

  const adminPasswordHash = await argon2.hash('AdminPassword123!');
  const userPasswordHash = await argon2.hash('ZenxGo@2026!');

  const userDefinitions = [
    // --- Ban Quản Trị & Vận Hành ---
    {
      username: 'admin',
      email: 'admin@zenxgo.vn',
      phone: '+84901000001',
      fullName: 'Super Administrator',
      gender: Gender.MALE,
      dateOfBirth: new Date('1990-01-15'),
      city: 'Hà Nội',
      address: 'Số 12 Nguyễn Thị Định, Cầu Giấy',
      passwordHash: adminPasswordHash,
      roleId: superAdmin.id,
      balance: 5_000_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '8821',
      securityQuestionCode: SecurityQuestionCode.FIRST_SCHOOL,
      socialProvider: null,
    },
    {
      username: 'lan.lengoc',
      email: 'lan.lengoc@zenxgo.vn',
      phone: '+84901000021',
      fullName: 'Lê Ngọc Lan',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1994-06-22'),
      city: 'Hà Nội',
      address: '88 Láng Hạ, Đống Đa',
      passwordHash: userPasswordHash,
      roleId: supportRole.id,
      balance: 150_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '3912',
      securityQuestionCode: SecurityQuestionCode.CHILDHOOD_NICKNAME,
      socialProvider: null,
    },
    {
      username: 'nam.tranhoang',
      email: 'nam.tranhoang@zenxgo.vn',
      phone: '+84901000022',
      fullName: 'Trần Hoàng Nam',
      gender: Gender.MALE,
      dateOfBirth: new Date('1996-03-18'),
      city: 'TP. Hồ Chí Minh',
      address: '45 Nguyễn Đình Chiểu, Quận 3',
      passwordHash: userPasswordHash,
      roleId: supportRole.id,
      balance: 120_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '5420',
      securityQuestionCode: SecurityQuestionCode.FAVORITE_TEACHER,
      socialProvider: null,
    },
    {
      username: 'tuan.nguyenminh',
      email: 'tuan.nguyenminh@zenxgo.vn',
      phone: '+84901000023',
      fullName: 'Nguyễn Minh Tuấn',
      gender: Gender.MALE,
      dateOfBirth: new Date('1991-08-10'),
      city: 'Hà Nội',
      address: '102 Thái Hà, Đống Đa',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 800_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '6741',
      securityQuestionCode: SecurityQuestionCode.MEMORABLE_PLACE,
      socialProvider: null,
    },
    {
      username: 'mai.vuphuong',
      email: 'mai.vuphuong@zenxgo.vn',
      phone: '+84901000024',
      fullName: 'Vũ Phương Mai',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1995-11-05'),
      city: 'Đà Nẵng',
      address: '24 Bạch Đằng, Hải Châu',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 350_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '7104',
      securityQuestionCode: SecurityQuestionCode.FIRST_PET,
      socialProvider: null,
    },
    {
      username: 'khanh.dangquoc',
      email: 'khanh.dangquoc@zenxgo.vn',
      phone: '+84901000025',
      fullName: 'Đặng Quốc Khánh',
      gender: Gender.MALE,
      dateOfBirth: new Date('1993-04-12'),
      city: 'TP. Hồ Chí Minh',
      address: '178 Hai Bà Trưng, Quận 1',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 400_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '9283',
      securityQuestionCode: SecurityQuestionCode.FIRST_SCHOOL,
      socialProvider: null,
    },
    {
      username: 'ha.lethanh',
      email: 'ha.lethanh@zenxgo.vn',
      phone: '+84901000026',
      fullName: 'Lê Thanh Hà',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1989-12-30'),
      city: 'Hà Nội',
      address: '36 Hoàng Cầu, Đống Đa',
      passwordHash: userPasswordHash,
      roleId: financeRole.id,
      balance: 1_200_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '4198',
      securityQuestionCode: SecurityQuestionCode.CHILDHOOD_NICKNAME,
      socialProvider: null,
    },

    // --- Người Chơi Hoạt Động (VIP & Active Players) ---
    {
      username: 'quang.tran',
      email: 'quang.tran88@gmail.com',
      phone: '+84902111222',
      fullName: 'Trần Nhật Quang',
      gender: Gender.MALE,
      dateOfBirth: new Date('1988-07-14'),
      city: 'Hà Nội',
      address: '15 Duy Tân, Cầu Giấy',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 4_250_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '4921',
      securityQuestionCode: SecurityQuestionCode.FIRST_PET,
      socialProvider: SocialProvider.GOOGLE,
    },
    {
      username: 'anh.nguyenthuy',
      email: 'thuyanh.nguyen@gmail.com',
      phone: '+84903333444',
      fullName: 'Nguyễn Thùy Anh',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1997-09-25'),
      city: 'TP. Hồ Chí Minh',
      address: '220 Điện Biên Phủ, Bình Thạnh',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 1_850_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '3819',
      securityQuestionCode: SecurityQuestionCode.MEMORABLE_PLACE,
      socialProvider: SocialProvider.FACEBOOK,
    },
    {
      username: 'dat.vutien',
      email: 'dat.vutien95@outlook.com',
      phone: '+84904555666',
      fullName: 'Vũ Tiến Đạt',
      gender: Gender.MALE,
      dateOfBirth: new Date('1995-02-18'),
      city: 'Đà Nẵng',
      address: '54 Nguyễn Văn Linh, Thanh Khê',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 920_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '8204',
      securityQuestionCode: SecurityQuestionCode.FIRST_SCHOOL,
      socialProvider: SocialProvider.GOOGLE,
    },
    {
      username: 'linh.dangthuy',
      email: 'linhdang.design@gmail.com',
      phone: '+84905777888',
      fullName: 'Đặng Thùy Linh',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1999-10-08'),
      city: 'Hải Phòng',
      address: '16 Cầu Đất, Ngô Quyền',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 650_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '7412',
      securityQuestionCode: SecurityQuestionCode.CHILDHOOD_NICKNAME,
      socialProvider: null,
    },
    {
      username: 'bao.hoanggia',
      email: 'bao.hoang99@gmail.com',
      phone: '+84906999000',
      fullName: 'Hoàng Gia Bảo',
      gender: Gender.MALE,
      dateOfBirth: new Date('1999-05-19'),
      city: 'Cần Thơ',
      address: '72 Hòa Bình, Ninh Kiều',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 3_100_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '1905',
      securityQuestionCode: SecurityQuestionCode.FIRST_PET,
      socialProvider: SocialProvider.GOOGLE,
    },
    {
      username: 'thao.buiphuong',
      email: 'thao.bp@icloud.com',
      phone: '+84907111333',
      fullName: 'Bùi Phương Thảo',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2001-08-14'),
      city: 'Bình Dương',
      address: '89 Đại lộ Bình Dương, Thủ Dầu Một',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 180_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '6284',
      securityQuestionCode: SecurityQuestionCode.FAVORITE_TEACHER,
      socialProvider: null,
    },
    {
      username: 'phuc.voduc',
      email: 'phuc.voduc@gmail.com',
      phone: '+84908222444',
      fullName: 'Võ Đức Phúc',
      gender: Gender.MALE,
      dateOfBirth: new Date('2000-01-20'),
      city: 'Đồng Nai',
      address: '14 Võ Thị Sáu, Biên Hòa',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 75_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '9031',
      securityQuestionCode: SecurityQuestionCode.MEMORABLE_PLACE,
      socialProvider: SocialProvider.GOOGLE,
    },
    {
      username: 'son.lehoang',
      email: 'son.lehoang@gmail.com',
      phone: '+84909333555',
      fullName: 'Lê Hoàng Sơn',
      gender: Gender.MALE,
      dateOfBirth: new Date('1994-11-11'),
      city: 'Quảng Ninh',
      address: '25 Lê Thánh Tông, Hạ Long',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 500_000n,
      status: AccountStatus.ACTIVE,
      citizenIdLast4: '2847',
      securityQuestionCode: SecurityQuestionCode.FIRST_SCHOOL,
      socialProvider: null,
    },

    // --- Các Trạng Thái Khác (Pending, Suspended, Locked, Deleted) ---
    {
      username: 'trang.dohuyen',
      email: 'trang.dohuyen@gmail.com',
      phone: '+84910444666',
      fullName: 'Đỗ Huyền Trang',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2002-04-03'),
      city: 'Nha Trang',
      address: '10 Trần Phú, Lộc Thọ',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 0n,
      status: AccountStatus.PENDING,
      citizenIdLast4: null,
      securityQuestionCode: null,
      socialProvider: null,
    },
    {
      username: 'hieu.nguyentrung',
      email: 'hieu.nt98@gmail.com',
      phone: '+84911555777',
      fullName: 'Nguyễn Trung Hiếu',
      gender: Gender.MALE,
      dateOfBirth: new Date('1998-12-01'),
      city: 'Huế',
      address: '18 Lê Lợi, Vĩnh Ninh',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 0n,
      status: AccountStatus.PENDING,
      citizenIdLast4: null,
      securityQuestionCode: null,
      socialProvider: null,
    },
    {
      username: 'kien.trantung',
      email: 'kien.trantung@gmail.com',
      phone: '+84912666888',
      fullName: 'Trần Tùng Kiên',
      gender: Gender.MALE,
      dateOfBirth: new Date('1992-03-29'),
      city: 'Hà Nội',
      address: '68 Phố Huế, Hai Bà Trưng',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 25_000n,
      status: AccountStatus.SUSPENDED,
      citizenIdLast4: '1849',
      securityQuestionCode: SecurityQuestionCode.CHILDHOOD_NICKNAME,
      socialProvider: null,
    },
    {
      username: 'long.vudinh',
      email: 'long.vudinh@hotmail.com',
      phone: '+84913777999',
      fullName: 'Vũ Đình Long',
      gender: Gender.MALE,
      dateOfBirth: new Date('1996-08-16'),
      city: 'Bắc Ninh',
      address: '42 Trần Hưng Đạo, Tiền An',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 10_000n,
      status: AccountStatus.LOCKED,
      citizenIdLast4: '9512',
      securityQuestionCode: SecurityQuestionCode.MEMORABLE_PLACE,
      socialProvider: null,
    },
    {
      username: 'minh.phanvan',
      email: 'minh.phanvan@gmail.com',
      phone: '+84914888000',
      fullName: 'Phan Văn Minh',
      gender: Gender.MALE,
      dateOfBirth: new Date('1993-06-05'),
      city: 'TP. Hồ Chí Minh',
      address: '90 Cách Mạng Tháng 8, Quận 3',
      passwordHash: userPasswordHash,
      roleId: null,
      balance: 0n,
      status: AccountStatus.DELETED,
      citizenIdLast4: null,
      securityQuestionCode: null,
      socialProvider: null,
    },
  ];

  const userMap = new Map<string, { id: string; username: string; email: string; fullName: string }>();

  for (const acc of userDefinitions) {
    const usernameNormalized = acc.username.toLowerCase();
    const emailNormalized = acc.email.toLowerCase();
    const phoneNormalized = acc.phone.toLowerCase();

    const isPending = acc.status === AccountStatus.PENDING;
    const verifiedAt = isPending ? null : new Date('2026-06-01T08:00:00Z');

    const user = await prisma.user.upsert({
      where: { usernameNormalized },
      update: {
        email: acc.email,
        emailNormalized,
        phone: acc.phone,
        phoneNormalized,
        passwordHash: acc.passwordHash,
        status: acc.status,
        emailVerifiedAt: verifiedAt,
        phoneVerifiedAt: verifiedAt,
      },
      create: {
        username: acc.username,
        usernameNormalized,
        email: acc.email,
        emailNormalized,
        phone: acc.phone,
        phoneNormalized,
        passwordHash: acc.passwordHash,
        status: acc.status,
        emailVerifiedAt: verifiedAt,
        phoneVerifiedAt: verifiedAt,
      },
    });

    userMap.set(acc.username, {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: acc.fullName,
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: acc.fullName,
        gender: acc.gender,
        dateOfBirth: acc.dateOfBirth,
        city: acc.city,
        address: acc.address,
        profileCompletedAt: isPending ? null : new Date('2026-06-02T10:00:00Z'),
      },
      create: {
        userId: user.id,
        fullName: acc.fullName,
        gender: acc.gender,
        dateOfBirth: acc.dateOfBirth,
        city: acc.city,
        address: acc.address,
        profileCompletedAt: isPending ? null : new Date('2026-06-02T10:00:00Z'),
        termsVersion: '2026-01',
        privacyVersion: '2026-01',
        acceptedAt: new Date('2026-06-01T08:00:00Z'),
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: acc.balance },
      create: {
        userId: user.id,
        currency: 'ZENX',
        balance: acc.balance,
      },
    });

    if (acc.citizenIdLast4) {
      await prisma.sensitiveProfile.upsert({
        where: { userId: user.id },
        update: {
          citizenIdLast4: acc.citizenIdLast4,
          citizenIdCiphertext: `enc_sec_${acc.citizenIdLast4}_prod`,
          citizenIdIv: 'iv_prod_9918231',
          citizenIdAuthTag: 'tag_prod_881923',
          securityQuestionCode: acc.securityQuestionCode,
          securityAnswerHash: '$argon2id$v=19$m=65536,t=3,p=4$dummySecurityAnswerHash',
        },
        create: {
          userId: user.id,
          citizenIdLast4: acc.citizenIdLast4,
          citizenIdCiphertext: `enc_sec_${acc.citizenIdLast4}_prod`,
          citizenIdIv: 'iv_prod_9918231',
          citizenIdAuthTag: 'tag_prod_881923',
          securityQuestionCode: acc.securityQuestionCode,
          securityAnswerHash: '$argon2id$v=19$m=65536,t=3,p=4$dummySecurityAnswerHash',
          securityVersion: 1,
        },
      });
    }

    if (acc.socialProvider) {
      await prisma.socialIdentity.upsert({
        where: {
          provider_providerUserId: {
            provider: acc.socialProvider,
            providerUserId: `social_id_${acc.username}`,
          },
        },
        update: {},
        create: {
          userId: user.id,
          provider: acc.socialProvider,
          providerUserId: `social_id_${acc.username}`,
          emailAtLinkTime: acc.email,
          linkedAt: new Date('2026-06-15T09:30:00Z'),
          lastLoginAt: new Date('2026-09-17T15:20:00Z'),
        },
      });
    }

    if (acc.roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: acc.roleId } },
        update: {},
        create: {
          userId: user.id,
          roleId: acc.roleId,
          assignedAt: new Date('2026-06-01T08:00:00Z'),
        },
      });
    }
  }

  return userMap;
}

/* ========================================================================== */
/* 3. SECURITY QUESTIONS                                                      */
/* ========================================================================== */
async function seedSecurityQuestions() {
  const questions = [
    [SecurityQuestionCode.CHILDHOOD_NICKNAME, 'Biệt danh thời thơ ấu của bạn là gì?', 1],
    [SecurityQuestionCode.FIRST_SCHOOL, 'Tên ngôi trường đầu tiên của bạn là gì?', 2],
    [SecurityQuestionCode.FIRST_PET, 'Tên thú cưng đầu tiên của bạn là gì?', 3],
    [SecurityQuestionCode.FAVORITE_TEACHER, 'Tên giáo viên bạn yêu thích là gì?', 4],
    [SecurityQuestionCode.MEMORABLE_PLACE, 'Địa điểm đáng nhớ nhất của bạn là ở đâu?', 5],
  ] as const;

  for (const [code, label, sortOrder] of questions) {
    await prisma.securityQuestion.upsert({
      where: { code },
      update: { label, sortOrder, isActive: true },
      create: { code, label, sortOrder, isActive: true },
    });
  }
}

/* ========================================================================== */
/* 4. GAMES & CONTENT                                                         */
/* ========================================================================== */
async function seedGames() {
  const genres = [
    ['MMORPG', 'MMORPG', 'mmorpg', 1],
    ['RPG', 'Nhập vai', 'nhap-vai', 2],
    ['FANTASY', 'Kỳ ảo', 'ky-ao', 3],
    ['ADVENTURE', 'Phiêu lưu', 'phieu-luu', 4],
    ['STRATEGY', 'Chiến thuật', 'chien-thuat', 5],
    ['SLG', 'Chiến thuật mô phỏng', 'slg', 6],
    ['TURN_BASED', 'Đánh theo lượt', 'danh-theo-luot', 7],
    ['CASUAL', 'Giải trí', 'casual', 8],
    ['SIMULATION', 'Mô phỏng', 'mo-phong', 9],
    ['SHOOTER', 'Bắn súng', 'ban-sung', 10],
  ] as const;

  const genreIds = new Map<string, string>();
  for (const [code, name, slug, sortOrder] of genres) {
    const genre = await prisma.genre.upsert({
      where: { code },
      update: { name, slug, sortOrder },
      create: { code, name, slug, sortOrder },
    });
    genreIds.set(code, genre.id);
  }

  const games = [
    {
      code: 'LDDM',
      name: 'Lục Địa Đam Mê',
      slug: 'luc-dia-dam-me',
      subdomain: 'lucdia',
      recordType: 'REAL',
      tagline: 'Lục địa huyền thoại đã trở lại.',
      shortDescription:
        'Thế giới MMORPG fantasy đa nền tảng nơi những hoài niệm tuổi thơ trở thành hành trình mới của cộng đồng.',
      longDescription:
        'Lục Địa Đam Mê là thế giới MMORPG fantasy đa nền tảng đã mở cửa, kết nối người chơi qua những vùng đất, trận chiến và mùa phiêu lưu liên tục.',
      lifecycleStatus: 'LIVE',
      operationalStatus: 'AVAILABLE',
      releaseYear: 2026,
      themePreset: 'EDITORIAL_FANTASY',
      featured: true,
      primaryGame: true,
      isPublic: true,
      sortOrder: 1,
      genres: ['MMORPG', 'FANTASY', 'ADVENTURE'],
      platforms: ['PC', 'MOBILE', 'WEB'],
      heroDesktopUrl: '/images/games/luc-dia-dam-me/hero.webp',
      heroMobileUrl: '/images/games/luc-dia-dam-me/hero.webp',
      coverUrl: '/images/games/luc-dia-dam-me/nhan_vat3.webp',
      iconUrl: '/images/games/luc-dia-dam-me/logo.webp',
      logoUrl: '/images/games/luc-dia-dam-me/logo.webp',
      primaryCtaLabel: 'Trang chủ game',
      primaryCtaPath: '/',
      secondaryCtaLabel: 'Xem tin tức',
      secondaryCtaPath: '/tin-tuc',
      theme: {
        primary: '#54796f',
        secondary: '#778fa0',
        surface: '#edf2f3',
        text: '#203236',
        heading: 'serif',
        body: 'sans-serif',
        radius: 'medium',
        motion: 'subtle',
      },
      features: {
        sections: [
          'HERO',
          'GAME_INTRODUCTION',
          'FEATURE_GRID',
          'ROADMAP_PREVIEW',
          'ARTICLE_GRID',
          'MEDIA_GALLERY',
          'COMMUNITY_CTA',
        ],
        routes: ['ABOUT', 'NEWS', 'ROADMAP'],
        downloads: false,
        servers: false,
        leaderboard: false,
        giftcode: false,
        gameTopup: false,
      },
      articles: [
        {
          title: 'Không gian gameplay là ưu tiên',
          slug: 'khong-gian-gameplay-la-uu-tien',
          excerpt:
            'Mỗi khung hình của Lục Địa Đam Mê giữ thế giới và nhân vật ở trung tâm trải nghiệm.',
          category: 'DEVELOPMENT_UPDATE',
          coverImageUrl: '/images/games/luc-dia-dam-me/hero.webp',
          content:
            '# Không gian gameplay là ưu tiên\n\nLục Địa Đam Mê đã mở cửa với nhịp khám phá, chiến đấu và kết nối được thiết kế rõ ràng trên mọi màn hình.\n\nCác khu vực trọng tâm được tối ưu để người chơi luôn đọc được không gian và nhận ra những điều đáng chú ý trong hành trình.\n\n- Giữ nhân vật ở trung tâm trải nghiệm\n- Làm rõ không gian chiến đấu\n- Tối ưu trải nghiệm trên PC, Mobile và Web',
          publishedAt: new Date('2026-09-01T08:00:00Z'),
        },
        {
          title: 'Season 6 chính thức mở cửa',
          slug: 'season-6-chinh-thuc-mo-cua',
          excerpt:
            'Mùa Season 6 đã mở cửa với phần thưởng tân thủ và chuỗi hoạt động cộng đồng đầu tiên.',
          category: 'EVENT',
          coverImageUrl: '/images/games/luc-dia-dam-me/hero2.webp',
          content:
            '# Season 6 chính thức mở cửa\n\nSeason 6 đưa người chơi trở lại những vùng đất quen thuộc với hệ thống nhiệm vụ, hoạt động bang hội và phần thưởng theo mùa.\n\nNgười chơi mới có thể bắt đầu hành trình ngay từ cổng thành và nhận bộ quà tân thủ trong những ngày đầu.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng mùa đầu tiên\n- Chuỗi nhiệm vụ cộng đồng',
          publishedAt: new Date('2026-09-01T22:00:00Z'),
        },
        {
          title: 'Bản đồ đã mở rộng',
          slug: 'world-remake',
          excerpt:
            'Các tuyến đường giữa thành trì và vùng trời mới đã được mở rộng trong mùa hiện tại.',
          category: 'DEVELOPMENT_UPDATE',
          coverImageUrl: '/images/games/luc-dia-dam-me/bg.webp',
          content:
            '# Bản đồ đã mở rộng\n\nCác tuyến đường mới kết nối thành trì, vùng săn và điểm giao thương để hành trình xuyên Lục Địa liền mạch hơn.\n\nHệ thống ánh sáng và mốc định hướng được cập nhật để người chơi dễ nhận biết điểm đến trong cả ngày lẫn đêm.\n\nNhững khu vực tiếp theo sẽ được mở theo lịch vận hành của Season 6.',
          publishedAt: new Date('2026-08-28T08:00:00Z'),
        },
      ],
      milestones: [
        [
          'Season 6 ra mắt',
          'Mở cửa mùa vận hành đầu tiên cho cộng đồng.',
          '06/2026',
          'COMPLETED',
          ['Mở tài khoản xuyên game', 'Kích hoạt phần thưởng tân thủ'],
        ],
        [
          'Bản đồ liên vùng',
          'Kết nối các thành trì và tuyến khám phá chính.',
          '08/2026',
          'COMPLETED',
          ['Mở tuyến thành trì', 'Cập nhật mốc định hướng'],
        ],
        [
          'Công thành chiến',
          'Chu kỳ chiến trường bang hội đang vận hành.',
          '09/2026',
          'IN_PROGRESS',
          ['Cân bằng chiến trường', 'Theo dõi mùa bang hội'],
        ],
      ],
    },
    {
      code: 'VTHL',
      name: 'Vương Triều Hỏa Long',
      slug: 'vuong-trieu-hoa-long',
      subdomain: 'hoalong',
      recordType: 'REAL',
      tagline: 'Dựng vương triều. Hiệu triệu Long Thần.',
      shortDescription:
        'Game chiến thuật mô phỏng nơi các vương triều tranh quyền, quản trị tài nguyên và hiệu triệu sức mạnh Long Thần.',
      longDescription:
        'Vương Triều Hỏa Long là chiến trường SLG đang vận hành, nơi mỗi quyết định xây dựng, ngoại giao và điều binh đều mở ra một chương mới cho vương quốc.',
      lifecycleStatus: 'LIVE',
      operationalStatus: 'AVAILABLE',
      releaseYear: 2026,
      themePreset: 'DARK_STRATEGY',
      featured: true,
      primaryGame: false,
      isPublic: true,
      sortOrder: 2,
      genres: ['STRATEGY', 'SLG'],
      platforms: ['MOBILE', 'WEB'],
      heroDesktopUrl: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp',
      heroMobileUrl: '/images/games/vuong-trieu-hoa-long/hero-mobile.webp',
      coverUrl: '/images/games/vuong-trieu-hoa-long/key-art.webp',
      iconUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp',
      logoUrl: '/images/games/vuong-trieu-hoa-long/avatar.webp',
      primaryCtaLabel: 'Trang chủ game',
      primaryCtaPath: '/',
      secondaryCtaLabel: 'Xem tin tức',
      secondaryCtaPath: '/tin-tuc',
      theme: {
        primary: '#9b4938',
        secondary: '#c89254',
        surface: '#1e1b1c',
        text: '#fff4df',
        heading: 'display-serif',
        body: 'sans-serif',
        radius: 'small',
        motion: 'cinematic',
      },
      features: {
        sections: [
          'HERO',
          'GAME_INTRODUCTION',
          'FEATURE_GRID',
          'ROADMAP_PREVIEW',
          'ARTICLE_GRID',
          'COMMUNITY_CTA',
        ],
        routes: ['ABOUT', 'NEWS', 'ROADMAP'],
        downloads: false,
        servers: false,
        leaderboard: false,
        giftcode: false,
        gameTopup: false,
      },
      articles: [
        {
          title: 'Mùa Liên Minh đầu tiên đã khai mở',
          slug: 'long-than-thuc-tinh',
          excerpt:
            'Các vương triều đã bước vào mùa Liên Minh với quyền triệu hồi Long Thần và mục tiêu lãnh thổ mới.',
          category: 'ANNOUNCEMENT',
          coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/dragon.webp',
          content:
            '# Mùa Liên Minh đầu tiên đã khai mở\n\nMùa Liên Minh đưa các vương triều vào cùng một chiến trường, nơi ngoại giao và sức mạnh Long Thần quyết định từng bước tiến.\n\nThủ lĩnh có thể lập liên minh, chia sẻ tuyến tiếp tế và cùng mở khóa phần thưởng theo cột mốc lãnh thổ.',
          publishedAt: new Date('2026-09-01T21:00:00Z'),
        },
      ],
      milestones: [
        [
          'Mùa Liên Minh đầu tiên',
          'Mùa vận hành liên minh đã mở cửa trên toàn chiến trường.',
          '08/2026',
          'COMPLETED',
          ['Mở bản đồ liên minh', 'Kích hoạt phần thưởng đóng góp'],
        ],
        [
          'Phòng thủ Hoàng Thành',
          'Chu kỳ phòng thủ và phản công đang diễn ra hằng tuần.',
          '09/2026',
          'IN_PROGRESS',
          ['Xoay vòng bản đồ', 'Theo dõi đóng góp liên minh'],
        ],
      ],
    },
    {
      code: 'TTM',
      name: 'Thị Trấn Mây',
      slug: 'thi-tran-may',
      subdomain: 'thitranmay',
      recordType: 'REAL',
      tagline: 'Sống chậm giữa những tầng mây.',
      shortDescription:
        'Game mô phỏng thư giãn nơi bạn chăm sóc khu vườn nổi, kết nối hàng xóm và tận hưởng nhịp sống trên mây.',
      longDescription:
        'Thị Trấn Mây là thị trấn mô phỏng đang hoạt động, nơi mỗi ngày mang đến một mùa vụ, chuyến thăm và góc nhỏ để bạn tự tay sắp xếp.',
      lifecycleStatus: 'LIVE',
      operationalStatus: 'AVAILABLE',
      releaseYear: 2026,
      themePreset: 'PLAYFUL_CASUAL',
      featured: true,
      primaryGame: false,
      isPublic: true,
      sortOrder: 3,
      genres: ['CASUAL', 'SIMULATION'],
      platforms: ['MOBILE', 'WEB'],
      heroDesktopUrl: '/images/games/thi-tran-may/hero-desktop.webp',
      heroMobileUrl: '/images/games/thi-tran-may/hero-mobile.webp',
      coverUrl: '/images/games/thi-tran-may/key-art.webp',
      iconUrl: '/images/games/thi-tran-may/avatar.webp',
      logoUrl: '/images/games/thi-tran-may/avatar.webp',
      primaryCtaLabel: 'Trang chủ game',
      primaryCtaPath: '/',
      secondaryCtaLabel: 'Xem tin tức',
      secondaryCtaPath: '/tin-tuc',
      theme: {
        primary: '#69bce8',
        secondary: '#f6c958',
        surface: '#fffdf7',
        text: '#193b5a',
        heading: 'rounded-sans',
        body: 'sans-serif',
        radius: 'large',
        motion: 'playful',
      },
      features: {
        sections: [
          'HERO',
          'GAME_INTRODUCTION',
          'FEATURE_GRID',
          'ROADMAP_PREVIEW',
          'ARTICLE_GRID',
          'COMMUNITY_CTA',
        ],
        routes: ['ABOUT', 'NEWS', 'ROADMAP'],
        downloads: false,
        servers: false,
        leaderboard: false,
        giftcode: false,
        gameTopup: false,
      },
      articles: [
        {
          title: 'Một ngày ở Quảng trường Mây',
          slug: 'mot-ngay-o-quang-truong-may',
          excerpt:
            'Quảng trường Mây rộn ràng với chợ cuối tuần, hoạt động cộng đồng và những cuộc hẹn giữa các đảo.',
          category: 'ANNOUNCEMENT',
          coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp',
          content:
            '# Một ngày ở Quảng trường Mây\n\nQuảng trường là nơi người chơi gặp nhau, trao đổi vật phẩm và bắt đầu các hoạt động theo mùa.\n\n- Chợ cuối tuần\n- Lễ hội ánh sáng\n- Góc chụp ảnh cộng đồng',
          publishedAt: new Date('2026-09-01T12:00:00Z'),
        },
      ],
      milestones: [
        [
          'Khai mở Quảng trường Mây',
          'Quảng trường trung tâm đã mở cửa cho cư dân và khách ghé thăm.',
          '07/2026',
          'COMPLETED',
          ['Mở chợ cuối tuần', 'Kích hoạt lịch hoạt động'],
        ],
        [
          'Lễ hội Khinh khí cầu',
          'Lễ hội kết nối các đảo đang diễn ra với nhiệm vụ và quà trang trí.',
          '09/2026',
          'IN_PROGRESS',
          ['Mở tuyến bay', 'Thu thập huy hiệu lễ hội'],
        ],
      ],
    },
    {
      code: 'CTO',
      name: 'Chiến Tuyến Orion',
      slug: 'chien-tuyen-orion',
      subdomain: 'orion',
      recordType: 'REAL',
      tagline: 'Tập hợp biệt đội. Giữ vững chiến tuyến.',
      shortDescription:
        'Game bắn súng chiến thuật khoa học viễn tưởng nơi các biệt đội phối hợp để bảo vệ thuộc địa ngoài không gian.',
      longDescription:
        'Chiến Tuyến Orion là chiến trường tactical shooter đang vận hành, nơi Recon, Assault và Support phối hợp qua từng trận đấu để giữ vững Vành đai Orion.',
      lifecycleStatus: 'LIVE',
      operationalStatus: 'AVAILABLE',
      releaseYear: 2026,
      themePreset: 'SCI_FI_SHOOTER',
      featured: true,
      primaryGame: false,
      isPublic: true,
      sortOrder: 4,
      genres: ['SHOOTER'],
      platforms: ['PC', 'MOBILE'],
      heroDesktopUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp',
      heroMobileUrl: '/images/games/chien-tuyen-orion/hero-mobile.webp',
      coverUrl: '/images/games/chien-tuyen-orion/key-art.webp',
      iconUrl: '/images/games/chien-tuyen-orion/avatar.webp',
      logoUrl: '/images/games/chien-tuyen-orion/avatar.webp',
      primaryCtaLabel: 'Trang chủ game',
      primaryCtaPath: '/',
      secondaryCtaLabel: 'Xem tin tức',
      secondaryCtaPath: '/tin-tuc',
      theme: {
        primary: '#6c8cff',
        secondary: '#57d7ff',
        surface: '#0b1224',
        text: '#e8f0ff',
        heading: 'display-sans',
        body: 'sans-serif',
        radius: 'medium',
        motion: 'cinematic',
      },
      features: {
        sections: [
          'HERO',
          'GAME_INTRODUCTION',
          'FEATURE_GRID',
          'ROADMAP_PREVIEW',
          'ARTICLE_GRID',
          'COMMUNITY_CTA',
        ],
        routes: ['ABOUT', 'NEWS', 'ROADMAP'],
        downloads: false,
        servers: false,
        leaderboard: false,
        giftcode: false,
        gameTopup: false,
      },
      articles: [
        {
          title: 'Ranked Season 1: Vành đai Orion',
          slug: 'bao-cao-chien-tuyen-vanh-dai-orion',
          excerpt:
            'Ranked Season 1 đã mở với bản đồ Vành đai Orion, mục tiêu xoay vòng và bảng xếp hạng theo mùa.',
          category: 'EVENT',
          coverImageUrl:
            '/images/games/chien-tuyen-orion/detail-v3-light/battlefield-panorama.webp',
          content:
            '# Ranked Season 1: Vành đai Orion\n\nRanked Season 1 đưa các biệt đội vào Vành đai Orion với mục tiêu thay đổi theo trận và bảng xếp hạng cập nhật liên tục.\n\n- Điểm quan sát ngoài trời\n- Khu vực trú ẩn\n- Mục tiêu xoay vòng theo trận',
          publishedAt: new Date('2026-09-01T23:00:00Z'),
        },
      ],
      milestones: [
        [
          'Vành đai Orion mở cửa',
          'Chiến tuyến đầu tiên đã mở cho các biệt đội.',
          '07/2026',
          'COMPLETED',
          ['Mở bản đồ chính', 'Kích hoạt ghép trận'],
        ],
        [
          'Ranked Season 1',
          'Mùa xếp hạng đầu tiên đang vận hành với bảng xếp hạng theo tuần.',
          '09/2026',
          'IN_PROGRESS',
          ['Mở mục tiêu xoay vòng', 'Trao phần thưởng mùa'],
        ],
      ],
    },
  ] as const;

  const gameMap = new Map<string, { id: string; code: string; name: string; slug: string }>();

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { code: gameData.code },
      update: {
        name: gameData.name,
        slug: gameData.slug,
        subdomain: gameData.subdomain,
        recordType: gameData.recordType,
        tagline: gameData.tagline,
        shortDescription: gameData.shortDescription,
        longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus,
        operationalStatus: gameData.operationalStatus,
        releaseYear: gameData.releaseYear,
        themePreset: gameData.themePreset,
        templateVersion: 1,
        themeConfig: JSON.stringify(gameData.theme),
        featureConfig: JSON.stringify(gameData.features),
        pageConfig: JSON.stringify(seedPageConfig(gameData)),
        logoUrl: gameData.logoUrl,
        iconUrl: gameData.iconUrl,
        coverUrl: gameData.coverUrl,
        heroDesktopUrl: gameData.heroDesktopUrl,
        heroMobileUrl: gameData.heroMobileUrl,
        featured: gameData.featured,
        primaryGame: gameData.primaryGame,
        isPublic: gameData.isPublic,
        sortOrder: gameData.sortOrder,
        primaryCtaLabel: gameData.primaryCtaLabel,
        primaryCtaPath: gameData.primaryCtaPath,
        secondaryCtaLabel: gameData.secondaryCtaLabel,
        secondaryCtaPath: gameData.secondaryCtaPath,
      },
      create: {
        code: gameData.code,
        name: gameData.name,
        slug: gameData.slug,
        subdomain: gameData.subdomain,
        recordType: gameData.recordType,
        tagline: gameData.tagline,
        shortDescription: gameData.shortDescription,
        longDescription: gameData.longDescription,
        lifecycleStatus: gameData.lifecycleStatus,
        operationalStatus: gameData.operationalStatus,
        releaseYear: gameData.releaseYear,
        themePreset: gameData.themePreset,
        templateVersion: 1,
        themeConfig: JSON.stringify(gameData.theme),
        featureConfig: JSON.stringify(gameData.features),
        pageConfig: JSON.stringify(seedPageConfig(gameData)),
        logoUrl: gameData.logoUrl,
        iconUrl: gameData.iconUrl,
        coverUrl: gameData.coverUrl,
        heroDesktopUrl: gameData.heroDesktopUrl,
        heroMobileUrl: gameData.heroMobileUrl,
        featured: gameData.featured,
        primaryGame: gameData.primaryGame,
        isPublic: gameData.isPublic,
        sortOrder: gameData.sortOrder,
        primaryCtaLabel: gameData.primaryCtaLabel,
        primaryCtaPath: gameData.primaryCtaPath,
        secondaryCtaLabel: gameData.secondaryCtaLabel,
        secondaryCtaPath: gameData.secondaryCtaPath,
      },
    });

    gameMap.set(gameData.code, { id: game.id, code: game.code, name: game.name, slug: game.slug });

    await prisma.gameGenre.deleteMany({ where: { gameId: game.id } });
    await prisma.gamePlatform.deleteMany({ where: { gameId: game.id } });
    await prisma.gameArticle.deleteMany({ where: { gameId: game.id } });
    await prisma.gameMilestone.deleteMany({ where: { gameId: game.id } });

    await prisma.gameGenre.createMany({
      data: gameData.genres.map((code) => ({ gameId: game.id, genreId: genreIds.get(code)! })),
    });

    await prisma.gamePlatform.createMany({
      data: gameData.platforms.map((platform) => ({ gameId: game.id, platform })),
    });

    if (gameData.articles.length) {
      await prisma.gameArticle.createMany({
        data: gameData.articles.map((article) => ({
          gameId: game.id,
          ...article,
          status: 'PUBLISHED',
          seoTitle: article.title,
          seoDescription: article.excerpt,
        })),
      });
    }

    if (gameData.milestones.length) {
      await prisma.gameMilestone.createMany({
        data: gameData.milestones.map(
          ([title, description, displayPeriod, status, checklist], sortOrder) => ({
            gameId: game.id,
            title,
            description,
            displayPeriod,
            status,
            checklistConfig: JSON.stringify(checklist),
            sortOrder,
          }),
        ),
      });
    }
  }

  return { games: gameMap, genreIds };
}

function seedPageConfig(gameData: {
  themePreset: 'EDITORIAL_FANTASY' | 'DARK_STRATEGY' | 'PLAYFUL_CASUAL' | 'SCI_FI_SHOOTER';
  name: string;
  tagline: string;
  shortDescription: string;
  heroDesktopUrl: string;
  heroMobileUrl: string;
  coverUrl: string;
}) {
  const pageConfig = createPageConfig(gameData.themePreset, gameData.name, gameData.tagline, gameData.shortDescription);
  pageConfig.legacyRenderer = gameData.themePreset;
  pageConfig.hero.imageUrl = gameData.heroDesktopUrl;
  pageConfig.hero.mobileImageUrl = gameData.heroMobileUrl;
  pageConfig.intro.imageUrl = gameData.coverUrl;
  return pageConfig;
}

/* ========================================================================== */
/* 5. GAME PLAYERS & GAME ROLES                                               */
/* ========================================================================== */
async function seedGameRolesAndPlayers({
  users,
  games,
  gameRoles,
}: {
  users: Map<string, { id: string }>;
  games: Map<string, { id: string }>;
  gameRoles: Array<{ id: string; code: string }>;
}) {
  const roleByCode = new Map(gameRoles.map((r) => [r.code, r.id]));
  const lddm = games.get('LDDM')!;
  const vthl = games.get('VTHL')!;
  const ttm = games.get('TTM')!;
  const cto = games.get('CTO')!;

  // 1. Phân quyền Game Admin / Quản lý nội dung cho nhân sự
  const assignments = [
    { username: 'tuan.nguyenminh', gameId: lddm.id, roleCode: 'GAME_ADMIN' },
    { username: 'mai.vuphuong', gameId: vthl.id, roleCode: 'GAME_CONTENT_MANAGER' },
    { username: 'khanh.dangquoc', gameId: cto.id, roleCode: 'GAME_PLAYER_MODERATOR' },
  ];

  for (const item of assignments) {
    const user = users.get(item.username);
    const roleId = roleByCode.get(item.roleCode);
    if (user && roleId) {
      await prisma.gameRoleAssignment.upsert({
        where: {
          userId_gameId_roleId: {
            userId: user.id,
            gameId: item.gameId,
            roleId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          gameId: item.gameId,
          roleId,
          assignedAt: new Date('2026-06-01T09:00:00Z'),
        },
      });
    }
  }

  // 2. Dữ liệu Người chơi trong Game (GamePlayer)
  const playersInGames = [
    // Lục Địa Đam Mê
    { username: 'quang.tran', gameId: lddm.id, loginCount: 142, status: 'ACTIVE', firstLogin: '2026-06-05', lastLogin: '2026-09-17' },
    { username: 'anh.nguyenthuy', gameId: lddm.id, loginCount: 68, status: 'ACTIVE', firstLogin: '2026-06-10', lastLogin: '2026-09-16' },
    { username: 'dat.vutien', gameId: lddm.id, loginCount: 94, status: 'ACTIVE', firstLogin: '2026-06-08', lastLogin: '2026-09-17' },
    { username: 'bao.hoanggia', gameId: lddm.id, loginCount: 110, status: 'ACTIVE', firstLogin: '2026-06-06', lastLogin: '2026-09-16' },
    { username: 'kien.trantung', gameId: lddm.id, loginCount: 24, status: 'BLOCKED', firstLogin: '2026-07-01', lastLogin: '2026-09-10', reason: 'Nghi vấn phát sinh giao dịch không hợp lệ' },

    // Vương Triều Hỏa Long
    { username: 'quang.tran', gameId: vthl.id, loginCount: 85, status: 'ACTIVE', firstLogin: '2026-06-15', lastLogin: '2026-09-17' },
    { username: 'son.lehoang', gameId: vthl.id, loginCount: 42, status: 'ACTIVE', firstLogin: '2026-07-02', lastLogin: '2026-09-15' },
    { username: 'bao.hoanggia', gameId: vthl.id, loginCount: 79, status: 'ACTIVE', firstLogin: '2026-06-18', lastLogin: '2026-09-16' },

    // Thị Trấn Mây
    { username: 'anh.nguyenthuy', gameId: ttm.id, loginCount: 88, status: 'ACTIVE', firstLogin: '2026-07-01', lastLogin: '2026-09-17' },
    { username: 'linh.dangthuy', gameId: ttm.id, loginCount: 56, status: 'ACTIVE', firstLogin: '2026-07-05', lastLogin: '2026-09-15' },
    { username: 'thao.buiphuong', gameId: ttm.id, loginCount: 39, status: 'ACTIVE', firstLogin: '2026-07-12', lastLogin: '2026-09-14' },

    // Chiến Tuyến Orion
    { username: 'dat.vutien', gameId: cto.id, loginCount: 73, status: 'ACTIVE', firstLogin: '2026-07-08', lastLogin: '2026-09-17' },
    { username: 'phuc.voduc', gameId: cto.id, loginCount: 45, status: 'ACTIVE', firstLogin: '2026-07-15', lastLogin: '2026-09-16' },
    { username: 'long.vudinh', gameId: cto.id, loginCount: 18, status: 'BLOCKED', firstLogin: '2026-08-01', lastLogin: '2026-09-14', reason: 'Phát hiện can thiệp chỉnh sửa gói tin mạng trong trận đấu' },
  ];

  const adminUser = users.get('admin');

  for (const item of playersInGames) {
    const user = users.get(item.username);
    if (!user) continue;

    await prisma.gamePlayer.upsert({
      where: { userId_gameId: { userId: user.id, gameId: item.gameId } },
      update: {
        status: item.status === 'BLOCKED' ? 'PERMANENTLY_BANNED' : item.status,
        loginCount: item.loginCount,
        firstLoginAt: new Date(`${item.firstLogin}T08:00:00Z`),
        lastLoginAt: new Date(`${item.lastLogin}T20:30:00Z`),
        blockReason: item.reason ?? null,
        blockedAt: item.status === 'BLOCKED' ? new Date(`${item.lastLogin}T21:00:00Z`) : null,
        blockedByUserId: item.status === 'BLOCKED' ? (adminUser?.id ?? null) : null,
      },
      create: {
        userId: user.id,
        gameId: item.gameId,
        status: item.status === 'BLOCKED' ? 'PERMANENTLY_BANNED' : item.status,
        loginCount: item.loginCount,
        firstLoginAt: new Date(`${item.firstLogin}T08:00:00Z`),
        lastLoginAt: new Date(`${item.lastLogin}T20:30:00Z`),
        blockReason: item.reason ?? null,
        blockedAt: item.status === 'BLOCKED' ? new Date(`${item.lastLogin}T21:00:00Z`) : null,
        blockedByUserId: item.status === 'BLOCKED' ? (adminUser?.id ?? null) : null,
      },
    });
  }
}

/* ========================================================================== */
/* 6. PORTAL ANNOUNCEMENTS & EVENTS                                           */
/* ========================================================================== */
async function seedPortalContent(games: Map<string, { id: string }>) {
  const announcements = [
    {
      code: 'SEASON6_LDDM_2026',
      title: 'Bốn thế giới đang hoạt động',
      message: 'Khám phá bốn game đang hoạt động, theo dõi mùa mới và nhận tin vận hành từ ZENX GO.',
      ctaLabel: 'Khám phá game',
      ctaPath: '/events/season-6-luc-dia-dam-me',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      sortOrder: 1,
    },
    {
      code: 'DEV_TALK_01_2026',
      title: 'Sự kiện cuối tuần ZENX GO',
      message: 'Chuỗi hoạt động cuối tuần sắp diễn ra với phần thưởng mùa và nhiệm vụ cộng đồng từ các game.',
      ctaLabel: 'Xem sự kiện',
      ctaPath: '/events/dev-talk-01-zenx-go',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-15T00:00:00.000Z'),
      endsAt: new Date('2026-10-15T23:59:59.000Z'),
      sortOrder: 2,
    },
  ] as const;

  for (const announcement of announcements) {
    await prisma.portalAnnouncement.upsert({
      where: { code: announcement.code },
      update: announcement,
      create: announcement,
    });
  }

  const lddmId = games.get('LDDM')?.id ?? null;
  const vthlId = games.get('VTHL')?.id ?? null;
  const ttmId = games.get('TTM')?.id ?? null;
  const ctoId = games.get('CTO')?.id ?? null;

  const events = [
    {
      title: 'Season 6 Lục Địa Đam Mê',
      slug: 'season-6-luc-dia-dam-me',
      excerpt: 'Season 6 đang mở với nhiệm vụ bang hội, phần thưởng tân thủ và chuỗi hoạt động cộng đồng.',
      content:
        '# Season 6 Lục Địa Đam Mê\n\nSeason 6 đã mở cửa trên toàn Lục Địa với nhiệm vụ bang hội, công thành chiến và phần thưởng theo mùa.\n\n- 1,000 ZENX Coin tân thủ\n- Cánh Ánh Sáng mùa hiện tại\n- Nhiệm vụ cộng đồng theo tuần',
      coverImageUrl: '/images/games/luc-dia-dam-me/hero.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Season 6 Lục Địa Đam Mê | ZENX GO',
      seoDescription: 'Theo dõi hoạt động Season 6, phần thưởng và nhiệm vụ cộng đồng của Lục Địa Đam Mê.',
      gameId: lddmId,
    },
    {
      title: 'Tuần lễ ra mắt ZENX GO',
      slug: 'zenx-go-game-hub-chinh-thuc-mo-cua',
      excerpt: 'Tuần lễ ra mắt kết nối cộng đồng với bốn thế giới game, lịch sự kiện và các tiện ích tài khoản ZENX GO.',
      content:
        '# Tuần lễ ra mắt ZENX GO\n\nGame Hub là điểm đến chung để khám phá bốn game đang hoạt động, theo dõi tin tức và quản lý tài khoản trên mọi thế giới.',
      coverImageUrl: '/images/image.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-24T00:00:00.000Z'),
      endsAt: null,
      publishedAt: new Date('2026-08-24T00:00:00.000Z'),
      seoTitle: 'ZENX GO Game Hub',
      seoDescription: 'Khám phá hệ sinh thái game ZENX GO.',
      gameId: null,
    },
    {
      title: 'Lễ hội Khinh khí cầu Thị Trấn Mây',
      slug: 'le-hoi-khinh-khi-cau-thi-tran-may',
      excerpt: 'Lên khinh khí cầu, ghé thăm hàng xóm và đổi quà trang trí trong lễ hội cuối tuần trên các đảo mây.',
      content:
        '# Lễ hội Khinh khí cầu Thị Trấn Mây\n\nLễ hội đưa cư dân lên những chuyến khinh khí cầu nối liền quảng trường, khu vườn và các đảo hàng xóm.',
      coverImageUrl: '/images/games/thi-tran-may/detail-v1/town-square.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-30T23:59:59.000Z'),
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      seoTitle: 'Lễ hội Khinh khí cầu Thị Trấn Mây',
      seoDescription: 'Tham gia lễ hội Khinh khí cầu và nhận quà trang trí tại Thị Trấn Mây.',
      gameId: ttmId,
    },
    {
      title: 'Mùa Liên Minh Hỏa Long',
      slug: 'khai-hoa-lien-minh-hoa-long',
      excerpt: 'Các vương triều tranh quyền trên bản đồ liên vùng với mục tiêu liên minh, tiếp tế và phòng thủ Hoàng Thành.',
      content:
        '# Mùa Liên Minh Hỏa Long\n\nCác vương triều sẽ hội quân trên bản đồ liên vùng, phối hợp tuyến tiếp tế và bảo vệ Hoàng Thành qua từng vòng giao tranh.',
      coverImageUrl: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-09-20T00:00:00.000Z'),
      endsAt: new Date('2026-10-15T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Mùa Liên Minh Hỏa Long',
      seoDescription: 'Tham gia Mùa Liên Minh và chiến đấu cùng Long Thần hệ Hỏa tại Vương Triều Hỏa Long.',
      gameId: vthlId,
    },
    {
      title: 'Ranked Season 1: Vành đai Orion',
      slug: 'orion-training-simulation',
      excerpt: 'Ranked Season 1 mở bảng xếp hạng theo mùa và những mục tiêu xoay vòng cho các biệt đội Orion.',
      content:
        '# Ranked Season 1: Vành đai Orion\n\nRanked Season 1 đưa các biệt đội vào Vành đai Orion với mục tiêu xoay vòng và bảng xếp hạng cập nhật theo tuần.',
      coverImageUrl: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp',
      status: 'PUBLISHED',
      startsAt: new Date('2026-10-05T00:00:00.000Z'),
      endsAt: new Date('2026-10-31T23:59:59.000Z'),
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      seoTitle: 'Ranked Season 1: Vành đai Orion',
      seoDescription: 'Theo dõi lịch Ranked Season 1 và phần thưởng mùa của Chiến Tuyến Orion.',
      gameId: ctoId,
    },
  ];

  for (const event of events) {
    await prisma.gameEvent.upsert({ where: { slug: event.slug }, update: event, create: event });
  }
}

/* ========================================================================== */
/* 7. COIN PACKAGES                                                           */
/* ========================================================================== */
async function seedCoinPackages() {
  const packages = [
    ['ZENX_1000', 'ZENX 1,000', 20000n, 1000n, 1],
    ['ZENX_2500', 'ZENX 2,500', 50000n, 2500n, 2],
    ['ZENX_5000', 'ZENX 5,000', 100000n, 5000n, 3],
    ['ZENX_12500', 'ZENX 12,500', 200000n, 12500n, 4],
    ['ZENX_25000', 'ZENX 25,000', 500000n, 25000n, 5],
    ['ZENX_50000', 'ZENX 50,000', 1000000n, 50000n, 6],
    ['ZENX_100000', 'ZENX 100,000', 2000000n, 100000n, 7],
  ] as const;

  const packageMap = new Map<string, { id: string; code: string; name: string; priceVnd: bigint; coinAmount: bigint }>();

  for (const [code, name, priceVnd, coinAmount, sortOrder] of packages) {
    const pkg = await prisma.coinPackage.upsert({
      where: { code },
      update: { name, priceVnd, coinAmount, sortOrder },
      create: { code, name, priceVnd, coinAmount, sortOrder },
    });
    packageMap.set(code, { id: pkg.id, code: pkg.code, name: pkg.name, priceVnd: pkg.priceVnd, coinAmount: pkg.coinAmount });
  }

  return packageMap;
}

/* ========================================================================== */
/* 8. FINANCE & PAYMENTS & WALLET TRANSACTIONS                                */
/* ========================================================================== */
async function seedFinanceAndTransactions({
  users,
  packages,
}: {
  users: Map<string, { id: string }>;
  packages: Map<string, { id: string; priceVnd: bigint; coinAmount: bigint; name: string }>;
}) {
  const paymentDefinitions = [
    // --- Giao dịch Thành công (SUCCESS) ---
    {
      paymentNo: 'PAY260815001',
      username: 'quang.tran',
      packageCode: 'ZENX_50000',
      provider: 'VNPAY',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.SUCCESS,
      date: '2026-08-15T10:20:00Z',
      providerTransId: 'VNP1482910482',
    },
    {
      paymentNo: 'PAY260820002',
      username: 'anh.nguyenthuy',
      packageCode: 'ZENX_25000',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.SUCCESS,
      date: '2026-08-20T14:15:00Z',
      providerTransId: 'MM26082014152',
    },
    {
      paymentNo: 'PAY260825003',
      username: 'quang.tran',
      packageCode: 'ZENX_100000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-08-25T19:40:00Z',
      providerTransId: 'MB26082519401',
    },
    {
      paymentNo: 'PAY260830004',
      username: 'dat.vutien',
      packageCode: 'ZENX_12500',
      provider: 'ZALOPAY',
      method: PaymentMethod.ZALOPAY,
      status: PaymentStatus.SUCCESS,
      date: '2026-08-30T09:05:00Z',
      providerTransId: 'ZLP26083009054',
    },
    {
      paymentNo: 'PAY260901005',
      username: 'bao.hoanggia',
      packageCode: 'ZENX_100000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-01T08:30:00Z',
      providerTransId: 'VCB26090108309',
    },
    {
      paymentNo: 'PAY260903006',
      username: 'linh.dangthuy',
      packageCode: 'ZENX_25000',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-03T11:45:00Z',
      providerTransId: 'MM26090311451',
    },
    {
      paymentNo: 'PAY260905007',
      username: 'quang.tran',
      packageCode: 'ZENX_100000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-05T20:10:00Z',
      providerTransId: 'MB26090520108',
    },
    {
      paymentNo: 'PAY260907008',
      username: 'son.lehoang',
      packageCode: 'ZENX_25000',
      provider: 'VNPAY',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-07T16:22:00Z',
      providerTransId: 'VNP1489012384',
    },
    {
      paymentNo: 'PAY260909009',
      username: 'dat.vutien',
      packageCode: 'ZENX_25000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-09T14:30:00Z',
      providerTransId: 'MB26090914302',
    },
    {
      paymentNo: 'PAY260911010',
      username: 'bao.hoanggia',
      packageCode: 'ZENX_50000',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-11T21:00:00Z',
      providerTransId: 'MM26091121005',
    },
    {
      paymentNo: 'PAY260913011',
      username: 'thao.buiphuong',
      packageCode: 'ZENX_5000',
      provider: 'ZALOPAY',
      method: PaymentMethod.ZALOPAY,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-13T10:15:00Z',
      providerTransId: 'ZLP26091310158',
    },
    {
      paymentNo: 'PAY260914012',
      username: 'quang.tran',
      packageCode: 'ZENX_50000',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-14T18:40:00Z',
      providerTransId: 'MM26091418402',
    },
    {
      paymentNo: 'PAY260915013',
      username: 'anh.nguyenthuy',
      packageCode: 'ZENX_50000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-15T09:20:00Z',
      providerTransId: 'VCB26091509201',
    },
    {
      paymentNo: 'PAY260916014',
      username: 'phuc.voduc',
      packageCode: 'ZENX_2500',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-16T12:00:00Z',
      providerTransId: 'MM26091612009',
    },
    {
      paymentNo: 'PAY260917015',
      username: 'linh.dangthuy',
      packageCode: 'ZENX_12500',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.SUCCESS,
      date: '2026-09-17T08:15:00Z',
      providerTransId: 'MB26091708154',
    },

    // --- Giao dịch Đang xử lý / Chờ (PENDING / CREATED) ---
    {
      paymentNo: 'PAY260917016',
      username: 'dat.vutien',
      packageCode: 'ZENX_25000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.PENDING,
      date: '2026-09-17T14:30:00Z',
      providerTransId: 'MB26091714309',
    },
    {
      paymentNo: 'PAY260917017',
      username: 'quang.tran',
      packageCode: 'ZENX_50000',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.PENDING,
      date: '2026-09-17T19:40:00Z',
      providerTransId: 'MM26091719401',
    },
    {
      paymentNo: 'PAY260917018',
      username: 'bao.hoanggia',
      packageCode: 'ZENX_12500',
      provider: 'ZALOPAY',
      method: PaymentMethod.ZALOPAY,
      status: PaymentStatus.CREATED,
      date: '2026-09-17T22:15:00Z',
      providerTransId: null,
    },

    // --- Giao dịch Thất bại (FAILED) ---
    {
      paymentNo: 'PAY260915019',
      username: 'son.lehoang',
      packageCode: 'ZENX_1000',
      provider: 'CARD',
      method: PaymentMethod.CARD,
      status: PaymentStatus.FAILED,
      date: '2026-09-15T15:10:00Z',
      providerTransId: null,
    },
    {
      paymentNo: 'PAY260916020',
      username: 'kien.trantung',
      packageCode: 'ZENX_5000',
      provider: 'VNPAY',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.FAILED,
      date: '2026-09-16T11:20:00Z',
      providerTransId: null,
    },

    // --- Giao dịch Đã hoàn tiền (REFUNDED) ---
    {
      paymentNo: 'PAY260910021',
      username: 'son.lehoang',
      packageCode: 'ZENX_25000',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.REFUNDED,
      date: '2026-09-10T13:00:00Z',
      providerTransId: 'MB26091013008',
    },
    {
      paymentNo: 'PAY260906022',
      username: 'anh.nguyenthuy',
      packageCode: 'ZENX_12500',
      provider: 'MOMO',
      method: PaymentMethod.MOMO,
      status: PaymentStatus.REFUNDED,
      date: '2026-09-06T17:35:00Z',
      providerTransId: 'MM26090617354',
    },

    // --- Giao dịch Hết hạn (EXPIRED) ---
    {
      paymentNo: 'PAY260914023',
      username: 'thao.buiphuong',
      packageCode: 'ZENX_2500',
      provider: 'VIETQR',
      method: PaymentMethod.VIETQR,
      status: PaymentStatus.EXPIRED,
      date: '2026-09-14T09:00:00Z',
      providerTransId: null,
    },
  ];

  for (const item of paymentDefinitions) {
    const user = users.get(item.username);
    const pkg = packages.get(item.packageCode);
    if (!user || !pkg) continue;

    const createdAt = new Date(item.date);
    const isSuccess = item.status === PaymentStatus.SUCCESS;
    const isRefunded = item.status === PaymentStatus.REFUNDED;
    const paidAt = isSuccess || isRefunded ? new Date(createdAt.getTime() + 120_000) : null;
    const expiredAt = new Date(createdAt.getTime() + 900_000);

    const payment = await prisma.payment.upsert({
      where: { paymentNo: item.paymentNo },
      update: {
        status: item.status,
        provider: item.provider,
        paymentMethod: item.method,
        providerTransactionId: item.providerTransId,
        paidAt,
        expiredAt,
      },
      create: {
        paymentNo: item.paymentNo,
        userId: user.id,
        coinPackageId: pkg.id,
        amountVnd: pkg.priceVnd,
        coinAmount: pkg.coinAmount,
        provider: item.provider,
        paymentMethod: item.method,
        providerTransactionId: item.providerTransId,
        status: item.status,
        createdAt,
        paidAt,
        expiredAt,
      },
    });

    // Lấy thông tin ví của người dùng
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) continue;

    // Ghi nhận WalletTransaction tương ứng nếu thanh toán thành công hoặc hoàn tiền
    if (isSuccess || isRefunded) {
      const txNo = `TX${item.paymentNo.slice(3)}`;
      const currentBalance = wallet.balance;
      const balanceBefore = currentBalance >= pkg.coinAmount ? currentBalance - pkg.coinAmount : 0n;

      await prisma.walletTransaction.upsert({
        where: { transactionNo: txNo },
        update: {
          status: WalletTransactionStatus.SUCCESS,
          amount: pkg.coinAmount,
        },
        create: {
          transactionNo: txNo,
          walletId: wallet.id,
          userId: user.id,
          paymentId: payment.id,
          type: WalletTransactionType.TOPUP,
          amount: pkg.coinAmount,
          balanceBefore,
          balanceAfter: currentBalance,
          status: WalletTransactionStatus.SUCCESS,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          idempotencyKey: `topup_${payment.id}`,
          description: `Nạp ${pkg.name} qua cổng ${item.provider}`,
          createdAt: paidAt ?? createdAt,
          completedAt: paidAt ?? createdAt,
        },
      });

      // Nếu trạng thái là REFUNDED, ghi thêm transaction hoàn tiền
      if (isRefunded) {
        const refundTxNo = `RF${item.paymentNo.slice(3)}`;
        await prisma.walletTransaction.upsert({
          where: { transactionNo: refundTxNo },
          update: {},
          create: {
            transactionNo: refundTxNo,
            walletId: wallet.id,
            userId: user.id,
            paymentId: null,
            type: WalletTransactionType.REFUND,
            amount: pkg.coinAmount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance >= pkg.coinAmount ? currentBalance - pkg.coinAmount : 0n,
            status: WalletTransactionStatus.SUCCESS,
            referenceType: 'PAYMENT_REFUND',
            referenceId: payment.id,
            idempotencyKey: `refund_${payment.id}`,
            description: `Hoàn tiền nạp ${pkg.name} theo yêu cầu đối soát`,
            createdAt: new Date(createdAt.getTime() + 86_400_000),
            completedAt: new Date(createdAt.getTime() + 86_400_000),
          },
        });
      }
    }
  }

  // --- Các Giao dịch Tiêu Coin Trong Game (DEBIT & PURCHASE) ---
  const inGamePurchases = [
    {
      username: 'quang.tran',
      amount: 50_000n,
      desc: 'Nâng cấp Rương Trang Bị Thần Thoại - Lục Địa Đam Mê',
      txNo: 'TXG26091401',
      date: '2026-09-14T21:00:00Z',
    },
    {
      username: 'quang.tran',
      amount: 75_000n,
      desc: 'Gia hạn Hội Viên Hoàng Gia 90 Ngày - Vương Triều Hỏa Long',
      txNo: 'TXG26091502',
      date: '2026-09-15T19:30:00Z',
    },
    {
      username: 'dat.vutien',
      amount: 20_000n,
      desc: 'Mua Battle Pass Ranked Season 1 - Chiến Tuyến Orion',
      txNo: 'TXG26091603',
      date: '2026-09-16T14:15:00Z',
    },
    {
      username: 'anh.nguyenthuy',
      amount: 5_000n,
      desc: 'Đổi Vé Khinh Khí Cầu Mùa Lễ Hội - Thị Trấn Mây',
      txNo: 'TXG26091604',
      date: '2026-09-16T16:40:00Z',
    },
    {
      username: 'bao.hoanggia',
      amount: 25_000n,
      desc: 'Mở khóa Gói Tân Thủ Hoàng Kim - Vương Triều Hỏa Long',
      txNo: 'TXG26091705',
      date: '2026-09-17T11:00:00Z',
    },
    {
      username: 'son.lehoang',
      amount: 15_000n,
      desc: 'Mua Thẻ Tháng VIP Season 6 - Lục Địa Đam Mê',
      txNo: 'TXG26091706',
      date: '2026-09-17T15:45:00Z',
    },
  ];

  for (const item of inGamePurchases) {
    const user = users.get(item.username);
    if (!user) continue;
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) continue;

    const balanceBefore = wallet.balance + item.amount;
    await prisma.walletTransaction.upsert({
      where: { transactionNo: item.txNo },
      update: {},
      create: {
        transactionNo: item.txNo,
        walletId: wallet.id,
        userId: user.id,
        type: WalletTransactionType.DEBIT,
        amount: item.amount,
        balanceBefore,
        balanceAfter: wallet.balance,
        status: WalletTransactionStatus.SUCCESS,
        referenceType: 'GAME_PURCHASE',
        referenceId: `purchase_${item.txNo}`,
        idempotencyKey: `ingame_${item.txNo}`,
        description: item.desc,
        createdAt: new Date(item.date),
        completedAt: new Date(item.date),
      },
    });
  }
}

/* ========================================================================== */
/* 9. SUPPORT CENTER & TICKETS & MESSAGES                                     */
/* ========================================================================== */
async function seedSupportSystem({
  users,
  games,
}: {
  users: Map<string, { id: string }>;
  games: Map<string, { id: string }>;
}) {
  const categories = [
    {
      code: 'ACCOUNT',
      name: 'Tài khoản',
      sortOrder: 1,
      faqs: [
        ['Làm thế nào để đổi mật khẩu?', 'Vào Tài khoản → Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới, sau đó xác nhận thay đổi.'],
        ['Tôi quên mật khẩu thì phải làm sao?', 'Chọn “Quên mật khẩu?” tại màn hình đăng nhập. Nhập email đã đăng ký và làm theo hướng dẫn để đặt lại mật khẩu.'],
        ['Làm thế nào để cập nhật thông tin cá nhân?', 'Vào Tài khoản → Thông tin cá nhân để cập nhật họ tên, ngày sinh, giới tính, thành phố và địa chỉ.'],
        ['Tôi có thể liên kết Google hoặc Facebook không?', 'Có. Vào Tài khoản → Liên kết tài khoản, chọn nền tảng muốn liên kết và hoàn tất xác thực.'],
      ],
    },
    {
      code: 'TOPUP',
      name: 'Nạp tiền',
      sortOrder: 2,
      faqs: [
        ['Nạp ZENX Coin bằng cách nào?', 'Vào Nạp Coin, chọn gói ZENX Coin và phương thức thanh toán phù hợp, sau đó hoàn tất hướng dẫn của cổng thanh toán.'],
        ['Thanh toán thành công nhưng chưa nhận được Coin?', 'Kiểm tra Lịch sử giao dịch trước. Nếu giao dịch vẫn chưa được cập nhật, hãy tạo yêu cầu hỗ trợ và cung cấp mã payment.'],
        ['Tôi có thể xem lại các lần nạp tiền ở đâu?', 'Vào Ví ZENX → Lịch sử giao dịch để xem số tiền, trạng thái, mã giao dịch và thông tin thanh toán.'],
      ],
    },
    {
      code: 'WALLET',
      name: 'Ví ZENX',
      sortOrder: 3,
      faqs: [
        ['Số dư ZENX Coin được cập nhật khi nào?', 'Số dư được cập nhật sau khi giao dịch được hệ thống xác nhận thành công. Bạn có thể tải lại trang Ví để kiểm tra.'],
        ['Làm sao xem chi tiết một giao dịch?', 'Vào Ví ZENX → Lịch sử giao dịch và chọn giao dịch muốn xem để mở bảng chi tiết.'],
        ['Nếu phát hiện giao dịch bất thường thì phải làm gì?', 'Không chia sẻ mật khẩu hoặc mã xác thực. Hãy tạo yêu cầu hỗ trợ ngay và ghi rõ mã giao dịch bất thường.'],
      ],
    },
    {
      code: 'OTHER',
      name: 'Khác',
      sortOrder: 4,
      faqs: [
        ['Làm thế nào để gửi yêu cầu hỗ trợ?', 'Chọn “Tạo yêu cầu hỗ trợ” trên trang Hỗ trợ, đăng nhập nếu được yêu cầu, chọn danh mục và mô tả vấn đề của bạn.'],
        ['Tôi có thể theo dõi yêu cầu hỗ trợ ở đâu?', 'Vào Tài khoản → Hỗ trợ để xem danh sách ticket, trạng thái và nội dung từng yêu cầu.'],
      ],
    },
  ] as const;

  const categoryMap = new Map<string, string>();
  for (const categoryData of categories) {
    const category = await prisma.supportCategory.upsert({
      where: { code: categoryData.code },
      update: { name: categoryData.name, sortOrder: categoryData.sortOrder, status: SupportStatus.ACTIVE },
      create: { code: categoryData.code, name: categoryData.name, sortOrder: categoryData.sortOrder, status: SupportStatus.ACTIVE },
    });
    categoryMap.set(categoryData.code, category.id);

    for (const [sortOrder, [question, answer]] of categoryData.faqs.entries()) {
      await prisma.supportFaq.upsert({
        where: { categoryId_question: { categoryId: category.id, question } },
        update: { answer, sortOrder, status: SupportStatus.ACTIVE },
        create: { categoryId: category.id, question, answer, sortOrder, status: SupportStatus.ACTIVE },
      });
    }
  }

  // --- Seed Danh Sách Tickets Thực Tế ---
  const lanStaff = users.get('lan.lengoc')!;
  const namStaff = users.get('nam.tranhoang')!;
  const lddmId = games.get('LDDM')?.id ?? null;
  const vthlId = games.get('VTHL')?.id ?? null;
  const ttmId = games.get('TTM')?.id ?? null;
  const ctoId = games.get('CTO')?.id ?? null;

  const tickets = [
    {
      ticketNo: 'TCK-2026-00101',
      username: 'dat.vutien',
      categoryCode: 'TOPUP',
      gameId: null,
      subject: 'Nạp gói ZENX 25,000 qua VietQR đã trừ tiền tài khoản ngân hàng nhưng chưa nhận được Coin',
      description:
        'Chào ban hỗ trợ, khoảng 14:30 chiều nay tôi có quét mã VietQR chuyển khoản 500,000đ mua gói ZENX 25,000. Tiền trong tài khoản MBBank đã trừ thành công với đúng nội dung thanh toán nhưng số dư trong ví vẫn chưa tăng. Nhờ hỗ trợ kiểm tra giúp tôi.',
      status: SupportTicketStatus.RESOLVED,
      priority: SupportTicketPriority.URGENT,
      assigneeId: lanStaff.id,
      createdAt: '2026-09-15T14:45:00Z',
      resolvedAt: '2026-09-15T15:15:00Z',
      messages: [
        {
          author: 'dat.vutien',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Tôi đã chuyển khoản lúc 14:30 qua mã thanh toán PAY260909009. Ảnh biên lai đã gửi qua hệ thống internet banking. Mong ban quản trị đối soát sớm.',
          date: '2026-09-15T14:45:00Z',
        },
        {
          author: 'lan.lengoc',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.INTERNAL,
          body: 'Đã kiểm tra cổng VietQR MBBank, lệnh thanh toán bị delay webhook 15 phút. Đã đối soát khớp mã provider MB26090914302.',
          date: '2026-09-15T15:00:00Z',
        },
        {
          author: 'lan.lengoc',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn Đạt, đội ngũ hỗ trợ đã kiểm tra và xác nhận giao dịch thành công. Hệ thống vừa cập nhật 25,000 ZENX Coin vào ví của bạn. Bạn vui lòng tải lại trang Ví để kiểm tra số dư nhé!',
          date: '2026-09-15T15:10:00Z',
        },
        {
          author: 'dat.vutien',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Cảm ơn bạn, tôi đã nhận đủ số dư trong ví rồi.',
          date: '2026-09-15T15:14:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00102',
      username: 'linh.dangthuy',
      categoryCode: 'ACCOUNT',
      gameId: null,
      subject: 'Yêu cầu hỗ trợ cập nhật số điện thoại xác thực tài khoản do mất SIM cũ',
      description:
        'Số điện thoại đăng ký ban đầu của tôi là 0905777888 hiện đã bị khóa và không nhận được mã OTP xác thực. Tôi muốn cập nhật sang số điện thoại mới để thuận tiện quản lý tài khoản.',
      status: SupportTicketStatus.IN_PROGRESS,
      priority: SupportTicketPriority.HIGH,
      assigneeId: namStaff.id,
      createdAt: '2026-09-16T09:20:00Z',
      resolvedAt: null,
      messages: [
        {
          author: 'linh.dangthuy',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn, SIM cũ của mình bị hỏng không làm lại được. Mình có đầy đủ thông tin CCCD đã xác minh trên hệ thống.',
          date: '2026-09-16T09:20:00Z',
        },
        {
          author: 'nam.tranhoang',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn Linh, để đảm bảo an toàn thông tin, chuyên viên cần đối chiếu số CCCD và câu hỏi bảo mật của tài khoản. Bạn vui lòng trả lời tin nhắn này với thông tin 4 số cuối CCCD và câu trả lời bảo mật nhé.',
          date: '2026-09-16T10:00:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00103',
      username: 'bao.hoanggia',
      categoryCode: 'OTHER',
      gameId: lddmId,
      subject: 'Lỗi gián đoạn kết nối máy chủ khi tham gia hoạt động Công thành chiến',
      description:
        'Tối qua bang của tôi tham gia Công thành chiến lúc 20:15 thì nhiều thành viên đồng loạt bị ngắt kết nối với mã lỗi 10054. Nhờ ban kỹ thuật kiểm tra lại đường truyền cụm máy chủ Season 6.',
      status: SupportTicketStatus.WAITING_USER,
      priority: SupportTicketPriority.NORMAL,
      assigneeId: lanStaff.id,
      createdAt: '2026-09-16T22:30:00Z',
      resolvedAt: null,
      messages: [
        {
          author: 'bao.hoanggia',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Cả tổ đội 5 người của tôi đều bị văng cùng một lúc lúc 20:15 khi đang chiếm cứ điểm trung tâm.',
          date: '2026-09-16T22:30:00Z',
        },
        {
          author: 'lan.lengoc',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn Bảo, đội ngũ kỹ thuật Lục Địa Đam Mê đã rà soát nhật ký máy chủ và phát hiện một đợt biến động kết nối mạng cục bộ. Bạn có thể cung cấp tên nhân vật và server cụ thể của các thành viên để chúng mình gửi quà bù đắp hoạt động không ạ?',
          date: '2026-09-17T08:45:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00104',
      username: 'long.vudinh',
      categoryCode: 'ACCOUNT',
      gameId: ctoId,
      subject: 'Khiếu nại về việc tài khoản bị khóa trong trận đấu Ranked Chiến Tuyến Orion',
      description:
        'Tôi đang tham gia trận đấu bình thường lúc 14:00 ngày 14/09 thì bị ngắt kết nối và hiển thị tài khoản bị khóa. Tôi cam kết không sử dụng bất kỳ phần mềm gian lận nào, đề nghị ban quản trị kiểm tra lại replay.',
      status: SupportTicketStatus.NEW,
      priority: SupportTicketPriority.HIGH,
      assigneeId: null,
      createdAt: '2026-09-17T11:00:00Z',
      resolvedAt: null,
      messages: [
        {
          author: 'long.vudinh',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Tôi chơi tại nhà riêng, máy tính cá nhân không cài đặt tool can thiệp. Đề nghị ban quản trị Orion rà soát lại nhật ký trận đấu chiều ngày 14/09.',
          date: '2026-09-17T11:00:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00105',
      username: 'thao.buiphuong',
      categoryCode: 'WALLET',
      gameId: null,
      subject: 'Tư vấn hạn mức nạp ZENX Coin và phương thức thanh toán ví điện tử MoMo',
      description:
        'Cho mình hỏi tài khoản mới đăng ký thì hạn mức nạp Coin tối đa trong ngày là bao nhiêu và nạp qua MoMo có bị trừ thêm phí giao dịch không?',
      status: SupportTicketStatus.RESOLVED,
      priority: SupportTicketPriority.LOW,
      assigneeId: namStaff.id,
      createdAt: '2026-09-14T10:00:00Z',
      resolvedAt: '2026-09-14T10:30:00Z',
      messages: [
        {
          author: 'thao.buiphuong',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Mình muốn nạp gói 500,000đ nhưng muốn biết rõ phí nạp trước khi quét mã.',
          date: '2026-09-14T10:00:00Z',
        },
        {
          author: 'nam.tranhoang',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn Thảo, việc nạp ZENX Coin qua cổng MoMo hoàn toàn miễn phí giao dịch. Bạn thanh toán đúng giá trị hiển thị trên gói. Hạn mức thanh toán phụ thuộc vào mức định danh tài khoản MoMo của bạn (tối đa 20,000,000đ/ngày).',
          date: '2026-09-14T10:25:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00106',
      username: 'quang.tran',
      categoryCode: 'TOPUP',
      gameId: vthlId,
      subject: 'Thanh toán gói ZENX 50,000 báo thành công nhưng trạng thái cổng MoMo hiển thị đang treo',
      description:
        'Tôi quét mã thanh toán 1,000,000đ gói ZENX 50,000 lúc 19:40 ngày hôm nay. Ứng dụng MoMo đã báo trừ tiền thành công nhưng màn hình web vẫn xoay đang chờ phản hồi từ đối tác.',
      status: SupportTicketStatus.IN_PROGRESS,
      priority: SupportTicketPriority.URGENT,
      assigneeId: lanStaff.id,
      createdAt: '2026-09-17T19:50:00Z',
      resolvedAt: null,
      messages: [
        {
          author: 'quang.tran',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Mã đơn thanh toán trên web là PAY260917017. Nhờ bạn đối soát ngay để tôi kịp tham gia sự kiện đấu giá lúc 20:30.',
          date: '2026-09-17T19:50:00Z',
        },
        {
          author: 'lan.lengoc',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào anh Quang, chuyên viên đã nhận được yêu cầu và đang tra soát mã giao dịch với đại diện kỹ thuật MoMo. Chúng em sẽ cập nhật Coin cho anh trong ít phút tới.',
          date: '2026-09-17T20:02:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00107',
      username: 'anh.nguyenthuy',
      categoryCode: 'OTHER',
      gameId: ttmId,
      subject: 'Góp ý mở rộng tính năng trang trí nhà vườn và kết nối bạn bè đảo lân cận',
      description:
        'Mình rất thích game Thị Trấn Mây, mong ban phát triển có thể bổ sung thêm tính năng cho phép bạn bè cùng nhau chăm sóc khu vườn chung và gửi quà lưu niệm mỗi tuần.',
      status: SupportTicketStatus.CLOSED,
      priority: SupportTicketPriority.LOW,
      assigneeId: namStaff.id,
      createdAt: '2026-09-12T15:00:00Z',
      resolvedAt: '2026-09-13T09:00:00Z',
      messages: [
        {
          author: 'anh.nguyenthuy',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Mình gửi kèm một vài ý tưởng về vật phẩm trang trí mới cho mùa Lễ hội Khinh khí cầu.',
          date: '2026-09-12T15:00:00Z',
        },
        {
          author: 'nam.tranhoang',
          type: SupportMessageAuthorType.STAFF,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Chào bạn Thùy Anh, cảm ơn bạn đã đóng góp những ý tưởng rất đáng yêu! Ban vận hành đã ghi nhận và chuyển tiếp sang bộ phận phát triển để cân nhắc trong bản cập nhật tới.',
          date: '2026-09-13T09:00:00Z',
        },
      ],
    },
    {
      ticketNo: 'TCK-2026-00108',
      username: 'phuc.voduc',
      categoryCode: 'ACCOUNT',
      gameId: null,
      subject: 'Đề nghị hỗ trợ hủy liên kết tài khoản Google cũ để liên kết tài khoản mới',
      description:
        'Hộp thư Google liên kết hiện tại của tôi sắp ngưng hoạt động. Tôi muốn chuyển liên kết đăng nhập sang hòm thư Google cá nhân mới.',
      status: SupportTicketStatus.NEW,
      priority: SupportTicketPriority.NORMAL,
      assigneeId: null,
      createdAt: '2026-09-17T16:30:00Z',
      resolvedAt: null,
      messages: [
        {
          author: 'phuc.voduc',
          type: SupportMessageAuthorType.CUSTOMER,
          visibility: SupportMessageVisibility.PUBLIC,
          body: 'Nhờ ban quản trị hướng dẫn quy trình hủy liên kết tài khoản Google an toàn.',
          date: '2026-09-17T16:30:00Z',
        },
      ],
    },
  ];

  for (const item of tickets) {
    const user = users.get(item.username);
    const categoryId = categoryMap.get(item.categoryCode);
    if (!user || !categoryId) continue;

    const createdAt = new Date(item.createdAt);
    const resolvedAt = item.resolvedAt ? new Date(item.resolvedAt) : null;
    const closedAt = item.status === SupportTicketStatus.CLOSED ? resolvedAt : null;

    const ticket = await prisma.supportTicket.upsert({
      where: { ticketNo: item.ticketNo },
      update: {
        status: item.status,
        priority: item.priority,
        assigneeUserId: item.assigneeId,
        subject: item.subject,
        description: item.description,
        resolvedAt,
        closedAt,
      },
      create: {
        ticketNo: item.ticketNo,
        userId: user.id,
        categoryId,
        gameId: item.gameId,
        subject: item.subject,
        description: item.description,
        status: item.status,
        priority: item.priority,
        assigneeUserId: item.assigneeId,
        createdAt,
        updatedAt: createdAt,
        lastActivityAt: createdAt,
        resolvedAt,
        closedAt,
      },
    });

    await prisma.supportTicketMessage.deleteMany({ where: { ticketId: ticket.id } });

    for (const msg of item.messages) {
      const authorUser = users.get(msg.author);
      if (!authorUser) continue;
      await prisma.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          authorUserId: authorUser.id,
          authorType: msg.type,
          visibility: msg.visibility,
          body: msg.body,
          createdAt: new Date(msg.date),
        },
      });
    }

    if (item.assigneeId) {
      await prisma.supportTicketReadState.upsert({
        where: { ticketId_userId: { ticketId: ticket.id, userId: item.assigneeId } },
        update: { lastReadAt: new Date() },
        create: { ticketId: ticket.id, userId: item.assigneeId, lastReadAt: new Date() },
      });
    }
  }
}

/* ========================================================================== */
/* 10. USER ACTIVITY LOGS & AUTHORIZATION AUDIT LOGS                           */
/* ========================================================================== */
async function seedActivityAndAuditLogs({
  users,
  games,
}: {
  users: Map<string, { id: string }>;
  games: Map<string, { id: string }>;
}) {
  const adminUser = users.get('admin')!;
  const quangUser = users.get('quang.tran')!;
  const datUser = users.get('dat.vutien')!;
  const lanUser = users.get('lan.lengoc')!;
  const longUser = users.get('long.vudinh')!;
  const lddmId = games.get('LDDM')?.id ?? null;
  const ctoId = games.get('CTO')?.id ?? null;

  // Dọn dẹp logs cũ của các users được seed để đảm bảo tính idempotent
  const seededUserIds = Array.from(users.values()).map((u) => u.id);
  await prisma.userActivityLog.deleteMany({
    where: { userId: { in: seededUserIds } },
  });
  await prisma.authorizationAuditLog.deleteMany({
    where: { actorUserId: adminUser.id },
  });
  await prisma.refreshSession.deleteMany({
    where: { userId: { in: seededUserIds } },
  });

  // 1. Activity Logs (Lịch sử hoạt động người dùng)
  const activityLogs = [
    {
      userId: quangUser.id,
      category: 'LOGIN',
      eventType: 'AUTH_LOGIN',
      outcome: 'SUCCESS',
      actorType: 'USER',
      ipAddress: '14.161.42.10',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      deviceLabel: 'Chrome · macOS · Desktop',
      createdAt: new Date('2026-09-17T15:20:00Z'),
    },
    {
      userId: quangUser.id,
      category: 'SECURITY',
      eventType: 'UPDATE_SENSITIVE_PROFILE',
      outcome: 'SUCCESS',
      actorType: 'USER',
      ipAddress: '14.161.42.10',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      deviceLabel: 'Chrome · macOS · Desktop',
      createdAt: new Date('2026-09-14T18:42:00Z'),
      metadata: JSON.stringify({ field: 'CITIZEN_ID' }),
    },
    {
      userId: datUser.id,
      category: 'LOGIN',
      eventType: 'AUTH_LOGIN',
      outcome: 'SUCCESS',
      actorType: 'USER',
      ipAddress: '113.190.234.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      deviceLabel: 'Chrome · Windows · Desktop',
      createdAt: new Date('2026-09-17T08:10:00Z'),
    },
    {
      userId: datUser.id,
      category: 'SECURITY',
      eventType: 'CHANGE_PASSWORD',
      outcome: 'SUCCESS',
      actorType: 'USER',
      ipAddress: '113.190.234.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceLabel: 'Chrome · Windows · Desktop',
      createdAt: new Date('2026-09-15T11:00:00Z'),
      metadata: JSON.stringify({ reason: 'Người dùng chủ động đổi mật khẩu định kỳ' }),
    },
    {
      userId: longUser.id,
      category: 'LOGIN',
      eventType: 'AUTH_LOGIN',
      outcome: 'FAILED',
      actorType: 'USER',
      ipAddress: '42.112.98.15',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceLabel: 'Firefox · Windows · Desktop',
      createdAt: new Date('2026-09-16T10:30:00Z'),
      metadata: JSON.stringify({ reason: 'Tài khoản đang trong trạng thái bị khóa' }),
    },
  ];

  for (const log of activityLogs) {
    await prisma.userActivityLog.create({
      data: log,
    });
  }

  // 2. Authorization Audit Logs (Nhật ký phân quyền & thao tác nhạy cảm)
  const auditLogs = [
    {
      actorUserId: adminUser.id,
      action: 'ASSIGN_ROLE',
      targetType: 'USER',
      targetId: lanUser.id,
      beforeData: JSON.stringify({ roles: [] }),
      afterData: JSON.stringify({ roles: ['SUPPORT'] }),
      reason: 'Bổ nhiệm Trưởng nhóm chăm sóc khách hàng',
      ipAddress: '14.161.42.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date('2026-06-01T08:30:00Z'),
    },
    {
      actorUserId: adminUser.id,
      action: 'ASSIGN_GAME_ROLE',
      targetType: 'GAME_ROLE',
      targetId: lddmId,
      gameId: lddmId,
      beforeData: null,
      afterData: JSON.stringify({ role: 'GAME_ADMIN', game: 'Lục Địa Đam Mê' }),
      reason: 'Phân quyền quản trị vận hành game Lục Địa Đam Mê',
      ipAddress: '14.161.42.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date('2026-06-01T09:00:00Z'),
    },
    {
      actorUserId: adminUser.id,
      action: 'BLOCK_PLAYER',
      targetType: 'GAME_PLAYER',
      targetId: longUser.id,
      gameId: ctoId,
      beforeData: JSON.stringify({ status: 'ACTIVE' }),
      afterData: JSON.stringify({ status: 'PERMANENTLY_BANNED', reason: 'Phát hiện can thiệp chỉnh sửa gói tin mạng trong trận đấu' }),
      reason: 'Xử lý vi phạm an ninh trận đấu Ranked Season 1',
      ipAddress: '14.161.42.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date('2026-09-14T21:05:00Z'),
    },
    {
      actorUserId: adminUser.id,
      action: 'ADJUST_WALLET',
      targetType: 'WALLET',
      targetId: datUser.id,
      beforeData: JSON.stringify({ balance: '895000' }),
      afterData: JSON.stringify({ balance: '920000', adjustment: '+25000' }),
      reason: 'Cộng bù Coin theo kết quả đối soát ticket TCK-2026-00101',
      ipAddress: '14.161.42.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date('2026-09-15T15:12:00Z'),
    },
  ];

  for (const log of auditLogs) {
    await prisma.authorizationAuditLog.create({
      data: log,
    });
  }

  // 3. Refresh Sessions (Phiên đăng nhập thực tế)
  const sessionUsers = [adminUser, lanUser, quangUser, datUser];
  for (const user of sessionUsers) {
    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `token_hash_${user.id}_active_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('❌ Lỗi khi chạy seed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
