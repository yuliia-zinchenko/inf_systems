import type { Request, Response } from 'express';
import { authService } from './auth.services.ts';
import { sessionsService } from '../sessions/sessions.services.ts';
import { SESSION_COOKIE } from '../application/middlewares/auth.middleware.ts';
import { UnauthorizedException } from '../application/exceptions/http.exception.ts';

function metaFrom(req: Request): {
  userAgent: string | null;
  ip: string | null;
  frontendBaseUrl: string;
} {
  const ua = req.get('user-agent') ?? null;
  const ip = (req.ip ?? null) as string | null;
  return { userAgent: ua, ip, frontendBaseUrl: frontendBaseUrl(req) };
}

function setSessionCookie(res: Response, sessionId: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: sessionsService.cookieMaxAgeMs(),
    path: '/',
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function frontendBaseUrl(req: Request): string {
  return (
    process.env.FRONTEND_URL ??
    req.get('origin') ??
    `${req.protocol}://${req.get('host') ?? 'localhost:3000'}`
  );
}

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const { user, session } = await authService.signup(req.body, metaFrom(req));
    setSessionCookie(res, session.id);
    res.status(201).json({ user });
  },

  async signin(req: Request, res: Response): Promise<void> {
    const { user, session } = await authService.signin(req.body, metaFrom(req));
    setSessionCookie(res, session.id);
    res.status(200).json({ user });
  },

  async google(req: Request, res: Response): Promise<void> {
    const { user, session } = await authService.signinWithGoogle(
      req.body.idToken,
      metaFrom(req),
    );
    setSessionCookie(res, session.id);
    res.status(200).json({ user });
  },

  async signout(req: Request, res: Response): Promise<void> {
    if (req.sessionId) {
      await authService.signout(req.sessionId);
    }
    clearSessionCookie(res);
    res.status(204).end();
  },

  me(req: Request, res: Response): void {
    if (!req.user) {
      res.status(200).json({ user: null });
      return;
    }
    res.status(200).json({ user: req.user });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.requestPasswordReset(req.body.email, frontendBaseUrl(req));
    res.status(204).end();
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(204).end();
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    await authService.verifyEmail(req.body.token);
    res.status(204).end();
  },

  async resendVerification(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    await authService.resendVerification(req.user.id, frontendBaseUrl(req));
    res.status(204).end();
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    await authService.changePassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.status(204).end();
  },
};
