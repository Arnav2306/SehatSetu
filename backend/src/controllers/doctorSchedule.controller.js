import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getMySchedule = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).lean();

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'No doctor profile is linked to this account.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doctorId: doctor._id,
        doctorName: doctor.name,
        schedule: doctor.schedule || {
          days: [],
          startTime: '',
          endTime: '',
          slotDurationMinutes: 30,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMySchedule = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'No doctor profile is linked to this account.',
      });
    }

    const { days, startTime, endTime, slotDurationMinutes } = req.body;

    // Validate days
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one working day must be selected.',
      });
    }

    for (const d of days) {
      if (!VALID_DAYS.includes(d)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid day: ${d}. Allowed days are ${VALID_DAYS.join(', ')}.`,
        });
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!startTime || !timeRegex.test(startTime) || !endTime || !timeRegex.test(endTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Start time and end time must be in 24-hour HH:MM format.',
      });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const duration = parseInt(slotDurationMinutes, 10) || 30;
    if (duration < 10 || duration > 120) {
      return res.status(400).json({
        status: 'error',
        message: 'Slot duration must be between 10 and 120 minutes.',
      });
    }

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        status: 'error',
        message: 'Schedule start time must be earlier than end time.',
      });
    }

    if (endMinutes - startMinutes < duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Total working window must be at least as long as one slot duration.',
      });
    }

    // Strict appointment conflict check:
    // Reject any schedule update that invalidates existing scheduled appointments
    const futureAppointments = await Appointment.find({
      doctor: doctor._id,
      status: 'scheduled',
      slotStart: { $gt: new Date() },
    }).lean();

    for (const appt of futureAppointments) {
      const apptDate = new Date(appt.slotStart);
      const apptDay = DAYS_OF_WEEK[apptDate.getUTCDay()];

      // 1. Day conflict
      if (!days.includes(apptDay)) {
        return res.status(409).json({
          status: 'error',
          code: 'SCHEDULE_CONFLICT',
          message: `Cannot modify schedule: An existing scheduled appointment exists on ${apptDay} (${apptDate.toISOString()}). Conflicting appointments cannot be silently invalidated.`,
        });
      }

      // 2. Working hour boundary conflict
      const apptStartMin = apptDate.getUTCHours() * 60 + apptDate.getUTCMinutes();
      const apptEndDate = new Date(appt.slotEnd);
      const apptEndMin = apptEndDate.getUTCHours() * 60 + apptEndDate.getUTCMinutes();

      if (apptStartMin < startMinutes || apptEndMin > endMinutes) {
        return res.status(409).json({
          status: 'error',
          code: 'SCHEDULE_CONFLICT',
          message: `Cannot modify schedule: An existing appointment at ${apptDate.toISOString()} falls outside the new hours (${startTime} - ${endTime}).`,
        });
      }
    }

    // Save validated schedule
    doctor.schedule = {
      days,
      startTime,
      endTime,
      slotDurationMinutes: duration,
    };

    await doctor.save();

    res.status(200).json({
      status: 'success',
      message: 'Schedule updated successfully.',
      data: {
        doctorId: doctor._id,
        schedule: doctor.schedule,
      },
    });
  } catch (error) {
    next(error);
  }
};
