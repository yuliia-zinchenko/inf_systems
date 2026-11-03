import type { User } from '@/types/api';
import { apiFetch } from './http';

export interface UpdateMeInput {
  name?: string | null;
}

export interface DeleteMeInput {
  password?: string;
}

export const usersApi = {
  updateMe: (input: UpdateMeInput): Promise<User> =>
    apiFetch('/users/me', { method: 'PATCH', json: input }),

  deleteMe: (input?: DeleteMeInput): Promise<void> =>
    apiFetch('/users/me', { method: 'DELETE', json: input ?? {} }),
};
