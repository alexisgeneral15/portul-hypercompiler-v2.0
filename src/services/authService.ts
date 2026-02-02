export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';
const TOKEN_KEY = 'portul.auth.token';
const USER_KEY = 'portul.auth.user';

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const authService = {
  getToken,
  getUser: loadUser,
  getAuthHeader: authHeader,

  async register(email: string, password: string, name?: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await handleJson<{ token: string; user: AuthUser }>(response);
    saveToken(data.token);
    saveUser(data.user);
    return data.user;
  },

  async login(email: string, password: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleJson<{ token: string; user: AuthUser }>(response);
    saveToken(data.token);
    saveUser(data.user);
    return data.user;
  },

  async me() {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { ...authHeader() }
    });
    const data = await handleJson<{ user: AuthUser }>(response);
    saveUser(data.user);
    return data.user;
  },

  logout() {
    clearAuth();
  }
};
