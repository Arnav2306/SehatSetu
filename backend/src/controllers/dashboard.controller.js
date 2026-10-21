import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

export const getPatientDashboard = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user.toSafeObject(),
      appointments: [],
      message: 'No appointments yet.',
    },
  });
};

export const getDoctorDashboard = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user.toSafeObject(),
      status: 'pending_schedule_phase',
      message: 'Schedule and appointment management will be added in the booking phase.',
    },
  });
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      verifiedDoctors,
      unverifiedDoctors,
      verifiedHospitals,
      unverifiedHospitals,
    ] = await Promise.all([
      Doctor.countDocuments({ isVerified: true }),
      Doctor.countDocuments({ isVerified: false }),
      Hospital.countDocuments({ isVerified: true }),
      Hospital.countDocuments({ isVerified: false }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user.toSafeObject(),
        verificationOverview: {
          doctors: {
            verified: verifiedDoctors,
            unverified: unverifiedDoctors,
            total: verifiedDoctors + unverifiedDoctors,
          },
          hospitals: {
            verified: verifiedHospitals,
            unverified: unverifiedHospitals,
            total: verifiedHospitals + unverifiedHospitals,
          },
        },
        message: 'Provider management tools will be enabled in upcoming administrative updates.',
      },
    });
  } catch (error) {
    next(error);
  }
};
