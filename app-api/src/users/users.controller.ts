import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { usersService } from './users.services.ts';
import {
  UnauthorizedException,
  ValidationException,
} from '../application/exceptions/http.exception.ts';
import { SESSION_COOKIE } from '../application/middlewares/auth.middleware.ts';

export const usersController = {
  async updateMe(
    req: Request<unknown, unknown, { name?: string | null }>,
    res: Response,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    const raw = req.body.name;
    const name = typeof raw === 'string' ? (raw.trim() || null) : null;
    const updated = await usersService.updateName(req.user.id, name);
    res.status(200).json(updated);
  },

  async deleteMe(
    req: Request<unknown, unknown, { password?: string }>,
    res: Response,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    const record = await usersService.getRecordById(req.user.id);
    if (!record) throw new UnauthorizedException();

    if (record.passwordHash) {
      const provided = req.body.password ?? '';
      const ok = await bcrypt.compare(provided, record.passwordHash);
      if (!ok) throw new ValidationException('Невірний пароль');
    }

    await usersService.delete(req.user.id);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  },
};
