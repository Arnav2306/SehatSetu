import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true,
    },
    slotStart: {
      type: Date,
      required: [true, 'Slot start time is required'],
      index: true,
    },
    slotEnd: {
      type: Date,
      required: [true, 'Slot end time is required'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee snapshot is required'],
      min: [0, 'Consultation fee cannot be negative'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Database-enforced atomic uniqueness under concurrency:
// Prevents any simultaneous double-booking of the same doctor slot for active appointments
appointmentSchema.index(
  { doctor: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'scheduled' },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
