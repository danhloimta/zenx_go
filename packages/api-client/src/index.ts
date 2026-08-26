export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;

export type Query = Record<string, QueryValue>;

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiErrorPayload | null;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  body?: unknown;
  method?: HttpMethod;
}

export interface ApiClientOptions {
  baseUrl?: string;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }

  static fromResponse(response: Response, payload: unknown): ApiError {
    const envelope = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;
    const fallback: ApiErrorPayload = {
      code: `HTTP_${response.status}`,
      message: response.statusText || "Request failed",
    };

    return new ApiError(
      {
        code: typeof envelope?.code === "string" ? envelope.code : fallback.code,
        message: typeof envelope?.message === "string" ? envelope.message : fallback.message,
        details: envelope?.details,
      },
      response.status,
    );
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function encodeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body as BodyInit;
  }

  return JSON.stringify(body);
}

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`, "http://zenx-go.local");

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Relative URLs must stay relative in the browser. Absolute URLs keep their
  // origin when a public API base URL is configured.
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;
  private readonly fetcher: typeof fetch;
  private refreshPromise: Promise<unknown> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "/api/v1";
    this.defaultHeaders = options.headers ?? {};
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, options: ApiRequestOptions = {}, query?: Query, allowRefresh = true): Promise<T> {
    const headers = new Headers(this.defaultHeaders);
    for (const [key, value] of new Headers(options.headers).entries()) {
      headers.set(key, value);
    }

    const body = encodeBody(options.body);
    if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetcher(buildUrl(this.baseUrl, path, query), {
      ...options,
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body,
    });
    const payload = await readPayload(response);

    if (!response.ok) {
      const error = ApiError.fromResponse(response, payload);
      if (response.status === 401 && allowRefresh && !path.startsWith('/auth/')) {
        try {
          await this.refreshSession();
          return this.request<T>(path, options, query, false);
        } catch {
          // Preserve the original error so callers can render the endpoint's
          // auth failure when the refresh cookie is also expired.
        }
      }
      throw error;
    }

    if (isRecord(payload) && "data" in payload && "error" in payload) {
      const envelope = payload as ApiEnvelope<T>;
      if (envelope.error) {
        throw new ApiError(envelope.error, response.status);
      }
      return envelope.data as T;
    }

    return payload as T;
  }

  private refreshSession() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.request('/auth/refresh', { method: 'POST' }, undefined, false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  get<T>(path: string, query?: Query, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" }, query);
  }

  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  delete<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export type AuthProvider = "google" | "facebook";
export type OtpChannel = "SMS" | "ZALO" | "EMAIL";
export type OtpPurpose =
  | "REGISTER"
  | "VERIFY_PHONE"
  | "RESET_PASSWORD"
  | "CHANGE_PHONE"
  | "CHANGE_EMAIL"
  | "LINK_SOCIAL";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
export type AccountStatus = "PENDING" | "ACTIVE" | "LOCKED" | "SUSPENDED";
export type WalletTransactionType = "TOPUP" | "CREDIT" | "DEBIT" | "REFUND";
export type WalletTransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentMethod = "MOMO" | "ZALOPAY" | "BANK_TRANSFER" | "CARD" | "VIETQR";
/** @deprecated Accepted by older API deployments; new requests should use PaymentMethod. */
export type LegacyPaymentMethod = "QR" | "REDIRECT";
export type SupportTicketStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  status?: AccountStatus;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  verificationToken: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  verificationToken: string;
  newPassword: string;
}

export interface OtpSendRequest {
  channel: OtpChannel;
  purpose: OtpPurpose;
  destination: string;
}

export interface OtpSendResponse {
  expiresIn: number;
  resendAfter: number;
  requestId?: string;
}

export interface OtpVerifyRequest extends OtpSendRequest {
  code: string;
}

export interface OtpVerifyResponse {
  verificationToken: string;
  expiresIn: number;
}

export interface UserProfile {
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  city?: string | null;
  address?: string | null;
  profileCompletedAt?: string | null;
}

export interface AccountMe extends AuthUser {
  email?: string | null;
  phone?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  hasPassword: boolean;
  profile: UserProfile;
  social: {
    google: boolean;
    facebook: boolean;
  };
}

export interface UpdateAccountRequest extends Partial<UserProfile> {}

export interface CompleteProfileRequest {
  fullName: string;
  dateOfBirth?: string;
  gender?: Gender;
  city?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  verificationToken: string;
}

export interface ChangePhoneRequest {
  newPhone: string;
  verificationToken: string;
}

export interface WalletSummary {
  currency: "ZENX" | string;
  balance: number | string;
}

export interface WalletTransaction {
  transactionNo: string;
  type: WalletTransactionType;
  amount: number | string;
  balanceBefore?: number | string;
  balanceAfter?: number | string;
  status: WalletTransactionStatus;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  completedAt?: string | null;
  payment?: {
    paymentNo: string;
    provider: string;
    paymentMethod: PaymentMethod | string;
    providerTransactionId?: string | null;
    paidAt?: string | null;
    status: PaymentStatus | string;
  } | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface CoinPackage {
  id: string;
  code?: string;
  name: string;
  priceVnd: number | string;
  coinAmount: number | string;
}

export interface Payment {
  paymentNo: string;
  status: PaymentStatus;
  provider?: string;
  providerTransactionId?: string | null;
  amountVnd: number | string;
  coinAmount: number | string;
  paymentMethod?: PaymentMethod | string;
  paymentUrl?: string | null;
  qrImageUrl?: string | null;
  qrPayload?: string | null;
  displayMetadata?: Record<string, unknown> | null;
  createdAt?: string;
  paidAt?: string | null;
  expiredAt?: string | null;
}

export interface CreatePaymentRequest {
  coinPackageId: string;
  paymentMethod: PaymentMethod | LegacyPaymentMethod;
  idempotencyKey?: string;
}

export interface CreatePaymentResponse extends Payment {}

export interface PaymentConfig {
  provider: string;
  methods: PaymentMethod[];
  isDemo: boolean;
  allowMockCompletion: boolean;
}

export interface SupportFaq {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

export interface SupportCategory {
  id: string;
  code: string;
  name: string;
  faqs: SupportFaq[];
}

export interface SupportFaqResponse {
  categories: SupportCategory[];
}

export interface SupportTicket {
  ticketNo: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  category: Pick<SupportCategory, "id" | "code" | "name">;
}

export interface CreateSupportTicketRequest {
  categoryId: string;
  subject: string;
  description: string;
}

export function createZenxApiClient(options: ApiClientOptions = {}) {
  const client = new ApiClient(options);

  return {
    raw: client,
    auth: {
      register: (input: RegisterRequest) => client.post<RegisterResponse>("/auth/register", input),
      login: (input: LoginRequest) => client.post<LoginResponse>("/auth/login", input),
      refresh: () => client.post<LoginResponse>("/auth/refresh"),
      logout: () => client.post<void>("/auth/logout"),
      forgotPassword: (input: ForgotPasswordRequest) =>
        client.post<void>("/auth/forgot-password", input),
      resetPassword: (input: ResetPasswordRequest) =>
        client.post<void>("/auth/reset-password", input),
      oauthUrl: (provider: AuthProvider, mode: "login" | "link" = "login") => {
        const query = mode === "link" ? "?mode=link" : "";
        return `${clientBasePath(options.baseUrl)}/auth/${provider}${query}`;
      },
    },
    otp: {
      send: (input: OtpSendRequest) => client.post<OtpSendResponse>("/otp/send", input),
      verify: (input: OtpVerifyRequest) => client.post<OtpVerifyResponse>("/otp/verify", input),
    },
    account: {
      me: () => client.get<AccountMe>("/account/me"),
      update: (input: UpdateAccountRequest) => client.patch<AccountMe>("/account/me", input),
      completeProfile: (input: CompleteProfileRequest) => client.post<AccountMe>("/account/complete-profile", input),
      uploadAvatar: (file: Blob | File) => {
        const body = new FormData();
        body.append("file", file);
        return client.post<{ avatarUrl: string }>("/account/avatar", body);
      },
      changePassword: (input: ChangePasswordRequest) =>
        client.post<void>("/account/change-password", input),
      changeEmail: (input: ChangeEmailRequest) =>
        client.post<void>("/account/change-email", input),
      changePhone: (input: ChangePhoneRequest) =>
        client.post<void>("/account/change-phone", input),
    },
    social: {
      oauthUrl: (provider: AuthProvider) =>
        `${clientBasePath(options.baseUrl)}/auth/${provider}?mode=link`,
      unlink: (provider: AuthProvider) => client.delete<void>(`/account/social/${provider}`),
    },
    wallet: {
      summary: () => client.get<WalletSummary>("/wallet"),
      transactions: (query: {
        page?: number;
        pageSize?: number;
        type?: WalletTransactionType | "ALL";
        status?: WalletTransactionStatus | "ALL";
        from?: string;
        to?: string;
        search?: string;
      } = {}) =>
        client.get<Paginated<WalletTransaction>>("/wallet/transactions", {
          ...query,
          type: query.type === "ALL" ? undefined : query.type,
          status: query.status === "ALL" ? undefined : query.status,
          from: optionalQuery(query.from),
          to: optionalQuery(query.to),
          search: optionalQuery(query.search),
        }),
      transaction: (transactionNo: string) =>
        client.get<WalletTransaction>(`/wallet/transactions/${encodeURIComponent(transactionNo)}`),
      export: (query: {
        type?: WalletTransactionType | "ALL";
        status?: WalletTransactionStatus | "ALL";
        from?: string;
        to?: string;
        search?: string;
      } = {}) => client.get<string>("/wallet/transactions/export", {
        ...query,
        type: query.type === "ALL" ? undefined : query.type,
        status: query.status === "ALL" ? undefined : query.status,
        from: optionalQuery(query.from),
        to: optionalQuery(query.to),
        search: optionalQuery(query.search),
      }),
      exportTransactions: async (query: {
        pageSize?: number;
        type?: WalletTransactionType | "ALL";
        status?: WalletTransactionStatus | "ALL";
        from?: string;
        to?: string;
        search?: string;
      } = {}) => {
        const filters = { ...query };
        delete filters.pageSize;
        const csv = await client.get<string>("/wallet/transactions/export", {
          ...filters,
          type: filters.type === "ALL" ? undefined : filters.type,
          status: filters.status === "ALL" ? undefined : filters.status,
          from: optionalQuery(filters.from),
          to: optionalQuery(filters.to),
          search: optionalQuery(filters.search),
        });
        return new Blob([csv], { type: "text/csv;charset=utf-8" });
      },
    },
    coinPackages: {
      list: () => client.get<CoinPackage[]>("/coin-packages"),
    },
    payments: {
      config: () => client.get<PaymentConfig>("/payment-config"),
      create: (input: CreatePaymentRequest) =>
        client.post<CreatePaymentResponse>("/payments", input),
      get: (paymentNo: string) =>
        client.get<Payment>(`/payments/${encodeURIComponent(paymentNo)}`),
      mockComplete: (paymentNo: string) =>
        client.post<Payment>(`/payments/${encodeURIComponent(paymentNo)}/mock-complete`),
      list: () => client.get<Payment[]>("/payments"),
    },
    support: {
      faqs: () => client.get<SupportFaqResponse>("/support/faqs"),
      createTicket: (input: CreateSupportTicketRequest) =>
        client.post<SupportTicket>("/support/tickets", input),
      tickets: (query: { page?: number; pageSize?: number; status?: SupportTicketStatus } = {}) =>
        client.get<Paginated<SupportTicket>>("/support/tickets", query),
      ticket: (ticketNo: string) =>
        client.get<SupportTicket>(`/support/tickets/${encodeURIComponent(ticketNo)}`),
    },
  };
}

function clientBasePath(baseUrl = "/api/v1") {
  return baseUrl.replace(/\/$/, "");
}

function optionalQuery(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export type ZenxApiClient = ReturnType<typeof createZenxApiClient>;
