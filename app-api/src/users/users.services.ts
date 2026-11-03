import { NotFoundException } from '../application/exceptions/http.exception.ts';
import { toPublic, usersRepository } from './repositories/users.repository.ts';
import type { User, UserRecord } from './types/user.interface.ts';

export const usersService = {
  async getById(id: string): Promise<User> {
    const record = await usersRepository.findById(id);
    if (!record) throw new NotFoundException(`User "${id}" not found`);
    return toPublic(record);
  },

  getRecordById(id: string): Promise<UserRecord | undefined> {
    return usersRepository.findById(id);
  },

  getRecordByEmail(email: string): Promise<UserRecord | undefined> {
    return usersRepository.findByEmail(email);
  },

  getRecordByGoogleId(googleId: string): Promise<UserRecord | undefined> {
    return usersRepository.findByGoogleId(googleId);
  },

  create(input: {
    email: string;
    name: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    googleId: string | null;
    emailVerified: boolean;
  }): Promise<UserRecord> {
    return usersRepository.create(input);
  },

  updatePassword(id: string, passwordHash: string): Promise<void> {
    return usersRepository.updatePasswordHash(id, passwordHash);
  },

  markEmailVerified(id: string): Promise<void> {
    return usersRepository.markEmailVerified(id);
  },

  async updateName(id: string, name: string | null): Promise<User> {
    await usersRepository.updateName(id, name);
    return this.getById(id);
  },

  delete(id: string): Promise<void> {
    return usersRepository.delete(id);
  },

  linkGoogleAccount(
    id: string,
    googleId: string,
    avatarUrl: string | null,
    name: string | null,
  ): Promise<void> {
    return usersRepository.linkGoogleAccount(id, googleId, avatarUrl, name);
  },
};

export { toPublic };
