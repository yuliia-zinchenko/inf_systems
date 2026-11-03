import type { User } from '@/types/api';
import { apiFetch } from './http';

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword: string;
}

export const authApi = {
  me: (): Promise<{ user: User | null }> => apiFetch('/auth/me'),

  signup: (input: SignUpInput): Promise<{ user: User }> =>
    apiFetch('/auth/signup', { method: 'POST', json: input }),

  signin: (input: SignInInput): Promise<{ user: User }> =>
    apiFetch('/auth/signin', { method: 'POST', json: input }),

  google: (idToken: string): Promise<{ user: User }> =>
    apiFetch('/auth/google', { method: 'POST', json: { idToken } }),

  signout: (): Promise<void> =>
    apiFetch('/auth/signout', { method: 'POST' }),

  forgotPassword: (email: string): Promise<void> =>
    apiFetch('/auth/forgot-password', { method: 'POST', json: { email } }),

  resetPassword: (token: string, password: string): Promise<void> =>
    apiFetch('/auth/reset-password', {
      method: 'POST',
      json: { token, password },
    }),

  changePassword: (input: ChangePasswordInput): Promise<void> =>
    apiFetch('/auth/change-password', { method: 'POST', json: input }),

  verifyEmail: (token: string): Promise<void> =>
    apiFetch('/auth/verify-email', { method: 'POST', json: { token } }),

  resendVerification: (): Promise<void> =>
    apiFetch('/auth/resend-verification', { method: 'POST' }),
};
