import type { ApiResponse } from '@magobo/shared';

/**
 * Thin fetch wrapper for the web client. Cookies (the session) are sent
 * automatically for same-origin requests, so nothing extra is needed here
 * for authentication — that's the point of the httpOnly-cookie approach.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  return (await response.json()) as ApiResponse<T>;
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'GET' });
}
