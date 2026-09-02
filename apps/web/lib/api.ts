import { createZenxApiClient } from "@zenx-go/api-client";

export const api = createZenxApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
});

const configuredServerBase = process.env.API_PROXY_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL;
const normalizedServerBase = configuredServerBase?.replace(/\/$/, '');
const serverBase = normalizedServerBase?.startsWith("http://") || normalizedServerBase?.startsWith("https://")
  ? normalizedServerBase.endsWith('/api/v1') ? normalizedServerBase : `${normalizedServerBase}/api/v1`
  : `${(process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? "http://lvh.me:3000").replace(/\/$/, "")}${normalizedServerBase ?? "/api/v1"}`;

export const serverApi = createZenxApiClient({ baseUrl: serverBase });
