import "server-only";
import type { ApiEnvelope } from "@/types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

/**
 * Server-side fetch for public, indexable pages (destinations, tours, hotels).
 * Responses are cached and revalidated on a timer so pages stay fast and crawlable.
 * Returns `null` for 404s so pages can call `notFound()`.
 */
export async function serverGet<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1${path}`, { next: { revalidate } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data;
  } catch (err) {
    console.error(`[serverGet] ${path}:`, (err as Error).message);
    return null;
  }
}

export async function serverGetWithMeta<T>(path: string, revalidate = 60) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiEnvelope<T>;
    return { data: json.data, meta: json.meta };
  } catch {
    return null;
  }
}
