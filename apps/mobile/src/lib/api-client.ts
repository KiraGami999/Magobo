import type { ApiResponse } from '@magobo/shared';
import { getSessionToken } from './session-store';

/**
 * The Magobo backend (Next.js API routes) is reachable at this base URL.
 * Set `EXPO_PUBLIC_API_URL` to your machine's LAN address when testing on
 * a physical device — `localhost` only resolves to the device itself, not
 * your dev machine. See `.env.example`.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = await getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'mobile',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  return (await response.json()) as ApiResponse<T>;
}

export function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
