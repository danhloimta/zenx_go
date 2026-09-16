import type { RequiredPermission } from './permission.decorator';

function define(code: string, action: string, subject: string): RequiredPermission {
  return { code, action, subject };
}

export const PERMISSIONS = {
  ADMIN_ACCESS: define('admin.access', 'access', 'Admin'),
  ADMIN_DASHBOARD_VIEW: define('admin.dashboard.view', 'read', 'Dashboard'),
  USERS_VIEW: define('users.view', 'read', 'User'),
  USERS_PROFILE_UPDATE: define('users.profile.update', 'update-profile', 'User'),
  USERS_STATUS_UPDATE: define('users.status.update', 'update-status', 'User'),
  USERS_ROLES_ASSIGN: define('users.roles.assign', 'assign-role', 'User'),
  USERS_SESSIONS_REVOKE: define('users.sessions.revoke', 'revoke-session', 'User'),
  USERS_PASSWORD_RESET: define('users.password.reset', 'reset-password', 'User'),
  USERS_SENSITIVE_VIEW: define('users.sensitive.view', 'view-sensitive', 'User'),
  USERS_SENSITIVE_UPDATE: define('users.sensitive.update', 'update-sensitive', 'User'),
  ROLES_VIEW: define('roles.view', 'read', 'Role'),
  ROLES_CREATE: define('roles.create', 'create', 'Role'),
  ROLES_UPDATE: define('roles.update', 'update', 'Role'),
  ROLES_DELETE: define('roles.delete', 'delete', 'Role'),
  ROLES_PERMISSIONS_ASSIGN: define('roles.permissions.assign', 'assign-permission', 'Role'),
  AUTH_SETTINGS_MANAGE: define('settings.auth.manage', 'manage', 'AuthSettings'),
  SUPPORT_DASHBOARD_VIEW: define('support.dashboard.view', 'read', 'SupportDashboard'),
  SUPPORT_AGENTS_VIEW: define('support.agents.view', 'read', 'SupportAgent'),
  SUPPORT_TICKETS_VIEW: define('support.tickets.view', 'read', 'SupportTicket'),
  SUPPORT_TICKETS_CLAIM: define('support.tickets.claim', 'claim', 'SupportTicket'),
  SUPPORT_TICKETS_UPDATE: define('support.tickets.update', 'update', 'SupportTicket'),
  SUPPORT_TICKETS_REPLY: define('support.tickets.reply', 'reply', 'SupportTicket'),
  SUPPORT_TICKETS_INTERNAL_NOTE: define('support.tickets.internal-note', 'internal-note', 'SupportTicket'),
  SUPPORT_FAQ_MANAGE: define('support.faq.manage', 'manage', 'SupportFaq'),
  CONTENT_DASHBOARD_VIEW: define('content.dashboard.view', 'read', 'ContentDashboard'),
  CONTENT_ASSETS_UPLOAD: define('content.assets.upload', 'upload', 'Asset'),
  GAMES_VIEW: define('games.view', 'read', 'Game'),
  GAMES_MANAGE: define('games.manage', 'manage', 'Game'),
  GAMES_PUBLISH: define('games.publish', 'publish', 'Game'),
  GENRES_MANAGE: define('genres.manage', 'manage', 'Genre'),
  ARTICLES_MANAGE: define('articles.manage', 'manage', 'Article'),
  EVENTS_MANAGE: define('events.manage', 'manage', 'Event'),
  ANNOUNCEMENTS_MANAGE: define('announcements.manage', 'manage', 'Announcement'),
  FINANCE_DASHBOARD_VIEW: define('finance.dashboard.view', 'read', 'FinanceDashboard'),
  FINANCE_PACKAGES_MANAGE: define('finance.packages.manage', 'manage', 'CoinPackage'),
  FINANCE_PAYMENTS_VIEW: define('finance.payments.view', 'read', 'Payment'),
  FINANCE_PAYMENTS_PROCESS: define('finance.payments.process', 'process', 'Payment'),
  FINANCE_PAYMENTS_REFUND: define('finance.payments.refund', 'refund', 'Payment'),
  FINANCE_TRANSACTIONS_VIEW: define('finance.transactions.view', 'read', 'WalletTransaction'),
  FINANCE_TRANSACTIONS_EXPORT: define('finance.transactions.export', 'export', 'WalletTransaction'),
  FINANCE_WALLET_ADJUST: define('finance.wallet.adjust', 'adjust', 'Wallet'),
} as const;

const byCode = new Map(Object.values(PERMISSIONS).map((entry) => [entry.code, entry]));
export function permission(code: string): RequiredPermission {
  const result = byCode.get(code);
  if (!result) throw new Error(`Unknown permission: ${code}`);
  return result;
}
