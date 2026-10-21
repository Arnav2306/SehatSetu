import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

/**
 * Submit a review for a completed appointment
 * Authenticated patient only
 */
export const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid appointment ID is required.',
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Review comment is required.',
      });
    }

    if (comment.trim().length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'Review comment cannot exceed 500 characters.',
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found.',
      });
    }

    // Ownership check: only the patient of this appointment can review
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: You can only review your own appointments.',
      });
    }

    // Completion check: cannot review cancelled or future/scheduled appointments
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot review appointment with status "${appointment.status}". Only completed appointments are eligible for review.`,
      });
    }

    if (new Date(appointment.slotStart) > new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot review future appointments.',
      });
    }

    // Duplicate check: one review per completed appointment
    const existingReview = await Review.findOne({ appointment: appointmentId });
    if (existingReview) {
      return res.status(409).json({
        status: 'error',
        message: 'A review has already been submitted for this appointment.',
      });
    }

    const review = await Review.create({
      patient: req.user._id,
      doctor: appointment.doctor,
      hospital: appointment.hospital || null,
      appointment: appointment._id,
      rating: numericRating,
      comment: comment.trim(),
      status: 'pending',
    });

    const populated = await Review.findById(review._id)
      .populate('doctor', 'name specialty')
      .populate('hospital', 'name')
      .lean();

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully. It will be publicly visible once approved by a moderator.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'A review has already been submitted for this appointment.',
      });
    }
    next(error);
  }
};

/**
 * Public API: Retrieve approved reviews and aggregate ratings for a doctor or hospital
 * Strictly approved reviews only; never exposes pending or rejected reviews.
 */
export const getPublicProviderReviews = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.query.doctorId;
    const hospitalId = req.params.hospitalId || req.query.hospitalId;

    if (!doctorId && !hospitalId) {
      return res.status(400).json({
        status: 'error',
        message: 'Either doctorId or hospitalId must be provided.',
      });
    }

    const filter = { status: 'approved' };
    let matchField = null;
    let targetObjectId = null;

    if (doctorId) {
      if (!mongoose.isValidObjectId(doctorId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid doctor ID format.',
        });
      }
      targetObjectId = new mongoose.Types.ObjectId(doctorId);
      matchField = 'doctor';
      filter.doctor = targetObjectId;
    } else {
      if (!mongoose.isValidObjectId(hospitalId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid hospital ID format.',
        });
      }
      targetObjectId = new mongoose.Types.ObjectId(hospitalId);
      matchField = 'hospital';
      filter.hospital = targetObjectId;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Aggregate summary and distribution from actual database records
    const [summaryResult, distributionResult, total, reviews] = await Promise.all([
      Review.aggregate([
        { $match: { [matchField]: targetObjectId, status: 'approved' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Review.aggregate([
        { $match: { [matchField]: targetObjectId, status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      Review.countDocuments(filter),
      Review.find(filter)
        .select('rating comment createdAt patient')
        .populate('patient', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionResult.forEach((d) => {
      if (d._id >= 1 && d._id <= 5) {
        ratingDistribution[d._id] = d.count;
      }
    });

    const averageRating =
      summaryResult.length > 0 && summaryResult[0].averageRating
        ? Math.round(summaryResult[0].averageRating * 10) / 10
        : 0;

    const totalReviews = summaryResult.length > 0 ? summaryResult[0].totalReviews : 0;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          averageRating,
          totalReviews,
          ratingDistribution,
        },
        reviews: reviews.map((r) => ({
          id: r._id,
          rating: r.rating,
          comment: r.comment,
          patientName: r.patient?.name || 'Verified Patient',
          createdAt: r.createdAt,
        })),
      },
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

/**
 * Get all reviews submitted by the currently authenticated patient
 */
export const getMyReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { patient: req.user._id };

    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .populate('doctor', 'name specialty qualification locality')
        .populate('hospital', 'name locality')
        .populate('appointment', 'slotStart status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: reviews,
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

/**
 * Update an existing review by the owning patient
 * Resets status to 'pending' for re-moderation
 */
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid review ID format.',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found.',
      });
    }

    // Prevent patients from modifying others' reviews
    if (review.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: You cannot edit another patient\'s review.',
      });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          status: 'error',
          message: 'Rating must be an integer between 1 and 5.',
        });
      }
      review.rating = numericRating;
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Review comment cannot be empty.',
        });
      }
      if (comment.trim().length > 500) {
        return res.status(400).json({
          status: 'error',
          message: 'Review comment cannot exceed 500 characters.',
        });
      }
      review.comment = comment.trim();
    }

    review.status = 'pending';
    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully and resubmitted for moderation.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review (owning patient or admin only)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid review ID format.',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found.',
      });
    }

    const isOwner = review.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: You cannot delete another patient\'s review.',
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: List reviews with optional moderation status filter
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status = 'pending' } = req.query;
    const filter = {};
    if (status !== 'all') {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status filter. Allowed values: pending, approved, rejected, all.',
        });
      }
      filter.status = status;
    }

    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialty locality')
        .populate('hospital', 'name locality')
        .populate('appointment', 'slotStart status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: reviews,
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

/**
 * Admin: Approve or reject a review
 */
export const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid review ID format.',
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "approved" or "rejected".',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found.',
      });
    }

    review.status = status;
    await review.save();

    res.status(200).json({
      status: 'success',
      message: `Review successfully ${status}.`,
      data: {
        id: review._id,
        status: review.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
