import { createZenxApiClient } from "@zenx-go/api-client";

export const api = createZenxApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
});

const configuredServerBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const serverBase = configuredServerBase?.startsWith("http://") || configuredServerBase?.startsWith("https://")
  ? configuredServerBase
  : `${(process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "")}${configuredServerBase ?? "/api/v1"}`;

export const serverApi = createZenxApiClient({ baseUrl: serverBase });
