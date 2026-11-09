import axios, { AxiosError } from "axios";
import type { ApiEnvelope, Paginated } from "@/types";

/**
 * Browser API client. Requests go to the same origin (`/api/v1`) and are proxied to the
 * Express API by Next.js rewrites, so the HTTP-only session cookie is first-party.
 */
export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export function toApiError(err: unknown): ApiRequestError {
  if (err instanceof ApiRequestError) return err;
  if (err instanceof AxiosError) {
    const body = err.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (!err.response) return new ApiRequestError("We couldn't reach Tripnaro. Check your connection and try again.", 0, "NETWORK");
    return new ApiRequestError(
      body?.message ?? "Something went wrong. Please try again.",
      err.response.status,
      body?.error?.code,
      body?.error?.details ?? [],
    );
  }
  return new ApiRequestError((err as Error)?.message ?? "Unexpected error", 500);
}

/** Readable message, including the first field error when validation failed. */
export function errorMessage(err: unknown): string {
  const e = toApiError(err);
  if (e.fieldErrors.length) return `${e.message}: ${e.fieldErrors[0].message}`;
  return e.message;
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const { data } = await api.get<ApiEnvelope<T>>(url, { params: clean(params) });
    return data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getPaginated<T>(url: string, params?: Record<string, unknown>): Promise<Paginated<T>> {
  try {
    const { data } = await api.get<ApiEnvelope<T[]>>(url, { params: clean(params) });
    return { items: data.data, meta: data.meta as Paginated<T>["meta"] };
  } catch (err) {
    throw toApiError(err);
  }
}

export async function send<T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown,
): Promise<{ data: T; message: string }> {
  try {
    const { data } = await api.request<ApiEnvelope<T>>({ method, url, data: body });
    return { data: data.data, message: data.message };
  } catch (err) {
    throw toApiError(err);
  }
}

/** Drops empty values so URLs stay clean (and shareable). */
function clean(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)),
  );
}
