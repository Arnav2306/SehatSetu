import mongoose from 'mongoose';

const VALID_SPECIALTIES = [
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'General Medicine',
  'Gynecology',
  'Neurology',
  'ENT Specialist',
  'Other',
];

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true,
      enum: {
        values: VALID_SPECIALTIES,
        message: '{VALUE} is not a recognized specialty',
      },
      index: true,
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience years cannot be negative'],
      default: 0,
    },
    consultationFee: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative'],
      default: 0,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: 'Indore',
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    operatingHours: {
      type: String,
      trim: true,
      default: '',
    },
    schedule: {
      days: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: [],
      },
      startTime: {
        type: String,
        trim: true,
        default: '',
      },
      endTime: {
        type: String,
        trim: true,
        default: '',
      },
      slotDurationMinutes: {
        type: Number,
        default: 30,
        min: 10,
        max: 120,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

export { VALID_SPECIALTIES };
export default Doctor;
