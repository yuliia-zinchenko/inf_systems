import bcrypt from 'bcrypt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import {
  ConflictException,
  UnauthorizedException,
  ValidationException,
} from '../application/exceptions/http.exception.ts';
import { sessionsService } from '../sessions/sessions.services.ts';
import type { Session } from '../sessions/types/session.interface.ts';
import { toPublic, usersService } from '../users/users.services.ts';
import type { User, UserRecord } from '../users/types/user.interface.ts';
import { emailService } from '../email/email.services.ts';
import { authAttemptsTotal } from '../application/metrics.ts';
import { logger } from '../application/logger.ts';
import { withSpan } from '../application/tracing.ts';
import { passwordResetTokensRepository } from './repositories/password-reset-tokens.repository.ts';
import { emailVerificationTokensRepository } from './repositories/email-verification-tokens.repository.ts';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MINUTES = 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;

let cachedGoogleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!cachedGoogleClient) {
    cachedGoogleClient = new OAuth2Client();
  }
  return cachedGoogleClient;
}

interface ContextMeta {
  userAgent: string | null;
  ip: string | null;
  frontendBaseUrl: string;
}

interface AuthResult {
  user: User;
  session: Session;
}

export const authService = {
  async signup(
    input: { email: string; password: string; name?: string },
    meta: ContextMeta,
  ): Promise<AuthResult> {
    const existing = await usersService.getRecordByEmail(input.email);
    if (existing) {
      authAttemptsTotal.inc({ action: 'signup', result: 'failure' });
      throw new ConflictException('Користувач з таким email вже існує');
    }
    const passwordHash = await withSpan('bcrypt.hash', { 'bcrypt.rounds': BCRYPT_ROUNDS }, () =>
      bcrypt.hash(input.password, BCRYPT_ROUNDS),
    );
    const record = await usersService.create({
      email: input.email,
      name: input.name?.trim() ? input.name.trim() : null,
      avatarUrl: null,
      passwordHash,
      googleId: null,
      emailVerified: false,
    });
    const session = await sessionsService.create({
      userId: record.id,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    // Fire-and-forget verification email; do not block signup on SMTP issues.
    this.sendVerificationEmail(record.id, record.email, meta.frontendBaseUrl).catch(
      (err) => logger.error({ err, userId: record.id }, 'Verification email send failed'),
    );
    authAttemptsTotal.inc({ action: 'signup', result: 'success' });
    return { user: toPublic(record), session };
  },

  async signin(
    input: { email: string; password: string },
    meta: ContextMeta,
  ): Promise<AuthResult> {
    const record = await usersService.getRecordByEmail(input.email);
    if (!record || !record.passwordHash) {
      authAttemptsTotal.inc({ action: 'signin', result: 'failure' });
      throw new UnauthorizedException('Невірний email або пароль');
    }
    const passwordHash = record.passwordHash;
    const ok = await withSpan('bcrypt.compare', {}, () =>
      bcrypt.compare(input.password, passwordHash),
    );
    if (!ok) {
      authAttemptsTotal.inc({ action: 'signin', result: 'failure' });
      throw new UnauthorizedException('Невірний email або пароль');
    }
    const session = await sessionsService.create({
      userId: record.id,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    authAttemptsTotal.inc({ action: 'signin', result: 'success' });
    return { user: toPublic(record), session };
  },

  async signinWithGoogle(idToken: string, meta: ContextMeta): Promise<AuthResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ValidationException('Google Sign-In is not configured on the server');
    }
    let payload: TokenPayload | undefined;
    try {
      const ticket = await getGoogleClient().verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      authAttemptsTotal.inc({ action: 'google', result: 'failure' });
      throw new UnauthorizedException('Невалідний Google токен');
    }
    if (!payload || !payload.email || !payload.sub) {
      throw new UnauthorizedException('Невалідний Google токен');
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? null;
    const avatarUrl = payload.picture ?? null;

    let record = await usersService.getRecordByGoogleId(googleId);
    if (!record) {
      const byEmail = await usersService.getRecordByEmail(email);
      if (byEmail) {
        await usersService.linkGoogleAccount(byEmail.id, googleId, avatarUrl, name);
        record = (await usersService.getRecordById(byEmail.id))!;
      } else {
        record = await usersService.create({
          email,
          name,
          avatarUrl,
          passwordHash: null,
          googleId,
          emailVerified: true,
        });
      }
    }

    const session = await sessionsService.create({
      userId: record.id,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    authAttemptsTotal.inc({ action: 'google', result: 'success' });
    return { user: toPublic(record), session };
  },

  signout(sessionId: string): Promise<void> {
    return sessionsService.destroy(sessionId);
  },

  async requestPasswordReset(email: string, frontendBaseUrl: string): Promise<void> {
    const record = await usersService.getRecordByEmail(email);
    // Always return success — do not reveal whether email exists.
    if (!record) return;
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    const reset = await passwordResetTokensRepository.create(record.id, expiresAt);
    const link = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password/${reset.token}`;
    await emailService.enqueue({
      to: record.email,
      subject: 'Скидання паролю — TagShop Video',
      text:
        `Привіт!\n\nЩоб встановити новий пароль, перейдіть за посиланням:\n${link}\n\n` +
        `Посилання дійсне ${RESET_TOKEN_TTL_MINUTES} хвилин. Якщо ви не запитували скидання — проігноруйте цей лист.`,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await passwordResetTokensRepository.findActive(token);
    if (!reset) {
      throw new ValidationException('Посилання недійсне або прострочене');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await usersService.updatePassword(reset.userId, passwordHash);
    await passwordResetTokensRepository.markUsed(token);
  },

  async changePassword(
    userId: string,
    input: { currentPassword?: string; newPassword: string },
  ): Promise<void> {
    const record = await usersService.getRecordById(userId);
    if (!record) throw new UnauthorizedException();
    if (record.passwordHash) {
      if (!input.currentPassword) {
        throw new ValidationException('Поточний пароль обов\'язковий');
      }
      const ok = await bcrypt.compare(input.currentPassword, record.passwordHash);
      if (!ok) throw new UnauthorizedException('Поточний пароль невірний');
    }
    const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await usersService.updatePassword(userId, newHash);
  },

  async sendVerificationEmail(
    userId: string,
    email: string,
    frontendBaseUrl: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
    const t = await emailVerificationTokensRepository.create(userId, email, expiresAt);
    const link = `${frontendBaseUrl.replace(/\/$/, '')}/verify-email/${t.token}`;
    await emailService.enqueue({
      to: email,
      subject: 'Підтвердіть пошту — TagShop Video',
      text:
        `Вітаємо в TagShop Video!\n\nПідтвердіть свою адресу за посиланням:\n${link}\n\n` +
        `Посилання дійсне ${EMAIL_VERIFICATION_TTL_HOURS} год. Якщо ви не реєструвалися — проігноруйте цей лист.`,
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const t = await emailVerificationTokensRepository.findActive(token);
    if (!t) throw new ValidationException('Посилання недійсне або прострочене');
    const record = await usersService.getRecordById(t.userId);
    if (!record) throw new ValidationException('Користувача не існує');
    // Token bound to specific email at issue-time; if user changed email since, refuse.
    if (record.email.toLowerCase() !== t.email.toLowerCase()) {
      throw new ValidationException('Посилання застаріло — email змінено');
    }
    await usersService.markEmailVerified(t.userId);
    await emailVerificationTokensRepository.markUsed(token);
  },

  async resendVerification(userId: string, frontendBaseUrl: string): Promise<void> {
    const record = await usersService.getRecordById(userId);
    if (!record) throw new UnauthorizedException();
    if (record.emailVerified) {
      throw new ValidationException('Email вже підтверджено');
    }
    await emailVerificationTokensRepository.invalidateForUser(userId);
    await this.sendVerificationEmail(userId, record.email, frontendBaseUrl);
  },

  async resolveUserBySession(sessionId: string): Promise<UserRecord | undefined> {
    const session = await sessionsService.findValid(sessionId);
    if (!session) return undefined;
    return usersService.getRecordById(session.userId);
  },
};
