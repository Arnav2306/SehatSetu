import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';

export const getDoctors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { locality, specialty, search } = req.query;
    const filter = {};

    if (locality && locality !== 'All Localities') {
      filter.locality = new RegExp(`^${locality.trim()}$`, 'i');
    }

    if (specialty) {
      filter.specialty = new RegExp(`^${specialty.trim()}$`, 'i');
    }

    if (search && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: searchRegex },
        { qualification: searchRegex },
        { specialty: searchRegex },
        { locality: searchRegex },
      ];
    }

    const [total, doctors] = await Promise.all([
      Doctor.countDocuments(filter),
      Doctor.find(filter)
        .populate('hospital', 'name type locality address contactPhone emergencyPhone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid doctor ID format',
      });
    }

    const doctor = await Doctor.findById(id)
      .populate('hospital', 'name type locality address contactPhone emergencyPhone')
      .lean();

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};
