import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { hashPassword } from '../services/authService';
import { z } from 'zod';

// Creates the administrator from ADMIN_EMAIL / ADMIN_PASSWORD, or resets that admin's password if it already exists.
async function main() {
  const creds = z
    .object({
      email: z.string().trim().toLowerCase().email('ADMIN_EMAIL must be a valid email'),
      password: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters'),
    })
    .safeParse({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  if (!creds.success) {
    console.error(creds.error.issues.map((i) => `- ${i.message}`).join('\n'));
    process.exit(1);
  }

  await connectDb(env.MONGODB_URI);
  await Admin.init();
  const passwordHash = await hashPassword(creds.data.password);
  const existing = await Admin.findOne({ email: creds.data.email });
  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Administrator ${creds.data.email} already existed; password updated.`);
  } else {
    await Admin.create({ email: creds.data.email, passwordHash });
    console.log(`Administrator ${creds.data.email} created.`);
  }
  await disconnectDb();
}

main().catch(async (err: Error) => {
  console.error('Admin initialisation failed:', err.message);
  await disconnectDb();
  process.exit(1);
});
