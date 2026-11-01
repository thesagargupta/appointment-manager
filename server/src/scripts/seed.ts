import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { Appointment } from '../models/Appointment';
import { normalizeName, toUtcDate } from '../utils/time';

const SAMPLES = [
  { customerName: 'Alex Morgan', service: 'Consultation', date: '2026-11-02', time: '10:00', status: 'Pending' },
  { customerName: 'Jamie Lee', service: 'Follow-up', date: '2026-11-02', time: '11:30', status: 'Confirmed' },
  { customerName: 'Taylor Smith', service: 'Review', date: '2026-11-03', time: '14:00', status: 'Cancelled' },
] as const;

// Optional demo data. Run `npm run seed` after `npm run admin:init`. Idempotent: re-running inserts nothing new.
async function main() {
  if (env.isProduction) {
    console.error('Refusing to seed demo data when NODE_ENV=production.');
    process.exit(1);
  }
  await connectDb(env.MONGODB_URI);
  const admin = await Admin.findOne().lean();
  if (!admin) {
    console.error('No administrator found. Run `npm run admin:init` first.');
    await disconnectDb();
    process.exit(1);
  }

  // `npm run seed -- --reset` replaces ALL appointments with the three samples.
  if (process.argv.includes('--reset')) {
    const { deletedCount } = await Appointment.deleteMany({});
    console.log(`Removed ${deletedCount} existing appointment(s).`);
  }

  let inserted = 0;
  for (const s of SAMPLES) {
    const appointmentAt = toUtcDate(s.date, s.time, env.APP_TIMEZONE);
    if (!appointmentAt) throw new Error(`Invalid sample date for ${s.customerName}`);
    const customerNameNormalized = normalizeName(s.customerName);
    const res = await Appointment.updateOne(
      { customerNameNormalized, appointmentAt, service: s.service },
      { $setOnInsert: { customerName: s.customerName, status: s.status, createdBy: admin!._id } },
      { upsert: true },
    );
    inserted += res.upsertedCount;
  }
  console.log(`Seed complete: ${inserted} inserted, ${SAMPLES.length - inserted} already present.`);
  await disconnectDb();
}

main().catch(async (err: Error) => {
  console.error('Seeding failed:', err.message);
  await disconnectDb();
  process.exit(1);
});
