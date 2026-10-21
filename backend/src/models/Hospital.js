import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Hospital', 'Clinic', 'Super-Specialty Hospital', 'Multi-Specialty Institute'],
      default: 'Hospital',
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
    address: {
      type: String,
      trim: true,
      default: '',
    },
    specialties: {
      type: [String],
      default: [],
      index: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyPhone: {
      type: String,
      trim: true,
      default: '',
    },
    operatingHours: {
      type: String,
      trim: true,
      default: '24x7',
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

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
