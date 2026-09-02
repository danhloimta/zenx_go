export const AccountStatus = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', LOCKED: 'LOCKED', SUSPENDED: 'SUSPENDED' } as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
export const Gender = { MALE: 'MALE', FEMALE: 'FEMALE', OTHER: 'OTHER', UNSPECIFIED: 'UNSPECIFIED' } as const;
export type Gender = (typeof Gender)[keyof typeof Gender];
export const SocialProvider = { GOOGLE: 'GOOGLE', FACEBOOK: 'FACEBOOK' } as const;
export type SocialProvider = (typeof SocialProvider)[keyof typeof SocialProvider];
export const OtpChannel = { SMS: 'SMS', ZALO: 'ZALO', EMAIL: 'EMAIL' } as const;
export type OtpChannel = (typeof OtpChannel)[keyof typeof OtpChannel];
export const OtpPurpose = { REGISTER: 'REGISTER', VERIFY_PHONE: 'VERIFY_PHONE', RESET_PASSWORD: 'RESET_PASSWORD', CHANGE_PHONE: 'CHANGE_PHONE', CHANGE_EMAIL: 'CHANGE_EMAIL', LINK_SOCIAL: 'LINK_SOCIAL' } as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];
export const OtpStatus = { PENDING: 'PENDING', USED: 'USED', EXPIRED: 'EXPIRED', LOCKED: 'LOCKED' } as const;
export type OtpStatus = (typeof OtpStatus)[keyof typeof OtpStatus];
export const WalletTransactionType = { TOPUP: 'TOPUP', CREDIT: 'CREDIT', DEBIT: 'DEBIT', REFUND: 'REFUND' } as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];
export const WalletTransactionStatus = { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', REVERSED: 'REVERSED' } as const;
export type WalletTransactionStatus = (typeof WalletTransactionStatus)[keyof typeof WalletTransactionStatus];
export const PaymentStatus = { CREATED: 'CREATED', PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', EXPIRED: 'EXPIRED', CANCELLED: 'CANCELLED', REFUNDED: 'REFUNDED' } as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PaymentMethod = { MOMO: 'MOMO', ZALOPAY: 'ZALOPAY', BANK_TRANSFER: 'BANK_TRANSFER', CARD: 'CARD', VIETQR: 'VIETQR' } as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const CoinPackageStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' } as const;
export const SupportStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' } as const;
export const SupportTicketStatus = { NEW: 'NEW', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' } as const;
export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];
export const GameRecordType = { REAL: 'REAL', DEMO: 'DEMO' } as const;
export type GameRecordType = (typeof GameRecordType)[keyof typeof GameRecordType];
export const GameLifecycleStatus = {
  CONCEPT: 'CONCEPT',
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  INTERNAL_TEST: 'INTERNAL_TEST',
  CLOSED_BETA: 'CLOSED_BETA',
  OPEN_BETA: 'OPEN_BETA',
  LIVE: 'LIVE',
  COMING_SOON: 'COMING_SOON',
  SUNSET: 'SUNSET',
} as const;
export type GameLifecycleStatus = (typeof GameLifecycleStatus)[keyof typeof GameLifecycleStatus];
export const GameOperationalStatus = { AVAILABLE: 'AVAILABLE', MAINTENANCE: 'MAINTENANCE', DEGRADED: 'DEGRADED', UNAVAILABLE: 'UNAVAILABLE' } as const;
export type GameOperationalStatus = (typeof GameOperationalStatus)[keyof typeof GameOperationalStatus];
export const GameArticleStatus = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' } as const;
export type GameArticleStatus = (typeof GameArticleStatus)[keyof typeof GameArticleStatus];
export const GameArticleCategory = { DEVELOPMENT_UPDATE: 'DEVELOPMENT_UPDATE', ANNOUNCEMENT: 'ANNOUNCEMENT', EVENT: 'EVENT', MAINTENANCE: 'MAINTENANCE' } as const;
export type GameArticleCategory = (typeof GameArticleCategory)[keyof typeof GameArticleCategory];
export const GameMilestoneStatus = { COMPLETED: 'COMPLETED', IN_PROGRESS: 'IN_PROGRESS', UPCOMING: 'UPCOMING', PLANNED: 'PLANNED' } as const;
export type GameMilestoneStatus = (typeof GameMilestoneStatus)[keyof typeof GameMilestoneStatus];
