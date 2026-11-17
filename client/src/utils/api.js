/**
 * Centralized API Client for Dalal Dojo
 * Handles base URL configuration, credentials (cookies), and Bearer token fallback.
 */

const defaultProdUrl =
  typeof window !== 'undefined' && window.location && window.location.hostname.includes('vercel.app')
    ? 'https://dalal-dojo.onrender.com'
    : '';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  defaultProdUrl
).replace(/\/$/, '');

export function getToken() {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem('token');
  } catch {}
}

export async function apiFetch(endpoint, options = {}) {
  // Normalize endpoint: ensure relative paths begin with /api/
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!cleanEndpoint.startsWith('/api/') && !cleanEndpoint.startsWith('http')) {
    cleanEndpoint = `/api${cleanEndpoint}`;
  }

  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    ...options.headers,
  };

  const token = getToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always send cookies (cross-domain and same-origin)
    });
  } catch (err) {
    throw new Error(
      `Unable to connect to market server at ${url}. Please verify the backend is online.`
    );
  }

  // Validate that response is JSON for API endpoints (prevents cryptic "Unexpected token 'T'" errors on 404/HTML responses)
  const contentType = res.headers.get('content-type') || '';
  if (cleanEndpoint.startsWith('/api/') && res.status !== 204 && !contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Market server returned non-JSON response (${res.status} ${res.statusText || 'Error'}): ${text.slice(0, 100) || 'Backend unavailable'}`
    );
  }

  return res;
}
