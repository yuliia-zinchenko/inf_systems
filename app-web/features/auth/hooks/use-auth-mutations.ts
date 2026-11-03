'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi, usersApi } from '@/lib/api';
import { useAuth } from '../auth-context';
import type { User } from '@/types/api';

export const useSignIn = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationKey: ['auth', 'signin'],
    mutationFn: authApi.signin,
    onSuccess: ({ user }) => setUser(user),
  });
};

export const useSignUp = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationKey: ['auth', 'signup'],
    mutationFn: authApi.signup,
    onSuccess: ({ user }) => setUser(user),
  });
};

export const useGoogleSignIn = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationKey: ['auth', 'google'],
    mutationFn: authApi.google,
    onSuccess: ({ user }) => setUser(user),
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: authApi.forgotPassword,
  });

export const useResetPassword = () =>
  useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });

export const useVerifyEmail = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationKey: ['auth', 'verify-email'],
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      void refresh();
    },
  });
};

export const useResendVerification = () =>
  useMutation({
    mutationKey: ['auth', 'resend-verification'],
    mutationFn: authApi.resendVerification,
  });

export const useChangePassword = () => {
  const { refresh } = useAuth();
  return useMutation({
    mutationKey: ['auth', 'change-password'],
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      void refresh();
    },
  });
};

export const useUpdateProfile = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationKey: ['users', 'update-me'],
    mutationFn: usersApi.updateMe,
    onSuccess: (user: User) => setUser(user),
  });
};

export const useDeleteAccount = () =>
  useMutation({
    mutationKey: ['users', 'delete-me'],
    mutationFn: usersApi.deleteMe,
  });
