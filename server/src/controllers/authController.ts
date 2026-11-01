import type { Request, Response } from 'express';
import { newCsrfToken } from '../middleware/csrf';
import { getAdmin, verifyCredentials } from '../services/authService';
import { HttpError } from '../utils/httpError';
import { sendSuccess } from '../utils/response';
import type { LoginInput } from '../validators/schemas';

const SESSION_COOKIE = 'sid';

const promisify = (fn: (cb: (err?: unknown) => void) => void) =>
  new Promise<void>((resolve, reject) => fn((err) => (err ? reject(err) : resolve())));

export async function csrf(req: Request, res: Response) {
  req.session.csrfToken ??= newCsrfToken();
  sendSuccess(res, 'CSRF token issued', { csrfToken: req.session.csrfToken });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;
  const admin = await verifyCredentials(email, password);
  // New session id on privilege change prevents session fixation; a fresh CSRF token goes with it.
  await promisify((cb) => req.session.regenerate(cb));
  req.session.adminId = admin.id;
  req.session.csrfToken = newCsrfToken();
  await promisify((cb) => req.session.save(cb));
  sendSuccess(res, 'Logged in successfully', { admin, csrfToken: req.session.csrfToken });
}

export async function logout(req: Request, res: Response) {
  await promisify((cb) => req.session.destroy(cb));
  res.clearCookie(SESSION_COOKIE);
  sendSuccess(res, 'Logged out successfully', null);
}

export async function me(req: Request, res: Response) {
  const admin = await getAdmin(req.session.adminId as string);
  if (!admin) {
    await promisify((cb) => req.session.destroy(cb));
    throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED');
  }
  sendSuccess(res, 'Current administrator', { admin });
}

export { SESSION_COOKIE };
