import api, { API_BASE_URL } from './api';

export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  residentPlace?: string;
  avatar?: string | null;
};

export type AuthResponse = {
  access_token: string;
  user: User;
};

export const authService = {
  /**
   * URL that starts the server-side Google flow.
   *
   * The phone cannot talk to Google directly: the project's only OAuth client is
   * a Web application, and Google rejects those for native redirect URIs. So the
   * app opens this backend endpoint — exactly what the web app does — and the
   * backend performs the exchange and deep-links back with a token.
   */
  googleAuthUrl: (redirectUri: string): string =>
    `${API_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    fullName: string;
    residentPlace?: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  /** Updates the signed-in user's own profile. Only these fields are editable. */
  updateProfile: async (payload: {
    fullName?: string;
    residentPlace?: string;
  }): Promise<User> => {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  },

  googleLogin: async (googleAccessToken: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/google/token', {
      access_token: googleAccessToken,
    });
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },
};
