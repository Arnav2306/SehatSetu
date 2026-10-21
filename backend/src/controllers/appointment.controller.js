import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getDoctorSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid doctor ID is required.',
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid date in YYYY-MM-DD format is required.',
      });
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found.',
      });
    }

    // Check if doctor has an active schedule configured
    const schedule = doctor.schedule;
    if (
      !schedule ||
      !schedule.days ||
      schedule.days.length === 0 ||
      !schedule.startTime ||
      !schedule.endTime
    ) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Doctor has not configured an active booking schedule.',
      });
    }

    // Determine day of week in UTC
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date supplied.',
      });
    }

    const dayName = DAYS_OF_WEEK[targetDate.getUTCDay()];
    if (!schedule.days.includes(dayName)) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: `Doctor is not scheduled to consult on ${dayName}.`,
      });
    }

    // Parse start and end time (HH:MM)
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDuration = schedule.slotDurationMinutes || 30;

    if (startMinutes >= endMinutes) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Doctor working hours are improperly configured.',
      });
    }

    // Query active scheduled appointments for this day
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      status: 'scheduled',
      slotStart: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    const bookedSet = new Set(
      existingAppointments.map((appt) => new Date(appt.slotStart).toISOString())
    );

    const now = new Date();
    const availableSlots = [];

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const endSlotH = Math.floor((m + slotDuration) / 60);
      const endSlotM = (m + slotDuration) % 60;

      const slotStart = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          h,
          min,
          0
        )
      );

      const slotEnd = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          endSlotH,
          endSlotM,
          0
        )
      );

      // Do not show past slots
      if (slotStart <= now) {
        continue;
      }

      // Do not show already booked slots
      if (bookedSet.has(slotStart.toISOString())) {
        continue;
      }

      availableSlots.push({
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
        durationMinutes: slotDuration,
        consultationFee: doctor.consultationFee,
      });
    }

    res.status(200).json({
      status: 'success',
      data: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

export const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, slotStart, slotEnd, notes } = req.body;

    if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid doctor ID is required.',
      });
    }

    if (!slotStart || !slotEnd) {
      return res.status(400).json({
        status: 'error',
        message: 'Slot start and end times are required.',
      });
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(slotEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid slot time range.',
      });
    }

    if (startDate <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot book appointments in the past.',
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found.',
      });
    }

    // Atomic create: database partial unique index prevents double-booking
    try {
      const appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctor._id,
        hospital: doctor.hospital || null,
        slotStart: startDate,
        slotEnd: endDate,
        consultationFee: doctor.consultationFee,
        notes: typeof notes === 'string' ? notes.trim() : '',
        status: 'scheduled',
      });

      const populated = await Appointment.findById(appointment._id)
        .populate('doctor', 'name specialty qualification locality')
        .populate('hospital', 'name locality')
        .lean();

      res.status(201).json({
        status: 'success',
        message: 'Appointment booked successfully.',
        data: populated,
      });
    } catch (insertError) {
      // Catch MongoDB duplicate key error (code 11000) for concurrency
      if (insertError.code === 11000) {
        return res.status(409).json({
          status: 'error',
          code: 'SLOT_ALREADY_BOOKED',
          message: 'This slot has already been booked by another patient. Please select another time.',
        });
      }
      throw insertError;
    }
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialty qualification locality city consultationFee')
      .populate('hospital', 'name locality')
      .sort({ slotStart: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid appointment ID format.',
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found.',
      });
    }

    // Permission check: only owning patient or admin can cancel
    if (
      appointment.patient.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: You cannot view or cancel another patient\'s appointment.',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'This appointment is already cancelled.',
      });
    }

    if (new Date(appointment.slotStart) <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Past appointments cannot be cancelled.',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointments = async (req, res, next) => {
  try {
    // Find doctor profile attached to authenticated user
    const doctorProfile = await Doctor.findOne({ user: req.user._id }).lean();

    if (!doctorProfile) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'No doctor profile is linked to this account.',
      });
    }

    const appointments = await Appointment.find({ doctor: doctorProfile._id })
      .populate('patient', 'name email')
      .sort({ slotStart: 1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid appointment ID format.',
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found.',
      });
    }

    // Permission check: doctor associated with this appointment or admin
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (!doctorProfile || appointment.doctor.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied: You can only complete your own appointments.',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied.',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Cancelled appointments cannot be completed.',
      });
    }

    appointment.status = 'completed';
    await appointment.save();

    res.status(200).json({
      status: 'success',
      message: 'Appointment marked as completed.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

