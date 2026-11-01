import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15_000,
});

// The CSRF token is held in memory only (never localStorage); it is re-issued on login and on demand.
let csrfToken: string | null = null;
export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

async function ensureCsrfToken() {
  if (!csrfToken) {
    const res = await api.get<{ data: { csrfToken: string } }>('/auth/csrf');
    csrfToken = res.data.data.csrfToken;
  }
  return csrfToken;
}

const SAFE = new Set(['get', 'head', 'options']);

api.interceptors.request.use(async (config) => {
  if (!SAFE.has((config.method ?? 'get').toLowerCase())) {
    config.headers.set('X-CSRF-Token', await ensureCsrfToken());
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Retriable = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError<ApiErrorBody>) => {
  const config = error.config as Retriable | undefined;
  const status = error.response?.status;
  // A stale CSRF token (e.g. the session was rotated): fetch a new one and retry once.
  if (status === 403 && error.response?.data?.code === 'CSRF_INVALID' && config && !config._retried) {
    config._retried = true;
    csrfToken = null;
    return api(config);
  }
  const isAuthCall = config?.url?.startsWith('/auth/');
  if (status === 401 && !isAuthCall) onUnauthorized?.();
  throw error;
});

interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: { field?: string; message: string }[];
}

/** Turns any thrown value into a message suitable for the UI. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
    const body = error.response.data;
    if (body?.errors?.length) return body.errors.map((e) => e.message).join(' ');
    if (body?.message) return body.message;
  }
  return fallback;
}
