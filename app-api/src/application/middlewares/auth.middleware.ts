import type { Request, RequestHandler } from 'express';
import { UnauthorizedException } from '../exceptions/http.exception.ts';
import { authService } from '../../auth/auth.services.ts';
import type { User, UserRecord } from '../../users/types/user.interface.ts';
import { toPublic } from '../../users/users.services.ts';

export const SESSION_COOKIE = 'tagshop_session';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    sessionId?: string;
  }
}

function getCookieValue(req: Request, name: string): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[name];
}

async function loadUser(req: Request): Promise<UserRecord | undefined> {
  const token = getCookieValue(req, SESSION_COOKIE);
  if (!token) return undefined;
  const user = await authService.resolveUserBySession(token);
  if (user) {
    req.user = toPublic(user);
    req.sessionId = token;
  }
  return user;
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  loadUser(req).then(() => next()).catch(next);
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  loadUser(req)
    .then((user) => {
      if (!user) throw new UnauthorizedException();
      next();
    })
    .catch(next);
};
