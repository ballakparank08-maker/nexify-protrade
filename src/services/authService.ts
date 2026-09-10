export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'trader' | 'admin';
  createdAt: string;
  updatedAt: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

interface AuthResponse {
  user: AuthenticatedUser;
}

interface AdminVerificationResponse extends AuthResponse {
  authorized: boolean;
}

class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new AuthApiError(payload.message || 'Authentication request failed.', response.status);
  }

  return payload as T;
};

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async login(input: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async me() {
    return request<AuthResponse>('/auth/me', {
      method: 'GET',
    });
  },
  async logout() {
    return request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },
  async verifyAdmin() {
    return request<AdminVerificationResponse>('/auth/admin/verify', {
      method: 'GET',
    });
  },
};

export const isAuthApiError = (error: unknown): error is AuthApiError => error instanceof AuthApiError;
