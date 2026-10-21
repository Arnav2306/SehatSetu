import { Router } from 'express';
import {
  getDoctorSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  completeAppointment,
} from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

// Slots can be viewed by authenticated users
router.get('/slots', authenticate, checkDatabaseConnection, getDoctorSlots);

// Patient appointment actions
router.post('/', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, bookAppointment);
router.get('/my', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, getMyAppointments);
router.patch('/:id/cancel', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, cancelAppointment);

// Doctor appointments list & completion
router.get('/doctor', authenticate, authorize('doctor', 'admin'), checkDatabaseConnection, getDoctorAppointments);
router.patch('/:id/complete', authenticate, authorize('doctor', 'admin'), checkDatabaseConnection, completeAppointment);

export default router;

