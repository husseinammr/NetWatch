/**
 * CyberLab — lib/api.ts
 * Typed fetch wrapper لجميع الـ API calls
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `HTTP error ${res.status}`);
  return data as T;
}

export const authApi = {
  login    : (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register : (email: string, password: string, role?: string) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) }),
  getMe    : (token: string) => request<{ user: any }>('/auth/me', {}, token),
};

export const scanApi = {
  getStats   : (token: string) =>
    request<{ status: string; data: any }>('/scans/stats', {}, token),

  runScan    : (token: string, target: string, profile: string = 'quick') =>
    request<{ scanId: string; message: string }>('/scans/run-scan', {
      method: 'POST',
      body  : JSON.stringify({ target, profile }),
    }, token),

  getHosts   : (token: string) =>
    request<{ status: string; data: any }>('/scans/hosts', {}, token),

  getNetworks: (token: string) =>
    request<{ status: string; data: { networks: Network[] } }>('/scans/networks', {}, token),

  getProfiles: (token: string) =>
    request<{ status: string; data: { profiles: ScanProfile[] } }>('/scans/profiles', {}, token),

  getHistory : (token: string, limit = 20) =>
    request<{ status: string; data: any }>(`/scans/history?limit=${limit}`, {}, token),
};

export interface Network {
  interface: string;
  ip       : string;
  netmask  : string;
  network  : string;
  cidr     : number;
}

export interface ScanProfile {
  key    : string;
  label  : string;
  timeout: string;
}
