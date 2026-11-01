import { Schema, Types, model } from 'mongoose';
import { STATUSES, type AppointmentStatus } from '../config/appointments';
import { normalizeName } from '../utils/time';

export interface AppointmentDoc {
  customerName: string;
  customerNameNormalized: string;
  service: string;
  appointmentAt: Date;
  status: AppointmentStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<AppointmentDoc>(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    customerNameNormalized: { type: String, required: true },
    service: { type: String, required: true, trim: true },
    appointmentAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'Pending', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true },
);

appointmentSchema.pre('validate', function () {
  if (this.customerName) this.customerNameNormalized = normalizeName(this.customerName);
});

// Status-filtered lists, ordered by date.
appointmentSchema.index({ status: 1, appointmentAt: 1 });
// Unfiltered lists and the upcoming/past split.
appointmentSchema.index({ appointmentAt: 1 });
// Name search combined with date ordering.
appointmentSchema.index({ customerNameNormalized: 1, appointmentAt: 1 });
// Prevents double-booking the same customer/service/time; also makes the seed idempotent.
appointmentSchema.index({ customerNameNormalized: 1, appointmentAt: 1, service: 1 }, { unique: true });

export const Appointment = model<AppointmentDoc>('Appointment', appointmentSchema);
