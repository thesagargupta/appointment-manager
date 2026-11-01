import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { HttpError } from '../utils/httpError';

export const BCRYPT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;

// Compared against when the account doesn't exist so response timing doesn't reveal valid emails.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export async function verifyCredentials(email: string, password: string) {
  const admin = await Admin.findOne({ email }).select('+passwordHash').lean();
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  return { id: String(admin._id), email: admin.email };
}

export async function getAdmin(id: string) {
  const admin = await Admin.findById(id).lean();
  return admin ? { id: String(admin._id), email: admin.email } : null;
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
