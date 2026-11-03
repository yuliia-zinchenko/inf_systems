import { sessionsRepository } from './repositories/sessions.repository.ts';
import type { Session } from './types/session.interface.ts';

const SESSION_TTL_DAYS = 30;

export const sessionsService = {
  create(input: {
    userId: string;
    userAgent: string | null;
    ip: string | null;
  }): Promise<Session> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    return sessionsRepository.create({ ...input, expiresAt });
  },

  findValid(id: string): Promise<Session | undefined> {
    return sessionsRepository.findValid(id);
  },

  destroy(id: string): Promise<void> {
    return sessionsRepository.delete(id);
  },

  cookieMaxAgeMs(): number {
    return SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  },
};
