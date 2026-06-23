import api from './api';

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

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },
};
