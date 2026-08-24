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

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "/api/v1";
    this.defaultHeaders = options.headers ?? {};
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, options: ApiRequestOptions = {}, query?: Query): Promise<T> {
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
      throw ApiError.fromResponse(response, payload);
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
export type PaymentMethod = "QR" | "REDIRECT";

export interface AuthUser {
  id: string;
  username: string;
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
  fullName: string;
  verificationToken: string;
  dateOfBirth: string;
  gender: Gender;
  city: string;
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
}

export interface AccountMe extends AuthUser {
  email?: string | null;
  phone?: string | null;
  profile: UserProfile;
  social: {
    google: boolean;
    facebook: boolean;
  };
}

export interface UpdateAccountRequest extends Partial<UserProfile> {}

export interface ChangePasswordRequest {
  currentPassword: string;
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
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
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
  amountVnd: number | string;
  coinAmount: number | string;
  paymentMethod?: PaymentMethod | string;
  paymentUrl?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  expiredAt?: string | null;
}

export interface CreatePaymentRequest {
  coinPackageId: string;
  paymentMethod: PaymentMethod;
}

export interface CreatePaymentResponse extends Payment {}

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
      } = {}) =>
        client.get<Paginated<WalletTransaction>>("/wallet/transactions", {
          ...query,
          type: query.type === "ALL" ? undefined : query.type,
          status: query.status === "ALL" ? undefined : query.status,
        }),
      transaction: (transactionNo: string) =>
        client.get<WalletTransaction>(`/wallet/transactions/${encodeURIComponent(transactionNo)}`),
    },
    coinPackages: {
      list: () => client.get<CoinPackage[]>("/coin-packages"),
    },
    payments: {
      create: (input: CreatePaymentRequest) =>
        client.post<CreatePaymentResponse>("/payments", input),
      get: (paymentNo: string) =>
        client.get<Payment>(`/payments/${encodeURIComponent(paymentNo)}`),
      list: () => client.get<Payment[]>("/payments"),
    },
  };
}

function clientBasePath(baseUrl = "/api/v1") {
  return baseUrl.replace(/\/$/, "");
}

export type ZenxApiClient = ReturnType<typeof createZenxApiClient>;
