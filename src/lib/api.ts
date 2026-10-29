import { AxiosError, create, isAxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorResponse, AuthSession } from "@/types/api";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.64:3000";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tenantId: string | null = null;
let refreshRequest: Promise<AuthSession | null> | null = null;
let refreshHandler: (() => Promise<AuthSession | null>) | null = null;

export const setApiSession = (session: {
  accessToken?: string | null;
  refreshToken?: string | null;
  tenantId?: string | null;
}) => {
  accessToken = session.accessToken ?? accessToken;
  refreshToken = session.refreshToken ?? refreshToken;
  tenantId = session.tenantId ?? tenantId;
};

export const clearApiSession = () => {
  accessToken = null;
  refreshToken = null;
  tenantId = null;
};

export const setRefreshHandler = (handler: (() => Promise<AuthSession | null>) | null) => {
  refreshHandler = handler;
};

export const api = create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (tenantId) {
    config.headers.set("X-Tenant-Id", tenantId);
  }
  if (accessToken) {
    config.headers.set("Authorization", "Bearer " + accessToken);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !refreshToken ||
      !refreshHandler ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshRequest ??= refreshHandler().finally(() => {
      refreshRequest = null;
    });

    const session = await refreshRequest;
    if (!session) {
      clearApiSession();
      return Promise.reject(error);
    }

    setApiSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      tenantId: session.user.tenantId,
    });
    return api(originalRequest);
  },
);

export const getApiErrorMessage = (error: unknown): string => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (error.response?.status === 429) return "Too many requests. Please try again shortly.";
    if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
};
