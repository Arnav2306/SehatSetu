import { Router } from 'express';
import {
  getPatientDashboard,
  getDoctorDashboard,
  getAdminDashboard,
} from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

router.get('/patient', authenticate, authorize('patient', 'admin'), getPatientDashboard);
router.get('/doctor', authenticate, authorize('doctor', 'admin'), getDoctorDashboard);
router.get('/admin', authenticate, authorize('admin'), checkDatabaseConnection, getAdminDashboard);

export default router;
