import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

export const getAdminProviders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { type = 'all', status = 'all' } = req.query;

    const filter = {};
    if (status === 'verified') {
      filter.isVerified = true;
    } else if (status === 'unverified') {
      filter.isVerified = false;
    }

    let doctors = [];
    let hospitals = [];
    let totalDoctors = 0;
    let totalHospitals = 0;

    if (type === 'all' || type === 'doctor') {
      [totalDoctors, doctors] = await Promise.all([
        Doctor.countDocuments(filter),
        Doctor.find(filter)
          .populate('hospital', 'name locality')
          .sort({ createdAt: -1 })
          .skip(type === 'doctor' ? skip : 0)
          .limit(type === 'doctor' ? limit : 25)
          .lean(),
      ]);
    }

    if (type === 'all' || type === 'hospital') {
      [totalHospitals, hospitals] = await Promise.all([
        Hospital.countDocuments(filter),
        Hospital.find(filter)
          .sort({ createdAt: -1 })
          .skip(type === 'hospital' ? skip : 0)
          .limit(type === 'hospital' ? limit : 25)
          .lean(),
      ]);
    }

    const formattedDocs = doctors.map((d) => ({
      ...d,
      id: d._id,
      providerType: 'doctor',
    }));

    const formattedHosps = hospitals.map((h) => ({
      ...h,
      id: h._id,
      providerType: 'hospital',
    }));

    const allProviders = type === 'doctor'
      ? formattedDocs
      : type === 'hospital'
      ? formattedHosps
      : [...formattedDocs, ...formattedHosps];

    res.status(200).json({
      status: 'success',
      data: allProviders,
      pagination: {
        total: totalDoctors + totalHospitals,
        totalDoctors,
        totalHospitals,
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProviderVerification = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { isVerified } = req.body;

    if (!['doctor', 'hospital'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid provider type. Allowed types are "doctor" or "hospital".',
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid provider ID format.',
      });
    }

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Field "isVerified" must be a boolean value.',
      });
    }

    const Model = type === 'doctor' ? Doctor : Hospital;
    const provider = await Model.findById(id);

    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: `${type === 'doctor' ? 'Doctor' : 'Hospital'} not found.`,
      });
    }

    provider.isVerified = isVerified;
    await provider.save();

    res.status(200).json({
      status: 'success',
      message: `${provider.name} verification status updated to ${isVerified ? 'verified' : 'unverified'}.`,
      data: {
        id: provider._id,
        name: provider.name,
        type,
        isVerified: provider.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};
