import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';

export const getHospitals = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { locality, type, specialty, search } = req.query;
    const filter = {};

    if (locality && locality !== 'All Localities') {
      filter.locality = new RegExp(`^${locality.trim()}$`, 'i');
    }

    if (type) {
      filter.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    if (specialty) {
      filter.specialties = { $in: [new RegExp(`^${specialty.trim()}$`, 'i')] };
    }

    if (search && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { locality: searchRegex },
        { specialties: { $in: [searchRegex] } },
      ];
    }

    const [total, hospitals] = await Promise.all([
      Hospital.countDocuments(filter),
      Hospital.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: hospitals,
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

export const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid hospital ID format',
      });
    }

    const hospital = await Hospital.findById(id).lean();

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
};
