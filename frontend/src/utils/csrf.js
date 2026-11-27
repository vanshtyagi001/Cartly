const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let cachedCsrfToken = '';
let pendingCsrfPromise = null;
let fetchInstalled = false;

export function getCsrfCookie() {
  if (typeof document === 'undefined' || !document.cookie) return '';
  const prefix = 'csrftoken=';
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return '';
}

export function getCsrfToken() {
  return getCsrfCookie() || cachedCsrfToken;
}

export async function ensureCsrfToken(nativeFetch = window.fetch.bind(window)) {
  const existing = getCsrfToken();
  if (existing) return existing;

  if (!pendingCsrfPromise) {
    pendingCsrfPromise = nativeFetch(`${API_BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return '';
        const data = await res.json().catch(() => null);
        if (data?.csrfToken) {
          cachedCsrfToken = data.csrfToken;
        }
        return getCsrfToken();
      })
      .catch(() => '')
      .finally(() => {
        pendingCsrfPromise = null;
      });
  }

  return pendingCsrfPromise;
}

function isApiRequest(input) {
  const url = typeof input === 'string' ? input : input?.url || '';
  return url.startsWith(API_BASE_URL) || url.startsWith('/api/');
}

export function installCsrfFetch() {
  if (fetchInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  fetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    if (!isApiRequest(input)) {
      return nativeFetch(input, init);
    }

    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const nextInit = {
      ...init,
      credentials: init.credentials || 'include',
    };

    if (UNSAFE_METHODS.has(method)) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('X-CSRFToken')) {
        const token = getCsrfToken() || (await ensureCsrfToken(nativeFetch));
        if (token) {
          headers.set('X-CSRFToken', token);
        }
      }
      nextInit.headers = headers;
    }

    return nativeFetch(input, nextInit);
  };

  void ensureCsrfToken(nativeFetch);
}
