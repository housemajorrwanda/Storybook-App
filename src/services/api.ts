import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE_URL = 'https://storybook-api-production.up.railway.app';

type Paginated<T> = { data: T[]; meta?: unknown };

/**
 * Normalises a list response to an array.
 *
 * Several endpoints documented as returning a bare array actually return the
 * paginated `{ data, meta }` envelope — `/testimonies/my-testimonies` delegates
 * to the backend's `findAll`, for example. Screens then call `.filter()` on an
 * object and crash. Every list-returning service method should pass its payload
 * through this so a shape change can never reach a component.
 */
export function toArray<T>(payload: T[] | Paginated<T> | null | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).data)) {
    return (payload as Paginated<T>).data;
  }
  return [];
}
const TOKEN_KEY = 'housemajor_auth_token';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Registered by AuthProvider so a 401 during an active session signs the user out cleanly.
let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Endpoints that legitimately answer 401 for bad input rather than an expired
 * session. A failed sign-in must surface the server's own message and must not
 * clear the token — the user isn't signed in yet, so there is no session to end.
 */
const CREDENTIAL_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google/token',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function isCredentialRequest(url?: string): boolean {
  if (!url) return false;
  return CREDENTIAL_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401 && !isCredentialRequest(error?.config?.url)) {
      await removeToken();
      _onUnauthorized?.();
      return Promise.reject(new Error('Session expired. Please sign in again.'));
    }
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  },
);

export default api;
